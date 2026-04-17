"use client";
import { Keyboard, X } from "lucide-react";
import { SHORTCUTS_HELP } from "@/hooks/useKeyboardShortcuts";

export default function ShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-white/40 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Keyboard size={18} className="text-orange-500" /> Keyboard Shortcuts
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-slate-900"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-2">
          {SHORTCUTS_HELP.map(s => (
            <div key={s.keys} className="flex items-center justify-between text-sm">
              <span className="text-gray-800">{s.label}</span>
              <kbd className="text-[11px] font-mono text-blue-700 border border-[#E2E8F0] bg-slate-50 rounded px-2 py-0.5">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <div className="border-t border-[#E5E7EB] px-5 py-3 text-[11px] text-gray-600 text-center">
          กด <kbd className="border border-[#E2E8F0] rounded px-1.5">?</kbd> เพื่อเปิดหน้านี้ทุกที่
        </div>
      </div>
    </div>
  );
}
