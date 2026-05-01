"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ArrowRight, Hash } from "lucide-react";

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  keywords?: string;
  group?: string;
  action: () => void;
}

export default function CommandPalette({ open, onClose, items }: { open: boolean; onClose: () => void; items: CommandItem[] }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ(""); setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items.slice(0, 50);
    return items.filter(i =>
      i.label.toLowerCase().includes(needle) ||
      (i.keywords ?? "").toLowerCase().includes(needle) ||
      (i.hint ?? "").toLowerCase().includes(needle)
    ).slice(0, 50);
  }, [q, items]);

  useEffect(() => { setIdx(0); }, [q]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[idx];
      if (item) { item.action(); onClose(); }
    } else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  // group
  const groups = filtered.reduce((acc, it) => {
    const g = it.group ?? "ทั่วไป";
    if (!acc[g]) acc[g] = [];
    acc[g].push(it);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  let runIdx = -1;

  return (
    <div className="fixed inset-0 bg-white/40 z-[100] flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-4 py-3">
          <Search size={18} className="text-slate-600" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="ค้นหาคำสั่ง โครงการ หรือเมนู..."
            className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-500"
          />
          <kbd className="text-[10px] text-slate-600 border border-[#E5E7EB] rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {!filtered.length && (
            <div className="text-center text-slate-600 py-10 text-sm">ไม่พบคำสั่ง</div>
          )}
          {Object.entries(groups).map(([g, list]) => (
            <div key={g} className="mb-2">
              <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-slate-600 flex items-center gap-1"><Hash size={10} />{g}</div>
              {list.map(it => {
                runIdx += 1;
                const active = runIdx === idx;
                return (
                  <button
                    key={it.id}
                    onClick={() => { it.action(); onClose(); }}
                    onMouseEnter={() => setIdx(runIdx)}
                    className={`w-full text-left px-4 py-2 flex items-center justify-between text-sm transition ${active ? "bg-blue-100 text-slate-900" : "text-slate-700 hover:bg-gray-100"}`}
                  >
                    <div>
                      <div className="font-medium">{it.label}</div>
                      {it.hint && <div className="text-[11px] text-slate-600">{it.hint}</div>}
                    </div>
                    {active && <ArrowRight size={14} className="text-orange-600" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="border-t border-[#E5E7EB] px-4 py-2 text-[10px] text-slate-600 flex justify-between">
          <span>↑↓ เลือก · Enter เปิด · Esc ปิด</span>
          <span>{filtered.length} รายการ</span>
        </div>
      </div>
    </div>
  );
}
