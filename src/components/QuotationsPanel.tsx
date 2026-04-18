"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, FileText, Send, CheckCircle2, XCircle, X, Eye, Download, FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react";
import type { Lang } from "@/lib/i18n";

/* ────── Types ────── */
interface QuotationItemForm {
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  sub_items: string[];
  notes: string;
}

interface QuotationItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  sub_items?: string[];
  notes?: string;
  sort_order?: number;
}

interface Quotation {
  id: string;
  quotation_no: string;
  title: string;
  customer_id?: string | null;
  customers?: { id: string; company_name: string; address?: string; phone?: string; email?: string; tax_id?: string } | null;
  creator?: { id: string; display_name: string } | null;
  approver?: { id: string; display_name: string } | null;
  total: number;
  vat_percent: number;
  vat_amount: number;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  status: string;
  issue_date: string;
  valid_until?: string | null;
  currency: string;
  attention?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  project_name?: string | null;
  lead_time?: string | null;
  payment_terms?: string | null;
  expire_days?: number | null;
  remark?: string | null;
  quotation_by?: string | null;
  revision?: number | null;
  customer_address?: string | null;
  notes?: string | null;
  terms?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
}

interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }
interface Member { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null; }
interface Customer { id: string; company_name?: string; company_name_en?: string; address?: string; phone?: string; email?: string; tax_id?: string; }

/* ────── Constants ────── */
const STATUS_COLORS: Record<string, string> = {
  draft: "#94A3B8", sent: "#00AEEF", approved: "#22C55E", rejected: "#EF4444", expired: "#F7941D",
};

