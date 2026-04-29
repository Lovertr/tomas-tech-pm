import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { AiNotConfiguredError, langInstruction } from "@/lib/ai";

export const maxDuration = 120; // 2 minutes for large file processing

// POST /api/ai/transcribe-audio-url
// Accepts JSON: { url: string, lang?: string }
// Downloads audio from URL (e.g. Supabase Storage) → uploads to Gemini File API → transcribes
// This bypasses Vercel's body size limit for large audio files
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { url, lang = "th" } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new AiNotConfiguredError("gemini");

    // Step 1: Download audio from the URL (Supabase Storage)
    const audioRes = await fetch(url);
    if (!audioRes.ok) {
      return NextResponse.json({ error: "ไม่สามารถดาวน์โหลดไฟล์เสียงได้" }, { status: 400 });
    }
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    const mimeType = audioRes.headers.get("content-type") || "audio/webm";

    // Step 2: Upload to Gemini File API
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    const boundary = "----GeminiUploadBoundary" + Date.now();

    const metadata = JSON.stringify({ file: { displayName: "meeting-audio" } });
    const bodyParts = [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    ];

    const bodyStart = Buffer.from(bodyParts[0], "utf-8");
    const bodyMid = Buffer.from(bodyParts[1], "utf-8");
    const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8");
    const fullBody = Buffer.concat([bodyStart, bodyMid, audioBuffer, bodyEnd]);

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(fullBody.length),
      },
      body: fullBody,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Gemini File API upload error:", errText);
      return NextResponse.json(
        { error: "ไม่สามารถอัพโหลดไฟล์ไป Gemini ได้ — กรุณาลองใหม่" },
        { status: 502 }
      );
    }

    const uploadData = await uploadRes.json();
    const fileUri = uploadData.file?.uri;
    const fileName = uploadData.file?.name;

    if (!fileUri) {
      return NextResponse.json({ error: "Gemini File API ไม่คืน file URI" }, { status: 502 });
    }

    // Step 3: Wait for file to be processed (ACTIVE state)
    let fileState = uploadData.file?.state || "PROCESSING";
    let retries = 0;
    while (fileState === "PROCESSING" && retries < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const checkRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`
      );
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        fileState = checkData.state || "PROCESSING";
      }
      retries++;
    }

    if (fileState !== "ACTIVE") {
      return NextResponse.json(
        { error: "Gemini ยังประมวลผลไฟล์ไม่เสร็จ — กรุณาลองใหม่ในอีกสักครู่" },
        { status: 502 }
      );
    }

    // Step 4: Transcribe using the uploaded file URI
    const systemText = [
      "You are an expert meeting transcription assistant for Tomas Tech, a Thai engineering/IT company.",
      "Transcribe the audio accurately, preserving the speaker's language (Thai, English, or mixed).",
      "Format the transcript clearly with timestamps if possible.",
      "If multiple speakers, label them as Speaker 1, Speaker 2, etc.",
      langInstruction(lang),
    ].join("\n");

    const model = "gemini-2.5-flash";
    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const genRes = await fetch(genUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemText }] },
        contents: [
          {
            role: "user",
            parts: [
              { fileData: { mimeType, fileUri } },
              {
                text: "ถอดเสียงการประชุมนี้ให้เป็นข้อความ (transcript) อย่างละเอียด ถ้ามีหลายคนพูดให้ระบุ Speaker แต่ถ้าฟังไม่ออกว่าใครพูดก็ไม่ต้องระบุ",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 65536,
        },
      }),
    });

    if (!genRes.ok) {
      const t = await genRes.text();
      throw new Error(`Gemini API ${genRes.status}: ${t}`);
    }

    const genData = await genRes.json();
    const cand = genData.candidates?.[0];
    const parts = cand?.content?.parts ?? [];
    const transcript = parts
      .map((p: { text?: string }) => p.text ?? "")
      .join("\n")
      .trim();

    // Step 5: Clean up uploaded file
    try {
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`,
        { method: "DELETE" }
      );
    } catch { /* best effort cleanup */ }

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
    console.error("transcribe-audio-url error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
