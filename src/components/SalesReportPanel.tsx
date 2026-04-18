'use client';

import { useState, useEffect } from 'react';
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
import { TrendingUp, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import TranslateButton from './TranslateButton';

interface Props {
  projects: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null }[];
  members: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
  lang?: Lang;
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
}

const COLORS = ['#003087', '#F7941D', '#00AEEF', '#10B981', '#6366F1', '#EF4444', '#8B5CF6'];

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
      },
    };
    return panelText[lang][key] || key;
  };
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(false);

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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipConfig}
                formatter={(value: any) => `฿${(value / 1000).toFixed(0)}K`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Revenue Area Chart */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
        <h3 className="font-semibold text-gray-900 mb-4">{L('monthlyRevenue')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={reportData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={tooltipConfig}
              formatter={(value: any) => `฿${(value / 1000).toFixed(0)}K`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#F7941D"
              fill="#F79C3D"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

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
