"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit3, Bug, AlertCircle, CheckCircle2 } from "lucide-react";
import TranslateButton from "./TranslateButton";

interface Issue {
  id: string; project_id: string; title: string; description?: string | null;
  severity: string; status: string; reported_by?: string | null; assigned_to?: string | null;
  created_at?: string; resolved_at?: string | null;
  projects?: { project_code?: string | null; name_th?: string | null; name_en?: string | null } | null;
}
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }
interface Member { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null; }

const SEV_COLOR: Record<string, string> = { critical: "#EF4444", high: "#F7941D", medium: "#FACC15", low: "#22C55E" };
const SEV_LBL: Record<string, string> = { critical: "วิกฤต", high: "สูง", medium: "กลาง", low: "ต่ำ" };
const STATUS_LBL: Record<string, string> = { open: "เปิด", investigating: "กำลังตรวจสอบ", in_progress: "กำลังแก้", resolved: "แก้แล้ว", closed: "ปิด" };
const STATUS_COLOR: Record<string, string> = { open: "#EF4444", investigating: "#F7941D", in_progress: "#3B82F6", resolved: "#22C55E", closed: "#94A3B8" };

const memberName = (m?: Member | null) =>
  m ? (m.first_name_th ? `${m.first_name_th} ${m.last_name_th ?? ""}`.trim() : `${m.first_name_en ?? ""} ${m.last_name_en ?? ""}`.trim()) : "—";

interface Props {
  projects: Project[]; members: Member[];
  filterProjectId?: string; canManage?: boolean; refreshKey?: number;
}

