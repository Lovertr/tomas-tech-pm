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
    sales: "การขาย", revenue: "รายได้",
    insights: "AI วิเคราะห์",
    totalDeals: "สถานะด้านขาย",
    closedWon: "ปิดทำ",
    conversion: "อัตราการ",
    lost: "หายไป",
    avgDeal: "การรดเฉลียธุรกิจ",
    pipeline: "มูลค่าใน Pipeline",
    stageBreakdown: "สัดส่วนตาม Stage",
    topCustomers: "ลูกค้ายอด",
    customer: "ลูกค้า",
    value: "มูลค่า (THB)",
    deals: "ดีล",
    month: "เดือน", year: "ปี",
    noData: "ยังไม่มีข้อมูล",
    downloadCsv: "ดาวน์โหลด CSV",
    downloadPdf: "ดาวน์โหลด PDF",
    ownerPerformance: "ผลงานพนักงานขาย",
    activityTypes: "ประเภทกิจกรรม",
    industryDist: "อุตสาหกรรม",
    overdue: "ดีลเลยกำหนด",
    avgAge: "อายุเฉลี่ย (วัน)",
    weighted: "Pipeline ถ่วงน้ำหนัก",
    forecast: "พยากรณ์",
    loading: "กำลังโหลด...",
    name: "ชื่อ",
    dealCount: "จำนวนดีล",
    wonDeals: "ปิดได้",
    totalValue: "มูลค่ารวม",
    activities: "กิจกรรม",
    aiRecommendations: "AI แนะนำ",
    overdueTitle: "ดีลเลยกำหนด",
    overdueText: "ดีลเกินกำหนดปิด ควรตรวจสอบและอัปเดตกำหนดการหรือปิดดีล",
    lowConversion: "อัตราการปิดต่ำ",
    lowConversionText: "อัตราปิดดีล {rate}% ต่ำกว่าเป้า ควรเน้นคุณภาพการนำเสนอ",
    coachingNeeded: "ต้องการโค้ชชิ่ง",
    coachingText: "พนักงานขายบางรายมีดีลแต่ยังไม่ปิดสำเร็จ ควรจับคู่กับนักขายมือหนึ่ง",
    pipelineHealth: "สุขภาพ Pipeline",
    pipelineHealthText: "Pipeline ถ่วงน้ำหนัก: THB {value}M จาก {count} ดีล อายุเฉลี่ย: {age} วัน",
    topActivity: "กิจกรรมยอดนิยม",
    topActivityText: "กิจกรรมที่ทำบ่อยสุด: \"{name}\" ({count} ครั้ง) ควรหลากหลายวิธีการเข้าถึง",
    topIndustry: "อุตสาหกรรมนำ",
    topIndustryText: "\"{name}\" นำด้วย THB {value}M ({count} ดีล) ควรเจาะลึกกลุ่มนี้",
    days: "วัน",
    total: "รวม",
    weightedShort: "ถ่วงน้ำหนัก",
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
    aiRecommendations: "AI Recommendations",
    overdueTitle: "Overdue Deals",
    overdueText: "{count} deals past expected close date. Review and update timelines or close them.",
    lowConversion: "Low Conversion",
    lowConversionText: "Conversion rate {rate}% is below target. Focus on qualification and proposal quality.",
    coachingNeeded: "Coaching Needed",
    coachingText: "Some sales reps have deals but no wins yet. Consider pairing them with top performers.",
    pipelineHealth: "Pipeline Health",
    pipelineHealthText: "Weighted pipeline: THB {value}M across {count} active deals. Average age: {age} days.",
    topActivity: "Top Activity",
    topActivityText: "Most common: \"{name}\" ({count} times). Diversify engagement strategies.",
    topIndustry: "Top Industry",
    topIndustryText: "\"{name}\" leads with THB {value}M ({count} deals). Consider deepening focus.",
    days: "days",
    total: "Total",
    weightedShort: "Weighted",
  },
  jp: {
    sales: "営業", revenue: "売上", insights: "AI分析",
    totalDeals: "総ディール数", closedWon: "成約", conversion: "成約率",
    lost: "失注", avgDeal: "平均ディール", pipeline: "パイプライン",
    stageBreakdown: "ステージ別", topCustomers: "上位顧客",
    customer: "顧客", value: "金額 (THB)", deals: "ディール",
    month: "月", year: "年", noData: "データなし",
    downloadCsv: "CSV DL", downloadPdf: "PDF DL",
    ownerPerformance: "営業成績", activityTypes: "活動種別",
    industryDist: "業界分布", overdue: "期限超過", avgAge: "平均日数",
    weighted: "加重パイプライン", forecast: "予測", loading: "読み込み中...",
    name: "名前", dealCount: "件数", wonDeals: "成約", totalValue: "合計金額",
    activities: "活動",
    aiRecommendations: "AIの提案",
    overdueTitle: "期限超過ディール",
    overdueText: "期限超過{count}件。スケジュールの見直しまたはクローズを検討してください。",
    lowConversion: "低成約率",
    lowConversionText: "成約率{rate}%が目標以下。提案品質の向上に注力してください。",
    coachingNeeded: "コーチング必要",
    coachingText: "一部の営業がまだ成約なし。トップパフォーマーとのペアリングを検討してください。",
    pipelineHealth: "パイプライン状況",
    pipelineHealthText: "加重パイプライン: THB {value}M（{count}件）平均{age}日。",
    topActivity: "主要活動",
    topActivityText: "最多: \"{name}\"（{count}回）。多様なアプローチを検討してください。",
    topIndustry: "主要業界",
    topIndustryText: "\"{name}\"がTHB {value}M（{count}件）でリード。深耕を検討してください。",
    days: "日",
    total: "合計",
    weightedShort: "加重",
  },
};

