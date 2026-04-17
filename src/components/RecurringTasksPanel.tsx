"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit3, Repeat, Play, Pause, Zap } from "lucide-react";

interface RT {
  id: string; project_id: string; title: string; description?: string | null; priority: string;
  assignee_id?: string | null; estimated_hours?: number | null; tags?: string[] | null;
  frequency: string; day_of_week?: number | null; day_of_month?: number | null;
  next_run_date: string; last_run_date?: string | null; active: boolean;
  projects?: { project_code?: string | null; name_th?: string | null; name_en?: string | null } | null;
}
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }
interface Member { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null; }

const FREQ_LBL: Record<string, string> = { daily: "รายวัน", weekly: "รายสัปดาห์", biweekly: "ทุก 2 สัปดาห์", monthly: "รายเดือน" };
const FREQ_COLOR: Record<string, string> = { daily: "#22C55E", weekly: "#00AEEF", biweekly: "#A855F7", monthly: "#F7941D" };
const DOW = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const memberName = (m?: Member | null) =>
  m ? (m.first_name_th ? `${m.first_name_th} ${m.last_name_th ?? ""}`.trim() : `${m.first_name_en ?? ""} ${m.last_name_en ?? ""}`.trim()) : "—";

interface Props { projects: Project[]; members: Member[]; filterProjectId?: string; canManage?: boolean; refreshKey?: number; }

