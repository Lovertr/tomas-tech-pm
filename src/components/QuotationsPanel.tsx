"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit2, FileText, Send, CheckCircle2, X, Eye } from "lucide-react";
import TranslateButton from "./TranslateButton";

interface QuotationItem {
  id?: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
}

interface Quotation {
  id: string;
  quotation_no: string;
  title: string;
  customer_name?: string | null;
  customer_id?: string | null;
  total: number;
  vat_pct: number;
  vat_amount: number;
  subtotal: number;
  discount: number;
  status: string;
  quotation_date: string;
  items?: QuotationItem[];
}

interface Project {
  id: string;
  project_code?: string | null;
  name_th?: string | null;
  name_en?: string | null;
}

interface Member {
  id: string;
  first_name_th?: string | null;
  last_name_th?: string | null;
  first_name_en?: string | null;
  last_name_en?: string | null;
}

interface Customer {
  id: string;
  name_th?: string | null;
  name_en?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "ร่าง",
  sent: "ส่งแล้ว",
  approved: "อนุมัติ",
  rejected: "ปฏิเสธ",
  expired: "หมดอายุ",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#94A3B8",
  sent: "#00AEEF",
  approved: "#22C55E",
  rejected: "#EF4444",
  expired: "#F7941D",
};

const fmtMoney = (n?: number | null) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(Number(n ?? 0));

