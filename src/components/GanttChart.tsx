"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { ZoomIn, ZoomOut, Calendar, Diamond } from "lucide-react";

interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; start_date?: string | null; end_date?: string | null; }
interface GTask {
  id: string; title: string; status: string; priority: string;
  start_date?: string | null; due_date?: string | null;
  estimated_hours?: number | null; actual_hours?: number | null;
  assignee_id?: string | null; project_id: string;
  team_members?: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null } | null;
}
interface Milestone { id: string; title: string; due_date: string; status: string; }
interface Dep { id: string; task_id: string; depends_on_task_id: string; dependency_type: string; }

const STATUS_BAR: Record<string, string> = {
  backlog: "#64748B", todo: "#3B82F6", in_progress: "#F59E0B",
  review: "#A855F7", done: "#22C55E", cancelled: "#6B7280",
};

type Zoom = "day" | "week" | "month";
const PX_PER_UNIT: Record<Zoom, number> = { day: 32, week: 18, month: 6 };
const ROW_H = 36;
const HEADER_H = 48;

const dayDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

interface Props {
  projectId: string;
  onTaskClick?: (id: string) => void;
  refreshKey?: number;
}

export default function GanttChart({ projectId, onTaskClick, refreshKey = 0 }: Props) {
  const [data, setData] = useState<{ project: Project | null; tasks: GTask[]; milestones: Milestone[]; dependencies: Dep[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState<Zoom>("week");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const LEFT_W = isMobile ? 120 : 260;
  const [hoverTask, setHoverTask] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/gantt?project_id=${projectId}`);
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  // Compute timeline range
  const range = useMemo(() => {
    if (!data) return null;
    const dates: Date[] = [];
    data.tasks.forEach(t => {
      if (t.start_date) dates.push(new Date(t.start_date));
      if (t.due_date) dates.push(new Date(t.due_date));
    });
    data.milestones.forEach(m => { if (m.due_date) dates.push(new Date(m.due_date)); });
    if (data.project?.start_date) dates.push(new Date(data.project.start_date));
    if (data.project?.end_date) dates.push(new Date(data.project.end_date));
    if (!dates.length) {
      const today = startOfDay(new Date());
      return { start: today, end: addDays(today, 30), totalDays: 30 };
    }
    const min = startOfDay(new Date(Math.min(...dates.map(d => d.getTime()))));
    const max = startOfDay(new Date(Math.max(...dates.map(d => d.getTime()))));
    const start = addDays(min, -3);
    const end = addDays(max, 3);
    return { start, end, totalDays: dayDiff(end, start) + 1 };
  }, [data]);

  const pxPerDay = useMemo(() => {
    if (zoom === "day") return PX_PER_UNIT.day;
    if (zoom === "week") return PX_PER_UNIT.week / 1; // pixels per day at week zoom
    return PX_PER_UNIT.month / 1; // month
  }, [zoom]);

  const totalWidth = range ? range.totalDays * pxPerDay : 0;

  // Build header ticks
  const ticks = useMemo(() => {
    if (!range) return [];
    const out: { x: number; label: string; major: boolean }[] = [];
    const cursor = new Date(range.start);
    if (zoom === "day") {
      for (let i = 0; i < range.totalDays; i++) {
        const d = addDays(range.start, i);
        out.push({ x: i * pxPerDay, label: d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" }), major: d.getDay() === 1 });
      }
    } else if (zoom === "week") {
      // Snap to Mondays
      let i = 0;
      const d0 = new Date(cursor);
      while (d0.getDay() !== 1 && i < 7) { d0.setDate(d0.getDate() + 1); i++; }
      const startOffset = dayDiff(d0, range.start);
      for (let j = startOffset; j < range.totalDays; j += 7) {
        const d = addDays(range.start, j);
        out.push({ x: j * pxPerDay, label: `${d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" })}`, major: true });
      }
    } else {
      // month — first of each month
      const firstMonth = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
      const start = firstMonth < range.start ? new Date(range.start.getFullYear(), range.start.getMonth() + 1, 1) : firstMonth;
      const c = new Date(start);
      while (c <= range.end) {
        const off = dayDiff(c, range.start);
        out.push({ x: off * pxPerDay, label: c.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }), major: true });
        c.setMonth(c.getMonth() + 1);
      }
    }
    return out;
  }, [range, zoom, pxPerDay]);

  // Sort tasks: by start date, then due date
  const sortedTasks = useMemo(() => {
    if (!data) return [];
    return [...data.tasks].sort((a, b) => {
      const sa = a.start_date || a.due_date || "9999";
      const sb = b.start_date || b.due_date || "9999";
      return sa.localeCompare(sb);
    });
  }, [data]);

  const taskRowIndex = useMemo(() => {
    const m = new Map<string, number>();
    sortedTasks.forEach((t, i) => m.set(t.id, i));
    return m;
  }, [sortedTasks]);

  const today = startOfDay(new Date());
  const todayX = range ? dayDiff(today, range.start) * pxPerDay : 0;

  if (!projectId) return <div className="text-gray-500 text-center py-12">เลือกโครงการเพื่อดู Gantt chart</div>;
  if (loading) return <div className="text-gray-500 text-center py-12">Loading...</div>;
  if (!data || !range) return <div className="text-gray-500 text-center py-12">ไม่มีข้อมูล</div>;

  const totalRows = sortedTasks.length;
  const chartHeight = totalRows * ROW_H + HEADER_H;

  // Compute bar geometry per task
  const taskBars = sortedTasks.map((t, i) => {
    const start = t.start_date ? startOfDay(new Date(t.start_date)) : (t.due_date ? startOfDay(new Date(t.due_date)) : null);
    const end = t.due_date ? startOfDay(new Date(t.due_date)) : start;
    if (!start || !end) return null;
    const x = dayDiff(start, range.start) * pxPerDay;
    const w = Math.max(pxPerDay, (dayDiff(end, start) + 1) * pxPerDay);
    const y = HEADER_H + i * ROW_H + 7;
    const progress = t.estimated_hours && t.estimated_hours > 0
      ? Math.min(100, ((t.actual_hours ?? 0) / t.estimated_hours) * 100)
      : (t.status === "done" ? 100 : 0);
    return { task: t, x, y, w, h: ROW_H - 14, color: STATUS_BAR[t.status] || "#64748B", progress, idx: i };
  }).filter(Boolean) as { task: GTask; x: number; y: number; w: number; h: number; color: string; progress: number; idx: number }[];

  // Dependency arrows
  const arrows = data.dependencies.map(d => {
    const fromIdx = taskRowIndex.get(d.depends_on_task_id);
    const toIdx = taskRowIndex.get(d.task_id);
    if (fromIdx === undefined || toIdx === undefined) return null;
    const from = taskBars[fromIdx]; const to = taskBars[toIdx];
    if (!from || !to) return null;
    const x1 = from.x + from.w; const y1 = from.y + from.h / 2;
    const x2 = to.x; const y2 = to.y + to.h / 2;
    return { id: d.id, x1, y1, x2, y2 };
  }).filter(Boolean) as { id: string; x1: number; y1: number; x2: number; y2: number }[];

  return (
    <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-300 gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
          <Calendar size={16} className="text-[#00AEEF] shrink-0" />
          <span className="font-semibold text-gray-900 truncate">{data.project?.name_th || data.project?.name_en}</span>
          <span className="text-xs text-gray-600 shrink-0">({data.project?.project_code})</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-50 rounded-lg p-0.5 sm:p-1">
            {(["day", "week", "month"] as Zoom[]).map(z => (
              <button key={z} onClick={() => setZoom(z)}
                className={`px-2 sm:px-2.5 py-1 text-xs rounded ${zoom === z ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-900"}`}>
                {z === "day" ? "วัน" : z === "week" ? "สัปดาห์" : "เดือน"}
              </button>
            ))}
          </div>
          <button onClick={() => setZoom(z => z === "month" ? "week" : "day")} className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-900" title="Zoom in"><ZoomIn size={16} /></button>
          <button onClick={() => setZoom(z => z === "day" ? "week" : "month")} className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-900" title="Zoom out"><ZoomOut size={16} /></button>
        </div>
      </div>

      {/* Body: left task list + right chart */}
      <div className="flex overflow-x-auto">
        {/* Left fixed column */}
        <div className="shrink-0 sticky left-0 z-10 bg-white border-r border-gray-300" style={{ width: LEFT_W }}>
          <div className="border-b border-gray-300 px-3 flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ height: HEADER_H }}>
            Task
          </div>
          {sortedTasks.map((t) => (
            <div key={t.id} onClick={() => onTaskClick?.(t.id)}
              className={`px-3 flex items-center text-sm border-b border-gray-300 cursor-pointer hover:bg-gray-50 ${hoverTask === t.id ? "bg-gray-50" : ""}`}
              style={{ height: ROW_H }}
              onMouseEnter={() => setHoverTask(t.id)}
              onMouseLeave={() => setHoverTask(null)}>
              <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: STATUS_BAR[t.status] }} />
              <span className="truncate text-gray-900" title={t.title}>{t.title}</span>
            </div>
          ))}
          {!sortedTasks.length && (
            <div className="text-xs text-gray-600 text-center py-6">ไม่มี task</div>
          )}
        </div>

        {/* Right chart */}
        <div className="flex-1 overflow-x-auto">
          <svg width={totalWidth} height={chartHeight} className="block">
            {/* Header background */}
            <rect x={0} y={0} width={totalWidth} height={HEADER_H} fill="#F1F5F9" />

            {/* Vertical tick lines */}
            {ticks.map((tk, i) => (
              <g key={i}>
                <line x1={tk.x} x2={tk.x} y1={0} y2={chartHeight}
                  stroke={tk.major ? "#E2E8F0" : "#E2E8F0"} strokeWidth={1} strokeDasharray={tk.major ? "" : "2 4"} />
                <text x={tk.x + 4} y={28} fill={tk.major ? "#94A3B8" : "#64748B"} fontSize={11}>{tk.label}</text>
              </g>
            ))}

            {/* Today marker */}
            {todayX >= 0 && todayX <= totalWidth && (
              <g>
                <line x1={todayX} x2={todayX} y1={HEADER_H} y2={chartHeight} stroke="#F7941D" strokeWidth={2} strokeDasharray="4 4" />
                <text x={todayX + 4} y={HEADER_H - 4} fill="#F7941D" fontSize={10} fontWeight="bold">วันนี้</text>
              </g>
            )}

            {/* Row stripes */}
            {sortedTasks.map((t, i) => (
              <rect key={t.id} x={0} y={HEADER_H + i * ROW_H} width={totalWidth} height={ROW_H}
                fill={i % 2 === 0 ? "transparent" : "#F1F5F9"}
                opacity={hoverTask === t.id ? 0.8 : (i % 2 === 0 ? 0 : 0.4)} />
            ))}

            {/* Dependency arrows */}
            {arrows.map(a => {
              const midX = (a.x1 + a.x2) / 2;
              const path = `M ${a.x1} ${a.y1} L ${midX} ${a.y1} L ${midX} ${a.y2} L ${a.x2} ${a.y2}`;
              return (
                <g key={a.id}>
                  <path d={path} stroke="#475569" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />
                </g>
              );
            })}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
              </marker>
            </defs>

            {/* Task bars */}
            {taskBars.map(b => (
              <g key={b.task.id}
                onClick={() => onTaskClick?.(b.task.id)}
                onMouseEnter={() => setHoverTask(b.task.id)}
                onMouseLeave={() => setHoverTask(null)}
                style={{ cursor: "pointer" }}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={4} fill={b.color} opacity={0.35} />
                <rect x={b.x} y={b.y} width={Math.max(0, b.w * b.progress / 100)} height={b.h} rx={4} fill={b.color} />
                {b.w > 60 && (
                  <text x={b.x + 6} y={b.y + b.h / 2 + 4} fill="white" fontSize={11} fontWeight={500}>
                    {b.task.title.length > Math.floor(b.w / 7) ? b.task.title.slice(0, Math.floor(b.w / 7) - 1) + "…" : b.task.title}
                  </text>
                )}
                {hoverTask === b.task.id && (
                  <g>
                    <rect x={b.x} y={b.y - 1} width={b.w} height={b.h + 2} rx={5} fill="none" stroke="#00AEEF" strokeWidth={2} />
                  </g>
                )}
              </g>
            ))}

            {/* Milestones — diamond shapes spanning all rows */}
            {data.milestones.map(m => {
              if (!m.due_date) return null;
              const x = dayDiff(startOfDay(new Date(m.due_date)), range.start) * pxPerDay;
              const color = m.status === "completed" ? "#22C55E" : m.status === "missed" ? "#EF4444" : "#F7941D";
              return (
                <g key={m.id}>
                  <line x1={x} x2={x} y1={HEADER_H} y2={chartHeight} stroke={color} strokeWidth={1} strokeDasharray="2 3" opacity={0.4} />
                  <polygon points={`${x},${HEADER_H - 14} ${x + 7},${HEADER_H - 7} ${x},${HEADER_H} ${x - 7},${HEADER_H - 7}`} fill={color}>
                    <title>{m.title} ({m.status})</title>
                  </polygon>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-gray-300 text-xs text-gray-500">
        <span className="font-medium text-gray-600">Status:</span>
        {Object.entries(STATUS_BAR).filter(([k]) => k !== "cancelled").map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: c }} /> {k}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1.5"><Diamond size={12} className="text-orange-600" /> Milestone</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-400" /> วันนี้</span>
      </div>
    </div>
  );
}
