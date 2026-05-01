"use client";
import { useEffect, useState, useCallback, DragEvent } from "react";
import { MessageSquare, CheckSquare, AlertCircle, Calendar, Plus, Lock } from "lucide-react";
import OverdueBadge from "@/components/OverdueBadge";

interface Member {
  id: string;
  first_name_th?: string | null; last_name_th?: string | null;
  first_name_en?: string | null; last_name_en?: string | null;
  avatar_url?: string | null;
}
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }
interface BoardTask {
  id: string; title: string; title_en?: string | null; title_jp?: string | null;
  status: string; priority: string;
  project_id: string; assignee_id?: string | null; due_date?: string | null;
  estimated_hours?: number | null; actual_hours?: number | null;
  tags?: string[] | null;
  _comments?: number; _checklist_total?: number; _checklist_done?: number; _blocked_by?: number;
}

const taskTitle = (t: BoardTask, lang: string) =>
  lang === "jp" ? (t.title_jp || t.title_en || t.title) :
  lang === "en" ? (t.title_en || t.title) : t.title;

const COLS: { key: string; label: string; color: string }[] = [
  { key: "backlog",     label: "Backlog",     color: "#64748B" },
  { key: "todo",        label: "To Do",       color: "#3B82F6" },
  { key: "in_progress", label: "In Progress", color: "#F7941D" },
  { key: "review",      label: "Review",      color: "#A855F7" },
  { key: "done",        label: "Done",        color: "#22C55E" },
];

const PRIO_DOT: Record<string, string> = {
  low: "bg-slate-600", medium: "bg-blue-600", high: "bg-orange-600", urgent: "bg-red-600",
};
const PRIO_RING: Record<string, string> = {
  urgent: "ring-1 ring-red-600/40",
  high: "ring-1 ring-orange-600/30",
  medium: "", low: "",
};

const memberName = (m?: Member) =>
  m ? ([m.first_name_th, m.last_name_th].filter(Boolean).join(" ") || [m.first_name_en, m.last_name_en].filter(Boolean).join(" ") || "—") : "—";
const memberInitial = (m?: Member) => {
  const n = memberName(m);
  return n && n !== "—" ? n[0].toUpperCase() : "?";
};

interface Props {
  projects: Project[];
  members: Member[];
  filterProjectId?: string;       // "all" or project id
  onTaskClick: (id: string) => void;
  onAddTask?: (status?: string) => void;
  refreshKey?: number;
  canManage?: boolean;
  lang?: string;
}

