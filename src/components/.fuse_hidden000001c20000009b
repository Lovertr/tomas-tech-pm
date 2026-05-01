"use client";
import { useEffect, useState, useCallback, Fragment } from "react";
import { Plus, Trash2, Edit3, AlertTriangle, ShieldCheck } from "lucide-react";
import TranslateButton from "./TranslateButton";

interface Risk {
  id: string; project_id: string; title: string; description?: string | null;
  probability: string; impact: string; mitigation?: string | null;
  owner_id?: string | null; status: string;
  projects?: { project_code?: string | null; name_th?: string | null; name_en?: string | null } | null;
  team_members?: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null } | null;
}
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }
interface Member { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null; }

const SCORE: Record<string, number> = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
const LEVELS = ["very_low", "low", "medium", "high", "very_high"];
const LBL: Record<string, string> = { very_low: "ต่ำมาก", low: "ต่ำ", medium: "กลาง", high: "สูง", very_high: "สูงมาก" };
const STATUS_LBL: Record<string, string> = { identified: "ระบุแล้ว", assessed: "ประเมินแล้ว", mitigated: "บรรเทาแล้ว", closed: "ปิด" };
const STATUS_COLOR: Record<string, string> = { identified: "#F7941D", assessed: "#3B82F6", mitigated: "#22C55E", closed: "#94A3B8" };

const cellColor = (score: number) => {
  if (score >= 15) return "#EF4444";
  if (score >= 8) return "#F7941D";
  if (score >= 4) return "#FACC15";
  return "#22C55E";
};

const memberName = (m?: Member | null) =>
  m ? (m.first_name_th ? `${m.first_name_th} ${m.last_name_th ?? ""}`.trim() : `${m.first_name_en ?? ""} ${m.last_name_en ?? ""}`.trim()) : "—";

