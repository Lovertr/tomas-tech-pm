"use client";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

export default function DailyStandupCard({ lang = "th" }: { lang?: string }) {
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ logs_count: number; open_tasks_count: number } | null>(null);

  const generate = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/ai/standup", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "failed");
      setText(j.standup);
      setMeta({ logs_count: j.logs_count, open_tasks_count: j.open_tasks_count });
    } catch (e) { setErr(e instanceof Error ? e.message : "failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">AI Daily Standup</h3>
          {meta && <span className="text-xs text-gray-500">— {meta.logs_count} logs · {meta.open_tasks_count} open tasks</span>}
        </div>
        <button onClick={generate} disabled={busy}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-medium disabled:opacity-40 flex items-center gap-1.5">
          {busy ? <><Loader2 size={12} className="animate-spin" /> Generating...</> : <>✨ {text ? "Regenerate" : "Generate"}</>}
        </button>
      </div>
      {err && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">{err}</div>}
      {text && (
        <div className="text-sm text-slate-700 whitespace-pre-wrap mt-2 max-h-64 overflow-y-auto">
          {text}
        </div>
      )}
      {!text && !err && !busy && (
        <div className="text-xs text-gray-500">Click Generate to create your daily standup from yesterday&apos;s time logs and open tasks.</div>
      )}
    </div>
  );
}
