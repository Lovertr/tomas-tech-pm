"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  TrendingUp, TrendingDown, BarChart3, Users, AlertCircle, Zap,
  Building2, CheckCircle2, XCircle, Activity, Download, Lightbulb,
  Clock, Target, DollarSign, FileText, Briefcase, Shield, Star,
  ArrowUpRight, ArrowDownRight, Megaphone, Award, PieChart as PieIcon,
} from "lucide-react";
import {
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ComposedChart, Line,
} from "recharts";

/* ── i18n ── */
const months_th = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const months_en = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const months_jp = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

const i18n: Record<string, Record<string, string>> = {
  th: {
    sales: "การขาย", revenue: "รายได้", insights: "AI วิเคราะห์",
    totalDeals: "สถานะด้านขาย", closedWon: "ปิดทำ", conversion: "อัตราการ",
    lost: "หายไป", avgDeal: "มูลค่าเฉลี่ย/ดีล", pipeline: "มูลค่าใน Pipeline",
    stageBreakdown: "สัดส่วนตาม Stage", topCustomers: "ลูกค้ายอด",
    customer: "ลูกค้า", value: "มูลค่า (THB)", deals: "ดีล",
    month: "เดือน", year: "ปี", noData: "ยังไม่มีข้อมูล",
    downloadCsv: "ดาวน์โหลด CSV",
    ownerPerformance: "ผลงานพนักงานขาย", activityTypes: "ประเภทกิจกรรม",
    industryDist: "อุตสาหกรรม", overdue: "ดีลเลยกำหนด", avgAge: "อายุเฉลี่ย (วัน)",
    weighted: "Pipeline ถ่วงน้ำหนัก", forecast: "พยากรณ์รายได้",
    loading: "กำลังโหลด...", name: "ชื่อ", dealCount: "จำนวนดีล",
    wonDeals: "ปิดได้", totalValue: "มูลค่ารวม", activities: "กิจกรรม",
    aiRecommendations: "AI แนะนำ",
    overdueTitle: "ดีลเลยกำหนด",
    overdueText: "ดีลเกินกำหนดปิด {count} ดีล ควรตรวจสอบและอัปเดตกำหนดการหรือปิดดีล",
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
    days: "วัน", total: "รวม", weightedShort: "ถ่วงน้ำหนัก",
    newDealsMonthly: "ดีลใหม่รายเดือน",
    dealCountLabel: "จำนวน", dealValueLabel: "มูลค่า",
    actualRevenue: "รายได้ที่ได้รับแล้ว",
    confirmedPO: "PO ที่ยืนยันแล้ว",
    quotedValue: "ยอดเสนอราคา",
    proposalValue: "ยอด Proposal",
    revenueByCategory: "รายได้ตามหมวด (รายเดือน)",
    payment: "ชำระแล้ว", po: "PO", quotation: "เสนอราคา", proposal: "Proposal",
    forecastBreakdown: "คาดการณ์รายได้",
    forecastActual: "รายได้จริง",
    forecastPO: "PO (แน่นอน)",
    forecastQuotation: "จากเสนอราคา (คาดว่า)",
    forecastProposal: "จาก Proposal (คาดว่า)",
    forecastTotal: "รวมคาดการณ์",
    convRate: "อัตราปิดจากเสนอราคา",
    convRateProposal: "อัตราปิดจาก Proposal",
    revenueGrowth: "แนวทางเพิ่มรายได้",
    revenueGrowthText: "รายได้จริง THB {actual}M | PO รอเก็บเงิน THB {po}M | เสนอราคา THB {quot}M (อัตราปิด {quotRate}%) ควรเร่งติดตามใบเสนอราคาเพื่อเปลี่ยนเป็น PO",
    marketingTips: "กลยุทธ์การตลาด",
    marketingTipsText: "อุตสาหกรรม \"{topInd}\" มียอดสูงสุด ควรเน้นทำการตลาดในกลุ่มนี้ พัฒนา Case Study จากลูกค้าที่ปิดแล้ว สร้าง Content เจาะกลุ่มเป้าหมาย",
    strengths: "จุดเด่น",
    strengthsText: "ขนาดดีลเฉลี่ยที่ชนะ THB {avgWon}M สูงกว่าที่แพ้ THB {avgLost}M — ทีมเก่งในการปิดดีลใหญ่ อุตสาหกรรม \"{topWonInd}\" เป็นจุดแข็ง",
    weaknesses: "จุดที่ควรปรับปรุง",
    weaknessesText: "อัตราปิดจาก Proposal {propRate}% ยังต่ำ ควรปรับปรุงคุณภาพการนำเสนอ เร่งกระบวนการจาก Proposal สู่ Quotation ลดระยะเวลาเฉลี่ยของดีล ({age} วัน)",
    actionItems: "สิ่งที่ควรทำ",
    actionItemsText: "1) ติดตามดีลเลยกำหนด {overdue} ดีล 2) เร่งปิด PO ค้าง THB {po}M 3) ติดตามใบเสนอราคา THB {quot}M 4) พัฒนา Proposal อีก THB {prop}M ให้เป็น Quotation",
    bestPerformer: "นักขายดีเด่น",
    bestPerformerText: "\"{name}\" นำทีมด้วยมูลค่า THB {value}M ({won} ดีลสำเร็จ) ควรใช้กลยุทธ์ของ {name} เป็นต้นแบบทีม",
    noStrengthData: "ยังไม่มีข้อมูลดีลสำเร็จเพียงพอที่จะวิเคราะห์จุดเด่น-จุดด้อย",
  },
  en: {
    sales: "Sales", revenue: "Revenue", insights: "AI Insights",
    totalDeals: "Total Deals", closedWon: "Closed Won", conversion: "Conversion",
    lost: "Lost", avgDeal: "Avg Deal Size", pipeline: "Pipeline Value",
    stageBreakdown: "Stage Breakdown", topCustomers: "Top Customers",
    customer: "Customer", value: "Value (THB)", deals: "Deals",
    month: "Month", year: "Year", noData: "No data yet",
    downloadCsv: "Download CSV",
    ownerPerformance: "Sales Performance", activityTypes: "Activity Types",
    industryDist: "Industries", overdue: "Overdue Deals", avgAge: "Avg Age (days)",
    weighted: "Weighted Pipeline", forecast: "Revenue Forecast",
    loading: "Loading...", name: "Name", dealCount: "Deals", wonDeals: "Won",
    totalValue: "Total Value", activities: "Activities",
    aiRecommendations: "AI Recommendations",
    overdueTitle: "Overdue Deals",
    overdueText: "{count} deals past expected close date. Review and update timelines.",
    lowConversion: "Low Conversion",
    lowConversionText: "Conversion rate {rate}% is below target. Focus on qualification and proposal quality.",
    coachingNeeded: "Coaching Needed",
    coachingText: "Some sales reps have deals but no wins yet. Consider pairing with top performers.",
    pipelineHealth: "Pipeline Health",
    pipelineHealthText: "Weighted pipeline: THB {value}M across {count} active deals. Average age: {age} days.",
    topActivity: "Top Activity",
    topActivityText: "Most common: \"{name}\" ({count} times). Diversify engagement strategies.",
    topIndustry: "Top Industry",
    topIndustryText: "\"{name}\" leads with THB {value}M ({count} deals). Consider deepening focus.",
    days: "days", total: "Total", weightedShort: "Weighted",
    newDealsMonthly: "New Deals Monthly",
    dealCountLabel: "Count", dealValueLabel: "Value",
    actualRevenue: "Actual Revenue", confirmedPO: "Confirmed PO",
    quotedValue: "Quoted Value", proposalValue: "Proposal Value",
    revenueByCategory: "Revenue by Category (Monthly)",
    payment: "Paid", po: "PO", quotation: "Quoted", proposal: "Proposal",
    forecastBreakdown: "Revenue Forecast",
    forecastActual: "Actual Revenue", forecastPO: "PO (Confirmed)",
    forecastQuotation: "From Quotations (Est.)", forecastProposal: "From Proposals (Est.)",
    forecastTotal: "Total Forecast",
    convRate: "Quotation Win Rate", convRateProposal: "Proposal Win Rate",
    revenueGrowth: "Revenue Growth Strategy",
    revenueGrowthText: "Revenue THB {actual}M | PO pending THB {po}M | Quoted THB {quot}M (win rate {quotRate}%). Push quotation follow-ups to convert to PO.",
    marketingTips: "Marketing Strategy",
    marketingTipsText: "\"{topInd}\" has highest deal value. Focus marketing here. Build case studies from closed deals. Create targeted content.",
    strengths: "Strengths",
    strengthsText: "Avg won deal THB {avgWon}M vs lost THB {avgLost}M — team excels at large deals. \"{topWonInd}\" is a strong vertical.",
    weaknesses: "Areas for Improvement",
    weaknessesText: "Proposal win rate {propRate}% is low. Improve presentation quality. Speed up Proposal-to-Quotation. Reduce avg deal age ({age} days).",
    actionItems: "Action Items",
    actionItemsText: "1) Follow up {overdue} overdue deals 2) Close pending PO THB {po}M 3) Chase quotations THB {quot}M 4) Convert proposals THB {prop}M to quotation",
    bestPerformer: "Top Performer",
    bestPerformerText: "\"{name}\" leads with THB {value}M ({won} wins). Use their approach as team playbook.",
    noStrengthData: "Not enough closed deal data to analyze strengths and weaknesses.",
  },
  jp: {
    sales: "営業", revenue: "売上", insights: "AI分析",
    totalDeals: "総ディール", closedWon: "成約", conversion: "成約率",
    lost: "失注", avgDeal: "平均ディール", pipeline: "パイプライン",
    stageBreakdown: "ステージ別", topCustomers: "上位顧客",
    customer: "顧客", value: "金額 (THB)", deals: "ディール",
    month: "月", year: "年", noData: "データなし",
    downloadCsv: "CSV DL",
    ownerPerformance: "営業成績", activityTypes: "活動種別",
    industryDist: "業界分布", overdue: "期限超過", avgAge: "平均日数",
    weighted: "加重パイプライン", forecast: "売上予測",
    loading: "読み込み中...", name: "名前", dealCount: "件数", wonDeals: "成約",
    totalValue: "合計金額", activities: "活動",
    aiRecommendations: "AIの提案",
    overdueTitle: "期限超過ディール",
    overdueText: "期限超過{count}件。スケジュールの見直しを検討してください。",
    lowConversion: "低成約率",
    lowConversionText: "成約率{rate}%が目標以下。提案品質の向上に注力してください。",
    coachingNeeded: "コーチング必要",
    coachingText: "一部の営業がまだ成約なし。トップとのペアリングを検討してください。",
    pipelineHealth: "パイプライン状況",
    pipelineHealthText: "加重: THB {value}M（{count}件）平均{age}日。",
    topActivity: "主要活動",
    topActivityText: "最多: \"{name}\"（{count}回）。多様なアプローチを検討。",
    topIndustry: "主要業界",
    topIndustryText: "\"{name}\"がTHB {value}M（{count}件）でリード。深耕を検討。",
    days: "日", total: "合計", weightedShort: "加重",
    newDealsMonthly: "月別新規ディール",
    dealCountLabel: "件数", dealValueLabel: "金額",
    actualRevenue: "実績売上", confirmedPO: "確定PO",
    quotedValue: "見積もり額", proposalValue: "提案額",
    revenueByCategory: "カテゴリ別売上（月次）",
    payment: "入金済", po: "PO", quotation: "見積", proposal: "提案",
    forecastBreakdown: "売上予測",
    forecastActual: "実績売上", forecastPO: "PO（確定）",
    forecastQuotation: "見積もりから（推定）", forecastProposal: "提案から（推定）",
    forecastTotal: "予測合計",
    convRate: "見積成約率", convRateProposal: "提案成約率",
    revenueGrowth: "売上向上戦略",
    revenueGrowthText: "実績 THB {actual}M | PO THB {po}M | 見積 THB {quot}M（成約率{quotRate}%）。見積フォローアップを強化。",
    marketingTips: "マーケティング戦略",
    marketingTipsText: "\"{topInd}\"が最大額。このセグメントに注力。ケーススタディを作成。",
    strengths: "強み",
    strengthsText: "成約平均 THB {avgWon}M vs 失注 THB {avgLost}M。大型案件に強い。\"{topWonInd}\"が得意分野。",
    weaknesses: "改善点",
    weaknessesText: "提案成約率{propRate}%が低い。提案品質向上と速度改善が必要。平均{age}日を短縮。",
    actionItems: "アクションアイテム",
    actionItemsText: "1) 期限超過{overdue}件フォロー 2) PO THB {po}M確定 3) 見積 THB {quot}M追跡 4) 提案 THB {prop}Mを見積へ",
    bestPerformer: "トップパフォーマー",
    bestPerformerText: "\"{name}\" THB {value}M（{won}件成約）。アプローチを全体に展開。",
    noStrengthData: "分析に十分なデータがありません。",
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
  monthlyByStage: Record<string, { payment: number; po: number; quotation: number; proposal: number }>;
  monthlyNewDeals: Record<string, { count: number; value: number }>;
  forecast: {
    actualRevenue: number; currentPO: number; currentQuotation: number; currentProposal: number;
    quotationToWonRate: number; proposalToWonRate: number;
    estimatedFromQuotation: number; estimatedFromProposal: number; totalForecast: number;
  };
  aiData: {
    ownerStats: { name: string; deals: number; value: number; won: number; wonValue: number; activities: number }[];
    activityTypeCount: Record<string, number>;
    industryStats: Record<string, { count: number; value: number }>;
    overdueDeals: number;
    avgDealAge: number;
    weightedPipeline: number;
    totalActivities: number;
    activeDealsCount: number;
    avgWonDealSize: number;
    avgLostDealSize: number;
    wonByIndustry: Record<string, { count: number; value: number }>;
    conversionRates: { overall: number; quotationToWon: number; proposalToWon: number };
  };
}

export default function SalesReportPanel({ lang = "th", filterProjectId = "all", refreshKey = 0 }:
  { lang?: "th" | "en" | "jp"; filterProjectId?: string; refreshKey?: number }) {
  const t = i18n[lang] || i18n.th;
  const monthNames = lang === "jp" ? months_jp : lang === "en" ? months_en : months_th;
  const getStageName = (stage: string) => STAGE_LABELS_I18N[stage]?.[lang] || STAGE_LABELS_I18N[stage]?.en || stage;
  const [tab, setTab] = useState<"summary" | "revenue" | "analysis">("summary");
  const [view, setView] = useState<"month" | "year">("month");
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

  const fmtM = (v: number) => `${(v / 1e6).toFixed(2)}M`;

  /* ── Derived data ── */
  const stageChartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.stageValue)
      .filter(([, v]) => v > 0)
      .map(([stage, value]) => ({
        name: getStageName(stage), value,
        count: data.stageCount[stage] || 0,
        color: STAGE_COLORS[stage] || "#6B7280",
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, lang]);

  // New deals monthly chart (for summary tab - replaces revenue chart)
  const newDealsChartData = useMemo(() => {
    if (!data?.monthlyNewDeals) return [];
    const yr = new Date().getFullYear();
    if (view === "month") {
      return Array.from({ length: 12 }, (_, i) => {
        const key = `${yr}-${String(i + 1).padStart(2, "0")}`;
        const d = data.monthlyNewDeals[key];
        return { name: monthNames[i], count: d?.count || 0, value: d?.value || 0 };
      });
    }
    const yearMap: Record<string, { count: number; value: number }> = {};
    Object.entries(data.monthlyNewDeals).forEach(([m, d]) => {
      const y = m.slice(0, 4);
      if (!yearMap[y]) yearMap[y] = { count: 0, value: 0 };
      yearMap[y].count += d.count;
      yearMap[y].value += d.value;
    });
    return Object.entries(yearMap).sort().map(([y, d]) => ({ name: y, count: d.count, value: d.value }));
  }, [data, view, lang]);

  // Revenue tab: actual revenue chart (payment_received only)
  const actualRevenueData = useMemo(() => {
    if (!data?.monthlyByStage) return [];
    const yr = new Date().getFullYear();
    if (view === "month") {
      return Array.from({ length: 12 }, (_, i) => {
        const key = `${yr}-${String(i + 1).padStart(2, "0")}`;
        const d = data.monthlyByStage[key];
        return { name: monthNames[i], payment: d?.payment || 0, po: d?.po || 0, quotation: d?.quotation || 0, proposal: d?.proposal || 0 };
      });
    }
    const yearMap: Record<string, { payment: number; po: number; quotation: number; proposal: number }> = {};
    Object.entries(data.monthlyByStage).forEach(([m, d]) => {
      const y = m.slice(0, 4);
      if (!yearMap[y]) yearMap[y] = { payment: 0, po: 0, quotation: 0, proposal: 0 };
      yearMap[y].payment += d.payment;
      yearMap[y].po += d.po;
      yearMap[y].quotation += d.quotation;
      yearMap[y].proposal += d.proposal;
    });
    return Object.entries(yearMap).sort().map(([y, d]) => ({ name: y, ...d }));
  }, [data, view, lang]);

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
  const fc = data?.forecast;

  /* ── Custom Tooltips ── */
  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-bold text-gray-800">{d.name}</p>
        <p className="text-gray-600">THB {fmtM(d.value)}</p>
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

      {/* ══════ TAB: SUMMARY (การขาย) ══════ */}
      {tab === "summary" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPI icon={Users} label={t.totalDeals} value={String(s?.totalDeals || 0)} color="#003087" />
            <KPI icon={CheckCircle2} label={t.closedWon} value={String(s?.wonCount || 0)} color="#22C55E" />
            <KPI icon={Activity} label={t.conversion} value={`${s?.conversionRate || 0}%`} color="#00AEEF" />
            <KPI icon={XCircle} label={t.lost} value={String(s?.lostCount || 0)} color="#EF4444" />
            <KPI icon={TrendingUp} label={t.pipeline} value={`THB ${fmtM(s?.totalPipeline || 0)}`} color="#F7941D" />
          </div>

          {/* Charts Row: New Deals Monthly + Stage Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* New Deals Monthly (replaces revenue chart in summary) */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="text-sm font-bold text-gray-800">{t.newDealsMonthly}</h3>
                <div className="flex gap-1.5">
                  <button onClick={() => setView("month")} className={`px-2.5 py-1 text-[11px] font-medium rounded-lg ${view === "month" ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-600"}`}>{t.month}</button>
                  <button onClick={() => setView("year")} className={`px-2.5 py-1 text-[11px] font-medium rounded-lg ${view === "year" ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-600"}`}>{t.year}</button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={newDealsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(v: any, name: any) => name === "value" ? [`THB ${fmtM(v)}`, t.dealValueLabel] : [v, t.dealCountLabel]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" name={t.dealCountLabel} fill="#00AEEF" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="value" name={t.dealValueLabel} stroke="#003087" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Stage Pie Chart */}
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
                      <td className="px-4 py-3 text-right text-gray-700">{fmtM(c.total)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════ TAB: REVENUE (รายได้) ══════ */}
      {tab === "revenue" && (
        <div className="space-y-4">
          {/* KPI: Revenue breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI icon={DollarSign} label={t.actualRevenue} value={`THB ${fmtM(fc?.actualRevenue || 0)}`} color="#059669" />
            <KPI icon={FileText} label={t.confirmedPO} value={`THB ${fmtM(fc?.currentPO || 0)}`} color="#22C55E" />
            <KPI icon={Briefcase} label={t.quotedValue} value={`THB ${fmtM(fc?.currentQuotation || 0)}`} color="#F7941D" />
            <KPI icon={Target} label={t.proposalValue} value={`THB ${fmtM(fc?.currentProposal || 0)}`} color="#003087" />
          </div>

          {/* Revenue by Category (Stacked Bar) */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-gray-800">{t.revenueByCategory}</h3>
              <div className="flex gap-1.5">
                <button onClick={() => setView("month")} className={`px-2.5 py-1 text-[11px] font-medium rounded-lg ${view === "month" ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-600"}`}>{t.month}</button>
                <button onClick={() => setView("year")} className={`px-2.5 py-1 text-[11px] font-medium rounded-lg ${view === "year" ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-600"}`}>{t.year}</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={actualRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                <Tooltip formatter={(v: any, name: any) => [`THB ${fmtM(v)}`, name]} />
                <Legend />
                <Bar dataKey="payment" name={t.payment} stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
                <Bar dataKey="po" name={t.po} stackId="a" fill="#22C55E" />
                <Bar dataKey="quotation" name={t.quotation} stackId="a" fill="#F7941D" />
                <Bar dataKey="proposal" name={t.proposal} stackId="a" fill="#003087" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Forecast Breakdown */}
          {fc && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#003087]" /> {t.forecastBreakdown}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Waterfall-style forecast */}
                <div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={[
                      { name: t.forecastActual, value: fc.actualRevenue, fill: "#059669" },
                      { name: t.forecastPO, value: fc.currentPO, fill: "#22C55E" },
                      { name: t.forecastQuotation, value: fc.estimatedFromQuotation, fill: "#F7941D" },
                      { name: t.forecastProposal, value: fc.estimatedFromProposal, fill: "#003087" },
                    ]} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e6).toFixed(1)}M`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip formatter={(v: any) => [`THB ${fmtM(v)}`, ""]} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {[
                          { fill: "#059669" }, { fill: "#22C55E" }, { fill: "#F7941D" }, { fill: "#003087" },
                        ].map((c, i) => <Cell key={i} fill={c.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Forecast summary */}
                <div className="space-y-3">
                  <ForecastRow label={t.forecastActual} value={fc.actualRevenue} color="#059669" icon={<CheckCircle2 size={14} />} />
                  <ForecastRow label={t.forecastPO} value={fc.currentPO} color="#22C55E" icon={<FileText size={14} />} />
                  <ForecastRow label={`${t.forecastQuotation} — ${t.convRate} ${fc.quotationToWonRate}%`} value={fc.estimatedFromQuotation} color="#F7941D" icon={<Briefcase size={14} />} />
                  <ForecastRow label={`${t.forecastProposal} — ${t.convRateProposal} ${fc.proposalToWonRate}%`} value={fc.estimatedFromProposal} color="#003087" icon={<Target size={14} />} />
                  <div className="border-t-2 border-[#003087] pt-3 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#003087]">{t.forecastTotal}</span>
                      <span className="text-lg font-bold text-[#003087]">THB {fmtM(fc.totalForecast)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline by expected close month */}
          {data?.pipelineByMonth && Object.keys(data.pipelineByMonth).length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3">{t.forecast} — Pipeline</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={Object.entries(data.pipelineByMonth).sort().map(([month, d]) => ({ name: month, total: d.total, weighted: d.weighted }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(v: any) => `THB ${fmtM(v)}`} />
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
                <KPI icon={Target} label={t.weighted} value={`THB ${fmtM(ai.weightedPipeline)}`} color="#003087" />
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
                            <td className="px-4 py-3 text-right text-gray-700">{fmtM(o.value)}</td>
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
                            <span className="ml-auto font-medium">{fmtM(d.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── AI Insights & Recommendations ── */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Lightbulb size={14} className="text-[#F7941D]" /> {t.aiRecommendations}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Overdue deals */}
                  {ai.overdueDeals > 0 && (
                    <InsightCard icon={<AlertCircle size={16} className="text-red-500" />} title={t.overdueTitle}
                      text={t.overdueText.replace("{count}", String(ai.overdueDeals))} severity="high" />
                  )}

                  {/* Revenue growth strategy */}
                  {fc && (
                    <InsightCard icon={<TrendingUp size={16} className="text-green-600" />} title={t.revenueGrowth}
                      text={t.revenueGrowthText
                        .replace("{actual}", fmtM(fc.actualRevenue))
                        .replace("{po}", fmtM(fc.currentPO))
                        .replace("{quot}", fmtM(fc.currentQuotation))
                        .replace("{quotRate}", String(fc.quotationToWonRate))
                      } severity="info" />
                  )}

                  {/* Marketing tips */}
                  {(() => {
                    const topInd = industryChartData[0];
                    return topInd ? (
                      <InsightCard icon={<Megaphone size={16} className="text-purple-500" />} title={t.marketingTips}
                        text={t.marketingTipsText.replace("{topInd}", topInd.name)} severity="info" />
                    ) : null;
                  })()}

                  {/* Strengths */}
                  {ai.avgWonDealSize > 0 ? (() => {
                    const topWonInd = Object.entries(ai.wonByIndustry || {}).sort((a, b) => b[1].value - a[1].value)[0];
                    return (
                      <InsightCard icon={<Star size={16} className="text-green-500" />} title={t.strengths}
                        text={t.strengthsText
                          .replace("{avgWon}", fmtM(ai.avgWonDealSize))
                          .replace("{avgLost}", fmtM(ai.avgLostDealSize))
                          .replace("{topWonInd}", topWonInd?.[0] || "-")
                        } severity="info" />
                    );
                  })() : (
                    <InsightCard icon={<Star size={16} className="text-gray-400" />} title={t.strengths}
                      text={t.noStrengthData} severity="info" />
                  )}

                  {/* Weaknesses */}
                  {ai.conversionRates && (
                    <InsightCard icon={<Shield size={16} className="text-orange-500" />} title={t.weaknesses}
                      text={t.weaknessesText
                        .replace("{propRate}", String(ai.conversionRates.proposalToWon))
                        .replace("{age}", String(ai.avgDealAge))
                      } severity="medium" />
                  )}

                  {/* Low conversion */}
                  {ai.activeDealsCount > 0 && Number(s?.conversionRate || 0) < 30 && (
                    <InsightCard icon={<Target size={16} className="text-orange-500" />} title={t.lowConversion}
                      text={t.lowConversionText.replace("{rate}", s?.conversionRate || "0")} severity="medium" />
                  )}

                  {/* Coaching needed */}
                  {ai.ownerStats.some(o => o.deals > 0 && o.won === 0) && (
                    <InsightCard icon={<Users size={16} className="text-blue-500" />} title={t.coachingNeeded}
                      text={t.coachingText} severity="medium" />
                  )}

                  {/* Best performer */}
                  {(() => {
                    const best = ai.ownerStats.filter(o => o.won > 0).sort((a, b) => b.wonValue - a.wonValue)[0];
                    return best ? (
                      <InsightCard icon={<Award size={16} className="text-yellow-500" />} title={t.bestPerformer}
                        text={t.bestPerformerText
                          .replace(/\{name\}/g, best.name)
                          .replace("{value}", fmtM(best.wonValue))
                          .replace("{won}", String(best.won))
                        } severity="info" />
                    ) : null;
                  })()}

                  {/* Action items */}
                  {fc && (
                    <InsightCard icon={<Zap size={16} className="text-[#003087]" />} title={t.actionItems}
                      text={t.actionItemsText
                        .replace("{overdue}", String(ai.overdueDeals))
                        .replace("{po}", fmtM(fc.currentPO))
                        .replace("{quot}", fmtM(fc.currentQuotation))
                        .replace("{prop}", fmtM(fc.currentProposal))
                      } severity="high" />
                  )}

                  {/* Pipeline health */}
                  {ai.weightedPipeline > 0 && (
                    <InsightCard icon={<DollarSign size={16} className="text-green-500" />} title={t.pipelineHealth}
                      text={t.pipelineHealthText.replace("{value}", fmtM(ai.weightedPipeline)).replace("{count}", String(ai.activeDealsCount)).replace("{age}", String(ai.avgDealAge))} severity="info" />
                  )}

                  {/* Top activity */}
                  {(() => {
                    const topType = activityChartData[0];
                    return topType ? (
                      <InsightCard icon={<Zap size={16} className="text-yellow-500" />} title={t.topActivity}
                        text={t.topActivityText.replace("{name}", topType.name).replace("{count}", String(topType.value))} severity="info" />
                    ) : null;
                  })()}

                  {/* Top industry */}
                  {(() => {
                    const topInd = industryChartData[0];
                    return topInd ? (
                      <InsightCard icon={<Building2 size={16} className="text-purple-500" />} title={t.topIndustry}
                        text={t.topIndustryText.replace("{name}", topInd.name).replace("{value}", fmtM(topInd.value)).replace("{count}", String(topInd.count))} severity="info" />
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

function ForecastRow({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex-shrink-0 p-1.5 rounded-md" style={{ backgroundColor: color + "20", color }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-600 truncate">{label}</div>
      </div>
      <div className="text-sm font-bold text-gray-800 whitespace-nowrap">THB {(value / 1e6).toFixed(2)}M</div>
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