export default function IssuesPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Issue | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<string>("active");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterProjectId && filterProjectId !== "all" ? `/api/issues?project_id=${filterProjectId}` : `/api/issues`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setItems(d.issues ?? []); }
    } finally { setLoading(false); }
  }, [filterProjectId]);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const memberMap = new Map(members.map(m => [m.id, m]));

  const remove = async (id: string) => {
    if (!confirm("ลบ issue นี้?")) return;
    await fetch(`/api/issues/${id}`, { method: "DELETE" });
    fetchAll();
  };
  const updateStatus = async (i: Issue, status: string) => {
    await fetch(`/api/issues/${i.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  const filtered = items.filter(i => {
    if (filter === "active") return !["resolved", "closed"].includes(i.status);
    if (filter === "resolved") return ["resolved", "closed"].includes(i.status);
    return true;
  });

  const stats = {
    open: items.filter(i => i.status === "open").length,
    inprog: items.filter(i => ["investigating", "in_progress"].includes(i.status)).length,
    resolved: items.filter(i => i.status === "resolved").length,
    critical: items.filter(i => i.severity === "critical" && !["resolved", "closed"].includes(i.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 flex-1">
          <Stat label="วิกฤต" value={stats.critical} color="#EF4444" />
          <Stat label="เปิดใหม่" value={stats.open} color="#F7941D" />
          <Stat label="กำลังแก้" value={stats.inprog} color="#3B82F6" />
          <Stat label="แก้แล้ว" value={stats.resolved} color="#22C55E" />
        </div>
        {canManage && (
          <button onClick={() => setCreating(true)} className="px-3 py-2 bg-[#1E40AF] hover:bg-[#2563EB] text-slate-900 rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <Plus size={14} /> เพิ่ม Issue
          </button>
        )}
      </div>

      <div className="flex rounded-xl overflow-hidden border border-[#E5E7EB] w-fit">
        {(["active", "resolved", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-medium ${filter === f ? "text-slate-900" : "text-slate-600"}`}
            style={filter === f ? { background: "#003087" } : { background: "#F5F5F5" }}>
            {f === "active" ? "กำลังเปิด" : f === "resolved" ? "ปิดแล้ว" : "ทั้งหมด"}
          </button>
        ))}
      </div>

      {loading && !filtered.length && <div className="text-center text-gray-500 py-12">Loading...</div>}
      {!loading && !filtered.length && (
        <div className="text-center py-16 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl text-gray-500">
          <Bug size={40} className="mx-auto mb-3 text-gray-500" />
          ยังไม่มี issue
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(i => {
          const isResolved = ["resolved", "closed"].includes(i.status);
          return (
            <div key={i.id} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${SEV_COLOR[i.severity]}25` }}>
                {isResolved ? <CheckCircle2 size={18} className="text-green-400" /> : <AlertCircle size={18} style={{ color: SEV_COLOR[i.severity] }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/50 text-slate-700">{i.projects?.project_code || "—"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded text-slate-900" style={{ background: SEV_COLOR[i.severity] }}>{SEV_LBL[i.severity]}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded text-slate-900" style={{ background: STATUS_COLOR[i.status] }}>{STATUS_LBL[i.status]}</span>
                </div>
                <div className={`text-sm font-medium ${isResolved ? "text-slate-600 line-through" : "text-slate-900"}`}>{i.title}</div>
                {i.description && (
                  <>
                    <div className="text-xs text-slate-600 mt-0.5">{i.description}</div>
                    <TranslateButton text={i.description} compact />
                  </>
                )}
                <div className="text-xs text-slate-500 mt-1">
                  รายงาน: {memberName(memberMap.get(i.reported_by ?? ""))} · ผู้รับผิดชอบ: {memberName(memberMap.get(i.assigned_to ?? ""))}
                  {i.created_at && <span className="ml-2">{new Date(i.created_at).toLocaleDateString("th-TH")}</span>}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <select value={i.status} onChange={e => updateStatus(i, e.target.value)}
                    className="text-xs bg-[#F5F5F5] border border-[#E5E7EB] rounded px-2 py-1 text-slate-900">
                    {Object.entries(STATUS_LBL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button onClick={() => setEditing(i)} className="p-1.5 text-slate-600 hover:text-slate-900"><Edit3 size={14} /></button>
                  <button onClick={() => remove(i.id)} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(creating || editing) && (
        <IssueModal
          initial={editing}
          projects={projects}
          members={members}
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
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-2 md:p-3">
      <div className="text-xl md:text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function IssueModal({ initial, projects, members, defaultProjectId, onClose, onSaved }: {
  initial: Issue | null; projects: Project[]; members: Member[]; defaultProjectId?: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Issue>>(
    initial ?? { severity: "medium", status: "open", project_id: defaultProjectId }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.title || !form.project_id) { setErr("ต้องระบุชื่อและโครงการ"); return; }
    setSaving(true); setErr(null);
    try {
      const url = initial ? `/api/issues/${initial.id}` : `/api/issues`;
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-white/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#FFFFFF] rounded-t-2xl md:rounded-2xl border-t md:border border-[#E5E7EB] w-full max-w-lg p-4 md:p-6 space-y-4 max-h-[95vh] md:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="md:hidden flex justify-center -mt-2 mb-2"><div className="w-10 h-1 rounded-full bg-slate-600" /></div>
        <h3 className="text-base md:text-lg font-semibold text-slate-900">{initial ? "แก้ไข Issue" : "เพิ่ม Issue"}</h3>
        <Field label="โครงการ *">
          <select className="w-full bg-[#F5F5F5] border border-[#E5E7EB] rounded-lg px-3 py-2 text-slate-900 text-sm"
            value={form.project_id ?? ""} onChange={e => setForm({ ...form, project_id: e.target.value })}>
            <option value="">— เลือก —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
          </select>
        </Field>
        <Field label="ชื่อ Issue *">
          <input className="w-full bg-[#F5F5F5] border border-[#E5E7EB] rounded-lg px-3 py-2 text-slate-900 text-sm"
            value={form.title ?? ""} onChange={e => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="รายละเอียด">
          <textarea rows={3} className="w-full bg-[#F5F5F5] border border-[#E5E7EB] rounded-lg px-3 py-2 text-slate-900 text-sm"
            value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ความรุนแรง">
            <select className="w-full bg-[#F5F5F5] border border-[#E5E7EB] rounded-lg px-3 py-2 text-slate-900 text-sm"
              value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
              {Object.entries(SEV_LBL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="สถานะ">
            <select className="w-full bg-[#F5F5F5] border border-[#E5E7EB] rounded-lg px-3 py-2 text-slate-900 text-sm"
              value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS_LBL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ผู้รายงาน">
            <select className="w-full bg-[#F5F5F5] border border-[#E5E7EB] rounded-lg px-3 py-2 text-slate-900 text-sm"
              value={form.reported_by ?? ""} onChange={e => setForm({ ...form, reported_by: e.target.value || null })}>
              <option value="">—</option>
              {members.map(m => <option key={m.id} value={m.id}>{memberName(m)}</option>)}
            </select>
          </Field>
          <Field label="ผู้รับผิดชอบ">
            <select className="w-full bg-[#F5F5F5] border border-[#E5E7EB] rounded-lg px-3 py-2 text-slate-900 text-sm"
              value={form.assigned_to ?? ""} onChange={e => setForm({ ...form, assigned_to: e.target.value || null })}>
              <option value="">—</option>
              {members.map(m => <option key={m.id} value={m.id}>{memberName(m)}</option>)}
            </select>
          </Field>
        </div>
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:text-slate-900 text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-[#1E40AF] hover:bg-[#2563EB] text-slate-900 rounded-lg text-sm disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-gray-500 mb-1">{label}</label>{children}</div>;
}
