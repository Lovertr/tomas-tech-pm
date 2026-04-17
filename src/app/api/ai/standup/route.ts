import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import { aiCall, AiNotConfiguredError } from "@/lib/ai";

// POST /api/ai/standup
// body: { user_id?: string, date?: "YYYY-MM-DD", lang?: "th"|"en"|"jp" }
// Returns an AI-generated daily standup based on yesterday's time logs +
// task transitions for the target user (defaults to current user).
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const lang = body.lang || "th";
    const today = body.date ? new Date(body.date) : new Date();
    const yest = new Date(today); yest.setDate(yest.getDate() - 1);
    const ymd = (d: Date) => d.toISOString().slice(0, 10);
    const yDay = ymd(yest);
    const tDay = ymd(today);

    // Resolve target team_member_id: explicit user_id, or derive from current user.
    let targetMemberId: string | null = body.user_id ?? null;
    if (!targetMemberId) {
      const { data: me } = await supabaseAdmin
        .from("team_members").select("id").eq("user_id", ctx.userId).maybeSingle();
      targetMemberId = me?.id ?? null;
    }
    // Permission: only admin/manager can request someone else's standup.
    if (body.user_id && body.user_id !== targetMemberId && !["admin", "manager"].includes(ctx.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Fallback: admin/manager without a team_member link → team-wide standup
    if (!targetMemberId) {
      if (!["admin", "manager"].includes(ctx.role)) {
        return NextResponse.json({
          error: "บัญชีนี้ยังไม่ได้ผูกกับ Team Member — ไปที่หน้า ทีมงาน แล้วตั้ง user_id ของสมาชิกให้ตรงกับ user นี้",
        }, { status: 400 });
      }
      const { data: teamLogs } = await supabaseAdmin
        .from("time_logs")
        .select("hours, description, log_date, team_members(first_name_th, last_name_th, first_name_en, last_name_en), projects(project_code, name_th, name_en), tasks(title)")
        .gte("log_date", yDay).lte("log_date", tDay)
        .order("log_date", { ascending: false }).limit(80);

      const sys = "You write a concise team-wide daily standup digest for a project manager. Group by person if possible.";
      const userPrompt = `Summarise yesterday's team activity (${yDay}) for a manager dashboard.

TIME LOGS (${(teamLogs ?? []).length}):
${(teamLogs ?? []).map(l => {
  const m = l.team_members as { first_name_th?: string; last_name_th?: string; first_name_en?: string; last_name_en?: string } | null;
  const name = [m?.first_name_th, m?.last_name_th].filter(Boolean).join(" ") || [m?.first_name_en, m?.last_name_en].filter(Boolean).join(" ") || "?";
  const p = l.projects as { project_code?: string } | null;
  const tk = l.tasks as { title?: string } | null;
  return `- ${name} | ${l.hours}h | ${p?.project_code ?? "?"} | ${tk?.title ?? "(no task)"} | ${l.description ?? ""}`;
}).join("\n") || "(none)"}

Format:
**Highlights** (3-5 bullets — biggest things done)
**By Person** (one line per person with totals)
**Watch** (anyone idle / overloaded / blocked, or "None")`;
      const text = await aiCall(userPrompt, { model: "haiku", system: sys, lang, maxTokens: 700 });
      return NextResponse.json({ standup: text, date: tDay, mode: "team", logs_count: (teamLogs ?? []).length, open_tasks_count: 0 });
    }

    // Yesterday's time logs
    const { data: logs } = await supabaseAdmin
      .from("time_logs")
      .select("hours, description, log_date, status, projects(name_th, name_en, project_code), tasks(title)")
      .eq("team_member_id", targetMemberId)
      .gte("log_date", yDay).lte("log_date", tDay)
      .order("log_date", { ascending: false });

    // Tasks currently assigned that are not done -> "today / blockers"
    const { data: openTasks } = await supabaseAdmin
      .from("tasks")
      .select("title, status, due_date, priority, projects(name_th, name_en)")
      .eq("assignee_id", targetMemberId)
      .neq("status", "done")
      .order("due_date", { ascending: true })
      .limit(20);

    const sys = "You write concise, professional daily standup updates in 'Yesterday / Today / Blockers' format. Keep each section to bullet points (max 5 bullets each). Be specific, mention project codes when available.";
    const userPrompt = `Generate a daily standup for ${tDay}.

YESTERDAY'S TIME LOGS (${(logs ?? []).length}):
${(logs ?? []).map(l => `- ${l.log_date} | ${l.hours}h | ${(l.projects as { project_code?: string } | null)?.project_code ?? "?"} | ${(l.tasks as { title?: string } | null)?.title ?? "(no task)"} | ${l.description ?? ""}`).join("\n") || "(none)"}

OPEN TASKS ASSIGNED (${(openTasks ?? []).length}):
${(openTasks ?? []).map(t => `- [${t.status}] ${t.title} (due ${t.due_date ?? "?"}, priority ${t.priority ?? "-"})`).join("\n") || "(none)"}

Format:
**Yesterday**
- ...
**Today**
- ...
**Blockers**
- ... (or "None")`;

    const text = await aiCall(userPrompt, { model: "haiku", system: sys, lang, maxTokens: 600 });
    return NextResponse.json({ standup: text, date: tDay, member_id: targetMemberId, logs_count: (logs ?? []).length, open_tasks_count: (openTasks ?? []).length });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: "AI not configured. Set ANTHROPIC_API_KEY in .env.local" }, { status: 503 });
    }
    console.error("standup ai error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
