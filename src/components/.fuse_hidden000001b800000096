"use client";
import { AlertTriangle, Clock } from "lucide-react";

export function daysFromToday(date?: string | null): number | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / 86400000);
}

/**
 * Renders a visual overdue / due-soon badge based on a date.
 * - past: red "เกิน Nวัน"
 * - today: orange "วันนี้"
 * - 1-3 days: yellow "อีก Nวัน"
 * - else: nothing
 */
export default function OverdueBadge({ date, completed = false, size = "sm" }: { date?: string | null; completed?: boolean; size?: "sm" | "xs" }) {
  if (completed) return null;
  const diff = daysFromToday(date);
  if (diff === null) return null;

  const px = size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]";
  const ic = size === "xs" ? 9 : 10;

  if (diff < 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${px}`} style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" }}>
        <AlertTriangle size={ic} /> เกิน {Math.abs(diff)} วัน
      </span>
    );
  }
  if (diff === 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${px}`} style={{ background: "#FEF3C7", color: "#D97706", border: "1px solid #FCD34D" }}>
        <Clock size={ic} /> ครบกำหนดวันนี้
      </span>
    );
  }
  if (diff <= 3) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${px}`} style={{ background: "#FEF08A", color: "#CA8A04", border: "1px solid #FADE50" }}>
        <Clock size={ic} /> อีก {diff} วัน
      </span>
    );
  }
  return null;
}
