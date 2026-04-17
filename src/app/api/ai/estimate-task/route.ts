import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import { aiCall, safeParseJson, AiNotConfiguredError } from "@/lib/ai";

// POST /api/ai/estimate-task
// body: { title: string, description?: string, project_id?: string, lang?: string }
// Returns: { estimated_hours: number, confidence: "low"|"medium"|"high",
//            reasoning: string, similar_tasks: [{title, hours}] }
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const title: string = (body.title ?? "").toString().trim();
    const description: string = (body.description ?? "").toString();
    const projectId: string | null = body.project_id ?? null;
    const lang = body.lang || "th";
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

    // Find similar past tasks with logged hours.
    // Basic approach: take 1-2 keywords (longest words) and ILIKE search.
    const keywords = title.split(/\s+/).filter(w => w.length >= 3).sort((a, b) => b.length - a.length).slice(0, 3);
    let q = supabaseAdmin
      .from("tasks")
      .select("id, title, description, estimated_hours, actual_hours, status, project_id")
      .eq("status", "done")
      .not("actual_hours", "is", null)
      .limit(10);
    if (projectId) q = q.eq("project_id", projectId);
    if (keywords.length) {
      const ors = keywords.map(k => `title.ilike.%${k}%`).join(",");
      q = q.or(ors);
    }
    const { data: similar } = await q;

    // Fallback: most recent done tasks in the same project.
    let pool = similar ?? [];
    if (pool.length === 0 && projectId) {
      const { data: recent } = await supabaseAdmin
        .from("tasks")
        .select("id, title, description, estimated_hours, actual_hours, status, project_id")
        .eq("project_id", projectId).eq("status", "done")
        .not("actual_hours", "is", null)
        .order("updated_at", { ascending: false }).limit(5);
      pool = recent ?? [];
    }

    const sys = "You are an expert software project estimator. Given a task description and historical similar tasks (with actual hours), estimate effort. Output ONLY JSON.";
    const prompt = `Estimate effort for this new task.

NEW TASK:
Title: ${title}
Description: ${description || "(none)"}

SIMILAR PAST TASKS (with actual hours):
${pool.length ? pool.map(t => `- "${t.title}" — estimated ${t.estimated_hours ?? "?"}h, actual ${t.actual_hours}h`).join("\n") : "(no similar history available)"}

Respond with JSON:
{
  "estimated_hours": number,
  "confidence": "low" | "medium" | "high",
  "reasoning": "1-3 sentences explaining the estimate",
  "similar_tasks": [{"title": "...", "hours": number}]
}`;

    const text = await aiCall(prompt, { model: "sonnet", system: sys, lang, maxTokens: 600, json: true });
    const parsed = safeParseJson<{
      estimated_hours?: number;
      confidence?: string;
      reasoning?: string;
      similar_tasks?: Array<{ title: string; hours: number }>;
    }>(text);

    if (!parsed || typeof parsed.estimated_hours !== "number") {
      return NextResponse.json({ error: "AI returned invalid estimate", raw: text }, { status: 502 });
    }
    return NextResponse.json({
      estimated_hours: parsed.estimated_hours,
      confidence: parsed.confidence ?? "medium",
      reasoning: parsed.reasoning ?? "",
      similar_tasks: parsed.similar_tasks ?? [],
      pool_size: pool.length,
    });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: "AI not configured. Set ANTHROPIC_API_KEY in .env.local" }, { status: 503 });
    }
    console.error("estimate-task ai error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
