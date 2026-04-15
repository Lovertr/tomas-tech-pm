"use client";
import { useEffect, useState } from "react";
import Modal, { fieldLabel, fieldInput, btnPrimary, btnGhost } from "../Modal";

interface Project { id: string; name_th?: string | null; name_en?: string | null; project_code?: string | null; }
interface Member { id: string; first_name_en?: string | null; last_name_en?: string | null; first_name_th?: string | null; last_name_th?: string | null; }

export interface AllocationFormValue {
  id?: string;
  project_id: string;
  team_member_id: string;
  allocation_pct: number;
  role_in_project: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  is_active?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (v: AllocationFormValue) => Promise<void> | void;
  initial?: Partial<AllocationFormValue> | null;
  projects: Project[];
  members: Member[];
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AllocationModal({ open, onClose, onSave, initial, projects, members }: Props) {
  const [form, setForm] = useState<AllocationFormValue>({
    project_id: "", team_member_id: "", allocation_pct: 100,
    role_in_project: null, start_date: todayISO(), end_date: null, notes: null, is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setForm({
      id: initial?.id,
      project_id: initial?.project_id ?? "",
      team_member_id: initial?.team_member_id ?? "",
      allocation_pct: initial?.allocation_pct ?? 100,
      role_in_project: initial?.role_in_project ?? null,
      start_date: initial?.start_date ?? todayISO(),
      end_date: initial?.end_date ?? null,
      notes: initial?.notes ?? null,
      is_active: initial?.is_active ?? true,
    });
  }, [open, initial]);

  const submit = async () => {
    if (!form.project_id || !form.team_member_id || !form.start_date) {
      setErr("Project, Member, Start date จำเป็น");
      return;
    }
    if (form.allocation_pct < 0 || form.allocation_pct > 100) {
      setErr("Allocation % ต้องอยู่ระหว่าง 0-100");
      return;
    }
    if (form.end_date && form.end_date < form.start_date) {
      setErr("End date ต้องไม่ก่อน Start date");
      return;
    }
    setSaving(true); setErr(null);
    try { await onSave(form); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const memberName = (m: Member) =>
    [m.first_name_en, m.last_name_en].filter(Boolean).join(" ") ||
    [m.first_name_th, m.last_name_th].filter(Boolean).join(" ") || m.id.slice(0, 6);
  const projectName = (p: Project) => p.project_code ? `[${p.project_code}] ${p.name_th || p.name_en || ""}` : (p.name_th || p.name_en || p.id.slice(0, 6));

  return (
    <Modal open={open} onClose={onClose} title={form.id ? "แก้ไข Allocation" : "เพิ่ม Allocation"} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>Project *</label>
            <select className={fieldInput} value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">— เลือก Project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{projectName(p)}</option>)}
            </select>
          </div>
          <div>
            <label className={fieldLabel}>Member *</label>
            <select className={fieldInput} value={form.team_member_id} onChange={(e) => setForm({ ...form, team_member_id: e.target.value })}>
              <option value="">— เลือก Member —</option>
              {members.map(m => <option key={m.id} value={m.id}>{memberName(m)}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={fieldLabel}>Allocation % *</label>
            <input type="number" min={0} max={100} step={5} className={fieldInput}
              value={form.allocation_pct}
              onChange={(e) => setForm({ ...form, allocation_pct: Number(e.target.value) })} />
          </div>
          <div>
            <label className={fieldLabel}>Start Date *</label>
            <input type="date" className={fieldInput}
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <label className={fieldLabel}>End Date</label>
            <input type="date" className={fieldInput}
              value={form.end_date ?? ""}
              onChange={(e) => setForm({ ...form, end_date: e.target.value || null })} />
          </div>
        </div>

        <div>
          <label className={fieldLabel}>Role in Project</label>
          <input type="text" className={fieldInput} placeholder="เช่น Lead Engineer, PM, QA"
            value={form.role_in_project ?? ""}
            onChange={(e) => setForm({ ...form, role_in_project: e.target.value || null })} />
        </div>

        <div>
          <label className={fieldLabel}>Notes</label>
          <textarea rows={3} className={fieldInput}
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value || null })} />
        </div>

        {form.id && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.is_active ?? true}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
        )}

        {err && <div className="text-red-400 text-sm">{err}</div>}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#334155]">
          <button className={btnGhost} onClick={onClose} disabled={saving}>ยกเลิก</button>
          <button className={btnPrimary} onClick={submit} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
