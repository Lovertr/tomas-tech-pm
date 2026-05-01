"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit3, Lightbulb, Calendar, User } from "lucide-react";
import TranslateButton from "./TranslateButton";

interface Decision {
  id: string; project_id: string; title: string;
  context?: string | null; decision?: string | null; rationale?: string | null;
  decided_by?: string | null; decided_at?: string | null;
  projects?: { project_code?: string | null; name_th?: string | null; name_en?: string | null } | null;
}
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }
interface Member { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null; }

const memberName = (m?: Member | null) =>
  m ? (m.first_name_th ? `${m.first_name_th} ${m.last_name_th ?? ""}`.trim() : `${m.first_name_en ?? ""} ${m.last_name_en ?? ""}`.trim()) : "—";

interface Props {
  projects: Project[]; members: Member[];
  filterProjectId?: string; canManage?: boolean; refreshKey?: number;
}

export default function DecisionLogPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Decision | null>(null);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterProjectId && filterProjectId !== "all" ? `/api/decisions?project_id=${filterProjectId}` : `/api/decisions`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setItems(d.decisions ?? d.items ?? []); }
    } finally { setLoading(false); }
  }, [filterProjectId]);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const memberMap = new Map(members.map(m => [m.id, m]));

  const remove = async (id: string) => {
    if (!confirm("ลบ decision นี้?")) return;
    await fetch(`/api/decisions/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  const thisMonth = items.filter(d => {
    if (!d.decided_at) return false;
    const dt = new Date(d.decided_at);
    const now = new Date();
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-3 gap-2 md:gap-3 flex-1">
          <Stat label="Decision ทั้งหมด" value={items.length} color="#A855F7" />
          <Stat label="เดือนนี้" value={thisMonth} color="#00AEEF" />
          <Stat label="โครงการ" value={new Set(items.map(i => i.project_id)).size} color="#22C55E" />
        </div>
        {canManage && (
          <button onClick={() => setCreating(true)} className="px-3 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <Plus size={14} /> เพิ่ม Decision
          </button>
        )}
      </div>

      {loading && !items.length && <div className="text-center text-slate-600 py-12">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center py-16 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl text-slate-600">
          <Lightbulb size={40} className="mx-auto mb-3 text-gray-500" />
          ยังไม่มี decision log
        </div>
      )}

      <div className="space-y-2">
        {items.map(d => {
          const isOpen = expanded.has(d.id);
          return (
            <div key={d.id} className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-100" onClick={() => toggle(d.id)}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-purple-100">
                  <Lightbulb size={18} className="text-purple-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/50 text-gray-500">{d.projects?.project_code || "—"}</span>
                    {d.decided_at && (
                      <span className="text-[10px] flex items-center gap-1 text-slate-600">
                        <Calendar size={10} /> {new Date(d.decided_at).toLocaleDateString("th-TH")}
                      </span>
                    )}
                    <span className="text-[10px] flex items-center gap-1 text-slate-600">
                      <User size={10} /> {memberName(memberMap.get(d.decided_by ?? ""))}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{d.title}</div>
                  {d.decision && !isOpen && <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">{d.decision}</div>}
                </div>
                {canManage && (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditing(d)} className="p-1.5 text-slate-600 hover:text-gray-900"><Edit3 size={14} /></button>
                    <button onClick={() => remove(d.id)} className="p-1.5 text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-[#E2E8F0] space-y-3 pt-3">
                  {d.context && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-600 mb-1">Context</div>
                      <div className="text-xs text-gray-500 whitespace-pre-wrap">{d.context}</div>
                      <TranslateButton text={d.context} compact />
                    </div>
                  )}
                  {d.decision && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-600 mb-1">Decision</div>
                      <div className="text-sm text-gray-900 whitespace-pre-wrap bg-purple-50 border border-purple-200 rounded-lg p-3">{d.decision}</div>
                      <TranslateButton text={d.decision} compact />
                    </div>
                  )}
                  {d.rationale && (
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-600 mb-1">Rationale</div>
                      <div className="text-xs text-gray-500 whitespace-pre-wrap">{d.rationale}</div>
                      <TranslateButton text={d.rationale} compact />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(creating || editing) && (
        <DecisionModal
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
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-2 md:p-3">
      <div className="text-xl md:text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] md:text-xs text-slate-600 mt-0.5">{label}</div>
    </div>
  );
}

function DecisionModal({ initial, projects, members, defaultProjectId, onClose, onSaved }: {
  initial: Decision | null; projects: Project[]; members: Member[]; defaultProjectId?: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Decision>>(
    initial ?? { project_id: defaultProjectId, decided_at: new Date().toISOString().slice(0, 10) }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.title || !form.project_id) { setErr("ต้องระบุชื่อและโครงการ"); return; }
    setSaving(true); setErr(null);
    try {
      const url = initial ? `/api/decisions/${initial.id}` : `/api/decisions`;
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
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">{initial ? "แก้ไข Decision" : "เพิ่ม Decision"}</h3>
        <Field label="โครงการ *">
          <select className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.project_id ?? ""} onChange={e => setForm({ ...form, project_id: e.target.value })}>
            <option value="">— เลือก —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
          </select>
        </Field>
        <Field label="หัวข้อ *">
          <input className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm"
            placeholder="เช่น เลือก React Native แทน Flutter"
            value={form.title ?? ""} onChange={e => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Context (สถานการณ์)">
          <textarea rows={3} className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm"
            placeholder="ปัญหาหรือสถานการณ์ที่ต้องตัดสินใจ"
            value={form.context ?? ""} onChange={e => setForm({ ...form, context: e.target.value })} />
        </Field>
        <Field label="Decision (การตัดสินใจ)">
          <textarea rows={3} className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm"
            placeholder="สิ่งที่ตัดสินใจเลือก"
            value={form.decision ?? ""} onChange={e => setForm({ ...form, decision: e.target.value })} />
        </Field>
        <Field label="Rationale (เหตุผล)">
          <textarea rows={3} className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm"
            placeholder="ทำไมจึงเลือกแบบนี้ พิจารณา trade-off อะไรบ้าง"
            value={form.rationale ?? ""} onChange={e => setForm({ ...form, rationale: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ผู้ตัดสินใจ">
            <select className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm"
              value={form.decided_by ?? ""} onChange={e => setForm({ ...form, decided_by: e.target.value || null })}>
              <option value="">—</option>
              {members.map(m => <option key={m.id} value={m.id}>{memberName(m)}</option>)}
            </select>
          </Field>
          <Field label="วันที่ตัดสินใจ">
            <input type="date" className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm"
              value={form.decided_at ? String(form.decided_at).slice(0, 10) : ""}
              onChange={e => setForm({ ...form, decided_at: e.target.value || null })} />
          </Field>
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-900 text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-slate-600 mb-1">{label}</label>{children}</div>;
}
