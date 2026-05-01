import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

async function nextInvoiceNo() {
  const year = new Date().getFullYear();
  const { data } = await supabaseAdmin.from("invoices")
    .select("invoice_no").like("invoice_no", `INV${year}%`).order("invoice_no", { ascending: false }).limit(1);
  const last = data?.[0]?.invoice_no;
  const seq = last ? parseInt(last.slice(-4)) + 1 : 1;
  return `INV${year}-${String(seq).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status");
  const customerId = req.nextUrl.searchParams.get("customer_id");
  let q = supabaseAdmin.from("invoices")
    .select("*, customers(id, company_name)")
    .order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  if (customerId) q = q.eq("customer_id", customerId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
  const invoice_no = await nextInvoiceNo();
  const items = body.items || [];
  delete body.items;
  const subtotal = items.reduce((s: number, i: { amount?: number }) => s + (Number(i.amount) || 0), 0);
  const discountAmt = body.discount_amount || (subtotal * (body.discount_percent || 0) / 100);
  const afterDiscount = subtotal - discountAmt;
  const vatAmt = afterDiscount * ((body.vat_percent ?? 7) / 100);
  const total = afterDiscount + vatAmt;

  const { data, error } = await supabaseAdmin.from("invoices")
    .insert({ ...body, invoice_no, subtotal, discount_amount: discountAmt, vat_amount: vatAmt, total, created_by: ctx.userId })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (items.length > 0) {
    await supabaseAdmin.from("invoice_items").insert(
      items.map((it: Record<string, unknown>, i: number) => ({ ...it, invoice_id: data.id, sort_order: i }))
    );
  }

  // Phase 3.1: Auto-create a pending income transaction linked to this invoice
  const txData: Record<string, unknown> = {
    type: "income",
    category: "invoice_payment",
    amount: total,
    description: "Invoice " + invoice_no + " - " + (body.title || ""),
    status: "pending",
    date: new Date().toISOString().slice(0, 10),
    created_by: ctx.userId,
    invoice_id: data.id,
    currency: body.currency || "THB",
    exchange_rate: body.exchange_rate || 1,
  };
  if (body.customer_id) txData.customer_id = body.customer_id;
  if (body.project_id) txData.project_id = body.project_id;
  await supabaseAdmin.from("transactions").insert(txData);

  return NextResponse.json({ invoice: data }, { status: 201 });
}
