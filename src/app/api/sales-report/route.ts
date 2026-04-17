import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Deals by stage
  const { data: deals } = await supabaseAdmin.from("deals").select("id, stage, value, created_at, actual_close_date");
  const stageCount: Record<string, number> = {};
  const stageValue: Record<string, number> = {};
  let totalPipeline = 0, wonValue = 0, lostCount = 0, wonCount = 0;
  (deals ?? []).forEach(d => {
    stageCount[d.stage] = (stageCount[d.stage] || 0) + 1;
    stageValue[d.stage] = (stageValue[d.stage] || 0) + Number(d.value || 0);
    if (d.stage === "project_complete") { wonValue += Number(d.value || 0); wonCount++; }
    else if (d.stage === "loss" || d.stage === "refuse") lostCount++;
    else totalPipeline += Number(d.value || 0);
  });
  const totalDeals = deals?.length || 0;
  const conversionRate = totalDeals > 0 ? ((wonCount / totalDeals) * 100).toFixed(1) : "0";

  // Monthly revenue (won deals)
  const monthly: Record<string, number> = {};
  (deals ?? []).filter(d => d.stage === "project_complete" && d.actual_close_date).forEach(d => {
    const m = d.actual_close_date!.slice(0, 7);
    monthly[m] = (monthly[m] || 0) + Number(d.value || 0);
  });
  const monthlyData = Object.entries(monthly).sort().map(([month, value]) => ({ month, value }));

  // Recent activities
  const { data: activities } = await supabaseAdmin.from("deal_activities")
    .select("*, performer:app_users!performed_by(id, email), deals(id, title)")
    .order("activity_date", { ascending: false }).limit(10);

  // Top customers by deal value
  const { data: topCustomers } = await supabaseAdmin.from("deals")
    .select("customer_id, value, customers(id, company_name)")
    .eq("stage", "project_complete");
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

  return NextResponse.json({
    summary: { totalDeals, totalPipeline, wonValue, wonCount, lostCount, conversionRate },
    stageCount, stageValue, monthlyData, topCustomers: topCust,
    recentActivities: activities ?? [],
  });
}
