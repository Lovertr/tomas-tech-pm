import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("quotations")
    .select("*, customers(id, company_name, company_name_en, address, tax_id, phone, email), creator:app_users!quotations_created_by_fkey(id, display_name), approver:app_users!quotations_approved_by_fkey(id, display_name)")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  const { data: items } = await supabaseAdmin
    .from("quotation_items")
    .select("*")
    .eq("quotation_id", id)
    .order("sort_order");
  return NextResponse.json({ quotation: data, items: items ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const items = body.items;
  delete body.items;
  delete body.customer_name;
  body.updated_at = new Date().toISOString();

  // Handle approval action
  if (body.status === "approved") {
    body.approved_by = ctx.userId;
    body.approved_at = new Date().toISOString();
    // Notify creator
    const { data: qt } = await supabaseAdmin.from("quotations").select("quotation_no, title, created_by").eq("id", id).single();
    if (qt?.created_by) {
      await supabaseAdmin.from("notifications").insert({
        user_id: qt.created_by,
        title: "\u0e43\u0e1a\u0e40\u0e2a\u0e19\u0e2d\u0e23\u0e32\u0e04\u0e32\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e01\u0e32\u0e23\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34",
        message: qt.quotation_no + " - " + qt.title + " approved",
        type: "quotation_approved",
        link: `/quotations/${id}`,
        is_read: false,
      });
    }
  }

  if (body.status === "rejected") {
    body.rejected_by = ctx.userId;
    body.rejected_at = new Date().toISOString();
    const { data: qt } = await supabaseAdmin.from("quotations").select("quotation_no, title, created_by").eq("id", id).single();
    if (qt?.created_by) {
      await supabaseAdmin.from("notifications").insert({
        user_id: qt.created_by,
        title: "\u0e43\u0e1a\u0e40\u0e2a\u0e19\u0e2d\u0e23\u0e32\u0e04\u0e32\u0e16\u0e39\u0e01\u0e1b\u0e0f\u0e34\u0e40\u0e2a\u0e18",
        message: [qt.quotation_no, qt.title, "rejected", body.rejection_reason || ""].filter(Boolean).join(" - "),
        type: "quotation_rejected",
        link: `/quotations/${id}`,
        is_read: false,
      });
    }
  }

  if (items) {
    const subtotal = items.reduce((s: number, i: { qty?: number; quantity?: number; unit_price?: number; amount?: number }) => {
      return s + (Number(i.amount) || (Number(i.qty ?? i.quantity ?? 1) * Number(i.unit_price || 0)));
    }, 0);
    const discountAmt = Number(body.discount_amount) || (subtotal * (Number(body.discount_percent) || 0) / 100);
    const afterDiscount = subtotal - discountAmt;
    const vatAmt = afterDiscount * ((Number(body.vat_percent) ?? 7) / 100);
    body.subtotal = subtotal;
    body.discount_amount = discountAmt;
    body.vat_amount = vatAmt;
    body.total = afterDiscount + vatAmt;
    await supabaseAdmin.from("quotation_items").delete().eq("quotation_id", id);
    if (items.length > 0) {
      await supabaseAdmin.from("quotation_items").insert(
        items.map((it: Record<string, unknown>, i: number) => ({
          quotation_id: id,
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
  }

  // Clean out non-DB fields
  delete body.rejection_reason_input;

  const { data, error } = await supabaseAdmin.from("quotations").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ quotation: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabaseAdmin.from("quotations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
