import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// QTA + YYMM + 3-digit sequence  e.g. QTA2604001
async function nextQuotationNo() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `QTA${yy}${mm}`;
  const { data } = await supabaseAdmin
    .from("quotations")
    .select("quotation_no")
    .like("quotation_no", `${prefix}%`)
    .order("quotation_no", { ascending: false })
    .limit(1);
  const last = data?.[0]?.quotation_no;
  const seq = last ? parseInt(last.slice(-3)) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status");
  const customerId = req.nextUrl.searchParams.get("customer_id");
  let q = supabaseAdmin
    .from("quotations")
    .select("*, customers(id, company_name, address, phone, email, tax_id), creator:app_users!quotations_created_by_fkey(id, display_name), approver:app_users!quotations_approved_by_fkey(id, display_name)")
    .order("created_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  if (customerId) q = q.eq("customer_id", customerId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotations: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

  const quotation_no = await nextQuotationNo();
  const items = body.items || [];
  delete body.items;
  // Remove frontend-only fields
  delete body.customer_name;

  const subtotal = items.reduce((s: number, i: { qty?: number; unit_price?: number; amount?: number }) => {
    return s + (Number(i.amount) || (Number(i.qty || 0) * Number(i.unit_price || 0)));
  }, 0);
  const discountAmt = Number(body.discount_amount) || (subtotal * (Number(body.discount_percent) || 0) / 100);
  const afterDiscount = subtotal - discountAmt;
  const vatAmt = afterDiscount * ((Number(body.vat_percent) ?? 7) / 100);
  const total = afterDiscount + vatAmt;

  // Build insert payload - only include DB columns
  const insertData: Record<string, unknown> = {
    quotation_no,
    title: body.title,
    customer_id: body.customer_id || null,
    contact_id: body.contact_id || null,
    deal_id: body.deal_id || null,
    project_id: body.project_id || null,
    issue_date: body.issue_date || new Date().toISOString().slice(0, 10),
    valid_until: body.valid_until || null,
    subtotal,
    discount_percent: body.discount_percent || 0,
    discount_amount: discountAmt,
    vat_percent: body.vat_percent ?? 7,
    vat_amount: vatAmt,
    total,
    currency: body.currency || "THB",
    status: "draft",
    terms: body.terms || null,
    notes: body.notes || null,
    created_by: ctx.userId,
    // New TOMAS TECH fields
    attention: body.attention || null,
    customer_phone: body.customer_phone || null,
    customer_email: body.customer_email || null,
    project_name: body.project_name || null,
    lead_time: body.lead_time || null,
    payment_terms: body.payment_terms || null,
    expire_days: body.expire_days ?? 30,
    remark: body.remark || null,
    quotation_by: body.quotation_by || null,
    revision: body.revision ?? 0,
    customer_address: body.customer_address || null,
  };

  const { data, error } = await supabaseAdmin
    .from("quotations")
    .insert(insertData)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (items.length > 0) {
    await supabaseAdmin.from("quotation_items").insert(
      items.map((it: Record<string, unknown>, i: number) => ({
        quotation_id: data.id,
        sort_order: i,
        description: it.description || "",
        quantity: it.qty ?? it.quantity ?? 1,
        unit: it.unit || "set",
        unit_price: it.unit_price || 0,
        amount: Number(it.qty ?? it.quantity ?? 1) * Number(it.unit_price || 0),
        notes: it.notes || null,
        sub_items: it.sub_items || [],
      }))
    );
  }

  // Send approval notifications to admin/manager/leader
  try {
    const { data: approvers } = await supabaseAdmin
      .from("app_users")
      .select("id")
      .in("role", ["admin", "manager", "leader"]);
    if (approvers?.length) {
      const notifications = approvers.map((u) => ({
        user_id: u.id,
        title: "\u0e43\u0e1a\u0e40\u0e2a\u0e19\u0e2d\u0e23\u0e32\u0e04\u0e32\u0e43\u0e2b\u0e21\u0e48\u0e23\u0e2d\u0e01\u0e32\u0e23\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34",
        message: quotation_no + " - " + body.title,
        type: "quotation_approval",
        link: `/quotations/${data.id}`,
        is_read: false,
      }));
      await supabaseAdmin.from("notifications").insert(notifications);
    }
  } catch (_) { /* non-critical */ }

  return NextResponse.json({ quotation: data }, { status: 201 });
}
