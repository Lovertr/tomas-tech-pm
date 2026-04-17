'use client';

import { useState, useEffect } from 'react';
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

const stageNames: Record<string, string> = {
  prospect: 'ผู้สนใจ',
  qualification: 'ประเมิน',
  proposal: 'เสนอให้',
  negotiation: 'เจรจา',
  won: 'ปิดข้อมูล',
  lost: 'สูญหาย',
};

export default function SalesReportPanel({
  projects,
  members,
  filterProjectId,
  canManage = true,
  refreshKey = 0,
}: Props) {
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
        <p className="text-gray-400">กำลังโหลด...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-400">ไม่พบข้อมูล</p>
      </div>
    );
  }

  const stageChartData = Object.entries(reportData.stageCount).map(([stage, count]) => ({
    name: stageNames[stage] || stage,
    value: count,
  }));

  const pieChartData = Object.entries(reportData.stageValue)
    .filter(([_, value]) => value > 0)
    .map(([stage, value]) => ({
      name: stageNames[stage] || stage,
      value: Math.round(value),
    }));

  const tooltipConfig = {
    background: '#1E293B',
    border: 'none',
    borderRadius: 12,
    color: '#F8FAFC',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">รายงานการขาย</h2>
          <p className="text-gray-400 text-sm mt-1">สรุปประสิทธิภาพการขายและแนวโน้ม</p>
        </div>
        <div>
          <TranslateButton text="รายงานการขาย — สรุปประสิทธิภาพการขายและแนวโน้ม" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">จำหน่ายสินค้า</p>
            <DollarSign size={20} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{reportData.summary.totalDeals}</p>
          <p className="text-xs text-gray-500 mt-2">
            ท่อรวม: ฿{(reportData.summary.totalPipeline / 1000).toFixed(0)}K
          </p>
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">ปิดข้อมูล</p>
            <CheckCircle size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-400">{reportData.summary.wonCount}</p>
          <p className="text-xs text-gray-500 mt-2">
            ฿{(reportData.summary.wonValue / 1000).toFixed(0)}K
          </p>
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">อัตราแปลง</p>
            <TrendingUp size={20} className="text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-orange-400">
            {reportData.summary.conversionRate}%
          </p>
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">สูญหาย</p>
            <AlertCircle size={20} className="text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400">{reportData.summary.lostCount}</p>
        </div>

        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">ขนาดเฉลี่ย</p>
            <DollarSign size={20} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400">
            ฿{reportData.summary.totalDeals > 0
              ? ((reportData.summary.totalPipeline / reportData.summary.totalDeals) / 1000).toFixed(0)
              : 0}K
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Count Bar Chart */}
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <h3 className="font-semibold text-white mb-4">จำหน่ายสินค้าตามขั้นตอน</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stageChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={tooltipConfig} />
              <Bar dataKey="value" fill="#003087" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Value Pie Chart */}
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <h3 className="font-semibold text-white mb-4">มูลค่าตามขั้นตอน</h3>
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
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
        <h3 className="font-semibold text-white mb-4">แนวโน้มรายได้รายเดือน</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={reportData.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
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
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
        <h3 className="font-semibold text-white mb-4">ลูกค้าชั้นนำ</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">ชื่อลูกค้า</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">มูลค่า</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">จำหน่ายสินค้า</th>
              </tr>
            </thead>
            <tbody>
              {reportData.topCustomers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                reportData.topCustomers.map((customer, index) => (
                  <tr
                    key={index}
                    className="border-b border-[#334155] hover:bg-[#0F172A] transition"
                  >
                    <td className="py-3 px-4 text-white">{customer.name}</td>
                    <td className="text-right py-3 px-4">
                      <span className="font-semibold text-green-400">
                        ฿{(customer.total / 1000).toFixed(0)}K
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-400">{customer.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
        <h3 className="font-semibold text-white mb-4">กิจกรรมล่าสุด</h3>
        <div className="space-y-3">
          {reportData.recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ไม่มีข้อมูล</div>
          ) : (
            reportData.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-3 border-b border-[#334155] last:border-b-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
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
          รีเฟรช
        </button>
        <button
          disabled
          className="flex-1 px-4 py-2 bg-[#334155] text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
        >
          ส่งออก PDF
        </button>
      </div>
    </div>
  );
}