const STAGE_COLORS: Record<string, string> = {
  waiting_present: "#6B7280", contacted: "#3B82F6", proposal_submitted: "#F59E0B",
  proposal_confirmed: "#8B5CF6", quotation: "#F7941D", negotiation: "#EC4899",
  waiting_po: "#14B8A6", po_received: "#22C55E", payment_received: "#059669",
  cancelled: "#EF4444", refused: "#9CA3AF",
};
const STAGE_LABELS_I18N: Record<string, Record<string, string>> = {
  waiting_present:    { th: "รอนำเสนอ",           en: "Waiting to Present",    jp: "プレゼン待ち" },
  contacted:          { th: "ติดต่อแล้ว",          en: "Contacted",             jp: "連絡済み" },
  proposal_submitted: { th: "เสนอ Proposal",      en: "Proposal Submitted",    jp: "提案済み" },
  proposal_confirmed: { th: "คอนเฟิร์ม Proposal", en: "Proposal Confirmed",   jp: "提案承認" },
  quotation:          { th: "เสนอราคา",            en: "Quotation",             jp: "見積もり" },
  negotiation:        { th: "เจรจาต่อรอง",         en: "Negotiation",           jp: "交渉中" },
  waiting_po:         { th: "รอ PO",               en: "Waiting PO",            jp: "PO待機" },
  po_received:        { th: "ได้รับ PO",            en: "PO Received",           jp: "PO受領" },
  payment_received:   { th: "ได้รับยอดชำระแล้ว",    en: "Payment Received",      jp: "入金済み" },
  cancelled:          { th: "ยกเลิก",              en: "Cancelled",             jp: "キャンセル" },
  refused:            { th: "ปฏิเสธ",              en: "Refused",               jp: "拒否" },
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
  const t = i18n[lang] || i18n.th;
  const getStageName = (stage: string) => STAGE_LABELS_I18N[stage]?.[lang] || STAGE_LABELS_I18N[stage]?.en || stage;
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
        name: getStageName(stage),
        value,
        count: data.stageCount[stage] || 0,
        color: STAGE_COLORS[stage] || "#6B7280",
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, lang]);

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
      rows.push([getStageName(stage), String(data.stageCount[stage] || 0), String(value)]);
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
                  <Bar dataKey="total" name={t.total} fill="#00AEEF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="weighted" name={t.weightedShort} fill="#003087" radius={[4, 4, 0, 0]} />
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
                <KPI icon={Clock} label={t.avgAge} value={`${ai.avgDealAge} ${t.days}`} color="#F7941D" />
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
                  <Lightbulb size={14} className="text-[#F7941D]" /> {t.aiRecommendations}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ai.overdueDeals > 0 && (
                    <InsightCard icon={<AlertCircle size={16} className="text-red-500" />} title={t.overdueTitle}
                      text={t.overdueText.replace("{count}", String(ai.overdueDeals))} severity="high" />
                  )}
                  {ai.activeDealsCount > 0 && Number(s?.conversionRate || 0) < 30 && (
                    <InsightCard icon={<Target size={16} className="text-orange-500" />} title={t.lowConversion}
                      text={t.lowConversionText.replace("{rate}", s?.conversionRate || "0")} severity="medium" />
                  )}
                  {ai.ownerStats.some(o => o.deals > 0 && o.won === 0) && (
                    <InsightCard icon={<Users size={16} className="text-blue-500" />} title={t.coachingNeeded}
                      text={t.coachingText} severity="medium" />
                  )}
                  {ai.weightedPipeline > 0 && (
                    <InsightCard icon={<DollarSign size={16} className="text-green-500" />} title={t.pipelineHealth}
                      text={t.pipelineHealthText.replace("{value}", (ai.weightedPipeline / 1e6).toFixed(1)).replace("{count}", String(ai.activeDealsCount)).replace("{age}", String(ai.avgDealAge))} severity="info" />
                  )}
                  {(() => {
                    const topType = activityChartData[0];
                    return topType ? (
                      <InsightCard icon={<Zap size={16} className="text-yellow-500" />} title={t.topActivity}
                        text={t.topActivityText.replace("{name}", topType.name).replace("{count}", String(topType.value))} severity="info" />
                    ) : null;
                  })()}
                  {(() => {
                    const topInd = industryChartData[0];
                    return topInd ? (
                      <InsightCard icon={<Building2 size={16} className="text-purple-500" />} title={t.topIndustry}
                        text={t.topIndustryText.replace("{name}", topInd.name).replace("{value}", (topInd.value / 1e6).toFixed(1)).replace("{count}", String(topInd.count))} severity="info" />
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
