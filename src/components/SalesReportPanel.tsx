"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  TrendingUp, TrendingDown, BarChart3, Users, AlertCircle, Zap,
  Building2, CheckCircle2, XCircle, Activity, Download, Lightbulb,
  Clock, Target, DollarSign, FileText,
} from "lucide-react";
import {
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from "recharts";

/* ── i18n ── */
const months = ["\u0e21.\u0e04.","\u0e01.\u0e1e.","\u0e21\u0e35.\u0e04.","\u0e40.\u0e21.\u0e22.","\u0e1e.\u0e04.","\u0e21\u0e34.\u0e22.","\u0e01.\u0e04.","\u0e2a.\u0e04.","\u0e01.\u0e22.","\u0e15.\u0e04.","\u0e1e.\u0e22.","\u0e18.\u0e04."];
const i18n: Record<string, Record<string, string>> = {
  th: {
    sales: "\u0e01\u0e32\u0e23\u0e02\u0e32\u0e22", revenue: "\u0e23\u0e32\u0e22\u0e44\u0e14\u0e49",
    insights: "AI \u0e1c\u0e25\u0e27\u0e34\u0e40\u0e04\u0e23\u0e32\u0e30\u0e2b\u0e4c",
    totalDeals: "\u0e2a\u0e16\u0e32\u0e19\u0e30\u0e14\u0e49\u0e32\u0e19\u0e02\u0e32\u0e22",
    closedWon: "\u0e1b\u0e34\u0e14\u0e17\u0e33",
    conversion: "\u0e2d\u0e31\u0e15\u0e23\u0e32\u0e01\u0e32\u0e23",
    lost: "\u0e2b\u0e32\u0e22\u0e44\u0e1b",
    avgDeal: "\u0e01\u0e32\u0e23\u0e23\u0e14\u0e40\u0e09\u0e25\u0e22\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08",
    pipeline: "\u0e21\u0e39\u0e25\u0e04\u0e48\u0e32\u0e43\u0e19 Pipeline",
    stageBreakdown: "\u0e2a\u0e31\u0e14\u0e2a\u0e48\u0e27\u0e19\u0e15\u0e32\u0e21 Stage",
    topCustomers: "\u0e25\u0e39\u0e01\u0e04\u0e49\u0e32\u0e22\u0e2d\u0e14",
    customer: "\u0e25\u0e39\u0e01\u0e04\u0e49\u0e32",
    value: "\u0e21\u0e39\u0e25\u0e04\u0e48\u0e32 (THB)",
    deals: "\u0e14\u0e35\u0e25",
    month: "\u0e40\u0e14\u0e37\u0e2d\u0e19", year: "\u0e1b\u0e35",
    noData: "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e21\u0e35\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25",
    downloadCsv: "\u0e14\u0e32\u0e27\u0e19\u0e4c\u0e42\u0e2b\u0e25\u0e14 CSV",
    downloadPdf: "\u0e14\u0e32\u0e27\u0e19\u0e4c\u0e42\u0e2b\u0e25\u0e14 PDF",
    ownerPerformance: "\u0e1c\u0e25\u0e07\u0e32\u0e19\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19\u0e02\u0e32\u0e22",
    activityTypes: "\u0e1b\u0e23\u0e30\u0e40\u0e20\u0e17\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21",
    industryDist: "\u0e2d\u0e38\u0e15\u0e2a\u0e32\u0e2b\u0e01\u0e23\u0e23\u0e21",
    overdue: "\u0e14\u0e35\u0e25\u0e40\u0e25\u0e22\u0e01\u0e33\u0e2b\u0e19\u0e14",
    avgAge: "\u0e2d\u0e32\u0e22\u0e38\u0e40\u0e09\u0e25\u0e35\u0e48\u0e22 (days)",
    weighted: "Weighted Pipeline",
    forecast: "\u0e1e\u0e22\u0e32\u0e01\u0e23\u0e13\u0e4c",
    loading: "\u0e01\u0e33\u0e25\u0e31\u0e07\u0e42\u0e2b\u0e25\u0e14...",
    name: "\u0e0a\u0e37\u0e48\u0e2d",
    dealCount: "\u0e08\u0e33\u0e19\u0e27\u0e19\u0e14\u0e35\u0e25",
    wonDeals: "\u0e1b\u0e34\u0e14\u0e44\u0e14\u0e49",
    totalValue: "\u0e21\u0e39\u0e25\u0e04\u0e48\u0e32\u0e23\u0e27\u0e21",
    activities: "\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21",
  },
  en: {
    sales: "Sales", revenue: "Revenue", insights: "AI Insights",
    totalDeals: "Total Deals", closedWon: "Closed Won", conversion: "Conversion",
    lost: "Lost", avgDeal: "Avg Deal", pipeline: "Pipeline Value",
    stageBreakdown: "Stage Breakdown", topCustomers: "Top Customers",
    customer: "Customer", value: "Value (THB)", deals: "Deals",
    month: "Month", year: "Year", noData: "No data yet",
    downloadCsv: "Download CSV", downloadPdf: "Download PDF",
    ownerPerformance: "Sales Performance", activityTypes: "Activity Types",
    industryDist: "Industries", overdue: "Overdue Deals", avgAge: "Avg Age (days)",
    weighted: "Weighted Pipeline", forecast: "Forecast", loading: "Loading...",
    name: "Name", dealCount: "Deals", wonDeals: "Won", totalValue: "Total Value",
    activities: "Activities",
  },
};

const STAGE_COLORS: Record<string, string> = {
  lead: "#6B7280", qualified: "#3B82F6", proposal_sent: "#8B5CF6",
  quotation: "#F59E0B", negotiation: "#F97316", po_received: "#22C55E",
  cancelled: "#EF4444", refused: "#DC2626",
};
const STAGE_LABELS: Record<string, string> = {
  lead: "Lead", qualified: "Qualified", proposal_sent: "Proposal",
  quotation: "Quotation", negotiation: "Negotiation", po_received: "PO Received",
  cancelled: "Cancelled", refused: "Refused",
};
const PIE_COLORS = ["#003087", "#00AEEF", "#F7941D", "#22C55E", "#8B5CF6", "#EF4444", "#EC4899", "#6366F1"];

interface SalesData {
  summary: { totalDeals: number; totalPipeline: number; wonValue: number; wonCount: number; lostCount: number; conversionRate: string };
  stageCount: Record<string, number>;
  stageValue: Record<string, number>;
  monthlyData: { month: string; value: number }[];
  topCustomers: { name: string; total: number; count: number }[];
  recentActivities: any[];
  pipelineByMonth: Record<string, { total: number; weighted: number; count: number }>;
  aiData: {
    ownerStats: { name: string; deals: number; value: number; won: number; wonValue: number; activities: number }[];
    activityTypeCount: Record<string, number>;
    industryStats: Record<string, { count: number; value: number }>;
    overdueDeals: number;
    avgDealAge: number;
    weightedPipeline: number;
    totalActivities: number;
    activeDealsCount: number;
  };
}

export default function SalesReportPanel({ lang = "th", filterProjectId = "all", refreshKey = 0 }:
  { lang?: "th" | "en" | "jp"; filterProjectId?: string; refreshKey?: number }) {
  const t = i18n[lang === "jp" ? "en" : lang] || i18n.th;
  const [tab, setTab] = useState<"summary" | "revenue" | "analysis">("summary");
  const [view, setView] = useState<"month" | "year">("year");
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales-report");
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      setData(json);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, refreshKey]);

  /* ── Derived data ── */
  const stageChartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.stageValue)
      .filter(([, v]) => v > 0)
      .map(([stage, value]) => ({
        name: STAGE_LABELS[stage] || stage,
        value,
        count: data.stageCount[stage] || 0,
        color: STAGE_COLORS[stage] || "#6B7280",
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const revenueChartData = useMemo(() => {
    if (!data) return [];
    if (view === "month") {
      const map: Record<string, number> = {};
      data.monthlyData.forEach(d => { map[d.month] = d.value; });
      const yr = new Date().getFullYear();
      return Array.from({ length: 12 }, (_, i) => {
        const key = `${yr}-${String(i + 1).padStart(2, "0")}`;
        return { name: months[i], value: map[key] || 0 };
      });
    }
    return data.monthlyData.reduce((acc, d) => {
      const yr = d.month.slice(0, 4);
      const existing = acc.find(a => a.name === yr);
      if (existing) existing.value += d.value;
      else acc.push({ name: yr, value: d.value });
      return acc;
    }, [] as { name: string; value: number }[]);
  }, [data, view]);

  const industryChartData = useMemo(() => {
    if (!data?.aiData?.industryStats) return [];
    return Object.entries(data.aiData.industryStats)
      .map(([name, stats]) => ({ name, value: stats.value, count: stats.count }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const activityChartData = useMemo(() => {
    if (!data?.aiData?.activityTypeCount) return [];
    return Object.entries(data.aiData.activityTypeCount)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  /* ── Download CSV ── */
  const downloadCSV = () => {
    if (!data) return;
    const rows = [["Stage", "Deals", "Value (THB)"]];
    Object.entries(data.stageValue).forEach(([stage, value]) => {
      rows.push([STAGE_LABELS[stage] || stage, String(data.stageCount[stage] || 0), String(value)]);
    });
    rows.push([]);
    rows.push(["Top Customer", "Value (THB)", "Deals"]);
    data.topCustomers.forEach(c => rows.push([c.name, String(c.total), String(c.count)]));
    rows.push([]);
    rows.push(["Month", "Revenue (THB)"]);
    data.monthlyData.forEach(d => rows.push([d.month, String(d.value)]));
    if (data.aiData?.ownerStats) {
      rows.push([]);
      rows.push(["Sales Person", "Deals", "Won", "Total Value", "Activities"]);
      data.aiData.ownerStats.forEach(o => rows.push([o.name, String(o.deals), String(o.won), String(o.value), String(o.activities)]));
    }
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "sales_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const s = data?.summary;
  const ai = data?.aiData;

  /* ── Custom Tooltip for Pie ── */
  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-bold text-gray-800">{d.name}</p>
        <p className="text-gray-600">THB {(d.value / 1e6).toFixed(2)}M</p>
        {d.count !== undefined && <p className="text-gray-500">{d.count} deals</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003087]"></div>
        <span className="ml-3 text-gray-500">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab bar + Download */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex rounded-xl overflow-hidden border border-[#E2E8F0]">
          {(["summary", "revenue", "analysis"] as const).map(tb => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${tab === tb ? "text-white" : "text-slate-600 hover:bg-slate-50"}`}
              style={tab === tb ? { background: "#003087" } : {}}>
              {tb === "summary" && <BarChart3 size={14} />}
              {tb === "revenue" && <TrendingUp size={14} />}
              {tb === "analysis" && <Zap size={14} />}
              {tb === "summary" ? t.sales : tb === "revenue" ? t.revenue : t.insights}
            </button>
          ))}
        </div>
        <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E2E8F0] text-gray-600 hover:bg-gray-50">
          <Download size={14} /> {t.downloadCsv}
        </button>
      </div>

      {/* ══════ TAB: SUMMARY ══════ */}
      {tab === "summary" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPI icon={Users} label={t.totalDeals} value={String(s?.totalDeals || 0)} color="#003087" />
            <KPI icon={CheckCircle2} label={t.closedWon} value={String(s?.wonCount || 0)} color="#22C55E" />
            <KPI icon={Activity} label={t.conversion} value={`${s?.conversionRate || 0}%`} color="#00AEEF" />
            <KPI icon={XCircle} label={t.lost} value={String(s?.lostCount || 0)} color="#EF4444" />
            <KPI icon={TrendingUp} label={t.avgDeal} value={`THB ${((s?.totalDeals || 0) > 0 ? ((s?.wonValue || 0) + (s?.totalPipeline || 0)) / (s?.totalDeals || 1) / 1e6 : 0).toFixed(1)}M`} color="#F7941D" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Bar Chart */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">{t.revenue}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(v: any) => [`THB ${(v / 1e6).toFixed(2)}M`, t.revenue]} />
                  <Bar dataKey="value" fill="#003087" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stage Pie Chart with labels */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">{t.stageBreakdown}</h3>
              {stageChartData.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie data={stageChartData} cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value" paddingAngle={2}>
                        {stageChartData.map((d, i) => <Cell key={i} fill={d.color || PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5 min-w-[140px]">
                    {stageChartData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-gray-700 truncate">{d.name}</span>
                        <span className="ml-auto font-medium text-gray-800">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">{t.noData}</div>
              )}
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E2E8F0] bg-slate-50/50">
              <h3 className="text-sm font-bold text-gray-800">{t.topCustomers}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">{t.customer}</th>
                    <th className="text-right px-4 py-3">{t.value}</th>
                    <th className="text-right px-4 py-3">{t.deals}</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data?.topCustomers || data.topCustomers.length === 0) ? (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-400">{t.noData}</td></tr>
                  ) : data.topCustomers.map((c, i) => (
                    <tr key={i} className="border-t border-[#E2E8F0] hover:bg-slate-50/30">
                      <td className="px-4 py-3 text-gray-800 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{(c.total / 1e6).toFixed(2)}M</td>
                      <td className="px-4 py-3 text-right text-gray-500">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════ TAB: REVENUE ══════ */}
      {tab === "revenue" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-gray-800">{t.revenue}</h3>
              <div className="flex gap-2">
                <button onClick={() => setView("month")} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${view === "month" ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-600"}`}>{t.month}</button>
                <button onClick={() => setView("year")} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${view === "year" ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-600"}`}>{t.year}</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003087" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#003087" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip formatter={(v: any) => [`THB ${(v / 1e6).toFixed(2)}M`, t.revenue]} />
                <Area type="monotone" dataKey="value" stroke="#003087" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pipeline Forecast */}
          {data?.pipelineByMonth && Object.keys(data.pipelineByMonth).length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">{t.forecast}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={Object.entries(data.pipelineByMonth).sort().map(([month, d]) => ({ name: month, total: d.total, weighted: d.weighted }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(v: any) => `THB ${(v / 1e6).toFixed(2)}M`} />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#00AEEF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="weighted" name="Weighted" fill="#003087" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ══════ TAB: AI ANALYSIS ══════ */}
      {tab === "analysis" && (
        <div className="space-y-4">
          {!ai || !data ? (
            <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-2xl text-gray-400">{t.noData}</div>
          ) : (
            <>
              {/* AI Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KPI icon={Target} label={t.weighted} value={`THB ${(ai.weightedPipeline / 1e6).toFixed(1)}M`} color="#003087" />
                <KPI icon={Clock} label={t.avgAge} value={`${ai.avgDealAge} days`} color="#F7941D" />
                <KPI icon={AlertCircle} label={t.overdue} value={String(ai.overdueDeals)} color="#EF4444" />
                <KPI icon={Activity} label={t.activities} value={String(ai.totalActivities)} color="#00AEEF" />
              </div>

              {/* Sales Person Performance Table */}
              {ai.ownerStats && ai.ownerStats.length > 0 && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#E2E8F0] bg-slate-50/50">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Users size={14} className="text-[#003087]" /> {t.ownerPerformance}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/50 text-gray-500 text-xs">
                        <tr>
                          <th className="text-left px-4 py-3">{t.name}</th>
                          <th className="text-right px-4 py-3">{t.dealCount}</th>
                          <th className="text-right px-4 py-3">{t.wonDeals}</th>
                          <th className="text-right px-4 py-3">{t.totalValue}</th>
                          <th className="text-right px-4 py-3">{t.activities}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ai.ownerStats.sort((a, b) => b.value - a.value).map((o, i) => (
                          <tr key={i} className="border-t border-[#E2E8F0] hover:bg-slate-50/30">
                            <td className="px-4 py-3 text-gray-800 font-medium">{o.name}</td>
                            <td className="px-4 py-3 text-right text-gray-700">{o.deals}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">{o.won}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-700">{(o.value / 1e6).toFixed(2)}M</td>
                            <td className="px-4 py-3 text-right text-gray-500">{o.activities}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Charts: Activity Types + Industry Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activityChartData.length > 0 && (
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Zap size={14} className="text-[#F7941D]" /> {t.activityTypes}
                    </h3>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <ResponsiveContainer width="100%" height={220}>
                        <RechartsPie>
                          <Pie data={activityChartData} cx="50%" cy="50%" outerRadius={80} innerRadius={35} dataKey="value" paddingAngle={2}>
                            {activityChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </RechartsPie>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-1 min-w-[120px]">
                        {activityChartData.slice(0, 8).map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-gray-600 truncate">{d.name}</span>
                            <span className="ml-auto font-medium">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {industryChartData.length > 0 && (
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Building2 size={14} className="text-[#003087]" /> {t.industryDist}
                    </h3>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <ResponsiveContainer width="100%" height={220}>
                        <RechartsPie>
                          <Pie data={industryChartData} cx="50%" cy="50%" outerRadius={80} innerRadius={35} dataKey="value" paddingAngle={2}>
                            {industryChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </RechartsPie>
                      </ResponsiveContainer>
                      <div className="flex flex-col gap-1 min-w-[120px]">
                        {industryChartData.slice(0, 6).map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-gray-600 truncate">{d.name}</span>
                            <span className="ml-auto font-medium">{(d.value / 1e6).toFixed(1)}M</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Insight Cards */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Lightbulb size={14} className="text-[#F7941D]" /> AI Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ai.overdueDeals > 0 && (
                    <InsightCard icon={<AlertCircle size={16} className="text-red-500" />} title="Overdue Deals"
                      text={`${ai.overdueDeals} deals past expected close date. Review and update timelines or close them.`} severity="high" />
                  )}
                  {ai.activeDealsCount > 0 && Number(s?.conversionRate || 0) < 30 && (
                    <InsightCard icon={<Target size={16} className="text-orange-500" />} title="Low Conversion"
                      text={`Conversion rate ${s?.conversionRate}% is below target. Focus on qualification and proposal quality.`} severity="medium" />
                  )}
                  {ai.ownerStats.some(o => o.deals > 0 && o.won === 0) && (
                    <InsightCard icon={<Users size={16} className="text-blue-500" />} title="Coaching Needed"
                      text={`Some sales reps have deals but no wins yet. Consider pairing them with top performers.`} severity="medium" />
                  )}
                  {ai.weightedPipeline > 0 && (
                    <InsightCard icon={<DollarSign size={16} className="text-green-500" />} title="Pipeline Health"
                      text={`Weighted pipeline: THB ${(ai.weightedPipeline / 1e6).toFixed(1)}M across ${ai.activeDealsCount} active deals. Average age: ${ai.avgDealAge} days.`} severity="info" />
                  )}
                  {(() => {
                    const topType = activityChartData[0];
                    return topType ? (
                      <InsightCard icon={<Zap size={16} className="text-yellow-500" />} title="Top Activity"
                        text={`Most common: "${topType.name}" (${topType.value} times). Diversify engagement strategies.`} severity="info" />
                    ) : null;
                  })()}
                  {(() => {
                    const topInd = industryChartData[0];
                    return topInd ? (
                      <InsightCard icon={<Building2 size={16} className="text-purple-500" />} title="Top Industry"
                        text={`"${topInd.name}" leads with THB ${(topInd.value / 1e6).toFixed(1)}M (${topInd.count} deals). Consider deepening focus.`} severity="info" />
                    ) : null;
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function KPI({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 min-w-0 overflow-hidden">
      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1 truncate">
        <span className="flex-shrink-0"><Icon size={12} /></span>
        <span className="truncate">{label}</span>
      </div>
      <div className="text-sm md:text-base font-bold truncate" style={{ color }}>{value}</div>
    </div>
  );
}

function InsightCard({ icon, title, text, severity }: { icon: React.ReactNode; title: string; text: string; severity: "high" | "medium" | "info" }) {
  const border = severity === "high" ? "border-l-red-400" : severity === "medium" ? "border-l-orange-400" : "border-l-blue-400";
  return (
    <div className={`border border-[#E2E8F0] ${border} border-l-4 rounded-lg p-3`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-semibold text-gray-800">{title}</span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}
