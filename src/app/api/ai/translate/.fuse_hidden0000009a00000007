import { NextRequest, NextResponse } from "next/server";
import { aiCall, AiLang } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, targetLang } = body as { text?: string; targetLang?: AiLang };

    if (!text?.trim()) return NextResponse.json({ error: "Missing text" }, { status: 400 });
    if (!targetLang || !["th", "en", "jp"].includes(targetLang))
      return NextResponse.json({ error: "Invalid targetLang (th|en|jp)" }, { status: 400 });

    const langLabel: Record<string, string> = { th: "Thai", en: "English", jp: "Japanese" };

    const result = await aiCall(
      `Translate the following text to ${langLabel[targetLang]}. Output ONLY the translated text, nothing else.\n\n---\n${text}`,
      {
        model: "haiku",
        system: "You are a professional translator. Translate accurately and naturally. Preserve formatting, line breaks, and structure. Do not add explanations.",
        lang: targetLang,
        temperature: 0.2,
      },
    );

    return NextResponse.json({ translated: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