interface Props {
  projects: Project[];
  members: Member[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
}

export default function RisksPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Risk | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterProjectId && filterProjectId !== "all" ? `/api/risks?project_id=${filterProjectId}` : `/api/risks`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setItems(d.risks ?? []); }
    } finally { setLoading(false); }
  }, [filterProjectId]);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const remove = async (id: string) => {
    if (!confirm("ลบ risk นี้?")) return;
    await fetch(`/api/risks/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const updateStatus = async (r: Risk, status: string) => {
    await fetch(`/api/risks/${r.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  // Build matrix counts
  const matrix: Record<string, Record<string, Risk[]>> = {};
  LEVELS.forEach(p => { matrix[p] = {}; LEVELS.forEach(i => matrix[p][i] = []); });
  items.filter(r => r.status !== "closed").forEach(r => {
    matrix[r.probability]?.[r.impact]?.push(r);
  });

  const stats = {
    high: items.filter(r => r.status !== "closed" && SCORE[r.probability] * SCORE[r.impact] >= 15).length,
    med: items.filter(r => r.status !== "closed" && SCORE[r.probability] * SCORE[r.impact] >= 8 && SCORE[r.probability] * SCORE[r.impact] < 15).length,
    low: items.filter(r => r.status !== "closed" && SCORE[r.probability] * SCORE[r.impact] < 8).length,
    closed: items.filter(r => r.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 flex-1">
          <Stat label="ความเสี่ยงสูง" value={stats.high} color="#EF4444" />
          <Stat label="ความเสี่ยงกลาง" value={stats.med} color="#F7941D" />
          <Stat label="ความเสี่ยงต่ำ" value={stats.low} color="#22C55E" />
          <Stat label="ปิดแล้ว" value={stats.closed} color="#94A3B8" />
        </div>
        {canManage && (
          <button onClick={() => setCreating(true)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <Plus size={14} /> เพิ่ม Risk
          </button>
        )}
      </div>

      {/* Risk Matrix — hidden on small phones */}
      <div className="bg-white border border-gray-300 rounded-2xl p-3 md:p-4 hidden sm:block">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Risk Matrix (Probability × Impact)</h3>
        <div className="flex gap-2">
          <div className="flex flex-col justify-end pb-6">
            <div className="text-[10px] text-gray-600 -rotate-90 whitespace-nowrap origin-bottom-left translate-y-2">PROBABILITY →</div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-6 gap-1">
              <div></div>
              {LEVELS.map(i => (
                <div key={i} className="text-center text-[10px] text-gray-600 pb-1">{LBL[i]}</div>
              ))}
              {[...LEVELS].reverse().map(p => (
                <Fragment key={`row-${p}`}>
                  <div className="text-right text-[10px] text-gray-600 pr-1 flex items-center justify-end">{LBL[p]}</div>
                  {LEVELS.map(i => {
                    const score = SCORE[p] * SCORE[i];
                    const cell = matrix[p][i];
                    return (
                      <div key={`${p}-${i}`} className="aspect-square rounded flex items-center justify-center text-xs font-bold relative"
                        style={{ background: `${cellColor(score)}30`, border: `1px solid ${cellColor(score)}80` }}
                        title={`P:${LBL[p]} × I:${LBL[i]} = ${score} (${cell.length} risks)`}>
                        <span style={{ color: cellColor(score) }}>{cell.length || ""}</span>
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
            <div className="text-center text-[10px] text-gray-600 mt-1">IMPACT →</div>
          </div>
        </div>
      </div>

      {loading && !items.length && <div className="text-center text-gray-500 py-12">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center py-16 bg-white border border-gray-300 rounded-2xl text-gray-500">
          <ShieldCheck size={40} className="mx-auto mb-3 text-gray-500" />
          ยังไม่มี risk
        </div>
      )}

      <div className="space-y-2">
        {items.sort((a, b) => SCORE[b.probability] * SCORE[b.impact] - SCORE[a.probability] * SCORE[a.impact]).map(r => {
          const score = SCORE[r.probability] * SCORE[r.impact];
          return (
            <div key={r.id} className="bg-white border border-gray-300 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex flex-col items-center justify-center shrink-0"
                style={{ background: `${cellColor(score)}25`, border: `1px solid ${cellColor(score)}60` }}>
                <AlertTriangle size={14} style={{ color: cellColor(score) }} />
                <span className="text-[10px] font-bold mt-0.5" style={{ color: cellColor(score) }}>{score}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{r.projects?.project_code || "—"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded text-gray-900" style={{ background: STATUS_COLOR[r.status] }}>{STATUS_LBL[r.status]}</span>
                  <span className="text-[10px] text-gray-500">P:{LBL[r.probability]} × I:{LBL[r.impact]}</span>
                </div>
                <div className="text-sm font-medium text-gray-900">{r.title}</div>
                {r.description && (
                  <>
                    <div className="text-xs text-gray-600 mt-0.5">{r.description}</div>
                    <TranslateButton text={r.description} compact />
                  </>
                )}
                {r.mitigation && (
                  <>
                    <div className="text-xs text-[#22C55E] mt-1 flex items-start gap-1">
                      <ShieldCheck size={11} className="mt-0.5 shrink-0" /> {r.mitigation}
                    </div>
                    <TranslateButton text={r.mitigation} compact />
                  </>
                )}
                <div className="text-xs text-gray-500 mt-1">เจ้าของ: {memberName(r.team_members)}</div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <select value={r.status} onChange={e => updateStatus(r, e.target.value)}
                    className="text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-900">
                    {Object.entries(STATUS_LBL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button onClick={() => setEditing(r)} className="p-1.5 text-gray-600 hover:text-gray-900"><Edit3 size={14} /></button>
                  <button onClick={() => remove(r.id)} className="p-1.5 text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(creating || editing) && (
        <RiskModal
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
    <div className="bg-white border border-gray-300 rounded-xl p-2 md:p-3">
      <div className="text-xl md:text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function RiskModal({ initial, projects, members, defaultProjectId, onClose, onSaved }: {
  initial: Risk | null; projects: Project[]; members: Member[]; defaultProjectId?: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Risk>>(
    initial ?? { probability: "medium", impact: "medium", status: "identified", project_id: defaultProjectId }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.title || !form.project_id) { setErr("ต้องระบุชื่อและโครงการ"); return; }
    setSaving(true); setErr(null);
    try {
      const url = initial ? `/api/risks/${initial.id}` : `/api/risks`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-300 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">{initial ? "แก้ไข Risk" : "เพิ่ม Risk"}</h3>
        <Field label="โครงการ *">
          <select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.project_id ?? ""} onChange={e => setForm({ ...form, project_id: e.target.value })}>
            <option value="">— เลือก —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
          </select>
        </Field>
        <Field label="ชื่อ Risk *">
          <input className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.title ?? ""} onChange={e => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="รายละเอียด">
          <textarea rows={2} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="โอกาสเกิด">
            <select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
              value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })}>
              {LEVELS.map(l => <option key={l} value={l}>{LBL[l]}</option>)}
            </select>
          </Field>
          <Field label="ผลกระทบ">
            <select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
              value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value })}>
              {LEVELS.map(l => <option key={l} value={l}>{LBL[l]}</option>)}
            </select>
          </Field>
        </div>
        <Field label="แผนบรรเทา">
          <textarea rows={2} className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.mitigation ?? ""} onChange={e => setForm({ ...form, mitigation: e.target.value })} />
        </Field>
        <Field label="เจ้าของ">
          <select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.owner_id ?? ""} onChange={e => setForm({ ...form, owner_id: e.target.value || null })}>
            <option value="">— ไม่ระบุ —</option>
            {members.map(m => <option key={m.id} value={m.id}>{memberName(m)}</option>)}
          </select>
        </Field>
        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
