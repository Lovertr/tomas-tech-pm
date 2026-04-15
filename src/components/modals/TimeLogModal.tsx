"use client";
import { useEffect, useState } from "react";
import Modal, { fieldLabel, fieldInput, btnPrimary, btnGhost } from "../Modal";
import type { DBTimeLog, DBProject, DBTask, DBMember } from "@/lib/useData";

interface Props {
  open: boolean;
  onClose: () => void;
  projects: DBProject[];
  tasks: DBTask[];
  members: DBMember[];
  defaultMemberId?: string;
  onSubmit: (payload: Partial<DBTimeLog>) => Promise<void>;
}

export default function TimeLogModal({ open, onClose, projects, tasks, members, defaultMemberId, onSubmit }: Props) {
  const [form, setForm] = useState<Partial<DBTimeLog>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        team_member_id: defaultMemberId,
        log_date: new Date().toISOString().slice(0, 10),
        hours: 0,
        hourly_rate_at_log: 0,
        is_billable: true,
      });
      setErr(null);
    }
  }, [open, defaultMemberId]);

  const set = <K extends keyof DBTimeLog>(k: K, v: DBTimeLog[K] | string | number | boolean | null) =>
    setForm((f) => ({ ...f, [k]: v as DBTimeLog[K] }));

  // Auto-fill rate from member
  const onMemberChange = (mid: string) => {
    set("team_member_id", mid);
    const mem = members.find(m => m.id === mid);
    if (mem) set("hourly_rate_at_log", Number(mem.hourly_rate) || 0);
  };

  const submit = async () => {
    if (!form.project_id || !form.team_member_id || !form.hours) {
      setErr("Project, Member, Hours จำเป็น");
      return;
    }
    setSaving(true); setErr(null);
    try { await onSubmit(form); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const filteredTasks = form.project_id ? tasks.filter(t => t.project_id === form.project_id) : [];

  return (
    <Modal open={open} onClose={onClose} title="บันทึกเวลาทำงาน" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className={fieldLabel}>โครงการ *</label>
          <select className={fieldInput} value={form.project_id ?? ""} onChange={(e) => { set("project_id", e.target.value); set("task_id", null); }}>
            <option value="">-- เลือกโครงการ --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name_th || p.name_en}</option>)}
          </select>
        </div>
        <div>
          <label className={fieldLabel}>Task (ไม่บังคับ)</label>
          <select className={fieldInput} value={form.task_id ?? ""} onChange={(e) => set("task_id", e.target.value || null)} disabled={!form.project_id}>
            <option value="">-- ไม่ระบุ --</option>
            {filteredTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label className={fieldLabel}>สมาชิก *</label>
          <select className={fieldInput} value={form.team_member_id ?? ""} onChange={(e) => onMemberChange(e.target.value)}>
            <option value="">-- เลือกสมาชิก --</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {[m.first_name_th, m.last_name_th].filter(Boolean).join(" ") || [m.first_name_en, m.last_name_en].filter(Boolean).join(" ")}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={fieldLabel}>วันที่</label>
            <input type="date" className={fieldInput} value={form.log_date ?? ""} onChange={(e) => set("log_date", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>ชั่วโมง *</label>
            <input type="number" step="0.5" className={fieldInput} value={form.hours ?? 0} onChange={(e) => set("hours", Number(e.target.value))} />
          </div>
          <div>
            <label className={fieldLabel}>ค่าแรง/ชม.</label>
            <input type="number" className={fieldInput} value={form.hourly_rate_at_log ?? 0} onChange={(e) => set("hourly_rate_at_log", Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className={fieldLabel}>รายละเอียด</label>
          <textarea className={fieldInput} rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input id="billable" type="checkbox" checked={form.is_billable ?? true} onChange={(e) => set("is_billable", e.target.checked)} />
          <label htmlFor="billable" className="text-sm text-slate-300">เรียกเก็บเงินได้ (billable)</label>
        </div>

        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={btnGhost}>ยกเลิก</button>
          <button onClick={submit} disabled={saving} className={btnPrimary}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
        </div>
      </div>
    </Modal>
  );
}
