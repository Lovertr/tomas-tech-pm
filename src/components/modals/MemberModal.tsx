"use client";
import { useEffect, useState } from "react";
import Modal, { fieldLabel, fieldInput, btnPrimary, btnGhost } from "../Modal";
import type { DBMember, DBPosition } from "@/lib/useData";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: DBMember | null;
  positions: DBPosition[];
  onSubmit: (payload: Partial<DBMember>) => Promise<void>;
}

interface BasicUser { id: string; username: string; display_name: string | null; display_name_th: string | null; }

export default function MemberModal({ open, onClose, initial, positions, onSubmit }: Props) {
  const [form, setForm] = useState<Partial<DBMember>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [users, setUsers] = useState<BasicUser[]>([]);

  useEffect(() => {
    if (open) {
      setForm(initial ?? { hourly_rate: 0 });
      setErr(null);
      // Load user list for the link dropdown (admin/manager only — silently 403 otherwise)
      fetch("/api/users/basic")
        .then(r => r.ok ? r.json() : { users: [] })
        .then(d => setUsers(d.users ?? []))
        .catch(() => setUsers([]));
    }
  }, [open, initial]);

  const set = <K extends keyof DBMember>(k: K, v: DBMember[K] | string | number | null) =>
    setForm((f) => ({ ...f, [k]: v as DBMember[K] }));

  // Auto-fill hourly_rate from position default
  const onPosChange = (pid: string) => {
    set("position_id", pid || null);
    if (pid && !initial) {
      const pos = positions.find(p => p.id === pid);
      if (pos) set("hourly_rate", Number(pos.default_hourly_rate) || 0);
    }
  };

  const submit = async () => {
    if (!form.first_name_th && !form.first_name_en) {
      setErr("ต้องระบุชื่ออย่างน้อยภาษาหนึ่ง");
      return;
    }
    setSaving(true); setErr(null);
    try { await onSubmit(form); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "แก้ไขสมาชิก" : "เพิ่มสมาชิกใหม่"} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>รหัสพนักงาน</label>
            <input className={fieldInput} value={form.employee_code ?? ""} onChange={(e) => set("employee_code", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>แผนก</label>
            <input className={fieldInput} value={form.department ?? ""} onChange={(e) => set("department", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>ชื่อ (TH)</label>
            <input className={fieldInput} value={form.first_name_th ?? ""} onChange={(e) => set("first_name_th", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>นามสกุล (TH)</label>
            <input className={fieldInput} value={form.last_name_th ?? ""} onChange={(e) => set("last_name_th", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>First name (EN)</label>
            <input className={fieldInput} value={form.first_name_en ?? ""} onChange={(e) => set("first_name_en", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>Last name (EN)</label>
            <input className={fieldInput} value={form.last_name_en ?? ""} onChange={(e) => set("last_name_en", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>名 (JP)</label>
            <input className={fieldInput} value={form.first_name_jp ?? ""} onChange={(e) => set("first_name_jp", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>姓 (JP)</label>
            <input className={fieldInput} value={form.last_name_jp ?? ""} onChange={(e) => set("last_name_jp", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>ตำแหน่ง</label>
            <select className={fieldInput} value={form.position_id ?? ""} onChange={(e) => onPosChange(e.target.value)}>
              <option value="">-- ไม่ระบุ --</option>
              {positions.map(p => <option key={p.id} value={p.id}>{p.name_th || p.name_en}</option>)}
            </select>
          </div>
          <div>
            <label className={fieldLabel}>ค่าแรง/ชม. (฿)</label>
            <input type="number" className={fieldInput} value={form.hourly_rate ?? 0} onChange={(e) => set("hourly_rate", Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>อีเมล</label>
            <input className={fieldInput} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>เบอร์โทร</label>
            <input className={fieldInput} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </div>
        </div>

        {users.length > 0 && (
          <div className="border-t border-[#334155] pt-3">
            <label className={fieldLabel}>
              🔗 ผูกกับ User Account
              <span className="text-xs text-slate-500 font-normal ml-2">
                (เพื่อให้ AI Standup, MyTasks, Timer ทำงานในมุมของบุคคลนี้)
              </span>
            </label>
            <select
              className={fieldInput}
              value={form.user_id ?? ""}
              onChange={(e) => set("user_id", e.target.value || null)}
            >
              <option value="">— ไม่ผูก —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.username} — {u.display_name_th || u.display_name || u.username}
                </option>
              ))}
            </select>
          </div>
        )}

        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={btnGhost}>ยกเลิก</button>
          <button onClick={submit} disabled={saving} className={btnPrimary}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
        </div>
      </div>
    </Modal>
  );
}
