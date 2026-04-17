"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit3, GitPullRequest, Check, X, Clock, DollarSign, Calendar } from "lucide-react";
import TranslateButton from "./TranslateButton";

interface CR {
  id: string; project_id: string; cr_code?: string | null; title: string; description?: string | null;
  impact_scope?: string | null; impact_schedule_days?: number | null; impact_budget?: number | null;
  requested_by?: string | null; status: string; requested_at?: string; decided_at?: string | null;
  projects?: { project_code?: string | null; name_th?: string | null; name_en?: string | null } | null;
}
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }
interface Member { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null; }

const STATUS_LBL: Record<string, string> = { pending: "รออนุมัติ", approved: "อนุมัติ", rejected: "ปฏิเสธ", implemented: "ดำเนินการแล้ว" };
const STATUS_COLOR: Record<string, string> = { pending: "#F7941D", approved: "#22C55E", rejected: "#EF4444", implemented: "#3B82F6" };

const memberName = (m?: Member | null) =>
  m ? (m.first_name_th ? `${m.first_name_th} ${m.last_name_th ?? ""}`.trim() : `${m.first_name_en ?? ""} ${m.last_name_en ?? ""}`.trim()) : "—";

const fmtMoney = (n?: number | null) =>
  n != null ? new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n) : "—";

interface Props {
  projects: Project[]; members: Member[];
  filterProjectId?: string; canManage?: boolean; canApprove?: boolean; refreshKey?: number;
}

