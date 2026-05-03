"use client";
import { useState, useEffect } from "react";
import { X, Sparkles, ChevronDown, ChevronUp, History } from "lucide-react";
import { VERSION_HISTORY, CURRENT_VERSION, type VersionEntry } from "@/lib/version-history";
import type { Lang } from "@/lib/i18n";

const STORAGE_KEY = "tt_dismissed_version";

const langMap: Record<Lang, "th" | "en" | "jp"> = { th: "th", en: "en", jp: "jp" };

interface Props {
  lang: Lang;
}

export default function VersionBanner({ lang }: Props) {
  const [dismissed, setDismissed] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const vLang = langMap[lang] || "th";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== CURRENT_VERSION) {
        setDismissed(false);
      }
    } catch { /* SSR / private browsing */ }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, CURRENT_VERSION); } catch {}
  };

  const latest = VERSION_HISTORY[0];
  if (!latest || dismissed) return null;

  const labelNew: Record<string, string> = { th: "ใหม่", en: "NEW", jp: "新機能" };
  const labelChangelog: Record<string, string> = { th: "ดูประวัติเวอร์ชั่นทั้งหมด", en: "View full changelog", jp: "全バージョン履歴を見る" };

  return (
    <div className="mx-4 mt-3 mb-1 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm overflow-hidden animate-in slide-in-from-top duration-300">
      {/* Main banner */}
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 px-2 py-0.5 rounded-full">
              {labelNew[vLang] || "NEW"}
            </span>
            <span className="text-xs text-gray-500 font-mono">v{latest.version}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{new Date(latest.date).toLocaleDateString(lang === "jp" ? "ja-JP" : lang === "en" ? "en-US" : "th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1.5">{latest.title[vLang]}</p>
          <ul className="space-y-1">
            {latest.highlights[vLang].map((h, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>

          {/* Show older versions */}
          {VERSION_HISTORY.length > 1 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <History size={12} />
              {labelChangelog[vLang]}
              {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
        <button onClick={dismiss} className="flex-shrink-0 p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Changelog history */}
      {showAll && (
        <div className="border-t border-blue-100 px-4 py-3 space-y-3 bg-white/40">
          {VERSION_HISTORY.slice(1).map((v: VersionEntry) => (
            <div key={v.version} className="pl-2 border-l-2 border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-medium text-gray-700">v{v.version}</span>
                <span className="text-xs text-gray-400">{new Date(v.date).toLocaleDateString(lang === "jp" ? "ja-JP" : lang === "en" ? "en-US" : "th-TH", { day: "numeric", month: "short" })}</span>
              </div>
              <p className="text-xs font-medium text-gray-800 mb-1">{v.title[vLang]}</p>
              <ul className="space-y-0.5">
                {v.highlights[vLang].map((h, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-gray-300 mt-0.5">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
