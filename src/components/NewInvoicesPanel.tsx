"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit2, FileText, Send, CheckCircle2, AlertCircle, Eye, X } from "lucide-react";
import type { Lang } from '@/lib/i18n';
import TranslateButton from "./TranslateButton";

interface InvoiceItem {
  id?: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoice_no: string;
  title: string;
  customer_name?: string | null;
  customer_id?: string | null;
  total: number;
  paid_amount: number;
  vat_pct: number;
  vat_amount: number;
  subtotal: number;
  discount: number;
  status: string;
  invoice_date: string;
  due_date?: string | null;
  items?: InvoiceItem[];
  project_id?: string | null;
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
  partially_paid: "ชำระบางส่วน",
  paid: "ชำระแล้ว",
  overdue: "เกินกำหนด",
  cancelled: "ยกเลิก",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#94A3B8",
  sent: "#00AEEF",
  partially_paid: "#F7941D",
  paid: "#22C55E",
  overdue: "#EF4444",
  cancelled: "#64748B",
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
  "draft_label": { th: "ร่าง", en: "Draft", jp: "ドラフト" },
  "sent_label": { th: "ส่งแล้ว", en: "Sent", jp: "送信済み" },
  "paid_label": { th: "ชำระแล้ว", en: "Paid", jp: "支払済み" },
  "overdue_label": { th: "เกินกำหนด", en: "Overdue", jp: "期限超過" },
  "outstanding_label": { th: "ค้างชำระ", en: "Outstanding", jp: "未払い" },
  "create_invoice": { th: "สร้างใบแจ้งหนี้", en: "Create Invoice", jp: "請求書を作成" },
  "no_invoices": { th: "ยังไม่มีใบแจ้งหนี้", en: "No invoices yet", jp: "請求書がまだありません" },
  "view_details": { th: "ดูรายละเอียด", en: "View Details", jp: "詳細を表示" },
  "send_button": { th: "ส่ง", en: "Send", jp: "送信" },
  "record_payment": { th: "รับชำระ", en: "Record Payment", jp: "支払いを記録" },
  "delete_confirm": { th: "ลบใบแจ้งหนี้นี้?", en: "Delete this invoice?", jp: "この請求書を削除しますか?" },
  "issued": { th: "ออก:", en: "Issued:", jp: "発行日:" },
  "due": { th: "กำหนด:", en: "Due:", jp: "期日:" },
  "recorded": { th: "ชำระ", en: "Recorded", jp: "記録済み" },
  "outstanding": { th: "ค้าง", en: "Outstanding", jp: "未払い" },
  "complete": { th: "เสร็จ", en: "Complete", jp: "完了" },
  "all_outstanding": { th: "ค้างชำระทั้งหมด", en: "All Outstanding", jp: "全て未払い" },
  "subtotal": { th: "ยอดรวม", en: "Subtotal", jp: "小計" },
  "discount": { th: "ส่วนลด", en: "Discount", jp: "割引" },
  "vat": { th: "VAT", en: "VAT", jp: "VAT" },
  "total": { th: "รวมทั้งสิ้น", en: "Total", jp: "合計" },
  "paid": { th: "ชำระแล้ว", en: "Paid", jp: "支払済み" },
  "outstanding_balance": { th: "ค้างชำระ", en: "Outstanding", jp: "未払い" },
  "close_button": { th: "ปิด", en: "Close", jp: "閉じる" },
  "modal_title": { th: "สร้างใบแจ้งหนี้", en: "Create Invoice", jp: "請求書を作成" },
  "invoice_no": { th: "เลขที่ใบแจ้งหนี้", en: "Invoice No.", jp: "請求書番号" },
  "project_label": { th: "โครงการ", en: "Project", jp: "プロジェクト" },
  "select_placeholder": { th: "— เลือก —", en: "— Select —", jp: "— 選択 —" },
  "invoice_name": { th: "ชื่อใบแจ้งหนี้", en: "Invoice Name", jp: "請求書名" },
  "customer_label": { th: "ลูกค้า", en: "Customer", jp: "顧客" },
  "invoice_date": { th: "วันออก", en: "Invoice Date", jp: "発行日" },
  "due_date": { th: "กำหนดชำระ", en: "Due Date", jp: "期日" },
  "vat_pct": { th: "VAT %", en: "VAT %", jp: "VAT %" },
  "items_label": { th: "รายการ", en: "Items", jp: "項目" },
  "description": { th: "รายละเอียด", en: "Description", jp: "説明" },
  "quantity": { th: "จำนวน", en: "Quantity", jp: "数量" },
  "unit_price": { th: "ราคา", en: "Unit Price", jp: "単価" },
  "add_item": { th: "เพิ่มรายการ", en: "Add Item", jp: "項目を追加" },
  "discount_label": { th: "ส่วนลด (หรือ 0)", en: "Discount (or 0)", jp: "割引（または0）" },
  "cancel_button": { th: "ยกเลิก", en: "Cancel", jp: "キャンセル" },
  "create_button": { th: "สร้าง", en: "Create", jp: "作成" },
  "creating": { th: "กำลังสร้าง...", en: "Creating...", jp: "作成中..." },
  "must_enter_name": { th: "ต้องป้อนชื่อ", en: "Must enter name", jp: "名前を入力してください" },
  "must_select_customer": { th: "ต้องเลือกลูกค้า", en: "Must select customer", jp: "顧客を選択してください" },
  "must_have_items": { th: "ต้องมีรายการอย่างน้อย 1 รายการ", en: "Must have at least 1 item", jp: "最低1つのアイテムが必要です" },
};

