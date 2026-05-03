"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, FileText, DollarSign, Send, CheckCircle2, AlertCircle, Printer, Pencil } from "lucide-react";

interface Invoice {
  id: string; invoice_number: string; project_id: string; client_name?: string | null;
  issue_date: string; due_date?: string | null;
  subtotal: number; vat_pct: number; vat_amount: number; total: number;
  status: string; notes?: string | null; timelog_ids?: string[] | null;
  projects?: { project_code?: string | null; name_th?: string | null; name_en?: string | null } | null;
}
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; client_name?: string | null; }

const STATUS_LBL: Record<string, string> = { draft: "ร่าง", sent: "ส่งแล้ว", paid: "ชำระแล้ว", overdue: "เกินกำหนด", cancelled: "ยกเลิก" };
const STATUS_COLOR: Record<string, string> = { draft: "#94A3B8", sent: "#00AEEF", paid: "#22C55E", overdue: "#EF4444", cancelled: "#64748B" };
const STATUS_BG_COLOR: Record<string, string> = { draft: "#DBEAFE", sent: "#D1F5FF", paid: "#DCFCE7", overdue: "#FEE2E2", cancelled: "#E2E8F0" };

const fmtMoney = (n?: number | null) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(Number(n ?? 0));

interface Props { projects: Project[]; filterProjectId?: string; canManage?: boolean; refreshKey?: number; }

