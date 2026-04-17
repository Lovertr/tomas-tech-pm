"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Square, Clock, ChevronUp, X } from "lucide-react";

interface ActiveTimer {
  id: string;
  task_id?: string | null;
  project_id?: string | null;
  started_at: string;
  tasks?: { id: string; title: string; project_id: string } | null;
  projects?: { id: string; name_th?: string | null; name_en?: string | null; project_code?: string | null } | null;
}

interface Props {
  onOpenTask?: (taskId: string) => void;
  refreshKey?: number;
  onChange?: () => void;
}

const POLL_MS = 30000; // poll backend every 30s as a safety net

export default function FloatingTimer({ onOpenTask, refreshKey = 0, onChange }: Props) {
  const [timer, setTimer] = useState<ActiveTimer | null>(null);
  const [now, setNow] = useState(Date.now());
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [stopping, setStopping] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTimer = useCallback(async () => {
    try {
      const r = await fetch("/api/timers");
      if (!r.ok) return;
      const d = await r.json();
      setTimer(d.timer ?? null);
    } catch {}
  }, []);

  useEffect(() => { fetchTimer(); }, [fetchTimer, refreshKey]);

  // Poll every 30s while mounted
  useEffect(() => {
    const id = setInterval(fetchTimer, POLL_MS);
    return () => clearInterval(id);
  }, [fetchTimer]);

  // Tick clock every second when timer is running
  useEffect(() => {
    if (!timer) {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    setHidden(false); // re-show when a new timer starts
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
  }, [timer]);

  // Listen for global timer events (so other components can trigger refresh)
  useEffect(() => {
    const onEvt = () => fetchTimer();
    window.addEventListener("timer:changed", onEvt);
    return () => window.removeEventListener("timer:changed", onEvt);
  }, [fetchTimer]);

  if (!timer || hidden) return null;

  const elapsed = () => {
    const s = Math.max(0, Math.floor((now - new Date(timer.started_at).getTime()) / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const stop = async () => {
    setStopping(true);
    try {
      const r = await fetch("/api/timers/stop", { method: "POST" });
      if (r.ok) {
        setTimer(null);
        onChange?.();
        window.dispatchEvent(new Event("timer:changed"));
      }
    } finally { setStopping(false); }
  };

  const taskTitle = timer.tasks?.title || "Untitled task";
  const projLabel = timer.projects?.project_code || timer.projects?.name_th || timer.projects?.name_en || "—";

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-gray-900 rounded-full shadow-2xl hover:shadow-green-500/30 transition-all"
        title={taskTitle}
      >
        <Clock size={14} className="animate-pulse" />
        <span className="font-mono text-sm font-semibold">{elapsed()}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 bg-white border border-green-500/40 rounded-2xl shadow-2xl shadow-green-500/10 overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-b border-green-500/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] font-medium text-green-700 uppercase tracking-wide">Timer running</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCollapsed(true)} title="ย่อ" className="p-1 text-gray-500 hover:text-gray-900">
            <ChevronUp size={14} />
          </button>
          <button onClick={() => setHidden(true)} title="ซ่อน (timer ยังทำงาน)" className="p-1 text-gray-500 hover:text-gray-900">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{projLabel}</span>
        </div>
        <button
          onClick={() => timer.task_id && onOpenTask?.(timer.task_id)}
          className="block w-full text-left text-sm font-medium text-gray-900 hover:text-blue-500 truncate mb-3"
          title={taskTitle}
        >
          {taskTitle}
        </button>

        <div className="flex items-center justify-between">
          <div className="font-mono text-2xl font-bold text-green-700 tabular-nums">{elapsed()}</div>
          <button
            onClick={stop}
            disabled={stopping}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Square size={14} /> {stopping ? "..." : "Stop"}
          </button>
        </div>
      </div>
    </div>
  );
}
