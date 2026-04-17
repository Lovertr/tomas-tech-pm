import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requirePermission } from "@/lib/auth-server";

// P&L per project: revenue (invoices) − cost (labor + recorded costs) = gross profit
export async function GET(req: NextRequest) {
  const ctx = await requirePermission(req, "finance", 1);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const startDate = req.nextUrl.searchParams.get("start_date");
  const endDate = req.nextUrl.searchParams.get("end_date");
  const projectId = req.nextUrl.searchParams.get("project_id");

  // Projects
  let pq = supabaseAdmin.from("projects").select("id, project_code, name_th, name_en, budget_limit, status").eq("is_archived", false);
  if (projectId) pq = pq.eq("id", projectId);
  const { data: projects } = await pq;

  // Invoices (revenue)
  let invQ = supabaseAdmin.from("invoices").select("project_id, total, status, issue_date").in("status", ["sent", "paid", "overdue"]);
  if (startDate) invQ = invQ.gte("issue_date", startDate);
  if (endDate) invQ = invQ.lte("issue_date", endDate);
  const { data: invoices } = await invQ;

  // Time logs (labor cost)
  let tlQ = supabaseAdmin.from("time_logs").select("project_id, hours, hourly_rate_at_log, log_date").eq("status", "approved");
  if (startDate) tlQ = tlQ.gte("log_date", startDate);
  if (endDate) tlQ = tlQ.lte("log_date", endDate);
  const { data: timeLogs } = await tlQ;

  const rows = (projects ?? []).map(p => {
    const projInvoices = (invoices ?? []).filter(i => i.project_id === p.id);
    const projLogs = (timeLogs ?? []).filter(l => l.project_id === p.id);
    const revenue = projInvoices.reduce((s, i) => s + Number(i.total ?? 0), 0);
    const paid = projInvoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total ?? 0), 0);
    const outstanding = revenue - paid;
    const laborCost = projLogs.reduce((s, l) => s + Number(l.hours) * Number(l.hourly_rate_at_log ?? 0), 0);
    const totalCost = laborCost; // could add other_costs table later
    const grossProfit = revenue - totalCost;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    return {
      project_id: p.id, project_code: p.project_code, name: p.name_th || p.name_en, status: p.status,
      budget: Number(p.budget_limit ?? 0), revenue, paid, outstanding,
      labor_cost: laborCost, total_cost: totalCost, gross_profit: grossProfit, margin_pct: Math.round(margin * 100) / 100,
    };
  });

  const totals = rows.reduce((acc, r) => ({
    revenue: acc.revenue + r.revenue, paid: acc.paid + r.paid, outstanding: acc.outstanding + r.outstanding,
    cost: acc.cost + r.total_cost, profit: acc.profit + r.gross_profit, budget: acc.budget + r.budget,
  }), { revenue: 0, paid: 0, outstanding: 0, cost: 0, profit: 0, budget: 0 });

  return NextResponse.json({ rows, totals });
}
