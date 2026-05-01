// Server-only AI wrapper. Supports Gemini and Anthropic.
// Switch via AI_PROVIDER env ("gemini" | "anthropic"). Default: gemini.

export type AiTier = "haiku" | "sonnet" | "opus"; // logical tier (fast / balanced / reasoning)
export type AiLang = "th" | "en" | "jp";
export type AiProvider = "gemini" | "anthropic";

const ANTHROPIC_MODELS: Record<AiTier, string> = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-6",
};

const GEMINI_MODELS: Record<AiTier, string> = {
  haiku: "gemini-2.5-flash-lite",
  sonnet: "gemini-2.5-flash",
  opus: "gemini-2.5-pro",
};

export class AiNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`AI not configured: missing API key for provider "${provider}"`);
  }
}

export function langInstruction(lang: AiLang | string | undefined): string {
  const l = (lang ?? "th").toLowerCase();
  if (l.startsWith("en")) return "Respond in English.";
  if (l.startsWith("jp") || l.startsWith("ja")) return "日本語で回答してください。";
  return "ตอบเป็นภาษาไทย";
}

function getProvider(): AiProvider {
  const p = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();
  return p === "anthropic" ? "anthropic" : "gemini";
}

export type AiCallOptions = {
  model?: AiTier;
  system?: string;
  lang?: AiLang | string;
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
  provider?: AiProvider; // override per-call
};

export async function aiCall(prompt: string, opts: AiCallOptions = {}): Promise<string> {
  const provider = opts.provider ?? getProvider();
  const tier = opts.model ?? "haiku";
  const systemParts = [
    opts.system ?? "You are a helpful project-management AI assistant for Tomas Tech.",
    langInstruction(opts.lang),
    opts.json ? "Output ONLY valid JSON. No markdown fences, no commentary." : "",
  ].filter(Boolean);
  const system = systemParts.join("\n\n");

  if (provider === "gemini") return callGemini(tier, system, prompt, opts);
  return callAnthropic(tier, system, prompt, opts);
}

async function callGemini(tier: AiTier, system: string, prompt: string, opts: AiCallOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError("gemini");

  const model = GEMINI_MODELS[tier];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0.3,
        maxOutputTokens: opts.maxTokens ?? 1024,
        responseMimeType: opts.json ? "application/json" : "text/plain",
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
  return parts.map((p: { text?: string }) => p.text ?? "").join("\n").trim();
}

async function callAnthropic(tier: AiTier, system: string, prompt: string, opts: AiCallOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError("anthropic");
  const model = ANTHROPIC_MODELS[tier];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.3,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API ${res.status}: ${t}`);
  }
  const data = await res.json();
  const blocks = (data.content ?? []) as Array<{ type: string; text?: string }>;
  return blocks.filter(b => b.type === "text").map(b => b.text ?? "").join("\n").trim();
}

/**
 * Detect hallucinated / repetitive transcription output from Gemini.
 * Returns an error message string if hallucination is detected, or null if OK.
 */
export function detectTranscriptHallucination(text: string): string | null {
  if (!text || text.length < 50) return null;

  // 1. Check for excessively repeated phrases (5+ word phrases repeated 5+ times)
  const sentences = text.split(/[.!?\n。]+/).map(s => s.trim()).filter(s => s.length > 10);
  if (sentences.length > 5) {
    const freq = new Map<string, number>();
    for (const s of sentences) {
      // Normalize whitespace for comparison
      const norm = s.replace(/\s+/g, " ").trim().slice(0, 80);
      freq.set(norm, (freq.get(norm) || 0) + 1);
    }
    for (const [phrase, count] of freq) {
      if (count >= 5 && phrase.length > 15) {
        return `ตรวจพบข้อความซ้ำผิดปกติ ("${phrase.slice(0, 40)}…" ซ้ำ ${count} ครั้ง) — AI อาจถอดเสียงผิดพลาด กรุณาลองอัดเสียงใหม่ให้ชัดขึ้น`;
      }
    }
  }

  // 2. Check for repetitive short segments (same 20-char chunk repeated many times)
  const chunkSize = 20;
  if (text.length > chunkSize * 10) {
    const chunks = new Map<string, number>();
    for (let i = 0; i <= text.length - chunkSize; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize).replace(/\s+/g, " ");
      chunks.set(chunk, (chunks.get(chunk) || 0) + 1);
    }
    for (const [chunk, count] of chunks) {
      if (count >= 8 && chunk.trim().length > 5) {
        return `ตรวจพบข้อความซ้ำวนผิดปกติ — AI อาจสร้างข้อความขึ้นมาเองแทนที่จะถอดเสียงจริง กรุณาลองใหม่`;
      }
    }
  }

  // 3. Check ratio of unique content — if text is very long but has very few unique sentences
  if (sentences.length > 20) {
    const uniqueSentences = new Set(sentences.map(s => s.replace(/\s+/g, " ").trim().slice(0, 80)));
    const uniqueRatio = uniqueSentences.size / sentences.length;
    if (uniqueRatio < 0.15) {
      return `ตรวจพบว่าข้อความที่ถอดออกมามีความซ้ำซ้อนสูงมาก (${Math.round(uniqueRatio * 100)}% ไม่ซ้ำ) — AI อาจถอดเสียงผิดพลาด`;
    }
  }

  return null;
}

/** Parse a JSON response defensively (handles accidental code fences). */
export function safeParseJson<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  let s = raw.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(s) as T; } catch { /* try fallback */ }
  const m = s.match(/[\[{][\s\S]*[\]}]/);
  if (m) { try { return JSON.parse(m[0]) as T; } catch { return null; } }
  return null;
}
