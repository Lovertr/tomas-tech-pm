"use client";
import { useEffect, useRef } from "react";

export interface ShortcutHandlers {
  onCommandPalette?: () => void;        // Cmd/Ctrl+K
  onNewTask?: () => void;               // n
  onSearch?: () => void;                // /
  onHelp?: () => void;                  // ?
  onEscape?: () => void;                // Esc
  onGoto?: (page: string) => void;      // g then [d/p/t/m/i/f/c/r/s]
}

const GOTO_MAP: Record<string, string> = {
  d: "dashboard",
  p: "projects",
  t: "tasks",
  m: "mytasks",
  i: "invoices",
  f: "finance",
  c: "calendar",
  r: "reports",
  s: "settings",
  k: "kanban",
  g: "gantt",
};

const isTyping = (e: KeyboardEvent) => {
  const tag = (e.target as HTMLElement)?.tagName;
  const editable = (e.target as HTMLElement)?.isContentEditable;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || editable;
};

export default function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const gotoArmed = useRef(false);
  const gotoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K → command palette (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handlers.onCommandPalette?.();
        return;
      }
      if (e.key === "Escape") { handlers.onEscape?.(); return; }
      if (isTyping(e)) return;

      // Goto sequence
      if (gotoArmed.current) {
        const pageId = GOTO_MAP[e.key.toLowerCase()];
        if (pageId) {
          e.preventDefault();
          handlers.onGoto?.(pageId);
        }
        gotoArmed.current = false;
        if (gotoTimer.current) clearTimeout(gotoTimer.current);
        return;
      }

      switch (e.key) {
        case "g":
          gotoArmed.current = true;
          if (gotoTimer.current) clearTimeout(gotoTimer.current);
          gotoTimer.current = setTimeout(() => { gotoArmed.current = false; }, 1200);
          break;
        case "n": e.preventDefault(); handlers.onNewTask?.(); break;
        case "/": e.preventDefault(); handlers.onSearch?.(); break;
        case "?": e.preventDefault(); handlers.onHelp?.(); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers]);
}

export const SHORTCUTS_HELP: { keys: string; label: string }[] = [
  { keys: "Ctrl/⌘ + K", label: "เปิด Command Palette" },
  { keys: "g d", label: "ไปหน้า Dashboard" },
  { keys: "g p", label: "ไปหน้า Projects" },
  { keys: "g t", label: "ไปหน้า Tasks" },
  { keys: "g m", label: "ไปหน้า My Tasks" },
  { keys: "g i", label: "ไปหน้า Invoices" },
  { keys: "g f", label: "ไปหน้า Finance" },
  { keys: "g c", label: "ไปหน้า Calendar" },
  { keys: "g r", label: "ไปหน้า Reports" },
  { keys: "g s", label: "ไปหน้า Settings" },
  { keys: "n", label: "สร้างงานใหม่" },
  { keys: "/", label: "Focus search" },
  { keys: "?", label: "แสดง shortcuts" },
  { keys: "Esc", label: "ปิด modal" },
];
