'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Lang } from '@/lib/i18n';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, DollarSign, CheckCircle, AlertCircle, Brain, ChevronDown, ChevronUp, Users, Activity, Target, Zap } from 'lucide-react';
import TranslateButton from './TranslateButton';

interface Props {
  projects: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null }[];
  members: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
  lang?: Lang;
}

interface OwnerStat {
  name: string;
  deals: number;
  value: number;
  won: number;
  wonValue: number;
  activities: number;
}

interface AIData {
  ownerStats: OwnerStat[];
  activityTypeCount: Record<string, number>;
  industryStats: Record<string, { count: number; value: number }>;
  overdueDeals: number;
  avgDealAge: number;
  weightedPipeline: number;
  totalActivities: number;
  activeDealsCount: number;
}

interface SalesReportData {
  summary: {
    totalDeals: number;
    totalPipeline: number;
    wonValue: number;
    wonCount: number;
    lostCount: number;
    conversionRate: string;
  };
  stageCount: Record<string, number>;
  stageValue: Record<string, number>;
  monthlyData: Array<{ month: string; value: number }>;
  topCustomers: Array<{ name: string; total: number; count: number }>;
  recentActivities: Array<{ id: string; description: string; date: string }>;
  pipelineByMonth?: Record<string, { total: number; weighted: number; count: number }>;
  aiData?: AIData;
}

const COLORS = ['#003087', '#F7941D', '#00AEEF', '#10B981', '#6366F1', '#EF4444', '#8B5CF6'];

