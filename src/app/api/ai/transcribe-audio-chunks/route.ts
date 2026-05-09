import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { AiNotConfiguredError, langInstruction, detectTranscriptHallucination } from "@/lib/ai";

export const maxDuration = 180; // 3 minutes for large file assembly + transcription

// POST /api/ai/transcribe-audio-chunks
// Accepts JSON: { chunkUrls: string[], mimeType: string, lang?: string }
// Downloads audio chunks from Supabase Storage, concatenates them,
// uploads the assembled file to Gemini File API, then transcribes.
// This bypasses Supabase's per-file upload size limit by splitting into smaller chunks.
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { chunkUrls, mimeType = "audio/webm", lang = "th" } = await req.json();

    if (!chunkUrls || !Array.isArray(chunkUrls) || chunkUrls.length === 0) {
      return NextResponse.json({ error: "chunkUrls array is required" }, { status: 400 });
    }
    if (chunkUrls.length > 50) {
      return NextResponse.json({ error: "Too many chunks (max 50)" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new AiNotConfiguredError("gemini");

    // Step 1: Download all chunks and concatenate
    const buffers: Buffer[] = [];
    let totalSize = 0;
    for (let i = 0; i < chunkUrls.length; i++) {
      const url = chunkUrls[i];
      const res = await fetch(url);
      if (!res.ok) {
        return NextResponse.json(
          { error: `ดาวน์โหลด chunk ${i + 1}/${chunkUrls.length} ไม่สำเร็จ (${res.status})` },
          { status: 400 }
        );
      }
      const buf = Buffer.from(await res.arrayBuffer());
      buffers.push(buf);
      totalSize += buf.length;
    }

    const audioBuffer = Buffer.concat(buffers);
    const fileSizeMB = (totalSize / (1024 * 1024)).toFixed(1);
    console.log(`transcribe-audio-chunks: assembled ${chunkUrls.length} chunks → ${fileSizeMB}MB, mime=${mimeType}`);

    if (totalSize > 200 * 1024 * 1024) {
      return NextResponse.json(
        { error: `ไฟล์เสียงรวมใหญ่เกินไป (${fileSizeMB}MB) — สูงสุด 200MB` },
        { status: 400 }
      );
    }

    // Step 2: Upload assembled file to Gemini File API
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    const boundary = "----GeminiUploadBoundary" + Date.now();

    const metadata = JSON.stringify({ file: { displayName: "meeting-audio-assembled" } });
    const bodyStart = Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
      "utf-8"
    );
    const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8");
    const fullBody = Buffer.concat([bodyStart, audioBuffer, bodyEnd]);

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(fullBody.length),
        "X-Goog-Upload-Protocol": "multipart",
      },
      body: fullBody,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("Gemini File API upload error:", uploadRes.status, errText);
      let detail = "";
      try {
        const errJson = JSON.parse(errText);
        detail = errJson?.error?.message || errText.slice(0, 200);
      } catch { detail = errText.slice(0, 200); }
      return NextResponse.json(
        { error: `อัพโหลดไฟล์ไป Gemini ไม่สำเร็จ (${uploadRes.status}): ${detail}` },
        { status: 502 }
      );
    }

    const uploadData = await uploadRes.json();
    const fileUri = uploadData.file?.uri;
    const fileName = uploadData.file?.name;

    if (!fileUri) {
      return NextResponse.json({ error: "Gemini File API ไม่คืน file URI" }, { status: 502 });
    }

    // Step 3: Wait for Gemini to process the file
    let fileState = uploadData.file?.state || "PROCESSING";
    let retries = 0;
    while (fileState === "PROCESSING" && retries < 45) {
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
        { error: "Gemini ยังประมวลผลไฟล์ไม่เสร็จ — กรุณาลองใหม่" },
        { status: 502 }
      );
    }

    // Step 4: Transcribe
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
                text: "ถอดเสียงจากไฟล์นี้เป็นข้อความตามที่ได้ยินจริงเท่านั้น ห้ามแต่งเติมหรือสร้างเนื้อหาขึ้นมาเอง ถ้าฟังไม่ออกให้เขียน [ไม่ชัด] ถ้าไม่มีเสียงพูดให้ตอบ [ไม่มีเสียงพูด]",
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

    // Step 5: Clean up Gemini file
    try {
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`,
        { method: "DELETE" }
      );
    } catch { /* best effort */ }

    if (!transcript) {
      return NextResponse.json(
        { error: "AI ไม่สามารถถอดเสียงได้ — อาจเป็นเพราะไฟล์เสียงไม่ชัด" },
        { status: 502 }
      );
    }

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
    console.error("transcribe-audio-chunks error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
