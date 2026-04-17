import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { AiNotConfiguredError, langInstruction } from "@/lib/ai";

// POST /api/ai/transcribe-audio
// Accepts multipart form: audio file + optional lang
// Uses Gemini multimodal (audio) to transcribe meeting recordings
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    const lang = (formData.get("lang") as string) || "th";

    if (!file) {
      return NextResponse.json({ error: "audio file required" }, { status: 400 });
    }

    // Validate file size (max 20MB for Gemini inline data)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "ไฟล์เสียงใหญ่เกิน 20MB" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new AiNotConfiguredError("gemini");

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Determine mime type
    const mimeType = file.type || "audio/webm";

    const systemText = [
      "You are an expert meeting transcription assistant for Tomas Tech, a Thai engineering/IT company.",
      "Transcribe the audio accurately, preserving the speaker's language (Thai, English, or mixed).",
      "Format the transcript clearly with timestamps if possible.",
      "If multiple speakers, label them as Speaker 1, Speaker 2, etc.",
      langInstruction(lang),
    ].join("\n");

    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
              {
                text: "ถอดเสียงการประชุมนี้ให้เป็นข้อความ (transcript) อย่างละเอียด ถ้ามีหลายคนพูดให้ระบุ Speaker แต่ถ้าฟังไม่ออกว่าใครพูดก็ไม่ต้องระบุ",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gemini API ${res.status}: ${t}`);
    }

    const data = await res.json();
    const cand = data.candidates?.[0];
    const parts = cand?.content?.parts ?? [];
    const transcript = parts
      .map((p: { text?: string }) => p.text ?? "")
      .join("\n")
      .trim();

    if (!transcript) {
      return NextResponse.json(
        { error: "AI ไม่สามารถถอดเสียงได้ — อาจเป็นเพราะไฟล์เสียงไม่ชัด" },
        { status: 502 }
      );
    }

    return NextResponse.json({ transcript });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json(
        { error: "AI not configured. Set GEMINI_API_KEY in env" },
        { status: 503 }
      );
    }
    console.error("transcribe-audio error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
