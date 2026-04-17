"use client";
import { Keyboard, X } from "lucide-react";
import { SHORTCUTS_HELP } from "@/hooks/useKeyboardShortcuts";

export default function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#334155] px-5 py-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <Keyboard size={18} className="text-orange-400" /> Keyboard Shortcuts
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-2">
          {SHORTCUTS_HELP.map(s => (
            <div key={s.keys} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{s.label}</span>
              <kbd className="text-[11px] font-mono text-cyan-300 border border-[#334155] bg-[#0F172A] rounded px-2 py-0.5">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <div className="border-t border-[#334155] px-5 py-3 text-[11px] text-slate-500 text-center">
          กด <kbd className="border border-[#334155] rounded px-1.5">?</kbd> เพื่อเปิดหน้านี้ทุกที่
        </div>
      </div>
    </div>
  );
}
