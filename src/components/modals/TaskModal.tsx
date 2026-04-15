"use client";
import { useEffect, useState } from "react";
import Modal, { fieldLabel, fieldInput, btnPrimary, btnGhost } from "../Modal";
import type { DBTask, DBProject, DBMember } from "@/lib/useData";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: DBTask | null;
  projects: DBProject[];
  members: DBMember[];
  onSubmit: (payload: Partial<DBTask>) => Promise<void>;
}

const STATUS = ["backlog", "todo", "in_progress", "review", "done"];
const PRIORITY = ["low", "medium", "high", "urgent"];

export default function TaskModal({ open, onClose, initial, projects, members, onSubmit }: Props) {
  const [form, setForm] = useState<Partial<DBTask>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ?? { status: "todo", priority: "medium" });
      setErr(null);
    }
  }, [open, initial]);

  const set = <K extends keyof DBTask>(k: K, v: DBTask[K] | string | number | null) =>
    setForm((f) => ({ ...f, [k]: v as DBTask[K] }));

  const submit = async () => {
    if (!form.title || !form.project_id) {
      setErr("Title และ Project จำเป็น");
      return;
    }
    setSaving(true); setErr(null);
    try { await onSubmit(form); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "แก้ไข Task" : "เพิ่ม Task ใหม่"} maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className={fieldLabel}>ชื่อ Task *</label>
          <input className={fieldInput} value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <label className={fieldLabel}>โครงการ *</label>
          <select className={fieldInput} value={form.project_id ?? ""} onChange={(e) => set("project_id", e.target.value)}>
            <option value="">-- เลือกโครงการ --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name_th || p.name_en}</option>)}
          </select>
        </div>
        <div>
          <label className={fieldLabel}>ผู้รับผิดชอบ</label>
          <select className={fieldInput} value={form.assignee_id ?? ""} onChange={(e) => set("assignee_id", e.target.value || null)}>
            <option value="">-- ไม่ระบุ --</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {[m.first_name_th, m.last_name_th].filter(Boolean).join(" ") || [m.first_name_en, m.last_name_en].filter(Boolean).join(" ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={fieldLabel}>รายละเอียด</label>
          <textarea className={fieldInput} rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>สถานะ</label>
            <select className={fieldInput} value={form.status ?? "todo"} onChange={(e) => set("status", e.target.value)}>
              {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={fieldLabel}>ความสำคัญ</label>
            <select className={fieldInput} value={form.priority ?? "medium"} onChange={(e) => set("priority", e.target.value)}>
              {PRIORITY.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>Due date</label>
            <input type="date" className={fieldInput} value={form.due_date ?? ""} onChange={(e) => set("due_date", e.target.value || null)} />
          </div>
          <div>
            <label className={fieldLabel}>ชั่วโมงประมาณ</label>
            <input type="number" className={fieldInput} value={form.estimated_hours ?? ""} onChange={(e) => set("estimated_hours", e.target.value ? Number(e.target.value) : null)} />
          </div>
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
