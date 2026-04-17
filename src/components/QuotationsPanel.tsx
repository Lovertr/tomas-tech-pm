"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit2, FileText, Send, CheckCircle2, X, Eye } from "lucide-react";
import type { Lang } from "@/lib/i18n";
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
  lang?: Lang;
}

const panelText = {
  draft: { th: "ร่าง", en: "Draft", jp: "下書き" },
  sent: { th: "ส่งแล้ว", en: "Sent", jp: "送信済み" },
  approved: { th: "อนุมัติ", en: "Approved", jp: "承認済み" },
  rejected: { th: "ปฏิเสธ", en: "Rejected", jp: "却下" },
  expired: { th: "หมดอายุ", en: "Expired", jp: "期限切れ" },
  totalValue: { th: "มูลค่ารวม", en: "Total Value", jp: "合計金額" },
  createQuotation: { th: "สร้างอัตราการเสนอราคา", en: "Create Quotation", jp: "見積書を作成" },
  noQuotations: { th: "ยังไม่มีอัตราการเสนอราคา", en: "No quotations yet", jp: "見積書がまだありません" },
  deleteConfirm: { th: "ลบอัตราการเสนอราคานี้?", en: "Delete this quotation?", jp: "この見積書を削除しますか？" },
  viewDetails: { th: "ดูรายละเอียด", en: "View details", jp: "詳細を表示" },
  send: { th: "ส่ง", en: "Send", jp: "送信" },
  approveBtn: { th: "อนุมัติ", en: "Approve", jp: "承認する" },
  close: { th: "ปิด", en: "Close", jp: "閉じる" },
  subtotal: { th: "ยอดรวม", en: "Subtotal", jp: "小計" },
  discount: { th: "ส่วนลด", en: "Discount", jp: "割引" },
  vat: { th: "VAT", en: "VAT", jp: "VAT" },
  totalAmount: { th: "รวมทั้งสิ้น", en: "Total", jp: "合計" },
  createTitle: { th: "สร้างอัตราการเสนอราคา", en: "Create Quotation", jp: "見積書を作成" },
  quotationNo: { th: "เลขที่อัตราการเสนอราคา", en: "Quotation No.", jp: "見積書番号" },
  date: { th: "วันที่", en: "Date", jp: "日付" },
  quotationName: { th: "ชื่ออัตราการเสนอราคา *", en: "Quotation Name *", jp: "見積書名 *" },
  quotationNamePlaceholder: { th: "เช่น ค่าพัฒนาเว็บไซต์", en: "e.g. Website development fee", jp: "例）Webサイト開発費" },
  customer: { th: "ลูกค้า *", en: "Customer *", jp: "顧客 *" },
  selectCustomer: { th: "— เลือก —", en: "— Select —", jp: "— 選択 —" },
  items: { th: "รายการ *", en: "Items *", jp: "項目 *" },
  description: { th: "รายละเอียด", en: "Description", jp: "説明" },
  quantity: { th: "จำนวน", en: "Quantity", jp: "数量" },
  unitPrice: { th: "ราคา", en: "Price", jp: "価格" },
  addItem: { th: "+ เพิ่มรายการ", en: "+ Add item", jp: "+ 項目を追加" },
  discountField: { th: "ส่วนลด (หรือ 0)", en: "Discount (or 0)", jp: "割引（または0）" },
  vatField: { th: "VAT %", en: "VAT %", jp: "VAT %" },
  cancel: { th: "ยกเลิก", en: "Cancel", jp: "キャンセル" },
  create: { th: "สร้าง", en: "Create", jp: "作成" },
  creating: { th: "กำลังสร้าง...", en: "Creating...", jp: "作成中..." },
  requiredTitle: { th: "ต้องป้อนชื่อ", en: "Title is required", jp: "タイトルが必要です" },
  requiredCustomer: { th: "ต้องเลือกลูกค้า", en: "Customer is required", jp: "顧客が必要です" },
  requiredItems: { th: "ต้องมีรายการอย่างน้อย 1 รายการ", en: "At least 1 item is required", jp: "最低1つの項目が必要です" },
} as const;

type PanelTextKey = keyof typeof panelText;

