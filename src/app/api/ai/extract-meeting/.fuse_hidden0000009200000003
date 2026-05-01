import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { aiCall, safeParseJson, AiNotConfiguredError } from "@/lib/ai";

// POST /api/ai/extract-meeting
// body: { raw_text: string, lang?: "th"|"en"|"jp" }
// Returns: { action_items, decisions, risks, change_requests, summary }
// All arrays of strings (or {text, owner?, due_date?} for action items).
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const raw = (body.raw_text ?? "").toString();
    if (!raw.trim()) return NextResponse.json({ error: "raw_text required" }, { status: 400 });
    const lang = body.lang || "th";

    const sys = "You extract structured information from meeting notes. You output ONLY a JSON object matching the requested schema. No prose, no markdown fences.";
    const prompt = `Extract structured items from these meeting notes. Preserve the original language of the source for each item's text.

Schema:
{
  "summary": "string (1-3 sentences)",
  "action_items": [{"text": "string", "owner": "string|null", "due_date": "YYYY-MM-DD|null"}],
  "decisions": ["string", ...],
  "risks": ["string", ...],
  "change_requests": ["string", ...]
}

Meeting notes:
"""
${raw}
"""`;

    const text = await aiCall(prompt, { model: "sonnet", system: sys, lang, maxTokens: 1500, json: true });
    const parsed = safeParseJson<{
      summary?: string;
      action_items?: Array<{ text: string; owner?: string | null; due_date?: string | null }>;
      decisions?: string[];
      risks?: string[];
      change_requests?: string[];
    }>(text);

    if (!parsed) {
      return NextResponse.json({ error: "AI returned non-JSON", raw: text }, { status: 502 });
    }
    return NextResponse.json({
      summary: parsed.summary ?? "",
      action_items: parsed.action_items ?? [],
      decisions: parsed.decisions ?? [],
      risks: parsed.risks ?? [],
      change_requests: parsed.change_requests ?? [],
    });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: "AI not configured. Set ANTHROPIC_API_KEY in .env.local" }, { status: 503 });
    }
    console.error("extract-meeting ai error", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
