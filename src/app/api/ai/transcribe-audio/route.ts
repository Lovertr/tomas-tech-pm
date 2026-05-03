import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { AiNotConfiguredError, langInstruction, detectTranscriptHallucination } from "@/lib/ai";

// Next.js App Router: allow longer processing for audio
export const maxDuration = 60;

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

    // Validate file size — Vercel serverless has ~4.5MB body limit
    // After base64 encoding, 3.5MB raw ≈ 4.7MB payload, so keep raw limit at 3.5MB
    const MAX_SIZE = 3.5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `ไฟล์เสียงใหญ่เกิน ${(MAX_SIZE / 1024 / 1024).toFixed(1)}MB — กรุณาอัดเสียงให้สั้นลง (แนะนำไม่เกิน 3 นาทีต่อครั้ง)` },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new AiNotConfiguredError("gemini");

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Determine mime type
    const mimeType = file.type || "audio/webm";

    const systemText = [
      "You are a strict audio-to-text transcription engine for Tomas Tech, a Thai engineering/IT company.",
      "CRITICAL RULES — violating any of these is a failure:",
      "1. ONLY output words that are actually spoken in the audio. NEVER invent, fabricate, or hallucinate content.",
      "2. If a section is unclear or inaudible, write [ไม่ชัด] (unclear). Do NOT guess or make up words.",
      "3. If the audio is silence, noise, or contains no speech, respond ONLY with: [ไม่มีเสียงพูด]",
      "4. NEVER generate repetitive text. If you find yourself writing the same phrase more than twice, stop and re-listen.",
      "5. Do NOT create fake meeting agendas, project names, or structured meeting minutes that weren't spoken.",
      "6. Preserve the speaker's actual language (Thai, English, or mixed). Do not translate.",
      "7. If multiple speakers are clearly distinguishable, label them Speaker 1, Speaker 2, etc. Otherwise, omit labels.",
      "8. Keep the transcript as a faithful raw transcription, not a polished summary.",
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
                text: "ถอดเสียงจากไฟล์นี้เป็นข้อความตามที่ได้ยินจริงเท่านั้น ห้ามแต่งเติมหรือสร้างเนื้อหาขึ้นมาเอง ถ้าฟังไม่ออกให้เขียน [ไม่ชัด] ถ้าไม่มีเสียงพูดให้ตอบ [ไม่มีเสียงพูด]",
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

    // Check for hallucinated / repetitive output
    const hallucinationError = detectTranscriptHallucination(transcript);
    if (hallucinationError) {
      return NextResponse.json(
        { error: hallucinationError, transcript, hallucinated: true },
        { status: 422 }
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
