import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Deals with owner info
  const { data: deals } = await supabaseAdmin.from("deals")
    .select("id, title, stage, value, probability, created_at, actual_close_date, expected_close_date, customer_id, owner_id, customers(id, company_name, industry), owner:app_users!deals_owner_id_fkey(id, display_name)");
  const stageCount: Record<string, number> = {};
  const stageValue: Record<string, number> = {};
  let totalPipeline = 0, wonValue = 0, lostCount = 0, wonCount = 0;
  (deals ?? []).forEach(d => {
    stageCount[d.stage] = (stageCount[d.stage] || 0) + 1;
    stageValue[d.stage] = (stageValue[d.stage] || 0) + Number(d.value || 0);
    if (d.stage === "po_received" || d.stage === "payment_received") { wonValue += Number(d.value || 0); wonCount++; }
    else if (d.stage === "cancelled" || d.stage === "refused") lostCount++;
    else totalPipeline += Number(d.value || 0);
  });
  const totalDeals = deals?.length || 0;
  const conversionRate = totalDeals > 0 ? ((wonCount / totalDeals) * 100).toFixed(1) : "0";

  // Monthly revenue (won deals — use actual_close_date, fallback to updated_at or created_at)
  const monthly: Record<string, number> = {};
  (deals ?? []).filter(d => d.stage === "po_received" || d.stage === "payment_received").forEach(d => {
    const dateStr = d.actual_close_date || (d as any).updated_at?.slice(0, 10) || d.created_at?.slice(0, 10);
    if (!dateStr) return;
    const m = dateStr.slice(0, 7);
    monthly[m] = (monthly[m] || 0) + Number(d.value || 0);
  });
  const monthlyData = Object.entries(monthly).sort().map(([month, value]) => ({ month, value }));

  // All activities with types for analysis
  const { data: activities } = await supabaseAdmin.from("deal_activities")
    .select("*, performer:app_users!performed_by(id, display_name, email), deals(id, title)")
    .order("activity_date", { ascending: false }).limit(100);

  // Top customers by deal value
  const { data: topCustomers } = await supabaseAdmin.from("deals")
    .select("customer_id, value, customers(id, company_name)")
    .in("stage", ["po_received", "payment_received"]);
  const custMap: Record<string, { name: string; total: number; count: number }> = {};
  (topCustomers ?? []).forEach(d => {
    const cid = d.customer_id;
    if (!cid) return;
    const name = (d.customers as unknown as { company_name: string })?.company_name || "Unknown";
    if (!custMap[cid]) custMap[cid] = { name, total: 0, count: 0 };
    custMap[cid].total += Number(d.value || 0);
    custMap[cid].count++;
  });
  const topCust = Object.values(custMap).sort((a, b) => b.total - a.total).slice(0, 5);

  // ── AI Analysis data ──
  // Sales by owner
  const ownerStats: Record<string, { name: string; deals: number; value: number; won: number; wonValue: number; activities: number }> = {};
  (deals ?? []).forEach(d => {
    const ownerId = d.owner_id ?? 'unknown';
    const ownerName = (d.owner as any)?.display_name ?? 'ไม่ระบุ';
    if (!ownerStats[ownerId]) ownerStats[ownerId] = { name: ownerName, deals: 0, value: 0, won: 0, wonValue: 0, activities: 0 };
    ownerStats[ownerId].deals++;
    ownerStats[ownerId].value += Number(d.value || 0);
    if (d.stage === 'po_received' || d.stage === 'payment_received') { ownerStats[ownerId].won++; ownerStats[ownerId].wonValue += Number(d.value || 0); }
  });
  (activities ?? []).forEach(a => {
    const pid = a.performed_by;
    if (pid && ownerStats[pid]) ownerStats[pid].activities++;
  });

  // Activity type distribution
  const activityTypeCount: Record<string, number> = {};
  (activities ?? []).forEach(a => {
    activityTypeCount[a.activity_type] = (activityTypeCount[a.activity_type] || 0) + 1;
  });

  // Industry distribution
  const industryStats: Record<string, { count: number; value: number }> = {};
  (deals ?? []).forEach(d => {
    const industry = (d.customers as any)?.industry || 'ไม่ระบุ';
    if (!industryStats[industry]) industryStats[industry] = { count: 0, value: 0 };
    industryStats[industry].count++;
    industryStats[industry].value += Number(d.value || 0);
  });

  // Deals with overdue expected close
  const now = new Date().toISOString().split('T')[0];
  const overdueDeals = (deals ?? []).filter(d =>
    d.expected_close_date && d.expected_close_date < now &&
    !['po_received', 'payment_received', 'cancelled', 'refused'].includes(d.stage)
  ).length;

  // Average deal age (days from created to now for active deals)
  const activeDealAges = (deals ?? [])
    .filter(d => !['po_received', 'payment_received', 'cancelled', 'refused'].includes(d.stage))
    .map(d => Math.floor((Date.now() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24)));
  const avgDealAge = activeDealAges.length > 0
    ? Math.round(activeDealAges.reduce((a, b) => a + b, 0) / activeDealAges.length) : 0;

  // Weighted pipeline
  const weightedPipeline = (deals ?? [])
    .filter(d => !['po_received', 'payment_received', 'cancelled', 'refused'].includes(d.stage))
    .reduce((sum, d) => sum + Number(d.value || 0) * (Number(d.probability || 0) / 100), 0);

  // Pipeline deals for forecasting (active deals with expected close date)
  const pipelineForForecast = (deals ?? [])
    .filter(d => !['po_received', 'payment_received', 'cancelled', 'refused'].includes(d.stage) && d.expected_close_date)
    .map(d => ({
      month: d.expected_close_date!.slice(0, 7),
      value: Number(d.value || 0),
      probability: Number(d.probability || 0),
      weighted: Number(d.value || 0) * (Number(d.probability || 0) / 100),
    }));

  // Group pipeline by month
  const pipelineByMonth: Record<string, { total: number; weighted: number; count: number }> = {};
  pipelineForForecast.forEach(d => {
    if (!pipelineByMonth[d.month]) pipelineByMonth[d.month] = { total: 0, weighted: 0, count: 0 };
    pipelineByMonth[d.month].total += d.value;
    pipelineByMonth[d.month].weighted += d.weighted;
    pipelineByMonth[d.month].count++;
  });

  return NextResponse.json({
    summary: { totalDeals, totalPipeline, wonValue, wonCount, lostCount, conversionRate },
    stageCount, stageValue, monthlyData, topCustomers: topCust,
    recentActivities: (activities ?? []).slice(0, 10),
    pipelineByMonth,
    // Extended data for AI analysis
    aiData: {
      ownerStats: Object.values(ownerStats),
      activityTypeCount,
      industryStats,
      overdueDeals,
      avgDealAge,
      weightedPipeline,
      totalActivities: (activities ?? []).length,
      activeDealsCount: activeDealAges.length,
    },
  });
}