const fmtMoney = (n?: number | null, currency = "THB") => {
  const c = currency === "JPY" ? "JPY" : currency === "USD" ? "USD" : "THB";
  return new Intl.NumberFormat(c === "THB" ? "th-TH" : "en-US", {
    style: "currency", currency: c, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(n ?? 0));
};

const fmtNum = (n: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const panelText = {
  draft: { th: "ร่าง", en: "Draft", jp: "下書き" },
  sent: { th: "ส่งแล้ว", en: "Sent", jp: "送信済み" },
  approved: { th: "อนุมัติ", en: "Approved", jp: "承認済み" },
  rejected: { th: "ปฏิเสธ", en: "Rejected", jp: "却下" },
  expired: { th: "หมดอายุ", en: "Expired", jp: "期限切れ" },
  totalValue: { th: "มูลค่ารวม", en: "Total Value", jp: "合計金額" },
  createQuotation: { th: "สร้างใบเสนอราคา", en: "Create Quotation", jp: "見積書を作成" },
  noQuotations: { th: "ยังไม่มีใบเสนอราคา", en: "No quotations yet", jp: "見積書がまだありません" },
  deleteConfirm: { th: "ลบใบเสนอราคานี้?", en: "Delete this quotation?", jp: "この見積書を削除しますか？" },
  send: { th: "ส่ง", en: "Send", jp: "送信" },
  approve: { th: "อนุมัติ", en: "Approve", jp: "承認" },
  reject: { th: "ปฏิเสธ", en: "Reject", jp: "却下" },
  close: { th: "ปิด", en: "Close", jp: "閉じる" },
  subtotal: { th: "ยอดรวม", en: "Subtotal", jp: "小計" },
  discount: { th: "ส่วนลด", en: "Discount", jp: "割引" },
  vat: { th: "VAT", en: "VAT", jp: "VAT" },
  totalAmount: { th: "รวมทั้งสิ้น", en: "Grand Total", jp: "合計" },
  salesAmount: { th: "Sales Amount", en: "Sales Amount", jp: "Sales Amount" },
  createTitle: { th: "สร้างใบเสนอราคา - TOMAS TECH", en: "Create Quotation - TOMAS TECH", jp: "見積書作成 - TOMAS TECH" },
  to: { th: "ถึง (บริษัท)", en: "To (Company)", jp: "宛先（会社）" },
  attention: { th: "Attention", en: "Attention", jp: "ご担当者" },
  phone: { th: "โทรศัพท์", en: "Phone", jp: "電話" },
  email: { th: "อีเมล", en: "Email", jp: "メール" },
  quotationNo: { th: "Quotation No.", en: "Quotation No.", jp: "見積番号" },
  date: { th: "วันที่", en: "Date", jp: "日付" },
  revision: { th: "Revision", en: "Revision", jp: "リビジョン" },
  quotationBy: { th: "Quotation By", en: "Quotation By", jp: "担当者" },
  projectName: { th: "ชื่อโครงการ", en: "Project Name", jp: "プロジェクト名" },
  items: { th: "รายการ", en: "Items", jp: "項目" },
  no: { th: "No.", en: "No.", jp: "No." },
  description: { th: "Item Description", en: "Item Description", jp: "項目説明" },
  quantity: { th: "Qty", en: "Qty", jp: "数量" },
  unit: { th: "Unit", en: "Unit", jp: "単位" },
  unitPrice: { th: "Unit Price", en: "Unit Price", jp: "単価" },
  extPrice: { th: "Ext Price", en: "Ext Price", jp: "合計" },
  subItems: { th: "รายละเอียดย่อย", en: "Sub-items", jp: "詳細項目" },
  addSubItem: { th: "+ เพิ่มรายละเอียด", en: "+ Add detail", jp: "+ 詳細追加" },
  addItem: { th: "+ เพิ่มรายการ", en: "+ Add item", jp: "+ 項目を追加" },
  notes: { th: "Notes", en: "Notes", jp: "備考" },
  remark: { th: "Remark (Payment Terms)", en: "Remark (Payment Terms)", jp: "備考（支払条件）" },
  currency: { th: "สกุลเงิน", en: "Currency", jp: "通貨" },
  leadTime: { th: "Lead Time", en: "Lead Time", jp: "納期" },
  paymentTerms: { th: "Payment Terms", en: "Payment Terms", jp: "支払条件" },
  expireDays: { th: "หมดอายุ (วัน)", en: "Expire (days)", jp: "有効期限（日）" },
  discountPct: { th: "ส่วนลด (%)", en: "Discount (%)", jp: "割引（%）" },
  discountAmt: { th: "ส่วนลด (จำนวนเงิน)", en: "Discount (Amount)", jp: "割引（金額）" },
  discountType: { th: "ประเภทส่วนลด", en: "Discount Type", jp: "割引タイプ" },
  percent: { th: "%", en: "%", jp: "%" },
  fixedAmount: { th: "จำนวนเงิน", en: "Amount", jp: "金額" },
  vatPct: { th: "VAT %", en: "VAT %", jp: "VAT %" },
  cancel: { th: "ยกเลิก", en: "Cancel", jp: "キャンセル" },
  create: { th: "สร้างใบเสนอราคา", en: "Create Quotation", jp: "見積書作成" },
  creating: { th: "กำลังสร้าง...", en: "Creating...", jp: "作成中..." },
  required: { th: "กรุณากรอกข้อมูลที่จำเป็น", en: "Please fill required fields", jp: "必須項目を入力してください" },
  downloadPdf: { th: "ดาวน์โหลด PDF", en: "Download PDF", jp: "PDFダウンロード" },
  downloadExcel: { th: "ดาวน์โหลด Excel", en: "Download Excel", jp: "Excelダウンロード" },
  customer: { th: "ลูกค้า", en: "Customer", jp: "顧客" },
  selectCustomer: { th: "— เลือกลูกค้า —", en: "— Select customer —", jp: "— 顧客を選択 —" },
  rejectReason: { th: "เหตุผลที่ปฏิเสธ", en: "Rejection reason", jp: "却下理由" },
  approvedByLabel: { th: "อนุมัติโดย", en: "Approved by", jp: "承認者" },
  rejectedByLabel: { th: "ปฏิเสธโดย", en: "Rejected by", jp: "却下者" },
  address: { th: "ที่อยู่", en: "Address", jp: "住所" },
} as const;

type PanelKey = keyof typeof panelText;

/* ────── Props ────── */
interface Props {
  projects: Project[];
  members: Member[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
  lang?: Lang;
  userRole?: string;
}

/* ════════════════════════ MAIN PANEL ════════════════════════ */
export default function QuotationsPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0, lang = "th", userRole = "member" }: Props) {
  const L = (k: string) => (panelText[k as PanelKey] as Record<string, string>)?.[lang] ?? (panelText[k as PanelKey] as Record<string, string>)?.th ?? k;
  const [items, setItems] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const canApprove = ["admin", "manager", "leader"].includes(userRole);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [qr, cr] = await Promise.all([
        fetch("/api/quotations").then(r => r.ok ? r.json() : null),
        fetch("/api/customers").then(r => r.ok ? r.json() : null),
      ]);
      if (qr) setItems(qr.quotations ?? []);
      if (cr) setCustomers(cr.customers ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const remove = async (id: string) => {
    if (!confirm(L("deleteConfirm"))) return;
    await fetch(`/api/quotations/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const updateStatus = async (id: string, status: string, extra?: Record<string, string>) => {
    await fetch(`/api/quotations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    fetchAll();
  };

  const stats = {
    draft: items.filter(q => q.status === "draft").length,
    sent: items.filter(q => q.status === "sent").length,
    approved: items.filter(q => q.status === "approved").length,
    total: items.reduce((s, q) => s + Number(q.total), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <Stat label={L("draft")} value={String(stats.draft)} color="#94A3B8" />
          <Stat label={L("sent")} value={String(stats.sent)} color="#00AEEF" />
          <Stat label={L("approved")} value={String(stats.approved)} color="#22C55E" />
          <Stat label={L("totalValue")} value={fmtMoney(stats.total)} color="#003087" />
        </div>
        {canManage && (
          <button onClick={() => setCreating(true)}
            className="ml-3 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2">
            <Plus size={16} /> {L("createQuotation")}
          </button>
        )}
      </div>

      {loading && !items.length && <div className="text-center text-slate-500 py-12">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center py-16 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl text-slate-500">
          <FileText size={40} className="mx-auto mb-3 text-slate-400" />{L("noQuotations")}
        </div>
      )}

      {/* Quotation list */}
      <div className="space-y-2">
        {items.map(quo => (
          <QuotationCard key={quo.id} quo={quo} lang={lang} L={L}
            canManage={canManage} canApprove={canApprove}
            isExpanded={viewingId === quo.id}
            onToggle={() => setViewingId(viewingId === quo.id ? null : quo.id)}
            onRemove={() => remove(quo.id)}
            onUpdateStatus={(st, extra) => updateStatus(quo.id, st, extra)}
          />
        ))}
      </div>

      {creating && (
        <CreateQuotationModal customers={customers} lang={lang}
          onClose={() => setCreating(false)} onSaved={() => { setCreating(false); fetchAll(); }} />
      )}
    </div>
  );
}

/* ────── Stat Card ────── */
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-3">
      <div className="text-base font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

/* ────── Quotation Card ────── */
function QuotationCard({ quo, lang, L, canManage, canApprove, isExpanded, onToggle, onRemove, onUpdateStatus }: {
  quo: Quotation; lang: Lang; L: (k: string) => string;
  canManage: boolean; canApprove: boolean; isExpanded: boolean;
  onToggle: () => void; onRemove: () => void;
  onUpdateStatus: (status: string, extra?: Record<string, string>) => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [detail, setDetail] = useState<{ quotation: Quotation; items: QuotationItem[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadDetail = async () => {
    if (detail) { onToggle(); return; }
    setLoadingDetail(true);
    try {
      const r = await fetch(`/api/quotations/${quo.id}`);
      if (r.ok) { const d = await r.json(); setDetail(d); }
    } finally { setLoadingDetail(false); }
    onToggle();
  };

  const statusLabel = (panelText[quo.status as PanelKey] as Record<string, string>)?.[lang] ?? quo.status;

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${STATUS_COLORS[quo.status] || "#94A3B8"}25` }}>
          <FileText size={18} style={{ color: STATUS_COLORS[quo.status] || "#94A3B8" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-mono font-medium text-slate-900">{quo.quotation_no}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: STATUS_COLORS[quo.status] || "#94A3B8" }}>
              {statusLabel}
            </span>
            {quo.revision && quo.revision > 0 ? <span className="text-[10px] text-slate-500">Rev.{quo.revision}</span> : null}
          </div>
          <div className="text-sm text-slate-900 font-medium mb-0.5">{quo.title}</div>
          <div className="text-xs text-slate-500">
            {quo.customers?.company_name && <span>{quo.customers.company_name} · </span>}
            {new Date(quo.issue_date).toLocaleDateString("th-TH")}
            {quo.quotation_by && <span> · โดย {quo.quotation_by}</span>}
          </div>
          {quo.status === "approved" && quo.approver && (
            <div className="text-[10px] text-green-600 mt-0.5">{L("approvedByLabel")}: {quo.approver.display_name}</div>
          )}
          {quo.status === "rejected" && quo.rejection_reason && (
            <div className="text-[10px] text-red-600 mt-0.5">{L("rejectedByLabel")}: {quo.rejection_reason}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-base font-bold text-slate-900">{fmtMoney(quo.total, quo.currency)}</div>
          <div className="text-[10px] text-slate-500">{quo.currency} · VAT {quo.vat_percent}%</div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button onClick={loadDetail} className="p-1.5 text-slate-500 hover:text-slate-900" title={L("close")}>
            {loadingDetail ? <span className="animate-spin text-xs">⏳</span> : isExpanded ? <ChevronUp size={14} /> : <Eye size={14} />}
          </button>
          {canManage && quo.status === "draft" && (
            <button onClick={() => onUpdateStatus("sent")} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs flex items-center gap-1">
              <Send size={11} /> {L("send")}
            </button>
          )}
          {canApprove && (quo.status === "sent" || quo.status === "draft") && (
            <>
              <button onClick={() => onUpdateStatus("approved")} className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs flex items-center gap-1">
                <CheckCircle2 size={11} /> {L("approve")}
              </button>
              <button onClick={() => setShowReject(!showReject)} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs flex items-center gap-1">
                <XCircle size={11} /> {L("reject")}
              </button>
            </>
          )}
          {canManage && quo.status === "draft" && (
            <button onClick={onRemove} className="p-1.5 text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
          )}
        </div>
      </div>

      {/* Reject reason input */}
      {showReject && (
        <div className="mt-3 flex items-center gap-2">
          <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder={L("rejectReason")} className="flex-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-slate-900" />
          <button onClick={() => { onUpdateStatus("rejected", { rejection_reason: rejectReason }); setShowReject(false); }}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs">{L("reject")}</button>
        </div>
      )}

      {/* Expanded detail */}
      {isExpanded && detail && (
        <QuotationDetailView data={detail} lang={lang} L={L} quo={quo} />
      )}
    </div>
  );
}

/* ────── Detail View ────── */
function QuotationDetailView({ data, lang, L, quo }: { data: { quotation: Quotation; items: QuotationItem[] }; lang: Lang; L: (k: string) => string; quo: Quotation }) {
  const q = data.quotation;
  const items = data.items;
  const cur = q.currency || "THB";

  return (
    <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-4">
      {/* Header info */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          {q.customers?.company_name && <div><span className="text-slate-500">To:</span> <span className="text-slate-900 font-medium">{q.customers.company_name}</span></div>}
          {q.attention && <div><span className="text-slate-500">Attention:</span> <span className="text-slate-900">{q.attention}</span></div>}
          {(q.customer_address || q.customers?.address) && <div><span className="text-slate-500">{L("address")}:</span> <span className="text-slate-900">{q.customer_address || q.customers?.address}</span></div>}
          {(q.customer_phone || q.customers?.phone) && <div><span className="text-slate-500">{L("phone")}:</span> <span className="text-slate-900">{q.customer_phone || q.customers?.phone}</span></div>}
          {(q.customer_email || q.customers?.email) && <div><span className="text-slate-500">{L("email")}:</span> <span className="text-slate-900">{q.customer_email || q.customers?.email}</span></div>}
        </div>
        <div className="space-y-1 text-right">
          <div><span className="text-slate-500">Quotation No:</span> <span className="text-slate-900 font-medium">{q.quotation_no}</span></div>
          <div><span className="text-slate-500">Date:</span> <span className="text-slate-900">{new Date(q.issue_date).toLocaleDateString("th-TH")}</span></div>
          {q.revision != null && q.revision > 0 && <div><span className="text-slate-500">Revision:</span> <span className="text-slate-900">{q.revision}</span></div>}
          {q.quotation_by && <div><span className="text-slate-500">By:</span> <span className="text-slate-900">{q.quotation_by}</span></div>}
          {q.project_name && <div><span className="text-slate-500">Project:</span> <span className="text-slate-900">{q.project_name}</span></div>}
        </div>
      </div>

      {/* Items table */}
      <div className="bg-[#F8FAFC] rounded-lg overflow-hidden border border-[#E2E8F0]">
        <table className="w-full text-xs">
          <thead className="bg-[#003087] text-white">
            <tr>
              <th className="px-3 py-2 text-center w-8">No.</th>
              <th className="px-3 py-2 text-left">Item Description</th>
              <th className="px-3 py-2 text-center w-14">Qty</th>
              <th className="px-3 py-2 text-center w-14">Unit</th>
              <th className="px-3 py-2 text-right w-24">Unit Price</th>
              <th className="px-3 py-2 text-right w-24">Ext Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="border-t border-[#E2E8F0]">
                <td className="px-3 py-2 text-center text-slate-600">{idx + 1}</td>
                <td className="px-3 py-2">
                  <div className="text-slate-900 font-medium">{item.description}</div>
                  {item.sub_items && (item.sub_items as string[]).length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {(item.sub_items as string[]).map((si, j) => (
                        <li key={j} className="text-slate-600 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-slate-400">{si}</li>
                      ))}
                    </ul>
                  )}
                  {item.notes && <div className="text-slate-500 italic mt-1">{item.notes}</div>}
                </td>
                <td className="px-3 py-2 text-center text-slate-700">{item.quantity}</td>
                <td className="px-3 py-2 text-center text-slate-700">{item.unit}</td>
                <td className="px-3 py-2 text-right text-slate-700">{fmtNum(Number(item.unit_price))}</td>
                <td className="px-3 py-2 text-right text-slate-900 font-medium">{fmtNum(Number(item.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between text-slate-600"><span>Sub Total</span><span>{fmtNum(Number(q.subtotal))}</span></div>
          {Number(q.discount_amount) > 0 && (
            <div className="flex justify-between text-orange-600"><span>{L("discount")}</span><span>-{fmtNum(Number(q.discount_amount))}</span></div>
          )}
          <div className="flex justify-between text-slate-600"><span>{L("salesAmount")}</span><span>{fmtNum(Number(q.subtotal) - Number(q.discount_amount))}</span></div>
          <div className="flex justify-between text-slate-600"><span>VAT {q.vat_percent}%</span><span>{fmtNum(Number(q.vat_amount))}</span></div>
                    <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-[#E2E8F0]">
            <span>Grand Total ({cur})</span><span>{fmtNum(Number(q.total))}</span>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
        <div className="space-y-0.5">
          {q.notes && <div><span className="font-medium">Notes:</span> {q.notes}</div>}
          {q.remark && <div><span className="font-medium">Remark:</span> {q.remark}</div>}
        </div>
        <div className="space-y-0.5 text-right">
          {q.currency && <div>Currency: {q.currency}</div>}
          {q.lead_time && <div>Lead time: {q.lead_time}</div>}
          {q.payment_terms && <div>Payment: {q.payment_terms}</div>}
          {q.expire_days && <div>Expire: {q.expire_days} days</div>}
        </div>
      </div>

      {/* Download buttons */}
      <div className="flex gap-2 pt-2">
        <a href={"/api/quotations/" + quo.id + "/pdf"} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium">
          <Download size={12} /> {L("downloadPdf")}
        </a>
        <a href={"/api/quotations/" + quo.id + "/excel"} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-medium">
          <FileSpreadsheet size={12} /> {L("downloadExcel")}
        </a>
      </div>
    </div>
  );
}

/* CREATE MODAL */
function CreateQuotationModal({ customers, lang = "th", onClose, onSaved }: {
  customers: Customer[]; lang?: Lang; onClose: () => void; onSaved: () => void;
}) {
  const L = (k: string) => (panelText[k as PanelKey] as Record<string, string>)?.[lang] ?? (panelText[k as PanelKey] as Record<string, string>)?.th ?? k;

  const [form, setForm] = useState({
    title: "", customer_id: "", attention: "", customer_phone: "", customer_email: "",
    customer_address: "", project_name: "",
    issue_date: new Date().toISOString().slice(0, 10),
    revision: 0, quotation_by: "", currency: "THB", lead_time: "",
    payment_terms: "50% Advance, 40% upon delivery, 10% upon completion",
    expire_days: 30, discount_percent: 0, discount_fixed: 0, discount_type: "percent" as "percent" | "fixed", vat_percent: 7, notes: "", remark: "",
  });

  const [formItems, setFormItems] = useState<QuotationItemForm[]>([
    { description: "", qty: 1, unit: "Set", unit_price: 0, sub_items: [], notes: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onCustomerChange = (cid: string) => {
    const c = customers.find(x => x.id === cid);
    setForm(f => ({ ...f, customer_id: cid, customer_address: c?.address || "", customer_phone: c?.phone || "", customer_email: c?.email || "" }));
  };

  const subtotal = formItems.reduce((s, it) => s + it.qty * it.unit_price, 0);
  const discountAmt = form.discount_type === "percent" ? subtotal * form.discount_percent / 100 : form.discount_fixed;
  const afterDiscount = subtotal - discountAmt;
  const vat = afterDiscount * form.vat_percent / 100;
  const total = afterDiscount + vat;

  const addItem = () => setFormItems([...formItems, { description: "", qty: 1, unit: "Set", unit_price: 0, sub_items: [], notes: "" }]);
  const removeItem = (idx: number) => setFormItems(formItems.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof QuotationItemForm, value: string | number | string[]) => {
    const ni = [...formItems];
    const item = { ...ni[idx] };
    if (field === "description" || field === "unit" || field === "notes") item[field] = value as string;
    else if (field === "qty" || field === "unit_price") item[field] = value as number;
    else if (field === "sub_items") item[field] = value as string[];
    ni[idx] = item;
    setFormItems(ni);
  };
  const addSubItem = (idx: number) => {
    const ni = [...formItems]; ni[idx].sub_items = [...ni[idx].sub_items, ""]; setFormItems(ni);
  };
  const updateSubItem = (ii: number, si: number, v: string) => {
    const ni = [...formItems]; ni[ii].sub_items[si] = v; setFormItems(ni);
  };
  const removeSubItem = (ii: number, si: number) => {
    const ni = [...formItems]; ni[ii].sub_items = ni[ii].sub_items.filter((_, i) => i !== si); setFormItems(ni);
  };

  const submit = async () => {
    if (!form.title.trim() || !form.customer_id || !formItems.length || !formItems[0].description.trim()) {
      setErr(L("required")); return;
    }
    setBusy(true); setErr(null);
    try {
      const payload = {
        ...form, discount_amount: discountAmt, discount_percent: form.discount_type === "percent" ? form.discount_percent : 0, subtotal, vat_amount: vat, total,
        items: formItems.map(it => ({
          description: it.description, qty: it.qty, unit: it.unit, unit_price: it.unit_price,
          amount: it.qty * it.unit_price, sub_items: it.sub_items.filter(s => s.trim()), notes: it.notes,
        })),
      };
      const r = await fetch("/api/quotations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  const inp = "w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-[#003087] focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] w-full max-w-3xl p-6 space-y-5 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#003087] flex items-center justify-center"><FileText size={16} className="text-white" /></div>
            {L("createTitle")}
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        {/* Company Header */}
        <div className="bg-gradient-to-r from-[#003087] to-[#0050C8] rounded-xl p-4 flex items-center gap-4">
          <img src="/logo.png" alt="TOMAS TECH" className="h-14 w-14 rounded-lg bg-white p-1 object-contain flex-shrink-0" />
          <div className="text-white">
            <div className="font-bold text-sm">TOMAS TECH CO., LTD.</div>
            <div className="text-[10px] text-blue-200 leading-relaxed">
              บจก. โทมัส เทค | 123/45 อาคาร ABC ชั้น 5 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400<br/>
              Tel: 02-XXX-XXXX | Email: info@tomastech.co.th | Tax ID: 0105XXXXXXXXX
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3 border border-[#E2E8F0]">
          <div className="text-xs font-semibold text-[#003087] uppercase tracking-wide">Customer Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label={L("to") + " *"}>
              <select className={inp} value={form.customer_id} onChange={e => onCustomerChange(e.target.value)}>
                <option value="">{L("selectCustomer")}</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.company_name || c.company_name_en}</option>)}
              </select>
            </Field>
            <Field label={L("attention")}><input type="text" className={inp} value={form.attention} onChange={e => setForm({ ...form, attention: e.target.value })} placeholder="Contact person" /></Field>
            <Field label={L("address")}><input type="text" className={inp} value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={L("phone")}><input type="text" className={inp} value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} /></Field>
              <Field label={L("email")}><input type="text" className={inp} value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} /></Field>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3 border border-[#E2E8F0]">
          <div className="text-xs font-semibold text-[#003087] uppercase tracking-wide">Quotation Details</div>
          <Field label={L("projectName") + " / " + L("description") + " *"}>
            <input type="text" className={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. MES System" />
          </Field>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label={L("date")}><input type="date" className={inp} value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} /></Field>
            <Field label={L("revision")}><input type="number" className={inp} value={form.revision} onChange={e => setForm({ ...form, revision: Number(e.target.value) })} min={0} /></Field>
            <Field label={L("quotationBy")}><input type="text" className={inp} value={form.quotation_by} onChange={e => setForm({ ...form, quotation_by: e.target.value })} /></Field>
            <Field label={L("currency")}><select className={inp} value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}><option value="THB">THB</option><option value="USD">USD</option><option value="JPY">JPY</option></select></Field>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[#003087] uppercase tracking-wide">{L("items")} *</div>
          {formItems.map((item, idx) => (
            <div key={idx} className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#003087]">Item {idx + 1}</span>
                {formItems.length > 1 && <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700"><X size={14} /></button>}
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 md:col-span-5"><input type="text" className={inp} value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} placeholder="Item Description" /></div>
                <div className="col-span-3 md:col-span-2"><input type="number" className={inp} value={item.qty} onChange={e => updateItem(idx, "qty", Number(e.target.value))} min={1} /></div>
                <div className="col-span-3 md:col-span-2"><input type="text" className={inp} value={item.unit} onChange={e => updateItem(idx, "unit", e.target.value)} placeholder="Unit" /></div>
                <div className="col-span-4 md:col-span-3"><input type="number" className={inp} value={item.unit_price} onChange={e => updateItem(idx, "unit_price", Number(e.target.value))} min={0} /></div>
              </div>
              <div className="text-right text-sm font-medium text-[#003087]">= {fmtNum(item.qty * item.unit_price)} {form.currency}</div>
              {item.sub_items.map((si, j) => (
                <div key={j} className="flex items-center gap-2 pl-4">
                  <span className="text-slate-400 text-xs">*</span>
                  <input type="text" className={inp + " flex-1 text-xs"} value={si} onChange={e => updateSubItem(idx, j, e.target.value)} placeholder="Sub item" />
                  <button onClick={() => removeSubItem(idx, j)} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                </div>
              ))}
              <button onClick={() => addSubItem(idx)} className="text-[10px] text-blue-600 hover:text-blue-800 pl-4">{L("addSubItem")}</button>
              <input type="text" className={inp + " text-xs"} value={item.notes} onChange={e => updateItem(idx, "notes", e.target.value)} placeholder="Notes (optional)" />
            </div>
          ))}
          <button onClick={addItem} className="text-xs text-[#003087] hover:text-blue-700 font-medium">{L("addItem")}</button>
        </div>

        {/* Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label={L("notes")}><textarea className={inp + " h-16"} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="General notes" /></Field>
          <Field label={L("remark")}><textarea className={inp + " h-16"} value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} placeholder="e.g. 50% Advance..." /></Field>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label={L("leadTime")}><input type="text" className={inp} value={form.lead_time} onChange={e => setForm({ ...form, lead_time: e.target.value })} placeholder="e.g. 3 months" /></Field>
          <Field label={L("paymentTerms")}><input type="text" className={inp} value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} /></Field>
          <Field label={L("discount")}>
            <div className="flex gap-1.5">
              <select className={inp + " !w-24 flex-shrink-0"} value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value as "percent" | "fixed", discount_percent: 0, discount_fixed: 0 })}>
                <option value="percent">{L("percent")}</option>
                <option value="fixed">{L("fixedAmount")}</option>
              </select>
              {form.discount_type === "percent" ? (
                <input type="number" className={inp} value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} min={0} max={100} placeholder="0" />
              ) : (
                <input type="number" className={inp} value={form.discount_fixed} onChange={e => setForm({ ...form, discount_fixed: Number(e.target.value) })} min={0} placeholder="0.00" />
              )}
            </div>
          </Field>
          <Field label={L("vatPct")}><input type="number" className={inp} value={form.vat_percent} onChange={e => setForm({ ...form, vat_percent: Number(e.target.value) })} min={0} /></Field>
        </div>

        {/* Summary */}
        <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
          <div className="flex justify-end">
            <div className="w-72 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600"><span>Sub Total</span><span>{fmtNum(subtotal)}</span></div>
              {discountAmt > 0 && <div className="flex justify-between text-orange-600"><span>{L("discount")} {form.discount_type === "percent" ? `(${form.discount_percent}%)` : ""}</span><span>-{fmtNum(discountAmt)}</span></div>}
              <div className="flex justify-between text-slate-600"><span>Sales Amount</span><span>{fmtNum(afterDiscount)}</span></div>
              <div className="flex justify-between text-slate-600"><span>VAT {form.vat_percent}%</span><span>{fmtNum(vat)}</span></div>
              <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-[#003087]">
                <span>Grand Total ({form.currency})</span><span>{fmtNum(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-900 text-sm">{L("cancel")}</button>
          <button onClick={submit} disabled={busy} className="px-6 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            <FileText size={14} /> {busy ? L("creating") : L("create")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-slate-500 mb-1 font-medium">{label}</label>
      {children}
    </div>
  );
}
