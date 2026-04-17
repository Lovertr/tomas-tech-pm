'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, GripVertical } from 'lucide-react';
import TranslateButton from './TranslateButton';

interface Props {
  projects: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null }[];
  members: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
}

interface Deal {
  id: string;
  title: string;
  customer_id: string;
  customer_name: string;
  value: number;
  stage: 'prospect' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';
  expected_close_date?: string;
  probability?: number;
  owner?: string;
  notes?: string;
}

interface Customer {
  id: string;
  company_name: string;
}

const stageConfig = {
  prospect: { name: 'ผู้สนใจ', color: '#6B7280', order: 1 },
  qualification: { name: 'ประเมิน', color: '#3B82F6', order: 2 },
  proposal: { name: 'เสนอให้', color: '#F7941D', order: 3 },
  negotiation: { name: 'เจรจา', color: '#8B5CF6', order: 4 },
  won: { name: 'ปิดข้อมูล', color: '#22C55E', order: 5 },
  lost: { name: 'สูญหาย', color: '#EF4444', order: 6 },
};

const stageKeys = Object.keys(stageConfig) as Array<keyof typeof stageConfig>;

export default function DealsPipelinePanel({
  projects,
  members,
  filterProjectId,
  canManage = true,
  refreshKey = 0,
}: Props) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerFilter, setCustomerFilter] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    customer_id: '',
    value: 0,
    stage: 'prospect' as 'prospect' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost',
    expected_close_date: '',
    probability: 50,
    notes: '',
  });

  useEffect(() => {
    fetchDeals();
    fetchCustomers();
  }, [filterProjectId, refreshKey]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/deals');
      if (res.ok) {
        const json = await res.json();
        const mapped = (json.deals ?? []).map((d: Record<string, unknown>) => ({
          ...d,
          customer_name: (d.customers as { company_name?: string })?.company_name ?? '',
          owner: (d.owner as { email?: string })?.email ?? '',
        }));
        setDeals(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.customers ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = selectedDeal ? 'PATCH' : 'POST';
      const url = selectedDeal ? `/api/deals/${selectedDeal.id}` : '/api/deals';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchDeals();
        setShowForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save deal:', error);
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    try {
      const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDeals();
      }
    } catch (error) {
      console.error('Failed to delete deal:', error);
    }
  };

  const handleChangeStage = async (dealId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });

      if (res.ok) {
        await fetchDeals();
      }
    } catch (error) {
      console.error('Failed to update deal stage:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      customer_id: '',
      value: 0,
      stage: 'prospect',
      expected_close_date: '',
      probability: 50,
      notes: '',
    });
    setSelectedDeal(null);
  };

  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setFormData({
      title: deal.title,
      customer_id: deal.customer_id,
      value: deal.value,
      stage: deal.stage,
      expected_close_date: deal.expected_close_date || '',
      probability: deal.probability || 50,
      notes: deal.notes || '',
    });
    setShowForm(true);
  };

  const dealsByStage = stageKeys.reduce((acc, stage) => {
    acc[stage] = deals.filter(
      (d) => d.stage === stage && (!customerFilter || d.customer_id === customerFilter)
    );
    return acc;
  }, {} as Record<string, Deal[]>);

  const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0);
  const summary: { totalPipeline: number; wonValue: number; wonCount: number; totalDeals: number; conversionRate: string; avgDealSize: number } = {
    totalPipeline,
    wonValue: deals
      .filter((d) => d.stage === 'won')
      .reduce((sum, d) => sum + d.value, 0),
    wonCount: deals.filter((d) => d.stage === 'won').length,
    totalDeals: deals.length,
    conversionRate:
      deals.length > 0
        ? ((deals.filter((d) => d.stage === 'won').length / deals.length) * 100).toFixed(1)
        : '0',
    avgDealSize: deals.length > 0 ? Math.round(totalPipeline / deals.length) : 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">ท่อจัดการจำหน่ายสินค้า</h2>
          <p className="text-gray-400 text-sm mt-1">ติดตามการจัดการจำหน่ายสินค้าในแต่ละขั้นตอน</p>
        </div>
        <div className="flex gap-2">
          <TranslateButton text="Pipeline การขาย — ติดตามดีลในแต่ละขั้นตอน" />
          {canManage && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              จำหน่ายสินค้าใหม่
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">ท่อรวม</p>
          <p className="text-2xl font-bold text-white mt-2">
            ฿{(summary.totalPipeline / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-gray-500 mt-1">{summary.totalDeals} ข้อมูล</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">ปิดข้อมูล</p>
          <p className="text-2xl font-bold text-green-400 mt-2">
            ฿{(summary.wonValue / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-gray-500 mt-1">{summary.wonCount} ข้อมูล</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">อัตราแปลง</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">{summary.conversionRate}%</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">ขนาดข้อมูลเฉลี่ย</p>
          <p className="text-2xl font-bold text-orange-400 mt-2">
            ฿{(summary.avgDealSize / 1000).toFixed(0)}K
          </p>
        </div>
      </div>

      {/* Customer Filter */}
      <div>
        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="w-full md:w-64 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
        >
          <option value="">ทั้งหมด</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.company_name}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stageKeys.map((stage) => (
          <div
            key={stage}
            className="flex-shrink-0 w-full md:min-w-[350px] lg:min-w-[280px]"
          >
            <div
              className="rounded-xl border-2 bg-[#0F172A] overflow-hidden"
              style={{ borderColor: stageConfig[stage].color + '40' }}
            >
              {/* Stage Header */}
              <div
                className="p-3 text-white font-semibold flex items-center justify-between"
                style={{ backgroundColor: stageConfig[stage].color + '20' }}
              >
                <span>{stageConfig[stage].name}</span>
                <span
                  className="text-xs rounded-full w-6 h-6 flex items-center justify-center"
                  style={{ backgroundColor: stageConfig[stage].color, color: '#0F172A' }}
                >
                  {dealsByStage[stage].length}
                </span>
              </div>

              {/* Stage Value */}
              <div
                className="px-3 py-2 border-b border-[#334155] text-xs text-gray-400"
                style={{ backgroundColor: stageConfig[stage].color + '10' }}
              >
                ฿{(dealsByStage[stage].reduce((sum, d) => sum + d.value, 0) / 1000).toFixed(0)}K
              </div>

              {/* Deal Cards */}
              <div className="p-2 space-y-2 min-h-[400px]">
                {dealsByStage[stage].length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">ไม่มีข้อมูล</div>
                ) : (
                  dealsByStage[stage].map((deal) => (
                    <div
                      key={deal.id}
                      className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 hover:border-[#003087] transition group"
                    >
                      <div className="space-y-2">
                        {/* Title */}
                        <div className="flex items-start gap-2">
                          <GripVertical size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-white text-sm line-clamp-2">
                              {deal.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">{deal.customer_name}</p>
                          </div>
                        </div>

                        {/* Value */}
                        <div className="flex items-center justify-between">
                          <span
                            className="text-sm font-semibold px-2 py-1 rounded"
                            style={{
                              color: stageConfig[deal.stage].color,
                              backgroundColor: stageConfig[deal.stage].color + '20',
                            }}
                          >
                            ฿{(deal.value / 1000).toFixed(0)}K
                          </span>
                          {deal.probability && (
                            <span className="text-xs text-gray-400">
                              {deal.probability}%
                            </span>
                          )}
                        </div>

                        {/* Date */}
                        {deal.expected_close_date && (
                          <p className="text-xs text-gray-400">
                            {new Date(deal.expected_close_date).toLocaleDateString('th-TH')}
                          </p>
                        )}

                        {/* Actions */}
                        {canManage && (
                          <div className="flex gap-1 pt-2 border-t border-[#334155] opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => handleEditDeal(deal)}
                              className="flex-1 px-2 py-1 bg-[#003087] hover:bg-[#0040B0] text-white rounded text-xs flex items-center justify-center gap-1"
                            >
                              <Edit2 size={12} />
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteDeal(deal.id)}
                              className="flex-1 px-2 py-1 bg-red-900 hover:bg-red-800 text-white rounded text-xs flex items-center justify-center gap-1"
                            >
                              <Trash2 size={12} />
                              ลบ
                            </button>
                          </div>
                        )}

                        {/* Stage Buttons */}
                        {canManage && stage !== 'won' && stage !== 'lost' && (
                          <div className="flex gap-1 pt-2">
                            <button
                              onClick={() => {
                                const nextStageIndex = stageKeys.indexOf(stage) + 1;
                                if (nextStageIndex < stageKeys.length) {
                                  handleChangeStage(deal.id, stageKeys[nextStageIndex]);
                                }
                              }}
                              className="flex-1 px-2 py-1 bg-[#F7941D] hover:bg-[#FF9D2D] text-black rounded text-xs font-medium"
                            >
                              ต่อไป
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] rounded-xl border border-[#334155] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {selectedDeal ? 'แก้ไขจำหน่ายสินค้า' : 'เพิ่มจำหน่ายสินค้าใหม่'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ชื่อจำหน่ายสินค้า *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ลูกค้า *
                  </label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  >
                    <option value="">เลือกลูกค้า</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    มูลค่า (฿) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: parseFloat(e.target.value) })
                    }
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ขั้นตอน *
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  >
                    {stageKeys.map((stage) => (
                      <option key={stage} value={stage}>
                        {stageConfig[stage].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    วันปิดที่คาดหวัง
                  </label>
                  <input
                    type="date"
                    value={formData.expected_close_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expected_close_date: e.target.value })
                    }
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ความน่าจะเป็น (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) =>
                      setFormData({ ...formData, probability: parseInt(e.target.value) })
                    }
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087] resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm font-medium"
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded-lg text-sm font-medium"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
