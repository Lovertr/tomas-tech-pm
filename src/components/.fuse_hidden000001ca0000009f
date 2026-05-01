"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Play, Square, Trash2, Activity, TrendingDown } from "lucide-react";

interface Sprint { id: string; project_id: string; name: string; goal?: string | null; start_date: string; end_date: string; status: string; }
interface Task { id: string; title: string; status: string; estimated_hours?: number | null; actual_hours?: number | null; sprint_id?: string | null; }
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-gray-200 text-gray-700", active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700", cancelled: "bg-red-100 text-red-700",
};

interface Props {
  projects: Project[];
  filterProjectId: string;
  onTaskClick?: (id: string) => void;
  refreshKey?: number;
  canManage?: boolean;
}

export default function SprintPanel({ projects, filterProjectId, onTaskClick, refreshKey = 0, canManage = true }: Props) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchSprints = useCallback(async () => {
    if (!filterProjectId || filterProjectId === "all") { setSprints([]); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/sprints?project_id=${filterProjectId}`);
      if (r.ok) {
        const d = await r.json();
        const s: Sprint[] = d.sprints ?? d.items ?? [];
        setSprints(s);
        const act = s.find(x => x.status === "active") || s[0];
        setActiveSprintId(act?.id ?? null);
      }
    } finally { setLoading(false); }
  }, [filterProjectId]);

  const fetchSprintTasks = useCallback(async (sid: string) => {
    const r = await fetch(`/api/tasks?sprint_id=${sid}`);
    if (r.ok) { const d = await r.json(); setTasks(d.tasks ?? []); }
  }, []);

  useEffect(() => { fetchSprints(); }, [fetchSprints, refreshKey]);
  useEffect(() => { if (activeSprintId) fetchSprintTasks(activeSprintId); else setTasks([]); }, [activeSprintId, fetchSprintTasks, refreshKey]);

  const sprint = sprints.find(s => s.id === activeSprintId);

  // Burndown computation
  const burndown = useMemo(() => {
    if (!sprint) return null;
    const start = new Date(sprint.start_date); start.setHours(0, 0, 0, 0);
    const end = new Date(sprint.end_date); end.setHours(0, 0, 0, 0);
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const totalHours = tasks.reduce((s, t) => s + Number(t.estimated_hours || 0), 0);
    const doneHours = tasks.filter(t => t.status === "done").reduce((s, t) => s + Number(t.estimated_hours || 0), 0);
    const remaining = totalHours - doneHours;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const elapsed = Math.max(0, Math.min(totalDays, Math.round((today.getTime() - start.getTime()) / 86400000) + 1));
    const idealRemaining = Math.max(0, totalHours - (totalHours / totalDays) * elapsed);
    return { totalDays, totalHours, doneHours, remaining, elapsed, idealRemaining };
  }, [sprint, tasks]);

  const remove = async (id: string) => {
    if (!confirm("ลบ sprint นี้?")) return;
    await fetch(`/api/sprints/${id}`, { method: "DELETE" });
    fetchSprints();
  };

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/sprints/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchSprints();
  };

  if (!filterProjectId || filterProjectId === "all") {
    return <div className="text-gray-500 text-center py-12">เลือกโครงการเพื่อดู Sprint</div>;
  }

  return (
    <div className="space-y-6">
      {/* Sprint selector + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {sprints.map(s => (
            <button key={s.id} onClick={() => setActiveSprintId(s.id)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap border transition-colors ${activeSprintId === s.id ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-700 hover:text-gray-900"}`}>
              {s.name}
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[s.status]}`}>{s.status}</span>
            </button>
          ))}
          {!sprints.length && !loading && <span className="text-xs text-gray-500">ยังไม่มี sprint</span>}
        </div>
        {canManage && (
          <button onClick={() => setCreating(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm flex items-center gap-2">
            <Plus size={16} /> New Sprint
          </button>
        )}
      </div>

      {sprint && burndown && (
        <>
          {/* Sprint header */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{sprint.name}</h2>
                {sprint.goal && <p className="text-sm text-gray-600 mt-1">🎯 {sprint.goal}</p>}
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(sprint.start_date).toLocaleDateString("th-TH")} → {new Date(sprint.end_date).toLocaleDateString("th-TH")}
                  <span className="ml-2">({burndown.totalDays} วัน, ผ่านไป {burndown.elapsed})</span>
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  {sprint.status === "planned" && <button onClick={() => setStatus(sprint.id, "active")} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-md flex items-center gap-1"><Play size={12} /> Start</button>}
                  {sprint.status === "active" && <button onClick={() => setStatus(sprint.id, "completed")} className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md flex items-center gap-1"><Square size={12} /> Complete</button>}
                  <button onClick={() => remove(sprint.id)} className="p-1.5 text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Stat label="งานทั้งหมด" value={tasks.length} color="#00AEEF" />
              <Stat label="เสร็จ" value={tasks.filter(t => t.status === "done").length} color="#22C55E" />
              <Stat label="ชั่วโมงรวม" value={`${burndown.totalHours.toFixed(1)}h`} color="#F7941D" />
              <Stat label="คงเหลือ" value={`${burndown.remaining.toFixed(1)}h`} color="#A855F7" />
            </div>
          </div>

          {/* Burndown chart */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={18} className="text-[#00AEEF]" />
              <h3 className="text-sm font-semibold text-gray-900">Burndown</h3>
            </div>
            <Burndown burndown={burndown} sprint={sprint} tasks={tasks} />
          </div>

          {/* Task list */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={18} className="text-[#F7941D]" />
              <h3 className="text-sm font-semibold text-gray-900">Sprint Backlog</h3>
            </div>
            <div className="space-y-1">
              {!tasks.length && <div className="text-sm text-gray-500 text-center py-4">ยังไม่มี task ใน sprint นี้ — แก้ที่ task แล้วระบุ sprint</div>}
              {tasks.map(t => (
                <div key={t.id} onClick={() => onTaskClick?.(t.id)}
                  className="flex items-center gap-2 p-2 rounded hover:bg-[#F1F5F9] cursor-pointer">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[t.status] || "bg-slate-100 text-slate-700"}`}>{t.status}</span>
                  <span className="text-sm text-gray-900 flex-1 truncate">{t.title}</span>
                  <span className="text-xs text-gray-500">{Number(t.estimated_hours ?? 0).toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {creating && (
        <SprintModal projectId={filterProjectId} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); fetchSprints(); }} />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-[#F1F5F9] rounded-lg p-3">
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function Burndown({ burndown, sprint, tasks }: { burndown: NonNullable<ReturnType<typeof Object>>; sprint: Sprint; tasks: Task[] }) {
  const W = 700, H = 220, P = 36;
  const totalDays = burndown.totalDays as number;
  const totalHours = burndown.totalHours as number;
  if (totalHours === 0) return <div className="text-sm text-gray-500 text-center py-6">ไม่มีชั่วโมงประมาณการ ใส่ estimated_hours ใน task ก่อน</div>;
  const stepX = (W - 2 * P) / Math.max(1, totalDays - 1);
  const yScale = (h: number) => H - P - ((H - 2 * P) * h) / totalHours;
  // Ideal line
  const idealPath = `M ${P} ${yScale(totalHours)} L ${W - P} ${yScale(0)}`;
  // Actual line: assume each done task burned at its task.updated_at, but we don't have that — use today snapshot
  // Simple actual: line from start to today at remaining
  const start = new Date(sprint.start_date); start.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const elapsed = Math.max(0, Math.min(totalDays - 1, Math.round((today.getTime() - start.getTime()) / 86400000)));
  const actualEndX = P + elapsed * stepX;
  const actualPath = `M ${P} ${yScale(totalHours)} L ${actualEndX} ${yScale(burndown.remaining as number)}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <g key={p}>
          <line x1={P} x2={W - P} y1={P + (H - 2 * P) * p} y2={P + (H - 2 * P) * p} stroke="#D1D5DB" strokeWidth={1} />
          <text x={P - 6} y={P + (H - 2 * P) * p + 4} fill="#6B7280" fontSize={10} textAnchor="end">{(totalHours * (1 - p)).toFixed(0)}h</text>
        </g>
      ))}
      {/* Day ticks */}
      {Array.from({ length: totalDays }).map((_, i) => {
        const x = P + i * stepX;
        const showLabel = totalDays <= 14 || i % Math.ceil(totalDays / 10) === 0;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={H - P} y2={H - P + 4} stroke="#9CA3AF" strokeWidth={1} />
            {showLabel && <text x={x} y={H - P + 16} fill="#6B7280" fontSize={9} textAnchor="middle">D{i + 1}</text>}
          </g>
        );
      })}
      {/* Axes */}
      <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="#9CA3AF" strokeWidth={1} />
      <line x1={P} x2={P} y1={P} y2={H - P} stroke="#9CA3AF" strokeWidth={1} />
      {/* Ideal */}
      <path d={idealPath} stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
      {/* Actual */}
      <path d={actualPath} stroke="#F7941D" strokeWidth={2.5} fill="none" />
      <circle cx={actualEndX} cy={yScale(burndown.remaining as number)} r={4} fill="#F7941D" />
      {/* Today line */}
      <line x1={actualEndX} x2={actualEndX} y1={P} y2={H - P} stroke="#00AEEF" strokeWidth={1} strokeDasharray="2 3" opacity={0.5} />
      {/* Legend */}
      <g transform={`translate(${W - P - 140}, ${P})`}>
        <rect width={140} height={42} fill="#F1F5F9" rx={4} />
        <line x1={8} x2={24} y1={14} y2={14} stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x={28} y={17} fill="#475569" fontSize={10}>Ideal burn</text>
        <line x1={8} x2={24} y1={30} y2={30} stroke="#F7941D" strokeWidth={2.5} />
        <text x={28} y={33} fill="#475569" fontSize={10}>Actual ({tasks.filter(t => t.status === "done").length}/{tasks.length} done)</text>
      </g>
    </svg>
  );
}

function SprintModal({ projectId, onClose, onSaved }: { projectId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Sprint>>({ project_id: projectId, status: "planned" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    if (!form.name || !form.start_date || !form.end_date) { setErr("ต้องระบุชื่อ และวันที่"); return; }
    setSaving(true); setErr(null);
    try {
      const r = await fetch("/api/sprints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">New Sprint</h3>
        <div>
          <label className="block text-xs text-gray-600 mb-1">ชื่อ Sprint *</label>
          <input className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm"
            placeholder="e.g. Sprint 1" value={form.name ?? ""} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">เป้าหมาย</label>
          <textarea rows={2} className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.goal ?? ""} onChange={e => setForm({ ...form, goal: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">เริ่ม *</label>
            <input type="date" className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm"
              value={form.start_date ?? ""} onChange={e => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">สิ้นสุด *</label>
            <input type="date" className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm"
              value={form.end_date ?? ""} onChange={e => setForm({ ...form, end_date: e.target.value })} />
          </div>
        </div>
        {err && <div className="text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50">
            {saving ? "..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
