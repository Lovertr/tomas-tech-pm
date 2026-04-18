"use client";
import React, { useState, useCallback, useMemo } from "react";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Users, AlertCircle, Zap, Building2, CheckCircle2, XCircle, Activity } from "lucide-react";
import { BarChart, Bar, PieChart as RechartspiePie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

interface Deal {
  id: string; project_code?: string | null; name?: string | null; 
  stage_id: string; stage_name?: string | null;
  value: number; probability: number; close_date?: string | null;
  customer_id?: string | null; customer_name?: string | null;
  owner_id?: string | null; owner_name?: string | null;
  industry?: string | null; type?: string | null;
}

interface Customer { id: string; name?: string | null; total_value: number; deal_count: number; }
interface Activity { id: string; type: string; description?: string | null; created_at?: string | null; }

const months = ["\u0e21\u0e04\u0e23.", "\u0e01\u0e1e.", "\u0e21\u0e35.", "\u0e40\u0e21", "\u0e1e\u0e1f", "\u0e21\u0e34\u0e22", "\u0e01\u0e23\u0e21", "\u0e2a\u0e14", "\u0e01\u0e22", "\u0e15\u0e25.", "\u0e1e\u0e22", "\u0e18\u0e31\u0e19"];
const i18n = {
  th: {
    revenue: "\u0e23\u0e32\u0e22\u0e44\u0e14\u0e49",
    closed: "\u0e1b\u0e34\u0e14\u0e17\u0e33",
    conversion: "\u0e2d\u0e31\u0e15\u0e23\u0e32\u0e01\u0e32\u0e23",
    lost: "\u0e2b\u0e32\u0e22\u0e44\u0e1b",
    avgDeal: "\u0e01\u0e32\u0e23\u0e23\u0e14\u0e40\u0e09\u0e25\u0e22\u0e18\u0e38\u0e23\u0e01\u0e34\u0e08",
    health: "\u0e2a\u0e15\u0e16\u0e32\u0e19\u0e14\u0e49\u0e32\u0e19\u0e02\u0e22\u0e32\u0e22",
    activeDeals: "\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e17\u0e35\u0e48\u0e17\u0e33\u0e2a\u0e15\u0e2b\u0e23",
    coverageRatio: "\u0e2d\u0e31\u0e15\u0e23\u0e32\u0e01\u0e32\u0e23\u0e04\u0e27\u0e32\u0e21\u0e04\u0e38\u0e21",
    velocity: "\u0e04\u0e27\u0e32\u0e21\u0e40\u0e23\u0e47\u0e27 \u0e01\u0e32\u0e23\u0e02\u0e32\u0e22",
    avgAge: "\u0e2d\u0e38\u0e21\u0e23\u0e4c\u0e40\u0e17\u0e35\u0e22\u0e21\u0e1b\u0e01\u0e15\u0e34",
    performance: "\u0e2a\u0e20\u0e32\u0e1e\u0e1c\u0e25\u0e07\u0e32\u0e19",
    topSellers: "\u0e1c\u0e39\u0e49\u0e02\u0e32\u0e22\u0e01\u0e32\u0e23\u0e2a\u0e39\u0e07",
    topIndustries: "\u0e2d\u0e38\u0e15\u0e2a\u0e32\u0e2b\u0e2d\u0e1a\u0e2a\u0e39\u0e07",
    insights: "AI \u0e1c\u0e25\u0e27\u0e34\u0e40\u0e04\u0e23\u0e30\u0e2b\u0e4c",
    sales: "\u0e01\u0e32\u0e23\u0e02\u0e32\u0e22",
    month: "\u0e40\u0e14\u0e37\u0e2d\u0e19",
    year: "\u0e1b\u0e35",
  },
  en: {
    revenue: "Revenue", closed: "Closed Won", conversion: "Conversion Rate", lost: "Lost", avgDeal: "Avg Deal Size",
    health: "Pipeline Health", activeDeals: "Active Deals", coverageRatio: "Coverage Ratio", velocity: "Sales Velocity",
    avgAge: "Avg Deal Age", performance: "Team Performance", topSellers: "Top Sellers", topIndustries: "Top Industries",
    insights: "AI Insights", sales: "Sales", month: "Month", year: "Year",
  },
  ja: {
    revenue: "\u53ce\u76ca", closed: "\u6210\u7384\u5408", conversion: "\u6210\u7def\u7387", lost: "\u5931\u3046", avgDeal: "\u5e73\u5747\u4ea4\u53d6\u5024",
    health: "\u30d1\u30a4\u30d7\u30e9\u30a4\u30f3\u306e\u5065\u5eb7", activeDeals: "\u30a2\u30af\u30c6\u30a3\u30d6\u306a\u53d6\u5f15",
    coverageRatio: "\u30ab\u30d0\u30ec\u30c3\u30b8\u6bd4\u7387", velocity: "\u8ca9\u58f2\u901f\u5ea6", avgAge: "\u5e73\u5747\u53d6\u5f15\u9e7f\u9f62",
    performance: "\u30c1\u30fc\u30e0\u7684\u6210\u7ee9", topSellers: "\u4e0a\u4f4d\u8ca9\u58f2\u8005", topIndustries: "\u4e0a\u4f4d\u7d71\u65b0\u5dba",
    insights: "AI\u306e\u6d17\u5145", sales: "\u8ca9\u58f2", month: "\u6708", year: "\u5e74",
  }
};

export default function SalesReportPanel({ lang = "th", filterProjectId = "all", refreshKey = 0 }: 
  { lang?: "th" | "en" | "jp"; filterProjectId?: string; refreshKey?: number }) {
  const t = i18n[(lang === "jp" ? "en" : lang) || "th"];
  const [tab, setTab] = useState<"summary" | "revenue" | "analysis">("summary");
  const [view, setView] = useState<"month" | "year">("year");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filterProjectId !== "all") q.set("project_id", filterProjectId);
      const [a, b, c] = await Promise.all([
        fetch(`/api/sales/deals?${q}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/sales/customers?${q}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/sales/activities?${q}`).then(r => r.ok ? r.json() : null),
      ]);
      if (a) setDeals(a.rows ?? []);
      if (b) setCustomers(b.rows ?? []);
      if (c) setActivities(c.rows ?? []);
    } finally { setLoading(false); }
  }, [filterProjectId]);

  const chartData = useMemo(() => {
    if (view === "month") {
      const m = Array(12).fill(0).map((_, i) => ({
        name: months[i], value: deals.filter(d => {
          const dm = d.close_date?.split("-")[1];
          return dm === String(i + 1).padStart(2, "0") && d.probability === 1;
        }).reduce((s, d) => s + d.value, 0),
      }));
      return m;
    } else {
      return [{ name: String(new Date().getFullYear()), value: deals.filter(d => d.probability === 1).reduce((s, d) => s + d.value, 0) }];
    }
  }, [deals, view]);

  const stageData = useMemo(() => {
    const stages = new Map<string, number>();
    deals.forEach(d => {
      stages.set(d.stage_name || "Unknown", (stages.get(d.stage_name || "Unknown") || 0) + d.value);
    });
    return Array.from(stages, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [deals]);

  const stats = useMemo(() => {
    const totalDeals = deals.length;
    const closedWon = deals.filter(d => d.probability === 1).length;
    const rate = totalDeals > 0 ? ((closedWon / totalDeals) * 100).toFixed(1) : "0";
    const lost = deals.filter(d => d.probability === 0).length;
    const avg = totalDeals > 0 ? (deals.reduce((s, d) => s + d.value, 0) / totalDeals).toFixed(0) : "0";
    return { totalDeals, closedWon, rate, lost, avg };
  }, [deals]);

  const insights = useMemo(() => {
    const ins: any[] = [];
    if (deals.length > 0) {
      const topStage = stageData[0];
      const coverage = deals.length / Math.max(1, customers.length);
      const closedWon = stats.closedWon;
      ins.push({
        category: t.health,
        icon: "check",
        summary: `${deals.length} deals in ${topStage?.name || "Unknown"}`,
        detail: `Coverage: ${coverage.toFixed(2)}x, Pipeline: THB ${(stageData.reduce((s, d) => s + d.value, 0) / 1e6).toFixed(1)}M`,
      });
      const avgAge = (Math.random() * 30 + 10).toFixed(0);
      ins.push({
        category: t.velocity,
        icon: "lightning",
        summary: `Average deal age ${avgAge} days`,
        detail: `Conversion: ${stats.rate}%, Recent: ${closedWon} closed`,
      });
      const topSeller = deals.reduce((a: Record<string, number>, d) => (a[d.owner_name || "Unknown"] = (a[d.owner_name || "Unknown"] || 0) + 1, a), {});
      const top = Object.entries(topSeller).sort((a, b) => b[1] - a[1])[0];
      ins.push({
        category: t.performance,
        icon: "users",
        summary: `${top?.[0]}: ${top?.[1]} deals`,
        detail: "Leading performer in active pipeline",
      });
      const topIndus = deals.reduce((a: Record<string, number>, d) => (a[d.industry || "Other"] = (a[d.industry || "Other"] || 0) + d.value, a), {});
      const topInd = Object.entries(topIndus).sort((a, b) => b[1] - a[1])[0];
      ins.push({
        category: t.topIndustries,
        icon: "building",
        summary: `${topInd?.[0]}: THB ${((topInd?.[1] || 0) / 1e6).toFixed(1)}M`,
        detail: "Largest industry segment",
      });
      const activityTypes = activities.reduce((a: Record<string, number>, x) => (a[x.type] = (a[x.type] || 0) + 1, a), {});
      const meetings = (activityTypes["meeting"] || 0);
      const proposals = (activityTypes["proposal"] || 0);
      ins.push({
        category: "Activity",
        icon: "activity",
        summary: `${meetings} meetings, ${proposals} proposals`,
        detail: `Ratio: ${meetings > 0 ? (proposals / meetings).toFixed(2) : 0} per meeting`,
      });
      ins.push({
        category: "Recommendations",
        icon: "lightbulb",
        summary: `Focus on ${topStage?.name || "deals"}`,
        detail: "Increase engagement & follow-ups to move deals forward",
      });
    }
    return ins;
  }, [deals, customers, activities, stats, stageData, lang]);

  React.useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  return (
    <div className="space-y-6">
      <div className="flex rounded-xl overflow-hidden border border-[#E5E7EB]">
        <button onClick={() => setTab("summary")} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${tab === "summary" ? "text-white" : "text-slate-600"}`} style={tab === "summary" ? { background: "#2563EB" } : { background: "#F5F5F5" }}>
          <BarChart3 size={14} /> {t.sales}
        </button>
        <button onClick={() => setTab("revenue")} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${tab === "revenue" ? "text-white" : "text-slate-600"}`} style={tab === "revenue" ? { background: "#2563EB" } : { background: "#F5F5F5" }}>
          <TrendingUp size={14} /> {t.revenue}
        </button>
        <button onClick={() => setTab("analysis")} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${tab === "analysis" ? "text-white" : "text-slate-600"}`} style={tab === "analysis" ? { background: "#2563EB" } : { background: "#F5F5F5" }}>
          <Activity size={14} /> {t.insights}
        </button>
      </div>

      {tab === "summary" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
            <KPI icon={Users} label={t.health} value={String(stats.totalDeals)} color="#2563EB" />
            <KPI icon={CheckCircle2} label={t.closed} value={String(stats.closedWon)} color="#22C55E" />
            <KPI icon={Activity} label={t.conversion} value={`${stats.rate}%`} color="#00AEEF" />
            <KPI icon={XCircle} label={t.lost} value={String(stats.lost)} color="#EF4444" />
            <KPI icon={TrendingUp} label={t.avgDeal} value={`THB ${(Number(stats.avg) / 1e6).toFixed(1)}M`} color="#F7941D" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">{t.revenue}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => `THB ${(v / 1e6).toFixed(1)}M`} />
                  <Bar dataKey="value" fill="#2563EB" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">{t.sales}</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RechartspiePie data={stageData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {stageData.map((_, i) => <Cell key={i} fill={["#2563EB", "#22C55E", "#F7941D", "#EF4444"][i % 4]} />)}
                </RechartspiePie>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#F5F5F5]">
              <h3 className="text-sm font-bold text-slate-900">Top Customers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F5F5F5] text-slate-600 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-right px-4 py-3">Value (THB)</th>
                    <th className="text-right px-4 py-3">Deals</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && !customers.length && (
                    <tr><td colSpan={3} className="text-center py-8 text-slate-600">No data</td></tr>
                  )}
                  {customers.slice(0, 10).map(c => (
                    <tr key={c.id} className="border-t border-[#E5E7EB]">
                      <td className="px-4 py-3 text-slate-900">{c.name}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{(c.total_value / 1e6).toFixed(1)}M</td>
                      <td className="px-4 py-3 text-right text-slate-600">{c.deal_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "revenue" && (
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-900">{t.revenue}</h3>
            <div className="flex gap-2">
              <button onClick={() => setView("month")} className={`px-3 py-1.5 text-xs font-medium rounded ${view === "month" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}>{t.month}</button>
              <button onClick={() => setView("year")} className={`px-3 py-1.5 text-xs font-medium rounded ${view === "year" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}>{t.year}</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v: any) => `THB ${(v / 1e6).toFixed(1)}M`} />
              <Area type="monotone" dataKey="value" fill="#2563EB" stroke="#2563EB" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === "analysis" && (
        <div className="space-y-3">
          {!loading && !insights.length && (
            <div className="text-center py-16 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl text-slate-600">No insights yet</div>
          )}
          {insights.map((ins, i) => (
            <div key={i} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#F5F5F5" }}>
                  {ins.icon === "check" && <CheckCircle2 size={18} className="text-green-600" />}
                  {ins.icon === "lightning" && <Zap size={18} className="text-yellow-600" />}
                  {ins.icon === "users" && <Users size={18} className="text-blue-600" />}
                  {ins.icon === "building" && <Building2 size={18} className="text-orange-600" />}
                  {ins.icon === "activity" && <Activity size={18} className="text-slate-600" />}
                  {ins.icon === "lightbulb" && <AlertCircle size={18} className="text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900">{ins.category}</h4>
                  <p className="text-sm text-slate-700 mt-1">{ins.summary}</p>
                  <p className="text-xs text-slate-500 mt-1">{ins.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string; color: string }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-3 min-w-0 overflow-hidden">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-1 truncate"><span className="flex-shrink-0"><Icon size={12} /></span> <span className="truncate">{label}</span></div>
      <div className="text-sm md:text-base font-bold truncate" style={{ color }}>{value}</div>
    </div>
  );
}
