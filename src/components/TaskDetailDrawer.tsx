"use client";
import { useEffect, useState, useCallback } from "react";
import { X, MessageSquare, CheckSquare, GitBranch, Activity, Play, Square, Trash2, Plus } from "lucide-react";
import AttachmentsTab from "./AttachmentsTab";
import TranslateButton from "./TranslateButton";

interface Member { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null; }
interface Task {
  id: string; title: string; description?: string | null; status: string; priority: string;
  assignee_id?: string | null; due_date?: string | null; start_date?: string | null;
  estimated_hours?: number | null; actual_hours?: number | null; project_id: string;
  tags?: string[] | null;
}
interface Comment { id: string; comment: string; created_at: string; author_id: string; team_members?: Member; }
interface ChecklistItem { id: string; title: string; is_completed: boolean; sort_order: number; }
interface DepItem { id: string; task_id: string; depends_on_task_id: string; dependency_type: string; tasks?: Task; depends_on?: Task; }
interface ActivityItem { id: string; action: string; field_name?: string | null; old_value?: string | null; new_value?: string | null; created_at: string; team_members?: Member; }

const memberName = (m?: Member | null) =>
  m ? ([m.first_name_th, m.last_name_th].filter(Boolean).join(" ") || [m.first_name_en, m.last_name_en].filter(Boolean).join(" ") || "—") : "—";

const STATUSES = ["backlog", "todo", "in_progress", "review", "done"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUS_COLOR: Record<string, string> = {
  backlog: "bg-slate-500/20 text-slate-300", todo: "bg-blue-500/20 text-blue-300",
  in_progress: "bg-yellow-500/20 text-yellow-300", review: "bg-purple-500/20 text-purple-300",
  done: "bg-green-500/20 text-green-300",
};
const PRIO_COLOR: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-300", medium: "bg-blue-500/20 text-blue-300",
  high: "bg-orange-500/20 text-orange-300", urgent: "bg-red-500/20 text-red-300",
};

interface Props {
  open: boolean;
  taskId: string | null;
  onClose: () => void;
  onChange?: () => void;
  members: Member[];
  allTasks?: Task[];
}

type Tab = "details" | "comments" | "checklist" | "deps" | "files" | "activity";