const MONTH_NAMES: Record<string, string[]> = {
  th: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  jp: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

/* ── Revenue Chart with Month/Year toggle ── */
function RevenueChart({
  monthlyData,
  pipelineByMonth,
  revenueView,
  setRevenueView,
  selectedYear,
  setSelectedYear,
  tooltipConfig,
  L,
  lang,
}: {
  monthlyData: Array<{ month: string; value: number }>;
  pipelineByMonth?: Record<string, { total: number; weighted: number; count: number }>;
  revenueView: 'month' | 'year';
  setRevenueView: (v: 'month' | 'year') => void;
  selectedYear: string;
  setSelectedYear: (y: string) => void;
  tooltipConfig: any;
  L: (key: string) => string;
  lang: string;
}) {
  // Collect all available years from actual data + pipeline
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    monthlyData.forEach(d => yearSet.add(d.month.slice(0, 4)));
    if (pipelineByMonth) {
      Object.keys(pipelineByMonth).forEach(m => yearSet.add(m.slice(0, 4)));
    }
    // Always include current year
    yearSet.add(new Date().getFullYear().toString());
    return Array.from(yearSet).sort();
  }, [monthlyData, pipelineByMonth]);

  // For "year" view: build 12-month chart with actual + forecast
  const yearChartData = useMemo(() => {
    if (revenueView !== 'year') return [];

    const now = new Date();
    const currentYearStr = now.getFullYear().toString();
    const currentMonth = now.getMonth(); // 0-indexed
    const mNames = MONTH_NAMES[lang] || MONTH_NAMES.en;

    // Build a map of actual revenue for the selected year
    const actualMap: Record<string, number> = {};
    monthlyData.forEach(d => {
      if (d.month.startsWith(selectedYear)) {
        actualMap[d.month] = d.value;
      }
    });

    // Calculate average monthly revenue from actual data for fallback forecast
    const actualValues = Object.values(actualMap).filter(v => v > 0);
    const avgMonthly = actualValues.length > 0
      ? actualValues.reduce((a, b) => a + b, 0) / actualValues.length
      : 0;

    return Array.from({ length: 12 }, (_, i) => {
      const monthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
      const actualVal = actualMap[monthKey] || 0;
      const isPast = selectedYear < currentYearStr || (selectedYear === currentYearStr && i <= currentMonth);

      let forecastVal = 0;
      if (!isPast) {
        // Use pipeline weighted value if available, otherwise use average
        const pipeline = pipelineByMonth?.[monthKey];
        forecastVal = pipeline ? pipeline.weighted : avgMonthly * 0.7;
      }

      return {
        month: mNames[i],
        actual: Math.round(actualVal),
        forecast: Math.round(isPast ? 0 : forecastVal),
        isForecast: !isPast,
      };
    });
  }, [revenueView, selectedYear, monthlyData, pipelineByMonth, lang]);

  // For "month" view: use raw monthly data (all time)
  const monthChartData = useMemo(() => {
    if (revenueView !== 'month') return [];
    const mNames = MONTH_NAMES[lang] || MONTH_NAMES.en;
    return monthlyData.map(d => {
      const mIdx = parseInt(d.month.slice(5, 7), 10) - 1;
      return {
        month: `${mNames[mIdx]} ${d.month.slice(2, 4)}`,
        value: d.value,
      };
    });
  }, [revenueView, monthlyData, lang]);

  return (
    <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-gray-900">{L('monthlyRevenue')}</h3>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-[#E2E8F0] overflow-hidden text-xs">
            <button
              onClick={() => setRevenueView('month')}
              className={`px-3 py-1.5 font-medium transition ${revenueView === 'month' ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {L('viewByMonth')}
            </button>
            <button
              onClick={() => setRevenueView('year')}
              className={`px-3 py-1.5 font-medium transition ${revenueView === 'year' ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {L('viewByYear')}
            </button>
          </div>
          {/* Year Selector (only in year view) */}
          {revenueView === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-gray-700 bg-white"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Legend for year view */}
      {revenueView === 'year' && (
        <div className="flex items-center gap-4 mb-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#F7941D]" />
            <span className="text-gray-600">{L('actual')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#00AEEF] opacity-60" />
            <span className="text-gray-600">{L('forecast')}</span>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        {revenueView === 'month' ? (
          <AreaChart data={monthChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={tooltipConfig}
              formatter={(value: any) => `฿${(value / 1000).toFixed(0)}K`}
            />
            <Area type="monotone" dataKey="value" stroke="#F7941D" fill="#F79C3D" fillOpacity={0.3} />
          </AreaChart>
        ) : (
          <BarChart data={yearChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={tooltipConfig}
              formatter={(value: any, name: string) => [
                `฿${(value / 1000).toFixed(0)}K`,
                name === 'actual' ? L('actual') : L('forecast'),
              ]}
            />
            <Bar dataKey="actual" fill="#F7941D" radius={[4, 4, 0, 0]} stackId="revenue" />
            <Bar dataKey="forecast" fill="#00AEEF" fillOpacity={0.5} radius={[4, 4, 0, 0]} stackId="revenue" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

const stageNamesI18n: Record<string, Record<string, string>> = {
  waiting_present:    { th: 'รอนำเสนอ',          en: 'Waiting to Present',    jp: 'プレゼン待ち' },
  contacted:          { th: 'ติดต่อแล้ว',         en: 'Contacted',             jp: '連絡済み' },
  proposal_submitted: { th: 'เสนอ Proposal',     en: 'Proposal Submitted',    jp: '提案済み' },
  proposal_confirmed: { th: 'คอนเฟิร์ม Proposal', en: 'Proposal Confirmed',   jp: '提案承認' },
  quotation:          { th: 'เสนอราคา',           en: 'Quotation',             jp: '見積もり' },
  negotiation:        { th: 'เจรจาต่อรอง',        en: 'Negotiation',           jp: '交渉中' },
  waiting_po:         { th: 'รอ PO',              en: 'Waiting PO',            jp: 'PO待機' },
  po_received:        { th: 'ได้รับ PO',           en: 'PO Received',           jp: 'PO受領' },
  cancelled:          { th: 'ยกเลิก',             en: 'Cancelled',             jp: 'キャンセル' },
  refused:            { th: 'ปฏิเสธ',             en: 'Refused',               jp: '拒否' },
};

export default function SalesReportPanel({
  projects,
  members,
  filterProjectId,
  canManage = true,
  refreshKey = 0,
  lang = 'th',
}: Props) {
  const L = (key: string) => {
    const panelText: Record<Lang, Record<string, string>> = {
      th: {
        loading: 'กำลังโหลด...',
        noData: 'ไม่พบข้อมูล',
        title: 'รายงานการขาย',
        subtitle: 'สรุปประสิทธิภาพการขายและแนวโน้ม',
        translateText: 'รายงานการขาย — สรุปประสิทธิภาพการขายและแนวโน้ม',
        totalDeals: 'ดีลทั้งหมด',
        pipeline: 'มูลค่ารวม Pipeline',
        closed: 'ปิดการขายได้',
        conversionRate: 'อัตราปิดการขาย',
        lost: 'ไม่สำเร็จ',
        avgDealSize: 'มูลค่าเฉลี่ยต่อดีล',
        dealsByStage: 'ดีลตามขั้นตอน',
        valueByStage: 'มูลค่าตามขั้นตอน',
        monthlyRevenue: 'แนวโน้มรายได้รายเดือน',
        topCustomers: 'ลูกค้าชั้นนำ',
        customerName: 'ชื่อลูกค้า',
        value: 'มูลค่า',
        deals: 'ดีล',
        recentActivities: 'กิจกรรมล่าสุด',
        refresh: 'รีเฟรช',
        export: 'ส่งออก PDF',
        viewByMonth: 'รายเดือน',
        viewByYear: 'รายปี',
        actual: 'จริง',
        forecast: 'คาดการณ์',
        selectYear: 'เลือกปี',
        aiAnalysis: 'วิเคราะห์โดย AI',
        aiAnalysisDesc: 'วิเคราะห์ข้อมูลการขายทั้งหมดด้วย AI เพื่อให้คำแนะนำ',
        analyzing: 'กำลังวิเคราะห์...',
        pipelineHealth: 'สุขภาพ Pipeline',
        salesVelocity: 'ความเร็วการขาย',
        teamPerformance: 'ประสิทธิภาพทีม',
        industryInsights: 'อุตสาหกรรม',
        activityAnalysis: 'การวิเคราะห์กิจกรรม',
        recommendations: 'คำแนะนำเพื่อเพิ่มยอดขาย',
        overdueDealAlert: 'ดีลเลยกำหนด',
        weightedPipeline: 'Pipeline (ถ่วงน้ำหนัก)',
        avgDealAge: 'อายุดีลเฉลี่ย',
        days: 'วัน',
      },
      en: {
        loading: 'Loading...',
        noData: 'No data available',
        title: 'Sales Report',
        subtitle: 'Sales performance and trend summary',
        translateText: 'Sales Report — Sales performance and trend summary',
        totalDeals: 'Total Deals',
        pipeline: 'Pipeline',
        closed: 'Closed Won',
        conversionRate: 'Conversion Rate',
        lost: 'Lost',
        avgDealSize: 'Avg Deal Size',
        dealsByStage: 'Deals by Stage',
        valueByStage: 'Value by Stage',
        monthlyRevenue: 'Monthly Revenue Trend',
        topCustomers: 'Top Customers',
        customerName: 'Customer Name',
        value: 'Value',
        deals: 'Deals',
        recentActivities: 'Recent Activities',
        refresh: 'Refresh',
        export: 'Export PDF',
        viewByMonth: 'Monthly',
        viewByYear: 'Yearly',
        actual: 'Actual',
        forecast: 'Forecast',
        selectYear: 'Select Year',
        aiAnalysis: 'AI Analysis',
        aiAnalysisDesc: 'Analyze all sales data with AI for actionable insights',
        analyzing: 'Analyzing...',
        pipelineHealth: 'Pipeline Health',
        salesVelocity: 'Sales Velocity',
        teamPerformance: 'Team Performance',
        industryInsights: 'Industry Insights',
        activityAnalysis: 'Activity Analysis',
        recommendations: 'Recommendations to Increase Sales',
        overdueDealAlert: 'Overdue Deals',
        weightedPipeline: 'Weighted Pipeline',
        avgDealAge: 'Avg Deal Age',
        days: 'days',
      },
      jp: {
        loading: '読み込み中...',
        noData: 'データが見つかりません',
        title: '売上レポート',
        subtitle: '売上パフォーマンスとトレンドの要約',
        translateText: '売上レポート — 売上パフォーマンスとトレンドの要約',
        totalDeals: '総取引件数',
        pipeline: 'パイプライン',
        closed: '完了',
        conversionRate: 'コンバージョン率',
        lost: '失敗',
        avgDealSize: '平均取引額',
        dealsByStage: 'ステージ別の取引',
        valueByStage: 'ステージ別の価値',
        monthlyRevenue: '月間収益トレンド',
        topCustomers: 'トップ顧客',
        customerName: '顧客名',
        value: '価値',
        deals: '取引',
        recentActivities: '最近のアクティビティ',
        refresh: '更新',
        export: 'PDF をエクスポート',
        viewByMonth: '月別',
        viewByYear: '年別',
        actual: '実績',
        forecast: '予測',
        selectYear: '年を選択',
        aiAnalysis: 'AI分析',
        aiAnalysisDesc: 'AIで全売上データを分析し、提案を取得',
        analyzing: '分析中...',
        pipelineHealth: 'パイプライン健全性',
        salesVelocity: '営業速度',
        teamPerformance: 'チームパフォーマンス',
        industryInsights: '業界インサイト',
        activityAnalysis: 'アクティビティ分析',
        recommendations: '売上向上のための提案',
        overdueDealAlert: '期限超過',
        weightedPipeline: '加重パイプライン',
        avgDealAge: '平均取引期間',
        days: '日',
      },
    };
    return panelText[lang][key] || key;
  };
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(true);
  const [revenueView, setRevenueView] = useState<'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    fetchReport();
  }, [filterProjectId, refreshKey]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sales-report');
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIAnalysis = useCallback(() => {
    if (!reportData?.aiData) return;
    setAiLoading(true);
    setAiExpanded(true);

    // Simulate a brief analysis delay for UX feel
    setTimeout(() => {
      const ai = reportData.aiData!;
      const s = reportData.summary;
      const insights: string[] = [];

      // 1. Pipeline Health
      const pipelineRatio = s.wonValue > 0 ? (s.totalPipeline / s.wonValue) : 0;
      if (ai.overdueDeals > 0) {
        insights.push(`⚠️ [${L('overdueDealAlert')}] ${lang === 'en' ? `${ai.overdueDeals} deals are past their expected close date. Review and update timelines or re-engage these prospects.` : lang === 'jp' ? `${ai.overdueDeals}件の取引が予定終了日を過ぎています。タイムラインを見直すか、再度アプローチしてください。` : `มี ${ai.overdueDeals} ดีลที่เลยกำหนดปิดการขาย ควรทบทวนและติดตามหรือปรับแผนใหม่`}`);
      }
      insights.push(`📊 [${L('pipelineHealth')}] ${lang === 'en' ? `Weighted pipeline value: ฿${(ai.weightedPipeline / 1000).toFixed(0)}K. Active deals: ${ai.activeDealsCount}. Pipeline-to-won ratio: ${pipelineRatio.toFixed(1)}x.${pipelineRatio < 3 ? ' Consider adding more leads to maintain healthy coverage (target 3-5x).' : pipelineRatio > 6 ? ' Pipeline is large relative to wins — focus on converting existing opportunities.' : ' Pipeline coverage is healthy.'}` : lang === 'jp' ? `加重パイプライン: ฿${(ai.weightedPipeline / 1000).toFixed(0)}K、アクティブ取引: ${ai.activeDealsCount}件、カバレッジ比: ${pipelineRatio.toFixed(1)}x` : `Pipeline ถ่วงน้ำหนัก: ฿${(ai.weightedPipeline / 1000).toFixed(0)}K, ดีลที่กำลังดำเนินการ: ${ai.activeDealsCount}, อัตราส่วน Pipeline ต่อยอดขาย: ${pipelineRatio.toFixed(1)}x${pipelineRatio < 3 ? ' — ควรเพิ่ม Lead ใหม่ (เป้าหมาย 3-5x)' : pipelineRatio > 6 ? ' — Pipeline ใหญ่เกินไป ควรเน้นปิดดีลที่มีอยู่' : ' — สมดุลดี'}`}`);

      // 2. Sales Velocity
      insights.push(`⚡ [${L('salesVelocity')}] ${lang === 'en' ? `Average deal age: ${ai.avgDealAge} days. Conversion rate: ${s.conversionRate}%.${ai.avgDealAge > 60 ? ' Deals are aging — consider shortening the sales cycle with faster follow-ups and clearer proposals.' : ai.avgDealAge > 30 ? ' Moderate pace. Look for bottleneck stages.' : ' Fast-moving pipeline!'}` : lang === 'jp' ? `平均取引期間: ${ai.avgDealAge}日、コンバージョン率: ${s.conversionRate}%` : `อายุดีลเฉลี่ย: ${ai.avgDealAge} วัน, อัตราปิดการขาย: ${s.conversionRate}%${ai.avgDealAge > 60 ? ' — ดีลค้างนาน ควรเร่งติดตามและส่ง Proposal ที่ชัดเจน' : ai.avgDealAge > 30 ? ' — ความเร็วปานกลาง ตรวจสอบขั้นตอนที่ติดขัด' : ' — Pipeline เคลื่อนไหวดี!'}`}`);

      // 3. Team Performance
      if (ai.ownerStats.length > 0) {
        const sorted = [...ai.ownerStats].sort((a, b) => b.wonValue - a.wonValue);
        const topSeller = sorted[0];
        const totalTeamValue = sorted.reduce((sum, o) => sum + o.value, 0);
        const topPct = totalTeamValue > 0 ? ((topSeller.value / totalTeamValue) * 100).toFixed(0) : '0';
        insights.push(`👥 [${L('teamPerformance')}] ${lang === 'en' ? `Top seller: ${topSeller.name} (Won ฿${(topSeller.wonValue / 1000).toFixed(0)}K from ${topSeller.won} deals, ${topSeller.activities} activities). Handles ${topPct}% of total pipeline value.${sorted.length > 1 && sorted[sorted.length - 1].activities < sorted[0].activities * 0.3 ? ' Some team members have low activity — consider coaching or redistributing leads.' : ''}` : lang === 'jp' ? `トップセラー: ${topSeller.name} (成約 ฿${(topSeller.wonValue / 1000).toFixed(0)}K, ${topSeller.won}件)` : `ผู้ขายอันดับ 1: ${topSeller.name} (ปิดได้ ฿${(topSeller.wonValue / 1000).toFixed(0)}K จาก ${topSeller.won} ดีล, กิจกรรม ${topSeller.activities} ครั้ง) รับผิดชอบ ${topPct}% ของ Pipeline ทั้งหมด${sorted.length > 1 && sorted[sorted.length - 1].activities < sorted[0].activities * 0.3 ? ' — บางคนมีกิจกรรมน้อย ควรให้คำแนะนำหรือกระจาย Lead ใหม่' : ''}`}`);
      }

      // 4. Industry Insights
      const industryArr = Object.entries(ai.industryStats).sort((a, b) => b[1].value - a[1].value);
      if (industryArr.length > 0) {
        const topInd = industryArr.slice(0, 3).map(([name, stat]) =>
          `${name} (${stat.count} ${lang === 'en' ? 'deals' : lang === 'jp' ? '件' : 'ดีล'}, ฿${(stat.value / 1000).toFixed(0)}K)`
        ).join(', ');
        insights.push(`🏭 [${L('industryInsights')}] ${lang === 'en' ? `Top industries: ${topInd}. Focus prospecting in your strongest verticals to maximize conversion.` : lang === 'jp' ? `主要業界: ${topInd}` : `อุตสาหกรรมหลัก: ${topInd} — ควรเน้นหาลูกค้าใหม่ในอุตสาหกรรมที่แข็งแกร่งเพื่อเพิ่มโอกาสปิดการขาย`}`);
      }

      // 5. Activity Analysis
      const actTypes = Object.entries(ai.activityTypeCount).sort((a, b) => b[1] - a[1]);
      if (actTypes.length > 0) {
        const topActs = actTypes.slice(0, 3).map(([type, count]) => `${type} (${count})`).join(', ');
        const hasProposal = ai.activityTypeCount['present_proposal'] || 0;
        const hasMeeting = (ai.activityTypeCount['online_meeting'] || 0) + (ai.activityTypeCount['site_meeting'] || 0);
        insights.push(`📋 [${L('activityAnalysis')}] ${lang === 'en' ? `Total activities: ${ai.totalActivities}. Most common: ${topActs}.${hasMeeting < hasProposal ? ' More meetings could help strengthen proposals.' : ''}` : lang === 'jp' ? `総アクティビティ: ${ai.totalActivities}件。主要: ${topActs}` : `กิจกรรมทั้งหมด: ${ai.totalActivities} ครั้ง, มากที่สุด: ${topActs}${hasMeeting < hasProposal ? ' — ควรเพิ่มการประชุมเพื่อเสริมความแข็งแกร่งของ Proposal' : ''}`}`);
      }

      // 6. Recommendations
      const recs: string[] = [];
      if (ai.overdueDeals > 0) {
        recs.push(lang === 'en' ? `Immediately review ${ai.overdueDeals} overdue deals — close, reschedule, or disqualify` : lang === 'jp' ? `${ai.overdueDeals}件の期限超過取引を即座にレビュー` : `ทบทวน ${ai.overdueDeals} ดีลที่เลยกำหนดทันที — ปิด, เลื่อน, หรือยกเลิก`);
      }
      if (parseFloat(s.conversionRate) < 20) {
        recs.push(lang === 'en' ? 'Improve qualification criteria — conversion rate is below 20%' : lang === 'jp' ? '評価基準を改善 — コンバージョン率が20%未満' : 'ปรับปรุงเกณฑ์คัดกรอง Lead — อัตราปิดการขายต่ำกว่า 20%');
      }
      if (ai.avgDealAge > 45) {
        recs.push(lang === 'en' ? `Shorten sales cycle (currently ${ai.avgDealAge} days avg) — set clear next steps after each meeting` : lang === 'jp' ? `営業サイクルを短縮（現在平均${ai.avgDealAge}日）` : `ลดระยะเวลาปิดการขาย (ปัจจุบันเฉลี่ย ${ai.avgDealAge} วัน) — กำหนด next step ชัดเจนหลังทุกการประชุม`);
      }
      if (ai.totalActivities < ai.activeDealsCount * 2) {
        recs.push(lang === 'en' ? 'Increase activity volume — aim for at least 2-3 touchpoints per active deal per week' : lang === 'jp' ? 'アクティビティ量を増やす — アクティブ取引あたり週2-3回を目標' : 'เพิ่มจำนวนกิจกรรม — เป้าหมายอย่างน้อย 2-3 ครั้งต่อดีลต่อสัปดาห์');
      }
      recs.push(lang === 'en' ? 'Schedule weekly pipeline reviews to keep deals moving and identify stalled opportunities early' : lang === 'jp' ? '毎週パイプラインレビューを実施し、停滞案件を早期に特定' : 'จัดประชุม Review Pipeline ทุกสัปดาห์เพื่อให้ดีลเดินหน้าและพบปัญหาเร็ว');
      if (industryArr.length > 2) {
        recs.push(lang === 'en' ? `Double down on top industry (${industryArr[0][0]}) — it has the highest deal value` : lang === 'jp' ? `トップ業界（${industryArr[0][0]}）に注力` : `เน้นอุตสาหกรรม ${industryArr[0][0]} ซึ่งมีมูลค่าดีลสูงสุด`);
      }

      insights.push(`💡 [${L('recommendations')}]\n${recs.map((r, i) => `   ${i + 1}. ${r}`).join('\n')}`);

      setAiAnalysis(insights);
      setAiLoading(false);
    }, 1500);
  }, [reportData, lang]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{L('loading')}</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{L('noData')}</p>
      </div>
    );
  }

  const stageChartData = Object.entries(reportData.stageCount).map(([stage, count]) => ({
    name: stageNamesI18n[stage]?.[lang] ?? stage,
    value: count,
  }));

  const pieChartData = Object.entries(reportData.stageValue)
    .filter(([_, value]) => value > 0)
    .map(([stage, value]) => ({
      name: stageNamesI18n[stage]?.[lang] ?? stage,
      value: Math.round(value),
    }));

  const tooltipConfig = {
    background: '#FFFFFF',
    border: 'none',
    borderRadius: 12,
    color: '#1F2937',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{L('title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{L('subtitle')}</p>
        </div>
        <div>
          <TranslateButton text={L('translateText')} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-sm">{L('totalDeals')}</p>
            <DollarSign size={20} className="text-blue-700" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{reportData.summary.totalDeals}</p>
          <p className="text-xs text-gray-500 mt-2">
            {L('pipeline')}: ฿{(reportData.summary.totalPipeline / 1000).toFixed(0)}K
          </p>
        </div>

        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-sm">{L('closed')}</p>
            <CheckCircle size={20} className="text-green-700" />
          </div>
          <p className="text-3xl font-bold text-green-700">{reportData.summary.wonCount}</p>
          <p className="text-xs text-gray-500 mt-2">
            ฿{(reportData.summary.wonValue / 1000).toFixed(0)}K
          </p>
        </div>

        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-sm">{L('conversionRate')}</p>
            <TrendingUp size={20} className="text-orange-700" />
          </div>
          <p className="text-3xl font-bold text-orange-700">
            {reportData.summary.conversionRate}%
          </p>
        </div>

        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-sm">{L('lost')}</p>
            <AlertCircle size={20} className="text-red-700" />
          </div>
          <p className="text-3xl font-bold text-red-700">{reportData.summary.lostCount}</p>
        </div>

        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-sm">{L('avgDealSize')}</p>
            <DollarSign size={20} className="text-purple-700" />
          </div>
          <p className="text-2xl font-bold text-purple-700">
            ฿{reportData.summary.totalDeals > 0
              ? ((reportData.summary.totalPipeline / reportData.summary.totalDeals) / 1000).toFixed(0)
              : 0}K
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Count Bar Chart */}
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <h3 className="font-semibold text-gray-900 mb-4">{L('dealsByStage')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={tooltipConfig} />
              <Bar dataKey="value" fill="#003087" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Value Pie Chart */}
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <h3 className="font-semibold text-gray-900 mb-4">{L('valueByStage')}</h3>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                label={(props: any) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={{ strokeWidth: 1 }}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipConfig}
                formatter={(value: any) => `฿${(value / 1000).toFixed(0)}K`}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string, entry: any) => {
                  const item = pieChartData.find(d => d.name === value);
                  return item ? `${value}: ฿${(item.value / 1000).toFixed(0)}K` : value;
                }}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Revenue Area Chart with Year/Month Toggle */}
      <RevenueChart
        monthlyData={reportData.monthlyData}
        pipelineByMonth={reportData.pipelineByMonth}
        revenueView={revenueView}
        setRevenueView={setRevenueView}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        tooltipConfig={tooltipConfig}
        L={L}
        lang={lang}
      />

      {/* Top Customers */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
        <h3 className="font-semibold text-gray-900 mb-4">{L('topCustomers')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">{L('customerName')}</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">{L('value')}</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">{L('deals')}</th>
              </tr>
            </thead>
            <tbody>
              {reportData.topCustomers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500">
                    {L('noData')}
                  </td>
                </tr>
              ) : (
                reportData.topCustomers.map((customer, index) => (
                  <tr
                    key={index}
                    className="border-b border-[#E2E8F0] hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 text-gray-900">{customer.name}</td>
                    <td className="text-right py-3 px-4">
                      <span className="font-semibold text-green-700">
                        ฿{(customer.total / 1000).toFixed(0)}K
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-500">{customer.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
        <h3 className="font-semibold text-gray-900 mb-4">{L('recentActivities')}</h3>
        <div className="space-y-3">
          {reportData.recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">{L('noData')}</div>
          ) : (
            reportData.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-3 border-b border-[#E2E8F0] last:border-b-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="text-gray-900 text-sm">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.date).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-gradient-to-br from-[#003087]/5 to-[#00AEEF]/5 rounded-xl border border-[#003087]/20 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#003087] to-[#00AEEF] rounded-xl flex items-center justify-center">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{L('aiAnalysis')}</h3>
                <p className="text-xs text-gray-500">{L('aiAnalysisDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {aiAnalysis && (
                <button
                  onClick={() => setAiExpanded(!aiExpanded)}
                  className="p-1.5 rounded-lg hover:bg-white/60 text-gray-500 transition"
                >
                  {aiExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              )}
              <button
                onClick={generateAIAnalysis}
                disabled={aiLoading || !reportData?.aiData}
                className="px-4 py-2 bg-gradient-to-r from-[#003087] to-[#00AEEF] hover:from-[#0040B0] hover:to-[#00BFF0] text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {L('analyzing')}
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    {L('aiAnalysis')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Quick Stats */}
          {reportData?.aiData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white/70 rounded-lg p-3 border border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-1">
                  <Target size={14} className="text-[#003087]" />
                  <span className="text-xs text-gray-500">{L('weightedPipeline')}</span>
                </div>
                <p className="text-lg font-bold text-[#003087]">฿{(reportData.aiData.weightedPipeline / 1000).toFixed(0)}K</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 border border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={14} className="text-[#F7941D]" />
                  <span className="text-xs text-gray-500">{L('avgDealAge')}</span>
                </div>
                <p className="text-lg font-bold text-[#F7941D]">{reportData.aiData.avgDealAge} {L('days')}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 border border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle size={14} className="text-red-600" />
                  <span className="text-xs text-gray-500">{L('overdueDealAlert')}</span>
                </div>
                <p className="text-lg font-bold text-red-600">{reportData.aiData.overdueDeals}</p>
              </div>
              <div className="bg-white/70 rounded-lg p-3 border border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-[#00AEEF]" />
                  <span className="text-xs text-gray-500">{L('teamPerformance')}</span>
                </div>
                <p className="text-lg font-bold text-[#00AEEF]">{reportData.aiData.ownerStats.length} {lang === 'en' ? 'sellers' : lang === 'jp' ? '名' : 'คน'}</p>
              </div>
            </div>
          )}

          {/* AI Analysis Results */}
          {aiAnalysis && aiExpanded && (
            <div className="space-y-3 mt-3">
              {aiAnalysis.map((insight, index) => (
                <div
                  key={index}
                  className="bg-white/80 rounded-lg p-4 border border-[#E2E8F0] text-sm text-gray-800 whitespace-pre-line leading-relaxed"
                >
                  {insight}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export/Refresh */}
      <div className="flex gap-3">
        <button
          onClick={fetchReport}
          className="flex-1 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm font-medium transition"
        >
          {L('refresh')}
        </button>
        <button
          disabled
          className="flex-1 px-4 py-2 bg-[#E2E8F0] text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
        >
          {L('export')}
        </button>
      </div>
    </div>
  );
}
