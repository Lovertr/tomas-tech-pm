"use client";
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string; // tailwind class e.g. "max-w-2xl"
}

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-xl" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-[#1E293B] rounded-2xl border border-[#334155] shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155] sticky top-0 bg-[#1E293B] z-10">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Shared form field helpers
export const fieldLabel = "block text-sm font-medium text-slate-300 mb-1.5";
export const fieldInput =
  "w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#00AEEF] transition-colors";
export const btnPrimary =
  "px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
export const btnGhost =
  "px-4 py-2 text-slate-300 hover:text-white text-sm font-medium rounded-lg transition-colors";