export default function KanbanBoard({ projects, members, filterProjectId = "all", onTaskClick, onAddTask, refreshKey = 0, canManage = true, lang = "th" }: Props) {
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterProjectId && filterProjectId !== "all" ? `/api/tasks/board?project_id=${filterProjectId}` : `/api/tasks/board`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setTasks(d.tasks ?? []); }
    } finally { setLoading(false); }
  }, [filterProjectId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks, refreshKey]);

  const onDragStart = (e: DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragOver = (e: DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overCol !== col) setOverCol(col);
  };
  const onDrop = async (e: DragEvent, col: string) => {
    e.preventDefault();
    setOverCol(null);
    const id = dragId || e.dataTransfer.getData("text/plain");
    setDragId(null);
    if (!id) return;
    const t = tasks.find(x => x.id === id);
    if (!t || t.status === col) return;
    // optimistic update
    setTasks(prev => prev.map(x => x.id === id ? { ...x, status: col } : x));
    setSavingId(id);
    try {
      const r = await fetch(`/api/tasks/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: col }),
      });
      if (!r.ok) { fetchTasks(); }
    } finally { setSavingId(null); }
  };

  const projectMap = new Map(projects.map(p => [p.id, p]));
  const memberMap = new Map(members.map(m => [m.id, m]));

  const fmtDue = (s?: string | null) => {
    if (!s) return null;
    const d = new Date(s); const now = new Date();
    const days = Math.floor((d.getTime() - now.getTime()) / 86400000);
    const label = d.toLocaleDateString("th-TH", { month: "short", day: "numeric" });
    let cls = "text-slate-600";
    if (days < 0) cls = "text-red-600";
    else if (days <= 3) cls = "text-orange-600";
    return { label, cls };
  };

  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none -mx-3 px-3 md:mx-0 md:px-0">
      {COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key);
        const isOver = overCol === col.key;
        return (
          <div
            key={col.key}
            className="min-w-[260px] w-[260px] md:min-w-[300px] md:w-[300px] flex-shrink-0 snap-start"
            onDragOver={(e) => onDragOver(e, col.key)}
            onDragLeave={() => setOverCol(o => o === col.key ? null : o)}
            onDrop={(e) => onDrop(e, col.key)}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: col.color }} />
                <span className="font-semibold text-sm text-slate-900">{col.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{colTasks.length}</span>
              </div>
              {canManage && onAddTask && (
                <button onClick={() => onAddTask(col.key)} className="p-1 text-slate-600 hover:text-slate-900" title="Add task">
                  <Plus size={14} />
                </button>
              )}
            </div>
            <div
              className={`space-y-3 p-2 rounded-2xl min-h-[400px] transition-colors ${isOver ? "bg-blue-50 ring-2 ring-blue-300" : "bg-gray-50"}`}
            >
              {loading && colTasks.length === 0 && <div className="text-xs text-gray-500 text-center py-6">Loading...</div>}
              {colTasks.map(task => {
                const proj = projectMap.get(task.project_id);
                const asg = task.assignee_id ? memberMap.get(task.assignee_id) : undefined;
                const due = fmtDue(task.due_date);
                const isBlocked = (task._blocked_by ?? 0) > 0;
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => onTaskClick(task.id)}
                    className={`group bg-[#FFFFFF] rounded-xl p-3 border border-[#E5E7EB] cursor-pointer hover:border-[#00AEEF] transition-all ${PRIO_RING[task.priority] || ""} ${dragId === task.id ? "opacity-40" : ""} ${savingId === task.id ? "ring-2 ring-yellow-400" : ""}`}
                  >
                    {/* top row: project code + priority */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 text-slate-700">
                        {proj?.project_code || "—"}
                      </span>
                      <div className="flex items-center gap-1">
                        {isBlocked && (
                          <span title={`Blocked by ${task._blocked_by}`} className="flex items-center gap-0.5 text-red-600 text-[10px]">
                            <Lock size={10} /> {task._blocked_by}
                          </span>
                        )}
                        <span className={`w-2 h-2 rounded-full ${PRIO_DOT[task.priority] || "bg-slate-400"}`} title={task.priority} />
                      </div>
                    </div>
                    {/* title */}
                    <h4 className="text-sm font-medium text-slate-900 mb-2 line-clamp-2">{taskTitle(task, lang)}</h4>
                    {/* overdue badge */}
                    {task.due_date && task.status !== "done" && (
                      <div className="mb-2"><OverdueBadge date={task.due_date} completed={task.status === "done"} /></div>
                    )}
                    {/* tags */}
                    {!!task.tags?.length && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">#{tag}</span>
                        ))}
                      </div>
                    )}
                    {/* checklist progress bar */}
                    {(task._checklist_total ?? 0) > 0 && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-600 mb-1">
                          <span className="flex items-center gap-1"><CheckSquare size={10} /> {task._checklist_done}/{task._checklist_total}</span>
                        </div>
                        <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#22C55E] transition-all" style={{ width: `${((task._checklist_done ?? 0) / (task._checklist_total || 1)) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {/* footer row */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {asg ? (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-slate-900 text-xs font-bold bg-gradient-to-br from-[#003087] to-[#00AEEF]" title={memberName(asg)}>
                            {memberInitial(asg)}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-dashed border-[#E2E8F0]" title="Unassigned" />
                        )}
                        {(task._comments ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-500">
                            <MessageSquare size={12} /> {task._comments}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        {task.estimated_hours ? <span className="text-gray-500">{Number(task.estimated_hours).toFixed(1)}h</span> : null}
                        {due && (
                          <span className={`flex items-center gap-0.5 ${due.cls}`}>
                            <Calendar size={11} /> {due.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && !loading && (
                <div className="text-xs text-gray-500 text-center py-8 border border-dashed border-[#E2E8F0] rounded-lg">
                  {lang === "jp" ? "ここにカードをドロップ" : lang === "en" ? "Drop cards here" : "วางการ์ดที่นี่"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

void AlertCircle;