export default function TaskDetailDrawer({ open, taskId, onClose, onChange, members, allTasks = [] }: Props) {
  const [tab, setTab] = useState<Tab>("details");
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sub-resources
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [deps, setDeps] = useState<{ blockedBy: DepItem[]; blocking: DepItem[] }>({ blockedBy: [], blocking: [] });
  const [newDepId, setNewDepId] = useState("");
  const [newDepType, setNewDepType] = useState("FS");
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [timer, setTimer] = useState<{ id: string; started_at: string; task_id?: string } | null>(null);
  const [now, setNow] = useState(Date.now());

  // Fetchers
  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    const r = await fetch(`/api/tasks/${taskId}`);
    if (r.ok) { const d = await r.json(); setTask(d.task ?? d); }
  }, [taskId]);

  const fetchAll = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      await fetchTask();
      const [c, cl, dp, ac, tm] = await Promise.all([
        fetch(`/api/tasks/${taskId}/comments`).then(r => r.ok ? r.json() : { comments: [] }),
        fetch(`/api/tasks/${taskId}/checklist`).then(r => r.ok ? r.json() : { items: [] }),
        fetch(`/api/tasks/${taskId}/dependencies`).then(r => r.ok ? r.json() : { blockedBy: [], blocking: [] }),
        fetch(`/api/tasks/${taskId}/activity`).then(r => r.ok ? r.json() : { activity: [] }),
        fetch(`/api/timers`).then(r => r.ok ? r.json() : { timer: null }),
      ]);
      setComments(c.comments ?? []);
      setChecklist(cl.items ?? cl.checklist ?? []);
      setDeps({ blockedBy: dp.blockedBy ?? [], blocking: dp.blocking ?? [] });
      setActivity(ac.activity ?? []);
      setTimer(tm.timer ?? null);
    } finally { setLoading(false); }
  }, [taskId, fetchTask]);

  useEffect(() => { if (open && taskId) { setTab("details"); fetchAll(); } }, [open, taskId, fetchAll]);

  // Timer ticker
  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const updateTask = async (patch: Partial<Task>) => {
    if (!taskId || !task) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (r.ok) { const d = await r.json(); setTask(d.task ?? d); onChange?.(); }
    } finally { setSaving(false); }
  };

  const addComment = async () => {
    if (!taskId || !newComment.trim()) return;
    const r = await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: newComment.trim() }),
    });
    if (r.ok) { setNewComment(""); fetchAll(); }
  };

  const deleteComment = async (id: string) => {
    if (!confirm("ลบคอมเมนต์นี้?")) return;
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const addChecklist = async () => {
    if (!taskId || !newCheckItem.trim()) return;
    const r = await fetch(`/api/tasks/${taskId}/checklist`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newCheckItem.trim() }),
    });
    if (r.ok) { setNewCheckItem(""); fetchAll(); }
  };

  const toggleCheck = async (item: ChecklistItem) => {
    await fetch(`/api/checklist/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: !item.is_completed }),
    });
    fetchAll();
  };

  const deleteCheck = async (id: string) => {
    await fetch(`/api/checklist/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const addDep = async () => {
    if (!taskId || !newDepId) return;
    const r = await fetch(`/api/tasks/${taskId}/dependencies`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depends_on_task_id: newDepId, dependency_type: newDepType }),
    });
    if (r.ok) { setNewDepId(""); fetchAll(); }
  };

  const removeDep = async (id: string) => {
    await fetch(`/api/dependencies/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const startTimer = async () => {
    if (!taskId || !task) return;
    const r = await fetch(`/api/timers`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, project_id: task.project_id }),
    });
    if (r.ok) { const d = await r.json(); setTimer(d.timer ?? d); window.dispatchEvent(new Event("timer:changed")); }
  };

  const stopTimer = async () => {
    const r = await fetch(`/api/timers/stop`, { method: "POST" });
    if (r.ok) { setTimer(null); fetchAll(); window.dispatchEvent(new Event("timer:changed")); }
  };

  const elapsedStr = () => {
    if (!timer) return "00:00:00";
    const ms = now - new Date(timer.started_at).getTime();
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const isMyTimer = !!timer && timer.task_id === taskId;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/60 backdrop-blur-sm" />
      <div
        className="w-full max-w-2xl bg-[#1E293B] border-l border-[#334155] shadow-2xl h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1E293B] border-b border-[#334155] z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Task</span>
              {task && <span className="font-mono">#{task.id.slice(0, 8)}</span>}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
          {task && (
            <div className="px-6 pb-4">
              <input
                className="w-full bg-transparent text-xl font-semibold text-white border-0 focus:outline-none focus:bg-[#0F172A] rounded px-2 py-1 -mx-2"
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
                onBlur={(e) => e.target.value !== "" && updateTask({ title: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <select
                  className={`text-xs px-2 py-1 rounded-md border-0 cursor-pointer ${STATUS_COLOR[task.status] || ""}`}
                  value={task.status}
                  onChange={(e) => updateTask({ status: e.target.value })}
                >
                  {STATUSES.map(s => <option key={s} value={s} className="bg-[#1E293B]">{s}</option>)}
                </select>
                <select
                  className={`text-xs px-2 py-1 rounded-md border-0 cursor-pointer ${PRIO_COLOR[task.priority] || ""}`}
                  value={task.priority}
                  onChange={(e) => updateTask({ priority: e.target.value })}
                >
                  {PRIORITIES.map(p => <option key={p} value={p} className="bg-[#1E293B]">{p}</option>)}
                </select>
                {/* Timer */}
                {isMyTimer ? (
                  <button onClick={stopTimer} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-md text-xs font-medium">
                    <Square size={14} /> Stop {elapsedStr()}
                  </button>
                ) : (
                  <button onClick={startTimer} disabled={!!timer} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-md text-xs font-medium disabled:opacity-50">
                    <Play size={14} /> {timer ? "Timer busy" : "Start timer"}
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Tabs */}
          <div className="flex border-b border-[#334155] px-4 gap-1">
            {([
              ["details", "Details", null],
              ["comments", "Comments", comments.length],
              ["checklist", "Checklist", checklist.length],
              ["deps", "Dependencies", deps.blockedBy.length + deps.blocking.length],
              ["files", "Files", null],
              ["activity", "Activity", activity.length],
            ] as [Tab, string, number | null][]).map(([k, label, count]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === k ? "border-[#F7941D] text-white" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {label} {count !== null && count > 0 && <span className="ml-1 text-xs text-slate-500">{count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading && <div className="text-slate-400 text-sm">Loading...</div>}
          {!task && !loading && <div className="text-slate-400 text-sm">Task not found</div>}

          {task && tab === "details" && (
            <div className="space-y-4">
              <Field label="Description">
                <textarea
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm min-h-24"
                  value={task.description ?? ""}
                  onChange={(e) => setTask({ ...task, description: e.target.value })}
                  onBlur={(e) => updateTask({ description: e.target.value })}
                />
                {task.description && <TranslateButton text={task.description} />}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Assignee">
                  <select className={inp} value={task.assignee_id ?? ""} onChange={(e) => updateTask({ assignee_id: e.target.value || null })}>
                    <option value="">— Unassigned —</option>
                    {members.map(m => <option key={m.id} value={m.id}>{memberName(m)}</option>)}
                  </select>
                </Field>
                <Field label="Due date">
                  <input type="date" className={inp} value={task.due_date ?? ""}
                    onChange={(e) => updateTask({ due_date: e.target.value || null })} />
                </Field>
                <Field label="Start date">
                  <input type="date" className={inp} value={task.start_date ?? ""}
                    onChange={(e) => updateTask({ start_date: e.target.value || null })} />
                </Field>
                <Field label="Estimated hours">
                  <input type="number" className={inp} value={task.estimated_hours ?? ""}
                    onChange={(e) => setTask({ ...task, estimated_hours: e.target.value ? Number(e.target.value) : null })}
                    onBlur={(e) => updateTask({ estimated_hours: e.target.value ? Number(e.target.value) : null })} />
                </Field>
              </div>
              <div className="text-xs text-slate-400 pt-2 border-t border-[#334155]">
                Actual hours: <span className="text-slate-200">{Number(task.actual_hours ?? 0).toFixed(1)}h</span>
                {task.estimated_hours ? ` / ${Number(task.estimated_hours).toFixed(1)}h` : ""}
                {saving && <span className="ml-2 text-[#00AEEF]">saving...</span>}
              </div>
            </div>
          )}

          {tab === "comments" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm"
                  rows={2} placeholder="เขียนคอมเมนต์..." value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button onClick={addComment} disabled={!newComment.trim()}
                  className="px-3 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm self-start disabled:opacity-50">
                  ส่ง
                </button>
              </div>
              {comments.length === 0 && <div className="text-slate-400 text-sm text-center py-8">ยังไม่มีคอมเมนต์</div>}
              {comments.map(c => (
                <div key={c.id} className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="text-slate-200 font-medium">{memberName(c.team_members)}</span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(c.created_at).toLocaleString("th-TH")}</span>
                      <button onClick={() => deleteComment(c.id)} className="text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-100 whitespace-pre-wrap">{c.comment}</div>
                  <TranslateButton text={c.comment} compact />
                </div>
              ))}
            </div>
          )}

          {tab === "checklist" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input className="flex-1 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="เพิ่มรายการ..." value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChecklist()} />
                <button onClick={addChecklist} className="px-3 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm">
                  <Plus size={16} />
                </button>
              </div>
              {checklist.length > 0 && (
                <div className="text-xs text-slate-400 mb-2">
                  {checklist.filter(c => c.is_completed).length} / {checklist.length} เสร็จแล้ว
                </div>
              )}
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 group bg-[#0F172A] border border-[#334155] rounded-lg p-2">
                  <input type="checkbox" checked={item.is_completed} onChange={() => toggleCheck(item)}
                    className="w-4 h-4 accent-[#F7941D]" />
                  <span className={`flex-1 text-sm ${item.is_completed ? "line-through text-slate-500" : "text-slate-100"}`}>
                    {item.title}
                  </span>
                  <button onClick={() => deleteCheck(item.id)} className="opacity-0 group-hover:opacity-100 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "deps" && (
            <div className="space-y-4">
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 space-y-2">
                <div className="text-xs text-slate-400 font-medium">เพิ่ม Dependency</div>
                <div className="flex gap-2">
                  <select className={inp + " flex-1"} value={newDepId} onChange={(e) => setNewDepId(e.target.value)}>
                    <option value="">— เลือก task —</option>
                    {allTasks.filter(t => t.id !== taskId).map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                  <select className={inp + " w-20"} value={newDepType} onChange={(e) => setNewDepType(e.target.value)}>
                    {["FS","SS","FF","SF"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={addDep} disabled={!newDepId} className="px-3 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50">เพิ่ม</button>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-300 mb-2">Blocked by ({deps.blockedBy.length})</div>
                {deps.blockedBy.length === 0 && <div className="text-xs text-slate-500">—</div>}
                {deps.blockedBy.map(d => (
                  <div key={d.id} className="flex items-center justify-between bg-[#0F172A] border border-[#334155] rounded-lg p-2 mb-1">
                    <span className="text-sm text-slate-100">{d.depends_on?.title ?? d.depends_on_task_id} <span className="text-xs text-slate-500 ml-2">{d.dependency_type}</span></span>
                    <button onClick={() => removeDep(d.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-300 mb-2">Blocking ({deps.blocking.length})</div>
                {deps.blocking.length === 0 && <div className="text-xs text-slate-500">—</div>}
                {deps.blocking.map(d => (
                  <div key={d.id} className="flex items-center justify-between bg-[#0F172A] border border-[#334155] rounded-lg p-2 mb-1">
                    <span className="text-sm text-slate-100">{d.tasks?.title ?? d.task_id} <span className="text-xs text-slate-500 ml-2">{d.dependency_type}</span></span>
                    <button onClick={() => removeDep(d.id)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "files" && taskId && (
            <AttachmentsTab taskId={taskId} canManage={true} onChange={() => { onChange?.(); fetchAll(); }} />
          )}

          {tab === "activity" && (
            <div className="space-y-2">
              {activity.length === 0 && <div className="text-slate-400 text-sm text-center py-8">ยังไม่มี activity</div>}
              {activity.map(a => (
                <div key={a.id} className="flex gap-3 text-sm bg-[#0F172A] border border-[#334155] rounded-lg p-3">
                  <Activity size={14} className="text-[#00AEEF] mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-slate-100">
                      <span className="font-medium">{memberName(a.team_members)}</span>{" "}
                      <span className="text-slate-300">{a.action}</span>
                      {a.field_name && <span className="text-slate-400"> {a.field_name}</span>}
                      {a.old_value && a.new_value && (
                        <span className="text-slate-400">: <span className="line-through">{a.old_value}</span> → <span className="text-slate-200">{a.new_value}</span></span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{new Date(a.created_at).toLocaleString("th-TH")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inp = "w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00AEEF]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

// Suppress unused icon warnings
void MessageSquare; void CheckSquare; void GitBranch;
