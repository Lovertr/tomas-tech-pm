import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ownerId = req.nextUrl.searchParams.get("owner_id"); // optional filter

  // Deals with owner info
  let dealsQuery = supabaseAdmin.from("deals")
    .select("id, title, stage, value, probability, created_at, actual_close_date, expected_close_date, customer_id, owner_id, customers(id, company_name, industry), owner:app_users!deals_owner_id_fkey(id, display_name)");
  if (ownerId) dealsQuery = dealsQuery.eq("owner_id", ownerId);
  const { data: deals } = await dealsQuery;
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
  let actQuery = supabaseAdmin.from("deal_activities")
    .select("*, performer:app_users!performed_by(id, display_name, email), deals(id, title)")
    .order("activity_date", { ascending: false }).limit(100);
  if (ownerId) actQuery = actQuery.eq("performed_by", ownerId);
  const { data: activities } = await actQuery;

  // Top customers by deal value
  let custQuery = supabaseAdmin.from("deals")
    .select("customer_id, value, customers(id, company_name)")
    .in("stage", ["po_received", "payment_received"]);
  if (ownerId) custQuery = custQuery.eq("owner_id", ownerId);
  const { data: topCustomers } = await custQuery;
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

  // ── Monthly breakdown by stage category ──
  const monthlyByStage: Record<string, { payment: number; po: number; quotation: number; proposal: number }> = {};
  (deals ?? []).forEach(d => {
    const dateStr = d.actual_close_date || (d as any).updated_at?.slice(0, 10) || d.created_at?.slice(0, 10);
    if (!dateStr) return;
    const m = dateStr.slice(0, 7);
    if (!monthlyByStage[m]) monthlyByStage[m] = { payment: 0, po: 0, quotation: 0, proposal: 0 };
    if (d.stage === 'payment_received') monthlyByStage[m].payment += Number(d.value || 0);
    else if (d.stage === 'po_received') monthlyByStage[m].po += Number(d.value || 0);
    else if (d.stage === 'quotation' || d.stage === 'negotiation' || d.stage === 'waiting_po') monthlyByStage[m].quotation += Number(d.value || 0);
    else if (d.stage === 'proposal_submitted' || d.stage === 'proposal_confirmed') monthlyByStage[m].proposal += Number(d.value || 0);
  });

  // ── Conversion rates for forecasting ──
  const allDeals = deals ?? [];
  const totalFinished = allDeals.filter(d => ['po_received', 'payment_received', 'cancelled', 'refused'].includes(d.stage)).length;
  const wonTotal = allDeals.filter(d => d.stage === 'po_received' || d.stage === 'payment_received').length;
  const reachedQuotation = allDeals.filter(d => ['quotation', 'negotiation', 'waiting_po', 'po_received', 'payment_received'].includes(d.stage)).length;
  const quotationToWon = reachedQuotation > 0 ? wonTotal / reachedQuotation : 0;
  const reachedProposal = allDeals.filter(d => ['proposal_submitted', 'proposal_confirmed', 'quotation', 'negotiation', 'waiting_po', 'po_received', 'payment_received'].includes(d.stage)).length;
  const proposalToWon = reachedProposal > 0 ? wonTotal / reachedProposal : 0;

  // Current pipeline value by category for forecast
  const currentPO = allDeals.filter(d => d.stage === 'po_received').reduce((s, d) => s + Number(d.value || 0), 0);
  const currentQuotation = allDeals.filter(d => ['quotation', 'negotiation', 'waiting_po'].includes(d.stage)).reduce((s, d) => s + Number(d.value || 0), 0);
  const currentProposal = allDeals.filter(d => ['proposal_submitted', 'proposal_confirmed'].includes(d.stage)).reduce((s, d) => s + Number(d.value || 0), 0);
  const actualRevenue = allDeals.filter(d => d.stage === 'payment_received').reduce((s, d) => s + Number(d.value || 0), 0);

  // ── Strengths & weaknesses for AI analysis ──
  const wonDealsArr = allDeals.filter(d => d.stage === 'po_received' || d.stage === 'payment_received');
  const lostDealsArr = allDeals.filter(d => d.stage === 'cancelled' || d.stage === 'refused');
  const avgWonDealSize = wonDealsArr.length > 0 ? wonDealsArr.reduce((s, d) => s + Number(d.value || 0), 0) / wonDealsArr.length : 0;
  const avgLostDealSize = lostDealsArr.length > 0 ? lostDealsArr.reduce((s, d) => s + Number(d.value || 0), 0) / lostDealsArr.length : 0;

  // Top winning industry
  const wonByIndustry: Record<string, { count: number; value: number }> = {};
  wonDealsArr.forEach(d => {
    const ind = (d.customers as any)?.industry || 'ไม่ระบุ';
    if (!wonByIndustry[ind]) wonByIndustry[ind] = { count: 0, value: 0 };
    wonByIndustry[ind].count++;
    wonByIndustry[ind].value += Number(d.value || 0);
  });

  // Monthly new deals trend (for summary tab)
  const monthlyNewDeals: Record<string, { count: number; value: number }> = {};
  allDeals.forEach(d => {
    const m = d.created_at?.slice(0, 7);
    if (!m) return;
    if (!monthlyNewDeals[m]) monthlyNewDeals[m] = { count: 0, value: 0 };
    monthlyNewDeals[m].count++;
    monthlyNewDeals[m].value += Number(d.value || 0);
  });

  // ── Revenue Forecast Line Chart ──
  // Build month-by-month: past = actual income from transactions, future = forecasted from pipeline
  const nowMonth = new Date().toISOString().slice(0, 7);
  const yr = new Date().getFullYear();

  // Fetch actual income transactions for accurate monthly revenue
  const { data: incomeTransactions } = await supabaseAdmin.from("transactions")
    .select("amount, transaction_date")
    .eq("type", "income")
    .eq("status", "approved");

  // Build monthly actual income from transactions
  const monthlyActualIncome: Record<string, number> = {};
  (incomeTransactions ?? []).forEach(t => {
    const m = t.transaction_date?.slice(0, 7);
    if (!m) return;
    monthlyActualIncome[m] = (monthlyActualIncome[m] || 0) + Number(t.amount || 0);
  });

  // Build forecast for future months from pipeline deals
  const monthlyForecastIncome: Record<string, number> = {};

  // PO deals → high confidence future revenue (spread by expected_close_date)
  allDeals.filter(d => d.stage === 'po_received').forEach(d => {
    const m = d.expected_close_date ? d.expected_close_date.slice(0, 7) : nowMonth;
    monthlyForecastIncome[m] = (monthlyForecastIncome[m] || 0) + Number(d.value || 0);
  });

  // Quotation/negotiation deals → weighted by conversion rate
  allDeals.filter(d => ['quotation', 'negotiation', 'waiting_po'].includes(d.stage)).forEach(d => {
    const m = d.expected_close_date ? d.expected_close_date.slice(0, 7) : nowMonth;
    monthlyForecastIncome[m] = (monthlyForecastIncome[m] || 0) + Number(d.value || 0) * quotationToWon;
  });

  // Proposal deals → weighted by conversion rate
  allDeals.filter(d => ['proposal_submitted', 'proposal_confirmed'].includes(d.stage)).forEach(d => {
    const m = d.expected_close_date ? d.expected_close_date.slice(0, 7) : nowMonth;
    monthlyForecastIncome[m] = (monthlyForecastIncome[m] || 0) + Number(d.value || 0) * proposalToWon;
  });

  // Calculate growth trend from past actual data
  const pastActualEntries = Object.entries(monthlyActualIncome).filter(([m]) => m <= nowMonth).sort();
  const pastRevenues = pastActualEntries.map(([, v]) => v);
  const avgMonthlyRevenue = pastRevenues.length > 0 ? pastRevenues.reduce((a, b) => a + b, 0) / pastRevenues.length : 0;
  let growthRate = 0;
  if (pastRevenues.length >= 4) {
    const half = Math.floor(pastRevenues.length / 2);
    const firstHalf = pastRevenues.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const secondHalf = pastRevenues.slice(half).reduce((a, b) => a + b, 0) / (pastRevenues.length - half);
    growthRate = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;
  }

  // Build the forecastTimeline with actualLine + forecastLine for each month
  const forecastTimeline: Record<string, { actual: number; forecast: number; isPast: boolean }> = {};
  for (let i = 0; i < 12; i++) {
    const m = `${yr}-${String(i + 1).padStart(2, '0')}`;
    const isPast = m <= nowMonth;
    const actualVal = monthlyActualIncome[m] || 0;
    let forecastVal = 0;

    if (!isPast) {
      // Future: use pipeline data or trend projection
      forecastVal = monthlyForecastIncome[m] || 0;
      if (forecastVal === 0) {
        // No pipeline data → use trend projection
        const monthsAhead = (i + 1) - (new Date().getMonth() + 1);
        if (monthsAhead > 0) {
          forecastVal = avgMonthlyRevenue * (1 + growthRate * monthsAhead / 12);
        }
      }
    }

    forecastTimeline[m] = { actual: actualVal, forecast: forecastVal, isPast };
  }

  // Keep old forecastTimeline shape too for backward compatibility in summary row
  const forecastTimelineOld: Record<string, { actual: number; po: number; quotation: number; proposal: number; trend: number }> = {};
  for (let i = 0; i < 12; i++) {
    const m = `${yr}-${String(i + 1).padStart(2, '0')}`;
    forecastTimelineOld[m] = { actual: 0, po: 0, quotation: 0, proposal: 0, trend: 0 };
  }
  allDeals.filter(d => d.stage === 'payment_received').forEach(d => {
    const dateStr = d.actual_close_date || (d as any).updated_at?.slice(0, 10) || d.created_at?.slice(0, 10);
    if (!dateStr) return;
    const m = dateStr.slice(0, 7);
    if (forecastTimelineOld[m]) forecastTimelineOld[m].actual += Number(d.value || 0);
  });
  allDeals.filter(d => d.stage === 'po_received').forEach(d => {
    const m = d.expected_close_date ? d.expected_close_date.slice(0, 7) : nowMonth;
    if (forecastTimelineOld[m]) forecastTimelineOld[m].po += Number(d.value || 0);
  });

  // Salespeople list (always return all — for admin/manager dropdown)
  const { data: salespeople } = await supabaseAdmin.from("app_users")
    .select("id, display_name")
    .order("display_name");

  return NextResponse.json({
    salespeople: (salespeople ?? []).map(u => ({ id: u.id, name: u.display_name })),
    summary: { totalDeals, totalPipeline, wonValue, wonCount, lostCount, conversionRate },
    stageCount, stageValue, monthlyData, topCustomers: topCust,
    recentActivities: (activities ?? []).slice(0, 10),
    monthlyByStage,
    monthlyNewDeals,
    forecastTimeline,
    forecast: {
      actualRevenue,
      currentPO,
      currentQuotation,
      currentProposal,
      quotationToWonRate: Math.round(quotationToWon * 100),
      proposalToWonRate: Math.round(proposalToWon * 100),
      estimatedFromQuotation: currentQuotation * quotationToWon,
      estimatedFromProposal: currentProposal * proposalToWon,
      totalForecast: actualRevenue + currentPO + (currentQuotation * quotationToWon) + (currentProposal * proposalToWon),
    },
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
      avgWonDealSize,
      avgLostDealSize,
      wonByIndustry,
      conversionRates: {
        overall: Number(conversionRate),
        quotationToWon: Math.round(quotationToWon * 100),
        proposalToWon: Math.round(proposalToWon * 100),
      },
    },
  });
}