export default function QuotationsPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0, lang = "th" }: Props) {
  const L = (key: string) => (panelText[key as PanelTextKey] as any)?.[lang] ?? (panelText[key as PanelTextKey] as any)?.th ?? key;
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
    if (!confirm(L("deleteConfirm"))) return;
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
          <Stat label={L("draft")} value={String(stats.draft)} color="#94A3B8" />
          <Stat label={L("sent")} value={String(stats.sent)} color="#00AEEF" />
          <Stat label={L("approved")} value={String(stats.approved)} color="#22C55E" />
          <Stat label={L("totalValue")} value={fmtMoney(stats.total)} color="#003087" />
        </div>
        {canManage && (
          <button
            onClick={() => setCreating(true)}
            className="ml-3 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} /> {L("createQuotation")}
          </button>
        )}
      </div>

      {loading && !items.length && <div className="text-center text-slate-400 py-12">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center py-16 bg-[#1E293B] border border-[#334155] rounded-2xl text-slate-400">
          <FileText size={40} className="mx-auto mb-3 text-slate-600" />
          {L("noQuotations")}
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
                    title={L("viewDetails")}
                  >
                    <Eye size={14} />
                  </button>
                  {quo.status === "draft" && (
                    <button
                      onClick={() => updateStatus(quo, "sent")}
                      className="px-2 py-1.5 bg-blue-500/20 text-blue-300 rounded text-xs flex items-center gap-1"
                    >
                      <Send size={11} /> {L("send")}
                    </button>
                  )}
                  {quo.status === "sent" && (
                    <button
                      onClick={() => updateStatus(quo, "approved")}
                      className="px-2 py-1.5 bg-green-500/20 text-green-300 rounded text-xs flex items-center gap-1"
                    >
                      <CheckCircle2 size={11} /> {L("approveBtn")}
                    </button>
                  )}
                  <button onClick={() => remove(quo.id)} className="p-1.5 text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {viewingId === quo.id && (
              <QuotationDetailView quotation={quo} onClose={() => setViewingId(null)} lang={lang} />
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
          lang={lang}
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

function QuotationDetailView({ quotation, onClose, lang = "th" }: { quotation: Quotation; onClose: () => void; lang?: Lang }) {
  const L = (key: string) => (panelText[key as PanelTextKey] as any)?.[lang] ?? (panelText[key as PanelTextKey] as any)?.th ?? key;

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
          <span>{L("subtotal")}</span>
          <span>{fmtMoney(quotation.subtotal)}</span>
        </div>
        {quotation.discount > 0 && (
          <div className="flex justify-between text-orange-300">
            <span>{L("discount")}</span>
            <span>-{fmtMoney(quotation.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-cyan-300">
          <span>{L("vat")} {quotation.vat_pct}%</span>
          <span>{fmtMoney(quotation.vat_amount)}</span>
        </div>
        <div className="flex justify-between text-white font-bold pt-2 border-t border-[#334155]">
          <span>{L("totalAmount")}</span>
          <span>{fmtMoney(quotation.total)}</span>
        </div>
      </div>
      <button onClick={onClose} className="w-full px-3 py-1.5 text-slate-300 hover:text-white text-sm">
        {L("close")}
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
  lang = "th",
}: {
  projects: Project[];
  customers: Customer[];
  defaultProjectId?: string;
  onClose: () => void;
  onSaved: () => void;
  lang?: Lang;
}) {
  const L = (key: string) => (panelText[key as PanelTextKey] as any)?.[lang] ?? (panelText[key as PanelTextKey] as any)?.th ?? key;
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
      setErr(L("requiredTitle"));
      return;
    }
    if (!form.customer_name) {
      setErr(L("requiredCustomer"));
      return;
    }
    if (form.items.length === 0 || !form.items[0].description) {
      setErr(L("requiredItems"));
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
        <h3 className="text-lg font-semibold text-white">{L("createTitle")}</h3>

        <div className="grid grid-cols-2 gap-3">
          <Field label={L("quotationNo")}>
            <input
              type="text"
              className={inp}
              value={form.quotation_no}
              onChange={(e) => setForm({ ...form, quotation_no: e.target.value })}
              placeholder="QT-2026-001"
            />
          </Field>
          <Field label={L("date")}>
            <input
              type="date"
              className={inp}
              value={form.quotation_date}
              onChange={(e) => setForm({ ...form, quotation_date: e.target.value })}
            />
          </Field>
        </div>

        <Field label={L("quotationName")}>
          <input
            type="text"
            className={inp}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={L("quotationNamePlaceholder")}
          />
        </Field>

        <Field label={L("customer")}>
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
            <option value="">{L("selectCustomer")}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_th || c.name_en}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <label className="block text-xs text-slate-400 mb-2">{L("items")}</label>
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
                  placeholder={L("description")}
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
                  placeholder={L("quantity")}
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
                  placeholder={L("unitPrice")}
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
            {L("addItem")}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={L("discountField")}>
            <input
              type="number"
              className={inp}
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
              placeholder="0"
            />
          </Field>
          <Field label={L("vatField")}>
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
            <span>{L("subtotal")}</span>
            <span>{fmtMoney(subtotal)}</span>
          </div>
          {form.discount > 0 && (
            <div className="flex justify-between text-orange-300">
              <span>{L("discount")}</span>
              <span>-{fmtMoney(form.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-cyan-300">
            <span>{L("vat")} {form.vat_pct}%</span>
            <span>{fmtMoney(vat)}</span>
          </div>
          <div className="flex justify-between text-white font-bold pt-2 border-t border-[#334155]">
            <span>{L("totalAmount")}</span>
            <span>{fmtMoney(total)}</span>
          </div>
        </div>

        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white text-sm">
            {L("cancel")}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50"
          >
            {busy ? L("creating") : L("create")}
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
