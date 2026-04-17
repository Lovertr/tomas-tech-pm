import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, requirePermission } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await requirePermission(req, "invoices", 1);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const projectId = req.nextUrl.searchParams.get("project_id");
  let q = supabaseAdmin.from("invoices").select("*, projects(id,name_th,name_en,project_code)").order("issue_date", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices: data ?? [] });
}

// Generate invoice from approved billable timelogs in a date range
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.project_id || !b.start_date || !b.end_date) return NextResponse.json({ error: "required fields missing" }, { status: 400 });

  const { data: logs } = await supabaseAdmin.from("time_logs").select("*")
    .eq("project_id", b.project_id).eq("status", "approved").eq("is_billable", true)
    .gte("log_date", b.start_date).lte("log_date", b.end_date);

  const subtotal = (logs ?? []).reduce((s, l) => s + Number(l.hours) * Number(l.hourly_rate_at_log), 0);
  const vatPct = b.vat_pct ?? 7;
  const vatAmount = subtotal * vatPct / 100;
  const total = subtotal + vatAmount;

  // Generate invoice number
  const { count } = await supabaseAdmin.from("invoices").select("*", { count: "exact", head: true });
  const invNumber = b.invoice_number || `INV-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data, error } = await supabaseAdmin.from("invoices").insert({
    invoice_number: invNumber, project_id: b.project_id, client_name: b.client_name || null,
    issue_date: b.issue_date || new Date().toISOString().slice(0, 10),
    due_date: b.due_date || null, subtotal, vat_pct: vatPct, vat_amount: vatAmount, total,
    status: "draft", timelog_ids: (logs ?? []).map(l => l.id), notes: b.notes || null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoice: data, logs_count: logs?.length ?? 0 }, { status: 201 });
}