interface Props {
  projects: Project[];
  members: Member[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
}

export default function QuotationsPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [qr, cr] = await Promise.all([
        fetch("/api/quotations").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/customers").then((r) => (r.ok ? r.json() : null)),
      ]);
      if (qr) setItems(qr.quotations ?? []);
      if (cr) setCustomers(cr.customers ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshKey]);

  const remove = async (id: string) => {
    if (!confirm("ลบอัตราการเสนอราคานี้?")) return;
    await fetch(`/api/quotations/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const updateStatus = async (quo: Quotation, status: string) => {
    await fetch(`/api/quotations/${quo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  const stats = {
    draft: items.filter((q) => q.status === "draft").length,
    sent: items.filter((q) => q.status === "sent").length,
    approved: items.filter((q) => q.status === "approved").length,
    total: items.reduce((sum, q) => sum + Number(q.total), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <Stat label="ร่าง" value={String(stats.draft)} color="#94A3B8" />
          <Stat label="ส่งแล้ว" value={String(stats.sent)} color="#00AEEF" />
          <Stat label="อนุมัติ" value={String(stats.approved)} color="#22C55E" />
          <Stat label="มูลค่ารวม" value={fmtMoney(stats.total)} color="#003087" />
        </div>
        {canManage && (
          <button
            onClick={() => setCreating(true)}
            className="ml-3 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} /> สร้างอัตราการเสนอราคา
          </button>
        )}
      </div>

      {loading && !items.length && <div className="text-center text-slate-400 py-12">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center py-16 bg-[#1E293B] border border-[#334155] rounded-2xl text-slate-400">
          <FileText size={40} className="mx-auto mb-3 text-slate-600" />
          ยังไม่มีอัตราการเสนอราคา
        </div>
      )}

      <div className="space-y-2">
        {items.map((quo) => (
          <div key={quo.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${STATUS_COLORS[quo.status]}25` }}
              >
                <FileText size={18} style={{ color: STATUS_COLORS[quo.status] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-mono font-medium text-white">{quo.quotation_no}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: STATUS_COLORS[quo.status] }}>
                    {STATUS_LABELS[quo.status]}
                  </span>
                </div>
                <div className="text-sm text-white font-medium mb-0.5">{quo.title}</div>
                <div className="text-xs text-slate-400">
                  {quo.customer_name && <span>{quo.customer_name} · </span>}
                  {new Date(quo.quotation_date).toLocaleDateString("th-TH")}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-bold text-white">{fmtMoney(quo.total)}</div>
                <div className="text-[10px] text-slate-500">VAT {quo.vat_pct}%</div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => setViewingId(quo.id)}
                    className="p-1.5 text-slate-400 hover:text-white"
                    title="ดูรายละเอียด"
                  >
                    <Eye size={14} />
                  </button>
                  {quo.status === "draft" && (
                    <button
                      onClick={() => updateStatus(quo, "sent")}
                      className="px-2 py-1.5 bg-blue-500/20 text-blue-300 rounded text-xs flex items-center gap-1"
                    >
                      <Send size={11} /> ส่ง
                    </button>
                  )}
                  {quo.status === "sent" && (
                    <button
                      onClick={() => updateStatus(quo, "approved")}
                      className="px-2 py-1.5 bg-green-500/20 text-green-300 rounded text-xs flex items-center gap-1"
                    >
                      <CheckCircle2 size={11} /> อนุมัติ
                    </button>
                  )}
                  <button onClick={() => remove(quo.id)} className="p-1.5 text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {viewingId === quo.id && (
              <QuotationDetailView quotation={quo} onClose={() => setViewingId(null)} />
            )}
          </div>
        ))}
      </div>

      {creating && (
        <CreateQuotationModal
          projects={projects}
          customers={customers}
          defaultProjectId={filterProjectId !== "all" ? filterProjectId : undefined}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-3">
      <div className="text-base font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function QuotationDetailView({ quotation, onClose }: { quotation: Quotation; onClose: () => void }) {
  return (
    <div className="mt-3 pt-3 border-t border-[#334155] space-y-3">
      <div className="bg-[#0F172A] rounded-lg p-3 space-y-2">
        {quotation.items?.map((item, idx) => (
          <div key={item.id || idx} className="flex justify-between text-sm text-slate-300">
            <div className="flex-1">
              <div>{item.description}</div>
              <div className="text-[10px] text-slate-500">
                {item.qty} × {fmtMoney(item.unit_price)} = {fmtMoney(item.amount)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>ยอดรวม</span>
          <span>{fmtMoney(quotation.subtotal)}</span>
        </div>
        {quotation.discount > 0 && (
          <div className="flex justify-between text-orange-300">
            <span>ส่วนลด</span>
            <span>-{fmtMoney(quotation.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-cyan-300">
          <span>VAT {quotation.vat_pct}%</span>
          <span>{fmtMoney(quotation.vat_amount)}</span>
        </div>
        <div className="flex justify-between text-white font-bold pt-2 border-t border-[#334155]">
          <span>รวมทั้งสิ้น</span>
          <span>{fmtMoney(quotation.total)}</span>
        </div>
      </div>
      <button onClick={onClose} className="w-full px-3 py-1.5 text-slate-300 hover:text-white text-sm">
        ปิด
      </button>
    </div>
  );
}

function CreateQuotationModal({
  projects,
  customers,
  defaultProjectId,
  onClose,
  onSaved,
}: {
  projects: Project[];
  customers: Customer[];
  defaultProjectId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    quotation_no: "",
    title: "",
    customer_id: "",
    customer_name: "",
    quotation_date: new Date().toISOString().slice(0, 10),
    vat_pct: 7,
    discount: 0,
    items: [{ description: "", qty: 1, unit_price: 0 }],
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const subtotal = form.items.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
  const afterDiscount = subtotal - form.discount;
  const vat = (afterDiscount * form.vat_pct) / 100;
  const total = afterDiscount + vat;

  const submit = async () => {
    if (!form.title) {
      setErr("ต้องป้อนชื่อ");
      return;
    }
    if (!form.customer_name) {
      setErr("ต้องเลือกลูกค้า");
      return;
    }
    if (form.items.length === 0 || !form.items[0].description) {
      setErr("ต้องมีรายการอย่างน้อย 1 รายการ");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        ...form,
        subtotal,
        vat_amount: vat,
        total,
      };
      const r = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Failed");
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const inp = "w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1E293B] rounded-2xl border border-[#334155] w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">สร้างอัตราการเสนอราคา</h3>

        <div className="grid grid-cols-2 gap-3">
          <Field label="เลขที่อัตราการเสนอราคา">
            <input
              type="text"
              className={inp}
              value={form.quotation_no}
              onChange={(e) => setForm({ ...form, quotation_no: e.target.value })}
              placeholder="QT-2026-001"
            />
          </Field>
          <Field label="วันที่">
            <input
              type="date"
              className={inp}
              value={form.quotation_date}
              onChange={(e) => setForm({ ...form, quotation_date: e.target.value })}
            />
          </Field>
        </div>

        <Field label="ชื่ออัตราการเสนอราคา *">
          <input
            type="text"
            className={inp}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="เช่น ค่าพัฒนาเว็บไซต์"
          />
        </Field>

        <Field label="ลูกค้า *">
          <select
            className={inp}
            value={form.customer_id}
            onChange={(e) => {
              const cust = customers.find((c) => c.id === e.target.value);
              setForm({
                ...form,
                customer_id: e.target.value,
                customer_name: cust?.name_th || cust?.name_en || "",
              });
            }}
          >
            <option value="">— เลือก —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_th || c.name_en}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <label className="block text-xs text-slate-400 mb-2">รายการ *</label>
          <div className="space-y-2">
            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  className={`${inp} col-span-5`}
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...form.items];
                    newItems[idx].description = e.target.value;
                    setForm({ ...form, items: newItems });
                  }}
                  placeholder="รายละเอียด"
                />
                <input
                  type="number"
                  className={`${inp} col-span-2`}
                  value={item.qty}
                  onChange={(e) => {
                    const newItems = [...form.items];
                    newItems[idx].qty = Number(e.target.value);
                    setForm({ ...form, items: newItems });
                  }}
                  placeholder="จำนวน"
                />
                <input
                  type="number"
                  className={`${inp} col-span-3`}
                  value={item.unit_price}
                  onChange={(e) => {
                    const newItems = [...form.items];
                    newItems[idx].unit_price = Number(e.target.value);
                    setForm({ ...form, items: newItems });
                  }}
                  placeholder="ราคา"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newItems = form.items.filter((_, i) => i !== idx);
                    setForm({ ...form, items: newItems });
                  }}
                  className="col-span-2 p-1.5 text-red-400 hover:text-red-300"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, items: [...form.items, { description: "", qty: 1, unit_price: 0 }] })}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300"
          >
            + เพิ่มรายการ
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="ส่วนลด (หรือ 0)">
            <input
              type="number"
              className={inp}
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
              placeholder="0"
            />
          </Field>
          <Field label="VAT %">
            <input
              type="number"
              className={inp}
              value={form.vat_pct}
              onChange={(e) => setForm({ ...form, vat_pct: Number(e.target.value) })}
            />
          </Field>
        </div>

        <div className="bg-[#0F172A] rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>ยอดรวม</span>
            <span>{fmtMoney(subtotal)}</span>
          </div>
          {form.discount > 0 && (
            <div className="flex justify-between text-orange-300">
              <span>ส่วนลด</span>
              <span>-{fmtMoney(form.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-cyan-300">
            <span>VAT {form.vat_pct}%</span>
            <span>{fmtMoney(vat)}</span>
          </div>
          <div className="flex justify-between text-white font-bold pt-2 border-t border-[#334155]">
            <span>รวมทั้งสิ้น</span>
            <span>{fmtMoney(total)}</span>
          </div>
        </div>

        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white text-sm">
            ยกเลิก
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50"
          >
            {busy ? "กำลังสร้าง..." : "สร้าง"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
