"use client";
import { useEffect, useState } from "react";
import Modal, { fieldLabel, fieldInput, btnPrimary, btnGhost } from "../Modal";
import type { DBPosition } from "@/lib/useData";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: DBPosition | null;
  onSubmit: (payload: Partial<DBPosition>) => Promise<void>;
}

export default function PositionModal({ open, onClose, initial, onSubmit }: Props) {
  const [form, setForm] = useState<Partial<DBPosition>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ?? { default_hourly_rate: 0, color: "#003087", sort_order: 0 });
      setErr(null);
    }
  }, [open, initial]);

  const set = <K extends keyof DBPosition>(k: K, v: DBPosition[K] | string | number | null) =>
    setForm((f) => ({ ...f, [k]: v as DBPosition[K] }));

  const submit = async () => {
    if (!form.name_th && !form.name_en) {
      setErr("ต้องระบุชื่ออย่างน้อยภาษาหนึ่ง");
      return;
    }
    setSaving(true); setErr(null);
    try { await onSubmit(form); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "แก้ไขตำแหน่ง" : "เพิ่มตำแหน่งใหม่"}>
      <div className="space-y-4">
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
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={fieldLabel}>ค่าแรงเริ่มต้น/ชม. (฿)</label>
            <input type="number" className={fieldInput} value={form.default_hourly_rate ?? 0} onChange={(e) => set("default_hourly_rate", Number(e.target.value))} />
          </div>
          <div>
            <label className={fieldLabel}>สี</label>
            <input type="color" className={fieldInput + " h-10"} value={form.color ?? "#003087"} onChange={(e) => set("color", e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>ลำดับ</label>
            <input type="number" className={fieldInput} value={form.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} />
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
