import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import * as XLSX from "xlsx";

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

  const cur = q.currency || "THB";
  const salesAmount = Number(q.subtotal) - Number(q.discount_amount || 0);
  const companyName = q.customers?.company_name || "";
  const issueDate = q.issue_date || "";

  // Build worksheet data
  const wsData: (string | number | null)[][] = [];

  // Header rows
  wsData.push(["TOMAS TECH CO., LTD."]);
  wsData.push(["QUOTATION"]);
  wsData.push([]);

  // Info
  wsData.push(["Quotation No:", q.quotation_no, "", "Date:", issueDate]);
  wsData.push(["Revision:", q.revision || 0, "", "Quotation By:", q.quotation_by || ""]);
  wsData.push([]);
  wsData.push(["To:", companyName]);
  if (q.attention) wsData.push(["Attention:", q.attention]);
  if (q.customer_address || q.customers?.address) wsData.push(["Address:", q.customer_address || q.customers?.address || ""]);
  if (q.customer_phone || q.customers?.phone) wsData.push(["Phone:", q.customer_phone || q.customers?.phone || ""]);
  if (q.customer_email || q.customers?.email) wsData.push(["Email:", q.customer_email || q.customers?.email || ""]);
  wsData.push([]);

  if (q.project_name || q.title) {
    wsData.push(["Re:", q.project_name || q.title]);
    wsData.push([]);
  }

  // Items header
  wsData.push(["No.", "Item Description", "Qty", "Unit", "Unit Price", "Ext Price"]);

  // Items
  (items ?? []).forEach((item, idx) => {
    wsData.push([
      idx + 1,
      item.description || "",
      Number(item.quantity),
      item.unit || "Set",
      Number(item.unit_price),
      Number(item.amount),
    ]);
    // Sub-items
    const subItems = (item.sub_items as string[]) || [];
    subItems.forEach(si => {
      wsData.push([null, `  • ${si}`, null, null, null, null]);
    });
    if (item.notes) {
      wsData.push([null, `  (${item.notes})`, null, null, null, null]);
    }
  });

  wsData.push([]);

  // Totals
  wsData.push([null, null, null, null, "Sub Total", Number(q.subtotal)]);
  if (Number(q.discount_amount) > 0) {
    wsData.push([null, null, null, null, "Discount", -Number(q.discount_amount)]);
  }
  wsData.push([null, null, null, null, "Sales Amount", salesAmount]);
  wsData.push([null, null, null, null, `VAT ${q.vat_percent || 7}%`, Number(q.vat_amount)]);
  wsData.push([null, null, null, null, `Grand Total (${cur})`, Number(q.total)]);

  wsData.push([]);

  // Footer
  if (q.notes) wsData.push(["Notes:", q.notes]);
  if (q.remark) wsData.push(["Remark:", q.remark]);
  if (q.currency) wsData.push(["Currency:", q.currency]);
  if (q.lead_time) wsData.push(["Lead Time:", q.lead_time]);
  if (q.payment_terms) wsData.push(["Payment:", q.payment_terms]);
  if (q.expire_days) wsData.push(["Expire:", `${q.expire_days} days`]);

  // Create workbook
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [
    { wch: 6 },   // No.
    { wch: 45 },  // Description
    { wch: 8 },   // Qty
    { wch: 8 },   // Unit
    { wch: 15 },  // Unit Price
    { wch: 15 },  // Ext Price
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Quotation");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${q.quotation_no}.xlsx"`,
    },
  });
}
