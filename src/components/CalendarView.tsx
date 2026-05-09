"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Flag, ListTodo, Zap } from "lucide-react";

interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }
interface Task { id: string; title: string; status: string; priority: string; due_date?: string | null; project_id: string; }
interface Milestone { id: string; title: string; due_date: string; status: string; project_id: string; }
interface Meeting { id: string; title: string; meeting_date: string; project_id: string; }
interface SalesActivity { id: string; subject: string; activity_type: string; activity_date: string; customer_name?: string; }

const PRIO_DOT: Record<string, string> = { urgent: "bg-red-600", high: "bg-orange-600", medium: "bg-blue-600", low: "bg-slate-600" };

interface Props {
  projects: Project[];
  filterProjectId?: string;
  onTaskClick?: (id: string) => void;
  refreshKey?: number;
}

export default function CalendarView({ projects, filterProjectId = "all", onTaskClick, refreshKey = 0 }: Props) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [salesActivities, setSalesActivities] = useState<SalesActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const proj = filterProjectId !== "all" ? `?project_id=${filterProjectId}` : "";
      const [t, m, mt, da] = await Promise.all([
        fetch(`/api/tasks${proj}`).then(r => r.ok ? r.json() : { tasks: [] }),
        fetch(`/api/milestones${proj}`).then(r => r.ok ? r.json() : { milestones: [] }),
        fetch(`/api/meeting-notes${proj}`).then(r => r.ok ? r.json() : { meetings: [] }),
        fetch('/api/deal-activities').then(r => r.ok ? r.json() : { activities: [] }),
      ]);
      setTasks(t.tasks ?? []);
      setMilestones(m.milestones ?? []);
      setMeetings(mt.meetings ?? mt.notes ?? []);
      setSalesActivities((da.activities ?? []).map((a: Record<string, unknown>) => ({
        id: a.id,
        subject: a.subject ?? '',
        activity_type: a.activity_type ?? '',
        activity_date: a.activity_date ?? '',
        customer_name: (a.customers as { company_name?: string })?.company_name ?? '',
      })));
    } finally { setLoading(false); }
  }, [filterProjectId]);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startDay = first.getDay(); // 0 = Sun
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: { date: Date | null }[] = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: null });
    for (let d = 1; d <= last; d++) cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), d) });
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [cursor]);

  const projMap = new Map(projects.map(p => [p.id, p]));
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, { tasks: Task[]; milestones: Milestone[]; meetings: Meeting[]; activities: SalesActivity[] }>();
    const key = (d: string) => d.slice(0, 10);
    const ensure = (k: string) => { if (!m.has(k)) m.set(k, { tasks: [], milestones: [], meetings: [], activities: [] }); };
    tasks.forEach(t => { if (!t.due_date) return; const k = key(t.due_date); ensure(k); m.get(k)!.tasks.push(t); });
    milestones.forEach(ms => { const k = key(ms.due_date); ensure(k); m.get(k)!.milestones.push(ms); });
    meetings.forEach(mt => { const k = key(mt.meeting_date); ensure(k); m.get(k)!.meetings.push(mt); });
    salesActivities.forEach(sa => { if (!sa.activity_date) return; const k = key(sa.activity_date); ensure(k); m.get(k)!.activities.push(sa); });
    return m;
  }, [tasks, milestones, meetings, salesActivities]);

  const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const monthLabel = cursor.toLocaleDateString("th-TH", { year: "numeric", month: "long" });

  const selectedDay = selected ? eventsByDay.get(selected) : null;

  return (
    <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-3 border-b border-gray-300 gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-1.5 text-gray-500 hover:text-gray-900"><ChevronLeft size={18} /></button>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 min-w-32 sm:min-w-40 text-center">{monthLabel}</h2>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-1.5 text-gray-500 hover:text-gray-900"><ChevronRight size={18} /></button>
          <button onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }} className="ml-1 sm:ml-2 px-2 sm:px-3 py-1 text-xs bg-gray-50 text-gray-600 hover:text-gray-900 rounded-lg border border-gray-300">วันนี้</button>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600" /> Task</span>
          <span className="flex items-center gap-1"><Flag size={11} className="text-orange-600" /> Mil</span>
          <span className="flex items-center gap-1"><CalIcon size={11} className="text-purple-600" /> Meet</span>
          <span className="flex items-center gap-1"><Zap size={11} className="text-green-600" /> Sales</span>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-gray-300 bg-gray-50">
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d, i) => (
          <div key={d} className={`px-2 py-2 text-center text-xs font-semibold ${i === 0 ? "text-red-600" : i === 6 ? "text-blue-600" : "text-gray-500"}`}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {grid.map((c, i) => {
          if (!c.date) return <div key={i} className="border-b border-r border-gray-300 bg-gray-50 min-h-16 sm:min-h-24" />;
          const k = dayKey(c.date);
          const ev = eventsByDay.get(k);
          const isToday = c.date.getTime() === today.getTime();
          const isSel = selected === k;
          const dow = c.date.getDay();
          const totalEv = ev ? ev.tasks.length + ev.milestones.length + ev.meetings.length + ev.activities.length : 0;
          return (
            <div key={i} onClick={() => setSelected(k)}
              className={`border-b border-r border-gray-300 min-h-16 sm:min-h-24 p-1 sm:p-1.5 cursor-pointer hover:bg-gray-50 transition-colors ${isSel ? "bg-blue-100 ring-1 ring-blue-500" : ""}`}>
              <div className={`text-xs font-medium mb-0.5 sm:mb-1 ${isToday ? "inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white" : dow === 0 ? "text-red-600" : dow === 6 ? "text-blue-600" : "text-gray-600"}`}>
                {c.date.getDate()}
              </div>
              {/* Mobile: show dots only. Desktop: show event names */}
              <div className="hidden sm:block space-y-0.5">
                {ev?.milestones.slice(0, 2).map(m => (
                  <div key={m.id} className="flex items-center gap-1 text-[10px] text-orange-600 truncate">
                    <Flag size={9} /> {m.title}
                  </div>
                ))}
                {ev?.meetings.slice(0, 2).map(m => (
                  <div key={m.id} className="flex items-center gap-1 text-[10px] text-purple-600 truncate">
                    <CalIcon size={9} /> {m.title}
                  </div>
                ))}
                {ev?.activities.slice(0, 2).map(sa => (
                  <div key={sa.id} className="flex items-center gap-1 text-[10px] text-green-600 truncate">
                    <Zap size={9} /> {sa.subject || sa.activity_type}
                  </div>
                ))}
                {ev?.tasks.slice(0, 3).map(t => (
                  <div key={t.id} onClick={(e) => { e.stopPropagation(); onTaskClick?.(t.id); }}
                    className="flex items-center gap-1 text-[10px] text-gray-700 hover:text-gray-900 truncate" title={t.title}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIO_DOT[t.priority] || "bg-slate-400"}`} />
                    {t.title}
                  </div>
                ))}
                {totalEv > 7 && (
                  <div className="text-[10px] text-gray-600">+{totalEv - 7} more</div>
                )}
              </div>
              {/* Mobile: compact dot indicators */}
              <div className="flex flex-wrap gap-0.5 sm:hidden">
                {ev?.milestones.slice(0, 2).map(m => (
                  <span key={m.id} className="w-2 h-2 rounded-full bg-orange-500" />
                ))}
                {ev?.meetings.slice(0, 2).map(m => (
                  <span key={m.id} className="w-2 h-2 rounded-full bg-purple-500" />
                ))}
                {ev?.activities.slice(0, 2).map(sa => (
                  <span key={sa.id} className="w-2 h-2 rounded-full bg-green-500" />
                ))}
                {ev?.tasks.slice(0, 3).map(t => (
                  <span key={t.id} className={`w-2 h-2 rounded-full ${PRIO_DOT[t.priority] || "bg-slate-400"}`} />
                ))}
                {totalEv > 5 && (
                  <span className="text-[8px] text-gray-500">+{totalEv - 5}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && selected && (
        <div className="border-t border-gray-300 p-4 space-y-2 bg-gray-50">
          <div className="text-sm font-semibold text-gray-900 mb-2">
            {new Date(selected).toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
          {selectedDay.milestones.map(m => (
            <div key={m.id} className="flex items-center gap-2 text-sm">
              <Flag size={14} className="text-orange-600" />
              <span className="text-gray-700">{m.title}</span>
              <span className="text-xs text-gray-600">({projMap.get(m.project_id)?.project_code})</span>
            </div>
          ))}
          {selectedDay.meetings.map(mt => (
            <div key={mt.id} className="flex items-center gap-2 text-sm">
              <CalIcon size={14} className="text-purple-600" />
              <span className="text-gray-700">{mt.title}</span>
              <span className="text-xs text-gray-600">({projMap.get(mt.project_id)?.project_code})</span>
            </div>
          ))}
          {selectedDay.activities.map(sa => (
            <div key={sa.id} className="flex items-center gap-2 text-sm">
              <Zap size={14} className="text-green-600" />
              <span className="text-gray-700">{sa.subject || sa.activity_type}</span>
              {sa.customer_name && <span className="text-xs text-gray-600">({sa.customer_name})</span>}
            </div>
          ))}
          {selectedDay.tasks.map(t => (
            <div key={t.id} onClick={() => onTaskClick?.(t.id)} className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#00AEEF]">
              <ListTodo size={14} className="text-blue-600" />
              <span className="text-gray-700">{t.title}</span>
              <span className="text-xs text-gray-600">({projMap.get(t.project_id)?.project_code})</span>
              <span className={`ml-auto w-2 h-2 rounded-full ${PRIO_DOT[t.priority]}`} />
            </div>
          ))}
          {!selectedDay.tasks.length && !selectedDay.milestones.length && !selectedDay.meetings.length && !selectedDay.activities.length && (
            <div className="text-xs text-gray-600">ไม่มีรายการ</div>
          )}
        </div>
      )}
      {loading && <div className="text-xs text-center text-gray-600 py-2">Loading...</div>}
    </div>
  );
}
