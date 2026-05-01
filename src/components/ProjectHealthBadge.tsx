"use client";
import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type Lang = "th" | "en" | "jp";
type Status = "healthy" | "at_risk" | "critical";

const T: Record<string, Record<Lang, string>> = {
  healthy: { th: "สุขภาพดี", en: "Healthy", jp: "良好" },
  at_risk: { th: "มีความเสี่ยง", en: "At Risk", jp: "リスクあり" },
  critical: { th: "วิกฤต", en: "Critical", jp: "危機的" },
  schedule: { th: "กำหนดเวลา", en: "Schedule", jp: "スケジュール" },
  tasks: { th: "งาน", en: "Tasks", jp: "タスク" },
  risks: { th: "ความเสี่ยง", en: "Risks", jp: "リスク" },
  budget: { th: "งบประมาณ", en: "Budget", jp: "予算" },
  progress: { th: "ความคืบหน้า", en: "Progress", jp: "進捗" },
  expected: { th: "คาดหวัง", en: "Expected", jp: "予定" },
  overdue: { th: "เลยกำหนด", en: "Overdue", jp: "期限超過" },
  open_risks: { th: "ความเสี่ยงเปิด", en: "Open Risks", jp: "未解決リスク" },
  days_left: { th: "เหลือ (วัน)", en: "Days Left", jp: "残り日数" },
  budget_used: { th: "ใช้งบ", en: "Budget Used", jp: "予算消費" },
  health_score: { th: "คะแนนสุขภาพ", en: "Health Score", jp: "健全性スコア" },
};

interface HealthData {
  score: number;
  status: Status;
  factors: { schedule: number; tasks: number; risks: number; budget: number };
  details: Record<string, number>;
}

const STATUS_CONFIG: Record<Status, { color: string; bg: string; border: string; icon: typeof CheckCircle }> = {
  healthy: { color: "text-green-700", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle },
  at_risk: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle },
  critical: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: XCircle },
};

function ScoreBar({ value, label, lang }: { value: number; label: string; lang: Lang }) {
  const color = value >= 70 ? "bg-green-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-gray-500 shrink-0">{T[label]?.[lang] || label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={"h-full rounded-full transition-all " + color} style={{ width: value + "%" }} />
      </div>
      <span className="w-7 text-right text-gray-600 font-medium">{value}</span>
    </div>
  );
}

export default function ProjectHealthBadge({ health, lang = "th", compact = false }: { health: HealthData | null; lang?: Lang; compact?: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const L = (k: string) => T[k]?.[lang] || T[k]?.en || k;

  if (!health) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400">
        <Activity className="w-3 h-3" /> --
      </span>
    );
  }

  const cfg = STATUS_CONFIG[health.status];
  const Icon = cfg.icon;

  if (compact) {
    return (
      <div className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
        <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-help border " + cfg.bg + " " + cfg.color + " " + cfg.border}>
          <Icon className="w-3 h-3" /> {health.score}
        </span>
        {showTooltip && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white rounded-xl shadow-xl border border-[#E2E8F0] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">{L("health_score")}</span>
              <span className={"text-sm font-bold " + cfg.color}>{health.score}/100</span>
            </div>
            <ScoreBar value={health.factors.schedule} label="schedule" lang={lang} />
            <ScoreBar value={health.factors.tasks} label="tasks" lang={lang} />
            <ScoreBar value={health.factors.risks} label="risks" lang={lang} />
            <ScoreBar value={health.factors.budget} label="budget" lang={lang} />
            <div className="pt-1 border-t border-[#F1F5F9] space-y-0.5 text-[10px] text-gray-500">
              <div className="flex justify-between"><span>{L("progress")}</span><span>{health.details.progress}% / {L("expected")} {health.details.expected_progress}%</span></div>
              <div className="flex justify-between"><span>{L("overdue")}</span><span>{health.details.overdue_tasks} / {health.details.total_tasks} {L("tasks").toLowerCase()}</span></div>
              <div className="flex justify-between"><span>{L("open_risks")}</span><span>{health.details.open_risks}</span></div>
              <div className="flex justify-between"><span>{L("days_left")}</span><span>{health.details.days_remaining}</span></div>
              {health.details.budget_used_pct > 0 && <div className="flex justify-between"><span>{L("budget_used")}</span><span>{health.details.budget_used_pct}%</span></div>}
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-[#E2E8F0]" />
          </div>
        )}
      </div>
    );
  }

  // Full card mode
  return (
    <div className={"rounded-xl border p-3 " + cfg.bg + " " + cfg.border}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={"w-4 h-4 " + cfg.color} />
          <span className={"text-sm font-semibold " + cfg.color}>{L(health.status)}</span>
        </div>
        <span className={"text-lg font-bold " + cfg.color}>{health.score}</span>
      </div>
      <div className="space-y-1.5">
        <ScoreBar value={health.factors.schedule} label="schedule" lang={lang} />
        <ScoreBar value={health.factors.tasks} label="tasks" lang={lang} />
        <ScoreBar value={health.factors.risks} label="risks" lang={lang} />
        <ScoreBar value={health.factors.budget} label="budget" lang={lang} />
      </div>
    </div>
  );
}