export default function RecurringTasksPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<RT[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<RT | null>(null);
  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterProjectId && filterProjectId !== "all" ? `/api/recurring-tasks?project_id=${filterProjectId}` : `/api/recurring-tasks`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setItems(d.items ?? []); }
    } finally { setLoading(false); }
  }, [filterProjectId]);
  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const memberMap = new Map(members.map(m => [m.id, m]));

  const remove = async (id: string) => {
    if (!confirm("ลบ recurring task นี้?")) return;
    await fetch(`/api/recurring-tasks/${id}`, { method: "DELETE" });
    fetchAll();
  };
  const toggleActive = async (rt: RT) => {
    await fetch(`/api/recurring-tasks/${rt.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rt.active }),
    });
    fetchAll();
  };
  const runDue = async () => {
    setRunning(true);
    try {
      const r = await fetch("/api/recurring-tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "run_due" }),
      });
      const d = await r.json();
      alert(`สร้าง task ${d.generated ?? 0} รายการแล้ว`);
      fetchAll();
    } finally { setRunning(false); }
  };

  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    active: items.filter(i => i.active).length,
    paused: items.filter(i => !i.active).length,
    dueToday: items.filter(i => i.active && i.next_run_date <= today).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="grid grid-cols-3 gap-3 flex-1">
          <Stat label="ใช้งาน" value={stats.active} color="#22C55E" />
          <Stat label="หยุดชั่วคราว" value={stats.paused} color="#94A3B8" />
          <Stat label="ครบกำหนดแล้ว" value={stats.dueToday} color="#F7941D" />
        </div>
        <div className="flex gap-2">
          {canManage && stats.dueToday > 0 && (
            <button onClick={runDue} disabled={running} className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <Zap size={16} /> {running ? "..." : `Run Due (${stats.dueToday})`}
            </button>
          )}
          {canManage && (
            <button onClick={() => setCreating(true)} className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2">
              <Plus size={16} /> เพิ่ม Recurring
            </button>
          )}
        </div>
      </div>

      {loading && !items.length && <div className="text-center text-slate-400 py-12">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center py-16 bg-[#1E293B] border border-[#334155] rounded-2xl text-slate-400">
          <Repeat size={40} className="mx-auto mb-3 text-slate-600" />ยังไม่มี recurring task
        </div>
      )}

      <div className="space-y-2">
        {items.map(rt => {
          const due = rt.active && rt.next_run_date <= today;
          return (
            <div key={rt.id} className={`bg-[#1E293B] border rounded-xl p-4 flex items-start gap-3 ${due ? "border-orange-500/50" : "border-[#334155]"} ${!rt.active ? "opacity-60" : ""}`}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${FREQ_COLOR[rt.frequency]}25` }}>
                <Repeat size={18} style={{ color: FREQ_COLOR[rt.frequency] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">{rt.projects?.project_code || "—"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: FREQ_COLOR[rt.frequency] }}>{FREQ_LBL[rt.frequency]}</span>
                  {rt.day_of_week != null && (rt.frequency === "weekly" || rt.frequency === "biweekly") && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">{DOW[rt.day_of_week]}</span>
                  )}
                  {rt.day_of_month && rt.frequency === "monthly" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">วันที่ {rt.day_of_month}</span>
                  )}
                  {due && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500 text-white">ครบกำหนด</span>}
                </div>
                <div className="text-sm font-medium text-white">{rt.title}</div>
                {rt.description && <div className="text-xs text-slate-400 mt-0.5">{rt.description}</div>}
                <div className="text-xs text-slate-500 mt-1">
                  ครั้งถัดไป: <span className="text-slate-300">{new Date(rt.next_run_date).toLocaleDateString("th-TH")}</span>
                  {rt.assignee_id && <span className="ml-2">· มอบหมาย: {memberName(memberMap.get(rt.assignee_id))}</span>}
                  {rt.last_run_date && <span className="ml-2">· ล่าสุด: {new Date(rt.last_run_date).toLocaleDateString("th-TH")}</span>}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(rt)} className={`p-1.5 ${rt.active ? "text-yellow-400 hover:text-yellow-300" : "text-green-400 hover:text-green-300"}`} title={rt.active ? "หยุดชั่วคราว" : "เปิดใช้งาน"}>
                    {rt.active ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={() => setEditing(rt)} className="p-1.5 text-slate-400 hover:text-white"><Edit3 size={14} /></button>
                  <button onClick={() => remove(rt.id)} className="p-1.5 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(creating || editing) && (
        <RTModal initial={editing} projects={projects} members={members}
          defaultProjectId={filterProjectId !== "all" ? filterProjectId : undefined}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); fetchAll(); }} />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-3">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function RTModal({ initial, projects, members, defaultProjectId, onClose, onSaved }: {
  initial: RT | null; projects: Project[]; members: Member[]; defaultProjectId?: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<RT>>(
    initial ?? { frequency: "weekly", priority: "medium", project_id: defaultProjectId, active: true, next_run_date: new Date().toISOString().slice(0, 10) }
  );
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.title || !form.project_id || !form.frequency || !form.next_run_date) {
      setErr("ต้องระบุชื่อ, โครงการ, ความถี่, วันเริ่ม"); return;
    }
    setBusy(true); setErr(null);
    try {
      const url = initial ? `/api/recurring-tasks/${initial.id}` : `/api/recurring-tasks`;
      const r = await fetch(url, {
        method: initial ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setBusy(false); }
  };

  const inp = "w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1E293B] rounded-2xl border border-[#334155] w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white">{initial ? "แก้ไข Recurring Task" : "เพิ่ม Recurring Task"}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="โครงการ *">
            <select className={inp} value={form.project_id ?? ""} onChange={e => setForm({ ...form, project_id: e.target.value })}>
              <option value="">— เลือก —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
            </select>
          </Field>
          <Field label="ความสำคัญ">
            <select className={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">ต่ำ</option><option value="medium">กลาง</option><option value="high">สูง</option><option value="urgent">ด่วน</option>
            </select>
          </Field>
        </div>
        <Field label="หัวข้อ *"><input className={inp} value={form.title ?? ""} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="รายละเอียด"><textarea rows={2} className={inp} value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="ความถี่ *">
            <select className={inp} value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
              {Object.entries(FREQ_LBL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="ครั้งถัดไป *">
            <input type="date" className={inp} value={form.next_run_date ?? ""} onChange={e => setForm({ ...form, next_run_date: e.target.value })} />
          </Field>
          <Field label="ชั่วโมงประมาณ">
            <input type="number" step="0.5" className={inp} value={form.estimated_hours ?? ""} onChange={e => setForm({ ...form, estimated_hours: e.target.value ? Number(e.target.value) : null })} />
          </Field>
        </div>
        {(form.frequency === "weekly" || form.frequency === "biweekly") && (
          <Field label="วันในสัปดาห์">
            <div className="flex gap-2">
              {DOW.map((d, i) => (
                <button key={i} onClick={() => setForm({ ...form, day_of_week: i })}
                  className={`flex-1 py-2 rounded-lg text-sm ${form.day_of_week === i ? "bg-[#003087] text-white" : "bg-[#0F172A] text-slate-400"}`}>
                  {d}
                </button>
              ))}
            </div>
          </Field>
        )}
        {form.frequency === "monthly" && (
          <Field label="วันที่ในเดือน (1-28)">
            <input type="number" min="1" max="28" className={inp} value={form.day_of_month ?? ""} onChange={e => setForm({ ...form, day_of_month: e.target.value ? Number(e.target.value) : null })} />
          </Field>
        )}
        <Field label="ผู้รับผิดชอบ">
          <select className={inp} value={form.assignee_id ?? ""} onChange={e => setForm({ ...form, assignee_id: e.target.value || null })}>
            <option value="">—</option>
            {members.map(m => <option key={m.id} value={m.id}>{memberName(m)}</option>)}
          </select>
        </Field>
        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={busy} className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50">{busy ? "กำลังบันทึก..." : "บันทึก"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-slate-400 mb-1">{label}</label>{children}</div>;
}
