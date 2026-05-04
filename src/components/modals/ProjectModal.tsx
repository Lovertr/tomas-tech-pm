"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Modal, { fieldLabel, fieldInput, btnPrimary, btnGhost } from "../Modal";
import type { DBProject } from "@/lib/useData";
import { Loader2, ChevronDown, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: DBProject | null;
  onSubmit: (payload: Partial<DBProject>) => Promise<void>;
}

const STATUS = ["planning", "in_progress", "on_hold", "completed", "cancelled"];
const PRIORITY = ["low", "medium", "high", "urgent"];

type LangKey = "name_th" | "name_en" | "name_jp";
const LANG_TARGETS: Record<LangKey, { key: LangKey; lang: string }[]> = {
  name_th: [{ key: "name_en", lang: "en" }, { key: "name_jp", lang: "jp" }],
  name_en: [{ key: "name_th", lang: "th" }, { key: "name_jp", lang: "jp" }],
  name_jp: [{ key: "name_th", lang: "th" }, { key: "name_en", lang: "en" }],
};

export default function ProjectModal({ open, onClose, initial, onSubmit }: Props) {
  const [form, setForm] = useState<Partial<DBProject>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Customer dropdown state
  const [customers, setCustomers] = useState<{ id: string; company_name: string }[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.data || d || [])).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.company_name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setForm(initial ?? { status: "planning", priority: "medium", progress: 0 });
      setErr(null);
      setCustomerSearch(initial?.client_name ?? "");
      setShowCustomerDropdown(false);
    }
    return () => { abortRef.current?.abort(); };
  }, [open, initial]);

  const set = <K extends keyof DBProject>(k: K, v: DBProject[K] | string | number | null) =>
    setForm((f) => ({ ...f, [k]: v as DBProject[K] }));

  /* Auto-translate: when user blurs a name field with text, fill empty siblings */
  const autoTranslate = useCallback(async (srcKey: LangKey) => {
    const text = (form[srcKey] as string)?.trim();
    if (!text) return;
    const targets = LANG_TARGETS[srcKey].filter(t => !(form[t.key] as string)?.trim());
    if (!targets.length) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setTranslating(true);

    try {
      const results = await Promise.all(
        targets.map(async t => {
          try {
            const res = await fetch("/api/ai/translate", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ text, targetLang: t.lang }),
              signal: ctrl.signal,
            });
            if (!res.ok) return null;
            const data = await res.json();
            return { key: t.key, value: data.translated as string };
          } catch { return null; }
        })
      );
      if (!ctrl.signal.aborted) {
        setForm(f => {
          const next = { ...f };
          for (const r of results) {
            if (r?.value && !(next[r.key] as string)?.trim()) {
              (next as Record<string, unknown>)[r.key] = r.value;
            }
          }
          return next;
        });
      }
    } finally {
      if (!ctrl.signal.aborted) setTranslating(false);
    }
  }, [form]);

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
          <div ref={customerRef} className="relative">
            <label className={fieldLabel}>ลูกค้า</label>
            <div className="relative">
              <input
                className={fieldInput}
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                  if (!e.target.value) set("client_name", "");
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="พิมพ์เพื่อค้นหาลูกค้า..."
              />
              {form.client_name ? (
                <button type="button" onClick={() => { set("client_name", ""); setCustomerSearch(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              ) : (
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              )}
            </div>
            {showCustomerDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-400">ไม่พบลูกค้า</div>
                ) : (
                  filteredCustomers.map(c => (
                    <button key={c.id} type="button"
                      onClick={() => {
                        set("client_name", c.company_name);
                        setCustomerSearch(c.company_name);
                        setShowCustomerDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${form.client_name === c.company_name ? "bg-blue-50 text-[#003087] font-medium" : "text-gray-700"}`}>
                      {c.company_name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={fieldLabel}>ชื่อ (TH)</label>
            <input className={fieldInput} value={form.name_th ?? ""} onChange={(e) => set("name_th", e.target.value)} onBlur={() => autoTranslate("name_th")} />
          </div>
          <div>
            <label className={fieldLabel}>Name (EN)</label>
            <input className={fieldInput} value={form.name_en ?? ""} onChange={(e) => set("name_en", e.target.value)} onBlur={() => autoTranslate("name_en")} />
          </div>
          <div>
            <label className={fieldLabel}>名前 (JP)</label>
            <input className={fieldInput} value={form.name_jp ?? ""} onChange={(e) => set("name_jp", e.target.value)} onBlur={() => autoTranslate("name_jp")} />
          </div>
        </div>
        {translating && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Loader2 size={12} className="animate-spin" /> กำลังแปลชื่อโครงการอัตโนมัติ...
          </div>
        )}
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

        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={btnGhost}>ยกเลิก</button>
          <button onClick={submit} disabled={saving} className={btnPrimary}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
        </div>
      </div>
    </Modal>
  );
}