export default function NewInvoicesPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0, lang = 'th' }: Props) {
  const L = (key: string) => panelText[key as keyof typeof panelText]?.[lang] ?? panelText[key as keyof typeof panelText]?.th ?? key;
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ir, cr] = await Promise.all([
        fetch("/api/invoices").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/customers").then((r) => (r.ok ? r.json() : null)),
      ]);
      if (ir) setItems(ir.invoices ?? []);
      if (cr) setCustomers(cr.customers ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshKey]);

  const remove = async (id: string) => {
    if (!confirm(L('delete_confirm'))) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const updateStatus = async (inv: Invoice, status: string) => {
    await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  const recordPayment = async (inv: Invoice, amount: number) => {
    const newPaidAmount = Number(inv.paid_amount ?? 0) + amount;
    let newStatus = inv.status;
    if (newPaidAmount >= inv.total) {
      newStatus = "paid";
    } else if (newPaidAmount > 0) {
      newStatus = "partially_paid";
    }
    await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid_amount: newPaidAmount, status: newStatus }),
    });
    fetchAll();
  };

  const stats = {
    draft: items.filter((i) => i.status === "draft").length,
    sent: items.filter((i) => i.status === "sent").length,
    paid: items.filter((i) => i.status === "paid").length,
    overdue: items.filter((i) => i.status === "overdue").length,
    outstanding: items.filter((i) => ["sent", "partially_paid", "overdue"].includes(i.status)).reduce((s, i) => s + (Number(i.total ?? 0) - Number(i.paid_amount ?? 0)), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1">
          <Stat label={L('draft_label')} value={String(stats.draft)} color="#94A3B8" />
          <Stat label={L('sent_label')} value={String(stats.sent)} color="#00AEEF" />
          <Stat label={L('paid_label')} value={String(stats.paid)} color="#22C55E" />
          <Stat label={L('overdue_label')} value={String(stats.overdue)} color="#EF4444" />
          <Stat label={L('outstanding_label')} value={fmtMoney(stats.outstanding)} color="#F7941D" />
        </div>
        {canManage && (
          <button
            onClick={() => setCreating(true)}
            className="ml-3 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} /> {L('create_invoice')}
          </button>
        )}
      </div>

      {loading && !items.length && <div className="text-center text-slate-400 py-12">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center py-16 bg-[#1E293B] border border-[#334155] rounded-2xl text-slate-400">
          <FileText size={40} className="mx-auto mb-3 text-slate-600" />
          {L('no_invoices')}
        </div>
      )}

      <div className="space-y-2">
        {items.map((inv) => {
          const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && !["paid", "cancelled"].includes(inv.status);
          const statusToShow = isOverdue && inv.status === "sent" ? "overdue" : inv.status;
          const outstandingAmount = Number(inv.total ?? 0) - Number(inv.paid_amount ?? 0);

          return (
            <div key={inv.id} className={`bg-[#1E293B] border rounded-xl p-4 ${isOverdue ? "border-red-500/50" : "border-[#334155]"}`}>
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${STATUS_COLORS[statusToShow]}25` }}
                >
                  {statusToShow === "paid" ? (
                    <CheckCircle2 size={18} style={{ color: STATUS_COLORS[statusToShow] }} />
                  ) : isOverdue ? (
                    <AlertCircle size={18} className="text-red-400" />
                  ) : (
                    <FileText size={18} style={{ color: STATUS_COLORS[statusToShow] }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-mono font-medium text-white">{inv.invoice_no}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: STATUS_COLORS[statusToShow] }}>
                      {STATUS_LABELS[statusToShow]}
                    </span>
                  </div>
                  <div className="text-sm text-white font-medium mb-0.5">{inv.title}</div>
                  <div className="text-xs text-slate-400">
                    {inv.customer_name && <span>{inv.customer_name} · </span>}
                    {L('issued')} {new Date(inv.invoice_date).toLocaleDateString("th-TH")}
                    {inv.due_date && (
                      <span className={isOverdue ? " text-red-400 font-medium" : ""}>
                        · {L('due')} {new Date(inv.due_date).toLocaleDateString("th-TH")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-white">{fmtMoney(inv.total)}</div>
                  <div className="text-[10px] text-slate-500">
                    {inv.paid_amount && Number(inv.paid_amount) > 0
                      ? `${L('recorded')} ${fmtMoney(inv.paid_amount)} / ${outstandingAmount > 0 ? fmtMoney(outstandingAmount) + " " + L('outstanding') : L('complete')}`
                      : L('all_outstanding')}
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => setViewingId(inv.id)}
                      className="p-1.5 text-slate-400 hover:text-white"
                      title={L('view_details')}
                    >
                      <Eye size={14} />
                    </button>
                    {inv.status === "draft" && (
                      <button
                        onClick={() => updateStatus(inv, "sent")}
                        className="px-2 py-1.5 bg-blue-500/20 text-blue-300 rounded text-xs flex items-center gap-1"
                      >
                        <Send size={11} /> {L('send_button')}
                      </button>
                    )}
                    {["sent", "overdue", "partially_paid"].includes(inv.status) && (
                      <button
                        onClick={() => {
                          const amt = prompt(panelText["record_payment"]?.[lang] ?? panelText["record_payment"]?.th ?? "Record Payment");
                          if (amt) recordPayment(inv, Number(amt));
                        }}
                        className="px-2 py-1.5 bg-green-500/20 text-green-300 rounded text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 size={11} /> {L('record_payment')}
                      </button>
                    )}
                    <button onClick={() => remove(inv.id)} className="p-1.5 text-red-400 hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {viewingId === inv.id && (
                <InvoiceDetailView invoice={inv} onClose={() => setViewingId(null)} lang={lang} />
              )}
            </div>
          );
        })}
      </div>

      {creating && (
        <CreateInvoiceModal
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

function InvoiceDetailView({ invoice, onClose, lang = 'th' }: { invoice: Invoice; onClose: () => void; lang?: Lang }) {
  const L = (key: string) => panelText[key as keyof typeof panelText]?.[lang] ?? panelText[key as keyof typeof panelText]?.th ?? key;
  return (
    <div className="mt-3 pt-3 border-t border-[#334155] space-y-3">
      <div className="bg-[#0F172A] rounded-lg p-3 space-y-2">
        {invoice.items?.map((item, idx) => (
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
          <span>{L('subtotal')}</span>
          <span>{fmtMoney(invoice.subtotal)}</span>
        </div>
        {invoice.discount > 0 && (
          <div className="flex justify-between text-orange-300">
            <span>{L('discount')}</span>
            <span>-{fmtMoney(invoice.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-cyan-300">
          <span>{L('vat')} {invoice.vat_pct}%</span>
          <span>{fmtMoney(invoice.vat_amount)}</span>
        </div>
        <div className="flex justify-between text-white font-bold pt-2 border-t border-[#334155]">
          <span>{L('total')}</span>
          <span>{fmtMoney(invoice.total)}</span>
        </div>
        {invoice.paid_amount && Number(invoice.paid_amount) > 0 && (
          <div className="flex justify-between text-green-300 pt-1">
            <span>{L('paid')}</span>
            <span>{fmtMoney(invoice.paid_amount)}</span>
          </div>
        )}
        {invoice.paid_amount && Number(invoice.paid_amount) < Number(invoice.total) && (
          <div className="flex justify-between text-orange-300">
            <span>{L('outstanding_balance')}</span>
            <span>{fmtMoney(Number(invoice.total) - Number(invoice.paid_amount))}</span>
          </div>
        )}
      </div>
      <button onClick={onClose} className="w-full px-3 py-1.5 text-slate-300 hover:text-white text-sm">
        {L('close_button')}
      </button>
    </div>
  );
}

function CreateInvoiceModal({
  projects,
  customers,
  defaultProjectId,
  onClose,
  onSaved,
  lang = 'th',
}: {
  projects: Project[];
  customers: Customer[];
  defaultProjectId?: string;
  onClose: () => void;
  onSaved: () => void;
  lang?: Lang;
}) {
  const L = (key: string) => panelText[key as keyof typeof panelText]?.[lang] ?? panelText[key as keyof typeof panelText]?.th ?? key;
  const [form, setForm] = useState({
    invoice_no: "",
    title: "",
    project_id: defaultProjectId ?? "",
    customer_id: "",
    customer_name: "",
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
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
      setErr(L('must_enter_name'));
      return;
    }
    if (!form.customer_name) {
      setErr(L('must_select_customer'));
      return;
    }
    if (form.items.length === 0 || !form.items[0].description) {
      setErr(L('must_have_items'));
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
        paid_amount: 0,
      };
      const r = await fetch("/api/invoices", {
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
        <h3 className="text-lg font-semibold text-white">{L('modal_title')}</h3>

        <div className="grid grid-cols-2 gap-3">
          <Field label={L('invoice_no')}>
            <input
              type="text"
              className={inp}
              value={form.invoice_no}
              onChange={(e) => setForm({ ...form, invoice_no: e.target.value })}
              placeholder="INV-2026-001"
            />
          </Field>
          <Field label={L('project_label')}>
            <select
              className={inp}
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            >
              <option value="">{L('select_placeholder')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_code} — {p.name_th || p.name_en}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={L('invoice_name')}>
          <input
            type="text"
            className={inp}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="เช่น ค่าพัฒนาเว็บไซต์ มกราคม"
          />
        </Field>

        <Field label={L('customer_label')}>
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
            <option value="">{L('select_placeholder')}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_th || c.name_en}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label={L('invoice_date')}>
            <input
              type="date"
              className={inp}
              value={form.invoice_date}
              onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
            />
          </Field>
          <Field label={L('due_date')}>
            <input
              type="date"
              className={inp}
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </Field>
          <Field label={L('vat_pct')}>
            <input
              type="number"
              className={inp}
              value={form.vat_pct}
              onChange={(e) => setForm({ ...form, vat_pct: Number(e.target.value) })}
            />
          </Field>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-2">{L('items_label')}</label>
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
                  placeholder={L('description')}
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
                  placeholder={L('quantity')}
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
                  placeholder={L('unit_price')}
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
            + {L('add_item')}
          </button>
        </div>

        <Field label={L('discount_label')}>
          <input
            type="number"
            className={inp}
            value={form.discount}
            onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
            placeholder="0"
          />
        </Field>

        <div className="bg-[#0F172A] rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>{L('subtotal')}</span>
            <span>{fmtMoney(subtotal)}</span>
          </div>
          {form.discount > 0 && (
            <div className="flex justify-between text-orange-300">
              <span>{L('discount')}</span>
              <span>-{fmtMoney(form.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-cyan-300">
            <span>{L('vat')} {form.vat_pct}%</span>
            <span>{fmtMoney(vat)}</span>
          </div>
          <div className="flex justify-between text-white font-bold pt-2 border-t border-[#334155]">
            <span>{L('total')}</span>
            <span>{fmtMoney(total)}</span>
          </div>
        </div>

        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white text-sm">
            {L('cancel_button')}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50"
          >
            {busy ? L('creating') : L('create_button')}
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
