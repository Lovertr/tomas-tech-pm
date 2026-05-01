import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { aiCall, type AiLang } from "@/lib/ai";
import { buildHelpContext } from "@/lib/helpContent";

export async function POST(req: NextRequest) {
  const session = await verifySession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, lang } = (await req.json()) as { question?: string; lang?: string };
  if (!question?.trim()) return NextResponse.json({ error: "Missing question" }, { status: 400 });

  const l = (lang ?? "th") as AiLang;
  const helpContext = buildHelpContext(l === "jp" ? "jp" : l === "en" ? "en" : "th");

  const system = `You are the Help Assistant for TOMAS TECH Project Management System.
Answer the user's question ONLY based on the user manual content provided below.
If the answer is not covered in the manual, say so politely and suggest they contact an admin.
Be concise, helpful, and friendly. Format with short paragraphs.

--- USER MANUAL ---
${helpContext}
--- END ---`;

  try {
    const answer = await aiCall(question, {
      system,
      lang: l,
      model: "sonnet",
      maxTokens: 1024,
      temperature: 0.2,
    });
    return NextResponse.json({ answer });
  } catch (e) {
    console.error("Help AI error:", e);
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }
}
