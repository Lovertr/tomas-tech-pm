"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit3, Repeat, Play, Pause, Zap } from "lucide-react";

interface RT {
  id: string; project_id: string; title: string; title_en?: string | null; title_jp?: string | null;
  description?: string | null; priority: string;
  assignee_id?: string | null; estimated_hours?: number | null; tags?: string[] | null;
  frequency: string; day_of_week?: number | null; day_of_month?: number | null;
  next_run_date: string; last_run_date?: string | null; active: boolean;
  projects?: { project_code?: string | null; name_th?: string | null; name_en?: string | null } | null;
}
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }
interface Member { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null; }

const FREQ_LBL: Record<string, Record<string, string>> = {
  th: { daily: "รายวัน", weekly: "รายสัปดาห์", biweekly: "ทุก 2 สัปดาห์", monthly: "รายเดือน" },
  en: { daily: "Daily", weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly" },
  jp: { daily: "毎日", weekly: "毎週", biweekly: "隔週", monthly: "毎月" },
};
const FREQ_COLOR: Record<string, string> = { daily: "#22C55E", weekly: "#00AEEF", biweekly: "#A855F7", monthly: "#F7941D" };
const DOW_I18N: Record<string, string[]> = {
  th: ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  jp: ["日", "月", "火", "水", "木", "金", "土"],
};
const memberName = (m?: Member | null) =>
  m ? (m.first_name_th ? `${m.first_name_th} ${m.last_name_th ?? ""}`.trim() : `${m.first_name_en ?? ""} ${m.last_name_en ?? ""}`.trim()) : "—";

const rtTitle = (rt: RT, lang: string) =>
  lang === "jp" ? (rt.title_jp || rt.title_en || rt.title) :
  lang === "en" ? (rt.title_en || rt.title) : rt.title;

const i18n: Record<string, Record<string, string>> = {
  th: { active: "ใช้งาน", paused: "หยุดชั่วคราว", due: "ครบกำหนดแล้ว", addBtn: "เพิ่ม Recurring", noItems: "ยังไม่มี recurring task", dueLabel: "ครบกำหนด", nextRun: "ครั้งถัดไป", assignedTo: "มอบหมาย", lastRun: "ล่าสุด", pauseBtn: "หยุดชั่วคราว", resumeBtn: "เปิดใช้งาน", deleteConfirm: "ลบ recurring task นี้?", generated: "สร้าง task {n} รายการแล้ว", dayInMonth: "วันที่ {d}", dayOfWeek: "วันในสัปดาห์", dayInMonthLabel: "วันที่ในเดือน (1-28)", editTitle: "แก้ไข Recurring Task", addTitle: "เพิ่ม Recurring Task", project: "โครงการ *", priority: "ความสำคัญ", titleTh: "หัวข้อ (ไทย) *", titleEn: "หัวข้อ (อังกฤษ)", titleJp: "หัวข้อ (ญี่ปุ่น)", desc: "รายละเอียด", freq: "ความถี่ *", nextDate: "ครั้งถัดไป *", estHours: "ชั่วโมงประมาณ", assignee: "ผู้รับผิดชอบ", cancel: "ยกเลิก", saving: "กำลังบันทึก...", save: "บันทึก", required: "ต้องระบุชื่อ, โครงการ, ความถี่, วันเริ่ม", prioLow: "ต่ำ", prioMed: "กลาง", prioHigh: "สูง", prioUrg: "ด่วน" },
  en: { active: "Active", paused: "Paused", due: "Due", addBtn: "Add Recurring", noItems: "No recurring tasks yet", dueLabel: "Due", nextRun: "Next run", assignedTo: "Assigned", lastRun: "Last run", pauseBtn: "Pause", resumeBtn: "Resume", deleteConfirm: "Delete this recurring task?", generated: "{n} tasks generated", dayInMonth: "Day {d}", dayOfWeek: "Day of week", dayInMonthLabel: "Day of month (1-28)", editTitle: "Edit Recurring Task", addTitle: "Add Recurring Task", project: "Project *", priority: "Priority", titleTh: "Title (Thai) *", titleEn: "Title (English)", titleJp: "Title (Japanese)", desc: "Description", freq: "Frequency *", nextDate: "Next Run *", estHours: "Est. Hours", assignee: "Assignee", cancel: "Cancel", saving: "Saving...", save: "Save", required: "Title, project, frequency, and start date are required", prioLow: "Low", prioMed: "Medium", prioHigh: "High", prioUrg: "Urgent" },
  jp: { active: "有効", paused: "一時停止", due: "期限到来", addBtn: "定期タスク追加", noItems: "定期タスクはまだありません", dueLabel: "期限", nextRun: "次回実行", assignedTo: "担当", lastRun: "前回", pauseBtn: "一時停止", resumeBtn: "再開", deleteConfirm: "この定期タスクを削除しますか？", generated: "{n}件のタスクを生成しました", dayInMonth: "{d}日", dayOfWeek: "曜日", dayInMonthLabel: "日付 (1-28)", editTitle: "定期タスク編集", addTitle: "定期タスク追加", project: "プロジェクト *", priority: "優先度", titleTh: "タイトル（タイ語） *", titleEn: "タイトル（英語）", titleJp: "タイトル（日本語）", desc: "説明", freq: "頻度 *", nextDate: "次回実行日 *", estHours: "見積時間", assignee: "担当者", cancel: "キャンセル", saving: "保存中...", save: "保存", required: "タイトル、プロジェクト、頻度、開始日は必須です", prioLow: "低", prioMed: "中", prioHigh: "高", prioUrg: "緊急" },
};

interface Props { projects: Project[]; members: Member[]; filterProjectId?: string; canManage?: boolean; refreshKey?: number; lang?: string; }

export default function RecurringTasksPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0, lang = "th" }: Props) {
  const lb = i18n[lang] || i18n.th;
  const freqLbl = FREQ_LBL[lang] || FREQ_LBL.th;
  const dow = DOW_I18N[lang] || DOW_I18N.th;
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
    if (!confirm(lb.deleteConfirm)) return;
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
      alert(lb.generated.replace("{n}", String(d.generated ?? 0)));
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
          <Stat label={lb.active} value={stats.active} color="#22C55E" />
          <Stat label={lb.paused} value={stats.paused} color="#94A3B8" />
          <Stat label={lb.due} value={stats.dueToday} color="#F7941D" />
        </div>
        <div className="flex gap-2">
          {canManage && stats.dueToday > 0 && (
            <button onClick={runDue} disabled={running} className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <Zap size={16} /> {running ? "..." : `Run Due (${stats.dueToday})`}
            </button>
          )}
          {canManage && (
            <button onClick={() => setCreating(true)} className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2">
              <Plus size={16} /> {lb.addBtn}
            </button>
          )}
        </div>
      </div>

      {loading && !items.length && <div className="text-center text-gray-600 py-12">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center py-16 bg-white border border-gray-300 rounded-2xl text-gray-600">
          <Repeat size={40} className="mx-auto mb-3 text-gray-600" />{lb.noItems}
        </div>
      )}

      <div className="space-y-2">
        {items.map(rt => {
          const due = rt.active && rt.next_run_date <= today;
          return (
            <div key={rt.id} className={`bg-white border rounded-xl p-4 flex items-start gap-3 ${due ? "border-orange-500/50" : "border-gray-300"} ${!rt.active ? "opacity-60" : ""}`}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${FREQ_COLOR[rt.frequency]}25` }}>
                <Repeat size={18} style={{ color: FREQ_COLOR[rt.frequency] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{rt.projects?.project_code || "—"}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: FREQ_COLOR[rt.frequency] }}>{freqLbl[rt.frequency]}</span>
                  {rt.day_of_week != null && (rt.frequency === "weekly" || rt.frequency === "biweekly") && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{dow[rt.day_of_week]}</span>
                  )}
                  {rt.day_of_month && rt.frequency === "monthly" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{lb.dayInMonth.replace("{d}", String(rt.day_of_month))}</span>
                  )}
                  {due && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500 text-white">{lb.dueLabel}</span>}
                </div>
                <div className="text-sm font-medium text-gray-900">{rtTitle(rt, lang)}</div>
                {rt.description && <div className="text-xs text-gray-600 mt-0.5">{rt.description}</div>}
                <div className="text-xs text-gray-600 mt-1">
                  {lb.nextRun}: <span className="text-gray-700">{new Date(rt.next_run_date).toLocaleDateString(lang === "jp" ? "ja-JP" : lang === "en" ? "en-US" : "th-TH")}</span>
                  {rt.assignee_id && <span className="ml-2">· {lb.assignedTo}: {memberName(memberMap.get(rt.assignee_id))}</span>}
                  {rt.last_run_date && <span className="ml-2">· {lb.lastRun}: {new Date(rt.last_run_date).toLocaleDateString(lang === "jp" ? "ja-JP" : lang === "en" ? "en-US" : "th-TH")}</span>}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(rt)} className={`p-1.5 ${rt.active ? "text-yellow-500 hover:text-yellow-600" : "text-green-500 hover:text-green-600"}`} title={rt.active ? lb.pauseBtn : lb.resumeBtn}>
                    {rt.active ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={() => setEditing(rt)} className="p-1.5 text-gray-600 hover:text-gray-900"><Edit3 size={14} /></button>
                  <button onClick={() => remove(rt.id)} className="p-1.5 text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(creating || editing) && (
        <RTModal initial={editing} projects={projects} members={members} lang={lang}
          defaultProjectId={filterProjectId !== "all" ? filterProjectId : undefined}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); fetchAll(); }} />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-3">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-600 mt-0.5">{label}</div>
    </div>
  );
}

function RTModal({ initial, projects, members, defaultProjectId, onClose, onSaved, lang = "th" }: {
  initial: RT | null; projects: Project[]; members: Member[]; defaultProjectId?: string; lang?: string;
  onClose: () => void; onSaved: () => void;
}) {
  const mlb = i18n[lang] || i18n.th;
  const mFreq = FREQ_LBL[lang] || FREQ_LBL.th;
  const mDow = DOW_I18N[lang] || DOW_I18N.th;
  const [form, setForm] = useState<Partial<RT>>(
    initial ?? { frequency: "weekly", priority: "medium", project_id: defaultProjectId, active: true, next_run_date: new Date().toISOString().slice(0, 10) }
  );
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.title || !form.project_id || !form.frequency || !form.next_run_date) {
      setErr(mlb.required); return;
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

  const inp = "w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-300 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">{initial ? mlb.editTitle : mlb.addTitle}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label={mlb.project}>
            <select className={inp} value={form.project_id ?? ""} onChange={e => setForm({ ...form, project_id: e.target.value })}>
              <option value="">— เลือก —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
            </select>
          </Field>
          <Field label={mlb.priority}>
            <select className={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">{mlb.prioLow}</option><option value="medium">{mlb.prioMed}</option><option value="high">{mlb.prioHigh}</option><option value="urgent">{mlb.prioUrg}</option>
            </select>
          </Field>
        </div>
        <Field label={mlb.titleTh}><input className={inp} value={form.title ?? ""} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={mlb.titleEn}><input className={inp} value={(form as Record<string, unknown>).title_en as string ?? ""} onChange={e => setForm({ ...form, title_en: e.target.value || null } as Partial<RT>)} placeholder="English title" /></Field>
          <Field label={mlb.titleJp}><input className={inp} value={(form as Record<string, unknown>).title_jp as string ?? ""} onChange={e => setForm({ ...form, title_jp: e.target.value || null } as Partial<RT>)} placeholder="日本語タイトル" /></Field>
        </div>
        <Field label={mlb.desc}><textarea rows={2} className={inp} value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label={mlb.freq}>
            <select className={inp} value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
              {Object.entries(mFreq).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label={mlb.nextDate}>
            <input type="date" className={inp} value={form.next_run_date ?? ""} onChange={e => setForm({ ...form, next_run_date: e.target.value })} />
          </Field>
          <Field label={mlb.estHours}>
            <input type="number" step="0.5" className={inp} value={form.estimated_hours ?? ""} onChange={e => setForm({ ...form, estimated_hours: e.target.value ? Number(e.target.value) : null })} />
          </Field>
        </div>
        {(form.frequency === "weekly" || form.frequency === "biweekly") && (
          <Field label={mlb.dayOfWeek}>
            <div className="flex gap-2">
              {mDow.map((d, i) => (
                <button key={i} onClick={() => setForm({ ...form, day_of_week: i })}
                  className={`flex-1 py-2 rounded-lg text-sm ${form.day_of_week === i ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-600"}`}>
                  {d}
                </button>
              ))}
            </div>
          </Field>
        )}
        {form.frequency === "monthly" && (
          <Field label={mlb.dayInMonthLabel}>
            <input type="number" min="1" max="28" className={inp} value={form.day_of_month ?? ""} onChange={e => setForm({ ...form, day_of_month: e.target.value ? Number(e.target.value) : null })} />
          </Field>
        )}
        <Field label={mlb.assignee}>
          <select className={inp} value={form.assignee_id ?? ""} onChange={e => setForm({ ...form, assignee_id: e.target.value || null })}>
            <option value="">—</option>
            {members.map(m => <option key={m.id} value={m.id}>{memberName(m)}</option>)}
          </select>
        </Field>
        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm">{mlb.cancel}</button>
          <button onClick={submit} disabled={busy} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50">{busy ? mlb.saving : mlb.save}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-gray-700 mb-1">{label}</label>{children}</div>;
}
