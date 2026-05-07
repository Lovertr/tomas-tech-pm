import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { AiNotConfiguredError, safeParseJson } from "@/lib/ai";

export const maxDuration = 30;

// POST /api/ai/scan-business-card
// Accepts JSON: { image: base64string, mimeType?: string }
// Returns extracted contact fields from business card image via Gemini Vision
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { image, mimeType: inputMime } = body as { image?: string; mimeType?: string };

    if (!image) {
      return NextResponse.json({ error: "image (base64) required" }, { status: 400 });
    }

    // Strip data URI prefix if present
    let base64 = image;
    let mimeType = inputMime || "image/jpeg";
    if (base64.startsWith("data:")) {
      const match = base64.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mimeType = match[1];
        base64 = base64.slice(match[0].length);
      }
    }

    // Validate size — ~4MB base64 limit
    const sizeBytes = (base64.length * 3) / 4;
    if (sizeBytes > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "รูปนามบัตรใหญ่เกิน 4MB — กรุณาลดขนาดรูปแล้วลองใหม่" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new AiNotConfiguredError("gemini");

    const systemText = [
      "You are a business card OCR engine for Tomas Tech, a Thai engineering/IT company.",
      "Extract contact information from the business card image.",
      "Return ONLY valid JSON with these fields (use null for fields not found):",
      '{ "first_name": string|null, "last_name": string|null, "position": string|null, "department": string|null, "company_name": string|null, "email": string|null, "phone": string|null, "line_id": string|null, "website": string|null, "address": string|null }',
      "Rules:",
      "- Read ALL text on the card carefully, including small print.",
      "- For Thai names, first_name = ชื่อ, last_name = นามสกุล (exclude คำนำหน้า like นาย/นาง/นางสาว/Mr./Mrs./Ms.).",
      "- For Japanese names, use the reading order as printed on the card.",
      "- phone: include country code if visible. If multiple phones, pick the mobile number first.",
      "- email: exact as printed, lowercase.",
      "- line_id: LINE ID if present.",
      "- Clean up OCR artifacts — no trailing > or stray characters in emails.",
      "- If the card is unreadable or not a business card, return all nulls.",
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
                text: "Extract all contact information from this business card. Return ONLY valid JSON.",
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
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
    const raw = parts.map((p: { text?: string }) => p.text ?? "").join("\n").trim();

    if (!raw) {
      return NextResponse.json(
        { error: "AI ไม่สามารถอ่านนามบัตรได้ — กรุณาถ่ายรูปให้ชัดขึ้น" },
        { status: 502 }
      );
    }

    const parsed = safeParseJson<Record<string, string | null>>(raw);
    if (!parsed) {
      return NextResponse.json(
        { error: "AI ส่งผลลัพธ์ในรูปแบบที่ไม่ถูกต้อง", raw },
        { status: 502 }
      );
    }

    return NextResponse.json({ contact: parsed });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json(
        { error: "AI not configured. Set GEMINI_API_KEY in env" },
        { status: 503 }
      );
    }
    console.error("scan-business-card error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
