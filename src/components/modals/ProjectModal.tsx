"use client";
import { useEffect, useState } from "react";
import Modal, { fieldLabel, fieldInput, btnPrimary, btnGhost } from "../Modal";
import type { DBProject } from "@/lib/useData";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: DBProject | null;
  onSubmit: (payload: Partial<DBProject>) => Promise<void>;
}

const STATUS = ["planning", "in_progress", "on_hold", "completed", "cancelled"];
const PRIORITY = ["low", "medium", "high", "urgent"];

export default function ProjectModal({ open, onClose, initial, onSubmit }: Props) {
  const [form, setForm] = useState<Partial<DBProject>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ?? { status: "planning", priority: "medium", progress: 0 });
      setErr(null);
    }
  }, [open, initial]);

  const set = <K extends keyof DBProject>(k: K, v: DBProject[K] | string | number | null) =>
    setForm((f) => ({ ...f, [k]: v as DBProject[K] }));

  const submit = async () => {
    setSaving(true); setErr(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "แก้ไขโครงการ" : "เพิ่มโครงการใหม่"} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>รหัสโครงการ</label>
            <input className={fieldInput} value={form.project_code ?? ""} onChange={(e) => set("project_code", e.target.value)} placeholder="TT-2026-001" />
          </div>
          <div>
            <label className={fieldLabel}>ลูกค้า</label>
            <input className={fieldInput} value={form.client_name ?? ""} onChange={(e) => set("client_name", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={fieldLabel}>ชื่อ (TH)</label>
            <input className={fieldInput} value={form.name_th ?? ""} onChange={(e) => set("name_th", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>Name (EN)</label>
            <input className={fieldInput} value={form.name_en ?? ""} onChange={(e) => set("name_en", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>名前 (JP)</label>
            <input className={fieldInput} value={form.name_jp ?? ""} onChange={(e) => set("name_jp", e.target.value)} />
          </div>
        </div>
        <div>
          <label className={fieldLabel}>รายละเอียด</label>
          <textarea className={fieldInput} rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>สถานะ</label>
            <select className={fieldInput} value={form.status ?? "planning"} onChange={(e) => set("status", e.target.value)}>
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
            <label className={fieldLabel}>วันเริ่ม</label>
            <input type="date" className={fieldInput} value={form.start_date ?? ""} onChange={(e) => set("start_date", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>วันสิ้นสุด</label>
            <input type="date" className={fieldInput} value={form.end_date ?? ""} onChange={(e) => set("end_date", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={fieldLabel}>งบประมาณ (฿)</label>
            <input type="number" className={fieldInput} value={form.budget_limit ?? ""} onChange={(e) => set("budget_limit", e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className={fieldLabel}>ชั่วโมงประมาณ</label>
            <input type="number" className={fieldInput} value={form.estimated_hours ?? ""} onChange={(e) => set("estimated_hours", e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className={fieldLabel}>ความคืบหน้า (%)</label>
            <input type="number" min={0} max={100} className={fieldInput} value={form.progress ?? 0} onChange={(e) => set("progress", Number(e.target.value))} />
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