export default function InvoicesPanel({ projects, filterProjectId = "all", canManage = true, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterProjectId && filterProjectId !== "all" ? `/api/invoices?project_id=${filterProjectId}` : `/api/invoices`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setItems(d.invoices ?? []); }
    } finally { setLoading(false); }
  }, [filterProjectId]);
  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const remove = async (id: string) => {
    if (!confirm("ลบใบแจ้งหนี้นี้?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    fetchAll();
  };
  const updateStatus = async (inv: Invoice, status: string) => {
    await fetch(`/api/invoices/${inv.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };
  const printInvoice = (inv: Invoice) => {
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) return;
    w.document.write(`<html><head><title>${inv.invoice_number}</title>
      <style>body{font-family:'Sarabun',sans-serif;padding:40px;color:#1a1a1a}h1{color:#003087;border-bottom:3px solid #F7941D;padding-bottom:10px}
      table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}
      th{background:#003087;color:white}.r{text-align:right}.tot{font-size:1.3em;color:#003087;font-weight:bold}</style>
      </head><body>
      <h1>ใบแจ้งหนี้ / INVOICE</h1>
      <p><strong>เลขที่:</strong> ${inv.invoice_number}<br/>
      <strong>วันที่:</strong> ${new Date(inv.issue_date).toLocaleDateString("th-TH")}<br/>
      <strong>กำหนดชำระ:</strong> ${inv.due_date ? new Date(inv.due_date).toLocaleDateString("th-TH") : "—"}<br/>
      <strong>ลูกค้า:</strong> ${inv.client_name ?? "—"}<br/>
      <strong>โครงการ:</strong> ${inv.projects?.project_code ?? ""} ${inv.projects?.name_th ?? ""}</p>
      <table><tr><th>รายการ</th><th class="r">จำนวนเงิน (THB)</th></tr>
      <tr><td>ค่าบริการตามชั่วโมงทำงาน (${inv.timelog_ids?.length ?? 0} time entries)</td><td class="r">${fmtMoney(inv.subtotal)}</td></tr>
      <tr><td>VAT ${inv.vat_pct}%</td><td class="r">${fmtMoney(inv.vat_amount)}</td></tr>
      <tr><td class="tot">รวมทั้งสิ้น</td><td class="r tot">${fmtMoney(inv.total)}</td></tr></table>
      ${inv.notes ? `<p style="margin-top:30px"><strong>หมายเหตุ:</strong><br/>${inv.notes}</p>` : ""}
      <p style="margin-top:60px;color:#94A3B8;font-size:.85em;text-align:center">TOMAS TECH CO., LTD. — ออกโดยระบบ Project Management</p>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  const filtered = items.filter(i => filter === "all" ? true : i.status === filter);

  const stats = {
    total: items.reduce((s, i) => s + Number(i.total), 0),
    paid: items.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total), 0),
    outstanding: items.filter(i => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + Number(i.total), 0),
    overdue: items.filter(i => i.status === "overdue").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <Stat label="มูลค่าใบแจ้งหนี้รวม" value={fmtMoney(stats.total)} color="#00AEEF" />
          <Stat label="ชำระแล้ว" value={fmtMoney(stats.paid)} color="#22C55E" />
          <Stat label="ค้างชำระ" value={fmtMoney(stats.outstanding)} color="#F7941D" />
          <Stat label="เกินกำหนด" value={`${stats.overdue} ใบ`} color="#EF4444" />
        </div>
        {canManage && (
          <button onClick={() => setCreating(true)} className="ml-3 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2">
            <Plus size={16} /> สร้างใบแจ้งหนี้
          </button>
        )}
      </div>

      <div className="flex rounded-xl overflow-hidden border border-[#E5E7EB] w-fit flex-wrap">
        {(["all", "draft", "sent", "paid", "overdue"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-medium ${filter === f ? "text-white" : "text-slate-600"}`}
            style={filter === f ? { background: "#003087" } : { background: "#F5F5F5" }}>
            {f === "all" ? "ทั้งหมด" : STATUS_LBL[f]}
          </button>
        ))}
      </div>

      {loading && !filtered.length && <div className="text-center text-slate-600 py-12">Loading...</div>}
      {!loading && !filtered.length && (
        <div className="text-center py-16 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl text-slate-600">
          <FileText size={40} className="mx-auto mb-3 text-slate-600" />ยังไม่มีใบแจ้งหนี้
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(inv => (
          <div key={inv.id} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: STATUS_BG_COLOR[inv.status] }}>
              {inv.status === "paid" ? <CheckCircle2 size={18} style={{ color: STATUS_COLOR[inv.status] }} /> :
                inv.status === "overdue" ? <AlertCircle size={18} style={{ color: STATUS_COLOR[inv.status] }} /> :
                <FileText size={18} style={{ color: STATUS_COLOR[inv.status] }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-mono font-medium text-slate-900">{inv.invoice_number}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">{inv.projects?.project_code || "—"}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: STATUS_COLOR[inv.status] }}>{STATUS_LBL[inv.status]}</span>
              </div>
              <div className="text-xs text-slate-600">
                {inv.client_name && <span>{inv.client_name} · </span>}
                ออก: {new Date(inv.issue_date).toLocaleDateString("th-TH")}
                {inv.due_date && <span> · กำหนด: {new Date(inv.due_date).toLocaleDateString("th-TH")}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-slate-900">{fmtMoney(inv.total)}</div>
              <div className="text-[10px] text-slate-600">VAT {inv.vat_pct}%</div>
            </div>
            {canManage && (
              <div className="flex items-center gap-1 ml-3">
                <button onClick={() => printInvoice(inv)} className="p-1.5 text-slate-600 hover:text-slate-900" title="พิมพ์"><Printer size={14} /></button>
                <button onClick={() => setEditing(inv)} className="p-1.5 text-slate-600 hover:text-slate-900" title="แก้ไข"><Pencil size={14} /></button>
                {inv.status === "draft" && (
                  <button onClick={() => updateStatus(inv, "sent")} className="px-2 py-1.5 bg-blue-100 text-blue-600 rounded text-xs flex items-center gap-1"><Send size={11} /> ส่ง</button>
                )}
                {["sent", "overdue"].includes(inv.status) && (
                  <button onClick={() => updateStatus(inv, "paid")} className="px-2 py-1.5 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1"><DollarSign size={11} /> รับชำระ</button>
                )}
                <button onClick={() => remove(inv.id)} className="p-1.5 text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {creating && (
        <CreateInvoiceModal projects={projects}
          defaultProjectId={filterProjectId !== "all" ? filterProjectId : undefined}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); fetchAll(); }} />
      )}
      {editing && (
        <EditInvoiceModal invoice={editing} projects={projects}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchAll(); }} />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-3">
      <div className="text-base font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-slate-600 mt-0.5">{label}</div>
    </div>
  );
}

function CreateInvoiceModal({ projects, defaultProjectId, onClose, onSaved }: {
  projects: Project[]; defaultProjectId?: string; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    project_id: defaultProjectId ?? "", client_name: "", invoice_number: "",
    start_date: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    vat_pct: 7, notes: "",
  });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.project_id) { setErr("ต้องเลือกโครงการ"); return; }
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/invoices", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Failed"); }
      const d = await r.json();
      alert(`สร้างใบแจ้งหนี้แล้ว: ${d.invoice.invoice_number} (${d.logs_count} time entries)`);
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  const inp = "w-full bg-[#F5F5F5] border border-[#E5E7EB] rounded-lg px-3 py-2 text-slate-900 text-sm";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900">สร้างใบแจ้งหนี้จาก Time Logs</h3>
        <Field label="โครงการ *">
          <select className={inp} value={form.project_id} onChange={e => {
            const p = projects.find(x => x.id === e.target.value);
            setForm({ ...form, project_id: e.target.value, client_name: form.client_name || (p?.client_name ?? "") });
          }}>
            <option value="">— เลือก —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ชื่อลูกค้า"><input className={inp} value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></Field>
          <Field label="เลขที่ใบแจ้งหนี้ (เว้นว่าง = อัตโนมัติ)"><input className={inp} placeholder="INV-2026-XXXX" value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ช่วงวันที่ทำงานเริ่ม"><input type="date" className={inp} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></Field>
          <Field label="ช่วงวันที่ทำงานสิ้นสุด"><input type="date" className={inp} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="วันออก"><input type="date" className={inp} value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} /></Field>
          <Field label="กำหนดชำระ"><input type="date" className={inp} value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></Field>
          <Field label="VAT %"><input type="number" className={inp} value={form.vat_pct} onChange={e => setForm({ ...form, vat_pct: Number(e.target.value) })} /></Field>
        </div>
        <Field label="หมายเหตุ"><textarea rows={2} className={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className="text-xs text-slate-600 bg-[#F5F5F5] rounded-lg p-3">ระบบจะรวบรวม time logs ที่ <strong>approved + billable</strong> ในช่วงเวลานี้มาคำนวณยอด subtotal × hourly_rate อัตโนมัติ</div>
        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:text-slate-900 text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={busy} className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50">{busy ? "กำลังสร้าง..." : "สร้าง"}</button>
        </div>
      </div>
    </div>
  );
}

function EditInvoiceModal({ invoice, projects, onClose, onSaved }: {
  invoice: Invoice; projects: Project[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    project_id: invoice.project_id,
    client_name: invoice.client_name ?? "",
    invoice_number: invoice.invoice_number,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date ?? "",
    vat_pct: invoice.vat_pct,
    notes: invoice.notes ?? "",
    status: invoice.status,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const inp = "w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]";

  const submit = async () => {
    if (!form.project_id) { setErr("กรุณาเลือกโปรเจค"); return; }
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      onSaved();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Error"); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800">แก้ไข Invoice</h3>
        <Field label="โปรเจค">
          <select className={inp} value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
            <option value="">-- เลือกโปรเจค --</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ชื่อลูกค้า"><input className={inp} value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></Field>
          <Field label="เลขที่ใบแจ้งหนี้"><input className={inp} value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="วันออก"><input type="date" className={inp} value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} /></Field>
          <Field label="กำหนดชำระ"><input type="date" className={inp} value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="VAT %"><input type="number" className={inp} value={form.vat_pct} onChange={e => setForm({ ...form, vat_pct: Number(e.target.value) })} /></Field>
          <Field label="สถานะ">
            <select className={inp} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="draft">ร่าง</option>
              <option value="sent">ส่งแล้ว</option>
              <option value="paid">ชำระแล้ว</option>
              <option value="overdue">เกินกำหนด</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </Field>
        </div>
        <Field label="หมายเหตุ"><textarea rows={2} className={inp} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-700 hover:text-slate-900 text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={busy} className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50">{busy ? "กำลังบันทึก..." : "บันทึก"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-slate-700 mb-1">{label}</label>{children}</div>;
}
