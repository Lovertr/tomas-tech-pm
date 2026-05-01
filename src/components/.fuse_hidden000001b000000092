"use client";
import { useEffect, useState, useCallback } from "react";
import { Calendar, AlertCircle, CheckCircle2, Clock, Play, Square, ChevronRight } from "lucide-react";

interface Task {
  id: string; title: string; title_en?: string | null; title_jp?: string | null;
  status: string; priority: string;
  due_date?: string | null; estimated_hours?: number | null; actual_hours?: number | null;
  project_id: string;
  projects?: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null };
}

const tTitle = (t: Task, lang: string) =>
  lang === "jp" ? (t.title_jp || t.title_en || t.title) :
  lang === "en" ? (t.title_en || t.title) : t.title;

const PRIO_DOT: Record<string, string> = {
  urgent: "bg-red-600", high: "bg-orange-600", medium: "bg-blue-600", low: "bg-gray-600",
};
const STATUS_COLOR: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-700", todo: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700", review: "bg-purple-100 text-purple-700",
};

interface Props {
  onTaskClick: (id: string) => void;
  refreshKey?: number;
  lang?: string;
}

export default function MyTasks({ onTaskClick, refreshKey = 0, lang = "th" }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState<{ id: string; task_id?: string; started_at: string } | null>(null);
  const [now, setNow] = useState(Date.now());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, tm] = await Promise.all([
        fetch("/api/my-tasks").then(r => r.ok ? r.json() : { tasks: [] }),
        fetch("/api/timers").then(r => r.ok ? r.json() : { timer: null }),
      ]);
      setTasks(t.tasks ?? []);
      setTimer(tm.timer ?? null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const elapsed = (start: string) => {
    const s = Math.max(0, Math.floor((now - new Date(start).getTime()) / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const startTimer = async (task: Task) => {
    const r = await fetch("/api/timers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: task.id, project_id: task.project_id }),
    });
    if (r.ok) { const d = await r.json(); setTimer(d.timer ?? d); window.dispatchEvent(new Event("timer:changed")); }
  };
  const stopTimer = async () => {
    const r = await fetch("/api/timers/stop", { method: "POST" });
    if (r.ok) { setTimer(null); fetchAll(); window.dispatchEvent(new Event("timer:changed")); }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in3days = new Date(today); in3days.setDate(in3days.getDate() + 3);
  const in7days = new Date(today); in7days.setDate(in7days.getDate() + 7);

  const groups = {
    overdue: [] as Task[], today: [] as Task[], next3: [] as Task[], next7: [] as Task[], later: [] as Task[], noDate: [] as Task[],
  };
  tasks.forEach(t => {
    if (!t.due_date) { groups.noDate.push(t); return; }
    const d = new Date(t.due_date); d.setHours(0, 0, 0, 0);
    if (d < today) groups.overdue.push(t);
    else if (d.getTime() === today.getTime()) groups.today.push(t);
    else if (d <= in3days) groups.next3.push(t);
    else if (d <= in7days) groups.next7.push(t);
    else groups.later.push(t);
  });

  const total = tasks.length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const overdue = groups.overdue.length;
  const dueToday = groups.today.length;

  const renderRow = (t: Task) => {
    const isMyTimer = timer?.task_id === t.id;
    const proj = t.projects;
    const due = t.due_date ? new Date(t.due_date) : null;
    return (
      <div
        key={t.id}
        onClick={() => onTaskClick(t.id)}
        className="group bg-white border border-gray-300 hover:border-blue-500/60 rounded-xl p-4 cursor-pointer transition-colors flex items-center gap-3"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${PRIO_DOT[t.priority] || "bg-slate-400"}`} title={t.priority} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{proj?.project_code || "—"}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLOR[t.status] || "bg-gray-100 text-gray-600"}`}>{t.status}</span>
          </div>
          <div className="text-sm text-gray-900 truncate">{tTitle(t, lang)}</div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            {due && <span className="flex items-center gap-1"><Calendar size={11} />{due.toLocaleDateString("th-TH", { month: "short", day: "numeric" })}</span>}
            {t.estimated_hours ? <span className="flex items-center gap-1"><Clock size={11} />{Number(t.estimated_hours).toFixed(1)}h</span> : null}
            {(t.actual_hours ?? 0) > 0 && <span className="text-gray-600">spent {Number(t.actual_hours).toFixed(1)}h</span>}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isMyTimer ? (
            <button onClick={stopTimer} className="flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-md border border-red-200">
              <Square size={12} /> {elapsed(timer!.started_at)}
            </button>
          ) : (
            <button onClick={() => startTimer(t)} disabled={!!timer} title={timer ? "มี timer ทำงานอยู่" : "Start timer"}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded-md border border-green-200 disabled:opacity-40 disabled:cursor-not-allowed">
              <Play size={12} />
            </button>
          )}
          <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-900" />
        </div>
      </div>
    );
  };

  const Section = ({ title, items, accent }: { title: string; items: Task[]; accent: string }) => {
    if (!items.length) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-4 rounded-full" style={{ background: accent }} />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <span className="text-xs text-gray-500">({items.length})</span>
        </div>
        <div className="space-y-2">{items.map(renderRow)}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={lang === "jp" ? "全タスク" : lang === "en" ? "All Tasks" : "งานทั้งหมด"} value={total} icon={CheckCircle2} color="#00AEEF" />
        <StatCard label={lang === "jp" ? "進行中" : lang === "en" ? "In Progress" : "กำลังทำ"} value={inProgress} icon={Clock} color="#F7941D" />
        <StatCard label={lang === "jp" ? "本日期限" : lang === "en" ? "Due Today" : "ครบกำหนดวันนี้"} value={dueToday} icon={Calendar} color="#A855F7" />
        <StatCard label={lang === "jp" ? "期限超過" : lang === "en" ? "Overdue" : "เลยกำหนด"} value={overdue} icon={AlertCircle} color="#EF4444" />
      </div>

      {/* Active timer banner */}
      {timer && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div>
              <div className="text-sm font-medium text-gray-900">Timer running</div>
              <div className="text-xs text-gray-500">{(() => { const found = tasks.find(t => t.id === timer.task_id); return found ? tTitle(found, lang) : "task"; })()}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg text-green-700">{elapsed(timer.started_at)}</span>
            <button onClick={stopTimer} className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-xs font-medium flex items-center gap-1">
              <Square size={14} /> Stop
            </button>
          </div>
        </div>
      )}

      {loading && tasks.length === 0 && <div className="text-center text-gray-500 py-12">Loading...</div>}
      {!loading && tasks.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-300 rounded-2xl">
          <CheckCircle2 size={48} className="mx-auto text-green-400 mb-3" />
          <div className="text-lg font-semibold text-gray-900">{lang === "jp" ? "未処理タスクなし" : lang === "en" ? "No pending tasks" : "ไม่มีงานค้าง"}</div>
          <div className="text-sm text-gray-500 mt-1">{lang === "jp" ? "全てクリアしました" : lang === "en" ? "All clear, great job!" : "เคลียร์งานหมดแล้ว ดีมาก"}</div>
        </div>
      )}

      <Section title={lang === "jp" ? "期限超過" : lang === "en" ? "Overdue" : "เลยกำหนด"} items={groups.overdue} accent="#EF4444" />
      <Section title={lang === "jp" ? "期限超過" : lang === "en" ? "Overdue" : "เลยกำหนด"} items={groups.overdue} accent="#EF4444" />
      <Section title={lang === "jp" ? "今日" : lang === "en" ? "Today" : "วันนี้"} items={groups.today} accent="#F7941D" />
      <Section title={lang === "jp" ? "3日以内" : lang === "en" ? "Next 3 Days" : "3 วันข้างหน้า"} items={groups.next3} accent="#00AEEF" />
      <Section title={lang === "jp" ? "7日以内" : lang === "en" ? "Next 7 Days" : "7 วันข้างหน้า"} items={groups.next7} accent="#3B82F6" />
      <Section title={lang === "jp" ? "それ以降" : lang === "en" ? "Later" : "ภายหลัง"} items={groups.later} accent="#64748B" />
      <Section title={lang === "jp" ? "日付なし" : lang === "en" ? "No Date" : "ไม่กำหนดวัน"} items={groups.noDate} accent="#475569" />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ size?: number; color?: string }>; color: string }) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon size={18} color={color} />
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
