"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit3, Flag, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface Milestone {
  id: string; project_id: string; title: string; description?: string | null;
  due_date: string; status: string; completed_at?: string | null; sort_order?: number;
}
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }

const STATUS_META: Record<string, { color: string; bg: string; label: string; icon: typeof CheckCircle2 }> = {
  pending:     { color: "#6B7280", bg: "bg-gray-100 text-gray-700", label: "Pending",     icon: Clock },
  in_progress: { color: "#F59E0B", bg: "bg-amber-100 text-amber-700", label: "In Progress", icon: Flag },
  completed:   { color: "#22C55E", bg: "bg-green-100 text-green-700",   label: "Completed",  icon: CheckCircle2 },
  missed:      { color: "#EF4444", bg: "bg-red-100 text-red-600",       label: "Missed",     icon: AlertTriangle },
};

interface Props {
  projects: Project[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
}

export default function MilestonesPanel({ projects, filterProjectId = "all", canManage = true, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterProjectId && filterProjectId !== "all" ? `/api/milestones?project_id=${filterProjectId}` : `/api/milestones`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setItems(d.milestones ?? d.items ?? []); }
    } finally { setLoading(false); }
  }, [filterProjectId]);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const groups = {
    overdue: [] as Milestone[], soon: [] as Milestone[], upcoming: [] as Milestone[], completed: [] as Milestone[],
  };
  items.forEach(m => {
    if (m.status === "completed") { groups.completed.push(m); return; }
    const d = new Date(m.due_date); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff < 0 || m.status === "missed") groups.overdue.push(m);
    else if (diff <= 14) groups.soon.push(m);
    else groups.upcoming.push(m);
  });

  const projMap = new Map(projects.map(p => [p.id, p]));

  const updateStatus = async (m: Milestone, status: string) => {
    await fetch(`/api/milestones/${m.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm("ลบ milestone นี้?")) return;
    await fetch(`/api/milestones/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const Row = (m: Milestone) => {
    const meta = STATUS_META[m.status] || STATUS_META.pending;
    const proj = projMap.get(m.project_id);
    const d = new Date(m.due_date);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    const Icon = meta.icon;
    return (
      <div key={m.id} className="bg-white border border-gray-300 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta.color}20` }}>
          <Icon size={18} style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/50 text-gray-600">{proj?.project_code || "—"}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${meta.bg}`}>{meta.label}</span>
          </div>
          <div className="text-sm font-medium text-gray-900">{m.title}</div>
          {m.description && <div className="text-xs text-gray-500 mt-0.5">{m.description}</div>}
          <div className="text-xs text-gray-600 mt-1">
            {d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
            {m.status !== "completed" && (
              <span className={`ml-2 ${diff < 0 ? "text-red-600" : diff <= 7 ? "text-orange-600" : ""}`}>
                {diff < 0 ? `เลย ${Math.abs(diff)} วัน` : diff === 0 ? "วันนี้" : `อีก ${diff} วัน`}
              </span>
            )}
            {m.completed_at && <span className="ml-2 text-green-700">เสร็จ {new Date(m.completed_at).toLocaleDateString("th-TH")}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canManage && (
            <select value={m.status} onChange={e => updateStatus(m, e.target.value)}
              className="text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-900">
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
          {canManage && <button onClick={() => setEditing(m)} className="p-1.5 text-gray-500 hover:text-gray-900"><Edit3 size={14} /></button>}
          {canManage && <button onClick={() => remove(m.id)} className="p-1.5 text-red-600 hover:text-red-700"><Trash2 size={14} /></button>}
        </div>
      </div>
    );
  };

  const Section = ({ title, items, accent }: { title: string; items: Milestone[]; accent: string }) => {
    if (!items.length) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-4 rounded-full" style={{ background: accent }} />
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <span className="text-xs text-gray-500">({items.length})</span>
        </div>
        <div className="space-y-2">{items.map(Row)}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <Stat label="เลยกำหนด" value={groups.overdue.length} color="#EF4444" />
          <Stat label="ใน 14 วัน" value={groups.soon.length} color="#F7941D" />
          <Stat label="กำลังจะมา" value={groups.upcoming.length} color="#3B82F6" />
          <Stat label="เสร็จแล้ว" value={groups.completed.length} color="#22C55E" />
        </div>
        {canManage && (
          <button onClick={() => setCreating(true)} className="ml-3 px-4 py-2 bg-blue-600 hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2">
            <Plus size={16} /> เพิ่ม Milestone
          </button>
        )}
      </div>
      {loading && !items.length && <div className="text-center text-gray-500 py-12">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center py-16 bg-white border border-gray-300 rounded-2xl text-gray-500">
          <Flag size={40} className="mx-auto mb-3 text-slate-600" />
          ยังไม่มี milestone
        </div>
      )}
      <Section title="เลยกำหนด" items={groups.overdue} accent="#EF4444" />
      <Section title="ใน 14 วัน" items={groups.soon} accent="#F7941D" />
      <Section title="กำลังจะมา" items={groups.upcoming} accent="#3B82F6" />
      <Section title="เสร็จแล้ว" items={groups.completed} accent="#22C55E" />

      {(creating || editing) && (
        <MilestoneModal
          initial={editing}
          projects={projects}
          defaultProjectId={filterProjectId !== "all" ? filterProjectId : undefined}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); fetchAll(); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-3">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function MilestoneModal({ initial, projects, defaultProjectId, onClose, onSaved }: {
  initial: Milestone | null; projects: Project[]; defaultProjectId?: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Milestone>>(initial ?? { status: "pending", project_id: defaultProjectId });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.title || !form.project_id || !form.due_date) { setErr("ต้องระบุชื่อ, โครงการ, และวันที่"); return; }
    setSaving(true); setErr(null);
    try {
      const url = initial ? `/api/milestones/${initial.id}` : `/api/milestones`;
      const r = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-300 w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">{initial ? "แก้ไข Milestone" : "เพิ่ม Milestone"}</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">โครงการ *</label>
          <select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.project_id ?? ""} onChange={e => setForm({ ...form, project_id: e.target.value })}>
            <option value="">— เลือก —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">ชื่อ Milestone *</label>
          <input className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.title ?? ""} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">รายละเอียด</label>
          <textarea rows={2} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">วันที่ครบกำหนด *</label>
            <input type="date" className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
              value={form.due_date ?? ""} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">สถานะ</label>
            <select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
              value={form.status ?? "pending"} onChange={e => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
