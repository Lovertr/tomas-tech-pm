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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-white/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`bg-[#FFFFFF] w-full md:rounded-2xl rounded-t-2xl border-t md:border border-[#E5E7EB] shadow-2xl ${maxWidth} max-h-[95vh] md:max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[#E5E7EB] sticky top-0 bg-[#FFFFFF] z-10">
          <h2 className="text-base md:text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-slate-900 transition-colors p-1">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}

// Shared form field helpers
export const fieldLabel = "block text-sm font-medium text-gray-800 mb-1.5";
export const fieldInput =
  "w-full bg-[#F5F5F5] border border-[#E5E7EB] rounded-lg px-3 py-2 text-slate-900 text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#3B82F6] transition-colors";
export const btnPrimary =
  "px-4 py-2 bg-[#1E40AF] hover:bg-[#2563EB] text-slate-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
export const btnGhost =
  "px-4 py-2 text-gray-700 hover:text-slate-900 text-sm font-medium rounded-lg transition-colors";
