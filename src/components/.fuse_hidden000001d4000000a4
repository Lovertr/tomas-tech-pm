"use client";
import { useState } from "react";
import { Languages, X, Loader2 } from "lucide-react";

type Lang = "th" | "en" | "jp";

const LANG_LABELS: Record<Lang, string> = { th: "TH", en: "EN", jp: "JP" };
const LANG_COLORS: Record<Lang, string> = {
  th: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  en: "bg-green-100 text-green-700 hover:bg-green-200",
  jp: "bg-red-100 text-red-700 hover:bg-red-200",
};

interface TranslateButtonProps {
  text: string;
  className?: string;
  compact?: boolean;
}

export default function TranslateButton({ text, className = "", compact = false }: TranslateButtonProps) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Lang | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doTranslate = async (lang: Lang) => {
    if (activeLang === lang) {
      setTranslated(null);
      setActiveLang(null);
      return;
    }
    if (!text?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), targetLang: lang }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Translation failed");
      }
      const d = await r.json();
      setTranslated(d.translated);
      setActiveLang(lang);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setTranslated(null);
    setActiveLang(null);
    setError(null);
  };

  if (!text?.trim()) return null;

  return (
    <div className={className}>
      <div className={`flex items-center gap-1 ${compact ? "" : "mt-1"}`}>
        <Languages size={compact ? 12 : 14} className="text-gray-500 shrink-0" />
        {(["th", "en", "jp"] as Lang[]).map((lang) => (
          <button
            key={lang}
            onClick={() => doTranslate(lang)}
            disabled={loading}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all disabled:opacity-50 ${
              activeLang === lang
                ? LANG_COLORS[lang].replace("hover:", "") + " ring-1 ring-current"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {LANG_LABELS[lang]}
          </button>
        ))}
        {loading && <Loader2 size={12} className="text-blue-500 animate-spin" />}
      </div>

      {error && (
        <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
          {error}
          <button onClick={close}><X size={10} /></button>
        </div>
      )}

      {translated && (
        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 relative">
          <button onClick={close} className="absolute top-1 right-1 text-gray-500 hover:text-gray-700">
            <X size={12} />
          </button>
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${activeLang ? LANG_COLORS[activeLang] : ""}`}>
              {activeLang ? LANG_LABELS[activeLang] : ""}
            </span>
            <span className="text-[10px] text-gray-500">Translation</span>
          </div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap pr-4">{translated}</div>
        </div>
      )}
    </div>
  );
}

/** Inline translate for short text snippets — shows translated text on the same line */
export function InlineTranslateButton({ text, className = "" }: { text: string; className?: string }) {
  return <TranslateButton text={text} className={className} compact />;
}
