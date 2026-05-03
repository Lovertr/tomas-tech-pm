import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import { logAudit, getClientIp } from "@/lib/auditLog";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabaseAdmin.from("recurring_transactions").select("*").order("next_due_date");
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();

  // Generate pending transactions from recurring
  if (body.action === "generate") {
    const today = new Date().toISOString().slice(0, 10);
    const { data: due } = await supabaseAdmin.from("recurring_transactions")
      .select("*").eq("is_active", true).lte("next_due_date", today);
    let generated = 0;
    for (const r of due || []) {
      await supabaseAdmin.from("transactions").insert({
        type: r.type, amount: r.amount, category: r.category,
        description: r.name + " (auto)", project_id: r.project_id,
        date: r.next_due_date, status: "pending", currency: "THB", exchange_rate: 1,
      });
      // Calculate next due date
      const d = new Date(r.next_due_date);
      if (r.frequency === "monthly") d.setMonth(d.getMonth() + 1);
      else if (r.frequency === "quarterly") d.setMonth(d.getMonth() + 3);
      else d.setFullYear(d.getFullYear() + 1);
      await supabaseAdmin.from("recurring_transactions").update({
        next_due_date: d.toISOString().slice(0, 10), last_generated_at: new Date().toISOString(),
      }).eq("id", r.id);
      generated++;
    }
    return NextResponse.json({ generated });
  }

  const { data, error } = await supabaseAdmin.from("recurring_transactions").insert({
    ...body, created_by: ctx.userId,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  logAudit({ userId: ctx.userId, action: "INSERT", tableName: "recurring_transactions", recordId: data.id, newValue: body, description: "Created recurring transaction", ip: getClientIp(req.headers) });
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...update } = body;
  const { data, error } = await supabaseAdmin.from("recurring_transactions").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await supabaseAdmin.from("recurring_transactions").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