export default function ChangeRequestsPanel({ projects, members, filterProjectId = "all", canManage = true, canApprove = false, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<CR[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CR | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterProjectId && filterProjectId !== "all" ? `/api/change-requests?project_id=${filterProjectId}` : `/api/change-requests`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setItems(d.items ?? []); }
    } finally { setLoading(false); }
  }, [filterProjectId]);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const memberMap = new Map(members.map(m => [m.id, m]));

  const remove = async (id: string) => {
    if (!confirm("ลบ change request นี้?")) return;
    await fetch(`/api/change-requests/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const decide = async (cr: CR, status: string) => {
    await fetch(`/api/change-requests/${cr.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, decided_at: new Date().toISOString() }),
    });
    fetchAll();
  };

  const stats = {
    pending: items.filter(i => i.status === "pending").length,
    approved: items.filter(i => i.status === "approved").length,
    rejected: items.filter(i => i.status === "rejected").length,
    implemented: items.filter(i => i.status === "implemented").length,
  };

  const totalBudgetImpact = items.filter(i => ["approved", "implemented"].includes(i.status)).reduce((s, i) => s + (Number(i.impact_budget) || 0), 0);
  const totalScheduleImpact = items.filter(i => ["approved", "implemented"].includes(i.status)).reduce((s, i) => s + (Number(i.impact_schedule_days) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 flex-1">
          <Stat label="รออนุมัติ" value={stats.pending} color="#F7941D" />
          <Stat label="อนุมัติแล้ว" value={stats.approved} color="#22C55E" />
          <Stat label="งบที่เพิ่ม" value={fmtMoney(totalBudgetImpact)} color="#00AEEF" isString />
          <Stat label="วันที่เลื่อน" value={`${totalScheduleImpact} วัน`} color="#A855F7" isString />
        </div>
        {canManage && (
          <button onClick={() => setCreating(true)} className="px-3 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <Plus size={14} /> เพิ่ม CR
          </button>
        )}
      </div>

      {loading && !items.length && <div className="text-center text-slate-400 py-12">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center py-16 bg-[#1E293B] border border-[#334155] rounded-2xl text-slate-400">
          <GitPullRequest size={40} className="mx-auto mb-3 text-slate-600" />
          ยังไม่มี change request
        </div>
      )}

      <div className="space-y-2">
        {items.map(cr => (
          <div key={cr.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-3 md:p-4">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${STATUS_COLOR[cr.status]}25` }}>
                <GitPullRequest size={18} style={{ color: STATUS_COLOR[cr.status] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {cr.cr_code && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#003087]/30 text-[#00AEEF]">{cr.cr_code}</span>}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">{cr.projects?.project_code || "—"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: STATUS_COLOR[cr.status] }}>{STATUS_LBL[cr.status]}</span>
                </div>
                <div className="text-sm font-medium text-white">{cr.title}</div>
                {cr.description && (
                  <>
                    <div className="text-xs text-slate-400 mt-0.5 whitespace-pre-wrap">{cr.description}</div>
                    <TranslateButton text={cr.description} compact />
                  </>
                )}
                {cr.impact_scope && (
                  <>
                    <div className="text-xs text-slate-300 mt-1"><span className="text-slate-500">ขอบเขต:</span> {cr.impact_scope}</div>
                    <TranslateButton text={cr.impact_scope} compact />
                  </>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                  {cr.impact_budget != null && (
                    <span className="flex items-center gap-1 text-orange-300"><DollarSign size={11} /> {fmtMoney(cr.impact_budget)}</span>
                  )}
                  {cr.impact_schedule_days != null && (
                    <span className="flex items-center gap-1 text-purple-300"><Calendar size={11} /> {cr.impact_schedule_days} วัน</span>
                  )}
                  <span className="text-slate-500">โดย: {memberName(memberMap.get(cr.requested_by ?? ""))}</span>
                  {cr.requested_at && <span className="flex items-center gap-1 text-slate-500"><Clock size={11} /> {new Date(cr.requested_at).toLocaleDateString("th-TH")}</span>}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(cr)} className="p-1.5 text-slate-400 hover:text-white"><Edit3 size={14} /></button>
                  <button onClick={() => remove(cr.id)} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            {canApprove && cr.status === "pending" && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#334155]">
                <button onClick={() => decide(cr, "approved")} className="flex-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                  <Check size={12} /> อนุมัติ
                </button>
                <button onClick={() => decide(cr, "rejected")} className="flex-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                  <X size={12} /> ปฏิเสธ
                </button>
              </div>
            )}
            {canManage && cr.status === "approved" && (
              <div className="mt-3 pt-3 border-t border-[#334155]">
                <button onClick={() => decide(cr, "implemented")} className="w-full px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-medium">
                  มาร์คว่าดำเนินการแล้ว
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <CRModal
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

function Stat({ label, value, color, isString }: { label: string; value: number | string; color: string; isString?: boolean }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-2 md:p-3">
      <div className={`font-bold ${isString ? "text-sm md:text-base" : "text-xl md:text-2xl"} truncate`} style={{ color }}>{value}</div>
      <div className="text-[10px] md:text-xs text-slate-400 mt-0.5 truncate">{label}</div>
    </div>
  );
}

function CRModal({ initial, projects, members, defaultProjectId, onClose, onSaved }: {
  initial: CR | null; projects: Project[]; members: Member[]; defaultProjectId?: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<CR>>(
    initial ?? { status: "pending", project_id: defaultProjectId }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.title || !form.project_id) { setErr("ต้องระบุชื่อและโครงการ"); return; }
    setSaving(true); setErr(null);
    try {
      const url = initial ? `/api/change-requests/${initial.id}` : `/api/change-requests`;
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
      <div className="bg-[#1E293B] rounded-2xl border border-[#334155] w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white">{initial ? "แก้ไข Change Request" : "เพิ่ม Change Request"}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="โครงการ *">
            <select className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm"
              value={form.project_id ?? ""} onChange={e => setForm({ ...form, project_id: e.target.value })}>
              <option value="">— เลือก —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
            </select>
          </Field>
          <Field label="CR Code">
            <input className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm"
              placeholder="CR-2025-001"
              value={form.cr_code ?? ""} onChange={e => setForm({ ...form, cr_code: e.target.value })} />
          </Field>
        </div>
        <Field label="หัวข้อ *">
          <input className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm"
            value={form.title ?? ""} onChange={e => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="รายละเอียด">
          <textarea rows={3} className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm"
            value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="ผลกระทบต่อขอบเขต">
          <textarea rows={2} className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm"
            value={form.impact_scope ?? ""} onChange={e => setForm({ ...form, impact_scope: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ผลกระทบงบ (THB)">
            <input type="number" className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm"
              value={form.impact_budget ?? ""} onChange={e => setForm({ ...form, impact_budget: e.target.value ? Number(e.target.value) : null })} />
          </Field>
          <Field label="ผลกระทบเวลา (วัน)">
            <input type="number" className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm"
              value={form.impact_schedule_days ?? ""} onChange={e => setForm({ ...form, impact_schedule_days: e.target.value ? Number(e.target.value) : null })} />
          </Field>
        </div>
        <Field label="ผู้ขอ">
          <select className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm"
            value={form.requested_by ?? ""} onChange={e => setForm({ ...form, requested_by: e.target.value || null })}>
            <option value="">—</option>
            {members.map(m => <option key={m.id} value={m.id}>{memberName(m)}</option>)}
          </select>
        </Field>
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-slate-400 mb-1">{label}</label>{children}</div>;
}
