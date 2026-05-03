import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import { logAudit, getClientIp } from "@/lib/auditLog";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: orig, error: origErr } = await supabaseAdmin
    .from("quotations").select("*").eq("id", id).single();
  if (origErr || !orig) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

  const { data: origItems } = await supabaseAdmin
    .from("quotation_items").select("*").eq("quotation_id", id).order("sort_order");

  const newVersion = (orig.version || 1) + 1;
  const baseNo = orig.quotation_no.replace(/-v\d+$/, "");
  const newQuotNo = baseNo + "-v" + newVersion;

  const insertData: Record<string, unknown> = {
    quotation_no: newQuotNo,
    title: orig.title,
    customer_id: orig.customer_id,
    contact_id: orig.contact_id,
    deal_id: orig.deal_id,
    project_id: orig.project_id,
    issue_date: new Date().toISOString().slice(0, 10),
    valid_until: orig.valid_until,
    subtotal: orig.subtotal,
    discount_percent: orig.discount_percent,
    discount_amount: orig.discount_amount,
    vat_percent: orig.vat_percent,
    vat_amount: orig.vat_amount,
    total: orig.total,
    currency: orig.currency || "THB",
    status: "draft",
    terms: orig.terms,
    notes: orig.notes,
    created_by: ctx.userId,
    attention: orig.attention,
    customer_phone: orig.customer_phone,
    customer_email: orig.customer_email,
    project_name: orig.project_name,
    lead_time: orig.lead_time,
    payment_terms: orig.payment_terms,
    expire_days: orig.expire_days,
    remark: orig.remark,
    quotation_by: orig.quotation_by,
    revision: orig.revision,
    customer_address: orig.customer_address,
    version: newVersion,
    parent_quotation_id: orig.parent_quotation_id || id,
  };

  const { data: newQt, error: newErr } = await supabaseAdmin
    .from("quotations").insert(insertData).select().single();
  if (newErr) return NextResponse.json({ error: newErr.message }, { status: 500 });

  if (origItems && origItems.length > 0) {
    await supabaseAdmin.from("quotation_items").insert(
      origItems.map((it: Record<string, unknown>, i: number) => ({
        quotation_id: newQt.id,
        sort_order: i,
        description: it.description || "",
        quantity: it.quantity ?? 1,
        unit: it.unit || "set",
        unit_price: it.unit_price || 0,
        amount: it.amount || 0,
        notes: it.notes || null,
        sub_items: it.sub_items || [],
      }))
    );
  }

  await supabaseAdmin.from("quotations").update({
    status: "superseded", updated_at: new Date().toISOString()
  }).eq("id", id);

  logAudit({
    userId: ctx.userId, action: "INSERT", tableName: "quotations",
    recordId: newQt.id, newValue: { quotation_no: newQuotNo, version: newVersion, parent: id },
    description: "Created quotation version " + newVersion + " from " + orig.quotation_no,
    ip: getClientIp(req.headers),
  });

  return NextResponse.json({ quotation: newQt, version: newVersion }, { status: 201 });
}
