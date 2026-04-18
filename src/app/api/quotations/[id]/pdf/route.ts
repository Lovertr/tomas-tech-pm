import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: q } = await supabaseAdmin.from("quotations")
    .select("*, customers(id, company_name, company_name_en, address, tax_id, phone, email)")
    .eq("id", id).single();
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: items } = await supabaseAdmin.from("quotation_items")
    .select("*").eq("quotation_id", id).order("sort_order");

  const fmtNum = (n: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const cur = q.currency || "THB";
  const issueDate = q.issue_date ? new Date(q.issue_date).toLocaleDateString("en-GB") : "";
  const salesAmount = Number(q.subtotal) - Number(q.discount_amount || 0);

  // Build items HTML
  let itemsHtml = "";
  (items ?? []).forEach((item, idx) => {
    const subItems = (item.sub_items as string[] || []);
    const subHtml = subItems.length > 0
      ? `<div class="sub-items">${subItems.map(s => `<div class="sub-item">• ${escHtml(s)}</div>`).join("")}</div>`
      : "";
    const notesHtml = item.notes ? `<div class="item-notes">${escHtml(item.notes)}</div>` : "";
    itemsHtml += `
      <tr>
        <td class="center">${idx + 1}</td>
        <td class="desc">
          <div class="item-title">${escHtml(item.description)}</div>
          ${subHtml}${notesHtml}
        </td>
        <td class="center">${item.quantity}</td>
        <td class="center">${escHtml(item.unit || "Set")}</td>
        <td class="right">${fmtNum(Number(item.unit_price))}</td>
        <td class="right">${fmtNum(Number(item.amount))}</td>
      </tr>`;
  });

  const companyName = q.customers?.company_name || "";
  const companyAddr = q.customer_address || q.customers?.address || "";
  const attn = q.attention || "";
  const phone = q.customer_phone || q.customers?.phone || "";
  const email = q.customer_email || q.customers?.email || "";

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>Quotation ${q.quotation_no}</title>
<style>
  @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.5; background: #fff; }
  .page { max-width: 210mm; margin: 0 auto; padding: 15mm; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 3px solid #003087; padding-bottom: 12px; }
  .logo-area { display: flex; align-items: center; gap: 12px; }
  .logo-img { width: 60px; height: 60px; border-radius: 8px; object-fit: contain; background: #fff; border: 1px solid #e2e8f0; padding: 2px; }
  .company-info { font-size: 9px; color: #555; }
  .company-info .name { font-size: 14px; font-weight: bold; color: #003087; }
  .company-info .addr { font-size: 8px; color: #777; line-height: 1.4; margin-top: 2px; }
  .company-info .tax-id { font-size: 8px; color: #888; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 22px; color: #003087; margin-bottom: 2px; }
  .doc-title .doc-no { font-size: 10px; color: #666; }
  .sys-ref { font-size: 8px; color: #999; text-align: right; margin-top: 2px; }

  /* Info grid */
  .info-grid { display: flex; gap: 20px; margin-bottom: 15px; }
  .info-left, .info-right { flex: 1; }
  .info-table { width: 100%; font-size: 10px; }
  .info-table td { padding: 2px 0; vertical-align: top; }
  .info-table .label { color: #666; width: 80px; font-weight: 600; }
  .info-table .value { color: #1a1a1a; }

  /* Items table */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; }
  .items-table thead th { background: #003087; color: #fff; padding: 6px 8px; text-align: center; font-weight: 600; font-size: 9px; text-transform: uppercase; }
  .items-table thead th:nth-child(2) { text-align: left; }
  .items-table tbody td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  .items-table .center { text-align: center; }
  .items-table .right { text-align: right; }
  .items-table .desc { text-align: left; }
  .item-title { font-weight: 600; }
  .sub-items { margin-top: 3px; }
  .sub-item { color: #555; font-size: 9px; padding-left: 8px; }
  .item-notes { color: #888; font-style: italic; font-size: 9px; margin-top: 2px; }

  /* Totals */
  .totals-area { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .totals-table { width: 250px; font-size: 10px; }
  .totals-table td { padding: 3px 0; }
  .totals-table .label { color: #555; }
  .totals-table .value { text-align: right; }
  .totals-table .grand { font-size: 12px; font-weight: bold; color: #003087; border-top: 2px solid #003087; padding-top: 5px; }

  /* Footer sections */
  .footer-grid { display: flex; gap: 20px; margin-bottom: 20px; font-size: 9px; }
  .footer-left, .footer-right { flex: 1; }
  .footer-label { color: #666; font-weight: 600; margin-bottom: 2px; }
  .footer-value { color: #333; margin-bottom: 6px; }

  /* Notes / Remark */
  .notes-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 15px; font-size: 9px; }
  .notes-title { font-weight: 700; color: #003087; margin-bottom: 3px; }

  /* Signature */
  .signature-area { display: flex; justify-content: flex-end; margin-top: 40px; }
  .signature-block { text-align: center; width: 200px; }
  .sig-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; font-size: 9px; }
  .sig-company { font-weight: 600; font-size: 10px; color: #003087; margin-top: 3px; }
  .sig-date { font-size: 9px; color: #666; margin-top: 2px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 0; }
    .no-print { display: none !important; }
  }
  .print-btn { position: fixed; top: 15px; right: 15px; background: #003087; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; cursor: pointer; z-index: 999; }
  .print-btn:hover { background: #0040B0; }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="logo-area">
      <img src="/logo.png" alt="TOMAS TECH" class="logo-img" />
      <div class="company-info">
        <div class="name">TOMAS TECH CO., LTD.</div>
        <div>บจก. โทมัส เทค</div>
        <div class="addr">123/45 อาคาร ABC ชั้น 5 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400</div>
        <div class="addr">Tel: 02-XXX-XXXX | Email: info@tomastech.co.th</div>
        <div class="tax-id">Tax ID: 0105XXXXXXXXX</div>
      </div>
    </div>
    <div class="doc-title">
      <h1>QUOTATION</h1>
      <div class="doc-no">${escHtml(q.quotation_no)}</div>
      <div class="sys-ref">SYS-MN-Rev#${String(q.revision || 0).padStart(2, "0")}</div>
    </div>
  </div>

  <!-- Info grid -->
  <div class="info-grid">
    <div class="info-left">
      <table class="info-table">
        <tr><td class="label">To:</td><td class="value">${escHtml(companyName)}</td></tr>
        ${attn ? `<tr><td class="label">Attention:</td><td class="value">${escHtml(attn)}</td></tr>` : ""}
        ${companyAddr ? `<tr><td class="label">Address:</td><td class="value">${escHtml(companyAddr)}</td></tr>` : ""}
        ${phone ? `<tr><td class="label">Phone:</td><td class="value">${escHtml(phone)}</td></tr>` : ""}
        ${email ? `<tr><td class="label">Email:</td><td class="value">${escHtml(email)}</td></tr>` : ""}
        ${q.customers?.tax_id ? `<tr><td class="label">Tax ID:</td><td class="value">${escHtml(q.customers.tax_id)}</td></tr>` : ""}
      </table>
    </div>
    <div class="info-right">
      <table class="info-table">
        <tr><td class="label">Quotation No:</td><td class="value">${escHtml(q.quotation_no)}</td></tr>
        <tr><td class="label">Date:</td><td class="value">${issueDate}</td></tr>
        <tr><td class="label">Revision:</td><td class="value">${q.revision || 0}</td></tr>
        ${q.quotation_by ? `<tr><td class="label">Quotation by:</td><td class="value">${escHtml(q.quotation_by)}</td></tr>` : ""}
      </table>
    </div>
  </div>

  ${q.project_name || q.title ? `<div style="margin-bottom:12px;font-size:11px;"><strong>Re:</strong> ${escHtml(q.project_name || q.title)}</div>` : ""}

  <!-- Items table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:30px">No.</th>
        <th>Item Description</th>
        <th style="width:45px">Qty</th>
        <th style="width:45px">Unit</th>
        <th style="width:90px">Unit Price</th>
        <th style="width:90px">Ext Price</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-area">
    <table class="totals-table">
      <tr><td class="label">Sub Total</td><td class="value">${fmtNum(Number(q.subtotal))}</td></tr>
      ${Number(q.discount_amount) > 0 ? `<tr><td class="label">Discount${Number(q.discount_percent) > 0 ? ` (${q.discount_percent}%)` : ""}</td><td class="value">-${fmtNum(Number(q.discount_amount))}</td></tr>` : ""}
      <tr><td class="label">Sales Amount</td><td class="value">${fmtNum(salesAmount)}</td></tr>
      <tr><td class="label">VAT ${q.vat_percent || 7}%</td><td class="value">${fmtNum(Number(q.vat_amount))}</td></tr>
      <tr class="grand"><td class="label">Grand Total (${cur})</td><td class="value">${fmtNum(Number(q.total))}</td></tr>
    </table>
  </div>

  <!-- Notes & Remark -->
  ${q.notes || q.remark ? `
  <div class="notes-section">
    ${q.notes ? `<div><span class="notes-title">Notes:</span> ${escHtml(q.notes)}</div>` : ""}
    ${q.remark ? `<div style="margin-top:4px"><span class="notes-title">Remark:</span> ${escHtml(q.remark)}</div>` : ""}
  </div>` : ""}

  <!-- Footer -->
  <div class="footer-grid">
    <div class="footer-left">
      <div class="footer-label">Currency</div><div class="footer-value">${cur}</div>
      ${q.lead_time ? `<div class="footer-label">Lead time</div><div class="footer-value">${escHtml(q.lead_time)}</div>` : ""}
    </div>
    <div class="footer-right">
      ${q.payment_terms ? `<div class="footer-label">Payment</div><div class="footer-value">${escHtml(q.payment_terms)}</div>` : ""}
      <div class="footer-label">Tax</div><div class="footer-value">VAT ${q.vat_percent || 7}%</div>
      ${q.expire_days ? `<div class="footer-label">Expire Date</div><div class="footer-value">${q.expire_days} days after quotation date</div>` : ""}
    </div>
  </div>

  <!-- Signature -->
  <div class="signature-area">
    <div class="signature-block">
      <div style="font-size:9px;color:#666;">Yours Sincerely,</div>
      <div class="sig-line">Authorized Signature</div>
      <div class="sig-company">TOMAS TECH CO., LTD.</div>
      <div class="sig-date">Date: _______________</div>
    </div>
  </div>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
