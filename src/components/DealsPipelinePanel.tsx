'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, GripVertical, User } from 'lucide-react';
import TranslateButton from './TranslateButton';
import type { Lang } from '@/lib/i18n';

interface Props {
  projects: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null }[];
  members: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
  lang?: Lang;
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
  owner_id?: string;
  owner_name?: string;
  notes?: string;
}

interface Customer {
  id: string;
  company_name: string;
}

interface Member {
  id: string;
  display_name?: string;
  first_name_th?: string | null;
  last_name_th?: string | null;
  first_name_en?: string | null;
  last_name_en?: string | null;
}

const stageLabels: Record<string, Record<string, string>> = {
  prospect:      { th: 'ลูกค้าเป้าหมาย', en: 'Prospect',      jp: '見込み客' },
  qualification: { th: 'คุณสมบัติ',       en: 'Qualification',  jp: '適格性評価' },
  proposal:      { th: 'เสนอราคา',        en: 'Proposal',       jp: '提案' },
  negotiation:   { th: 'เจรจาต่อรอง',     en: 'Negotiation',    jp: '交渉' },
  won:           { th: 'ปิดการขาย',        en: 'Won',            jp: '受注' },
  lost:          { th: 'ไม่สำเร็จ',        en: 'Lost',           jp: '失注' },
};

const stageColors: Record<string, string> = {
  prospect: '#6B7280', qualification: '#3B82F6', proposal: '#F7941D',
  negotiation: '#8B5CF6', won: '#22C55E', lost: '#EF4444',
};

const panelText: Record<string, Record<string, string>> = {
  title:         { th: 'Pipeline การขาย',                   en: 'Sales Pipeline',                  jp: '営業パイプライン' },
  subtitle:      { th: 'ติดตามดีลในแต่ละขั้นตอน',             en: 'Track deals through each stage',  jp: '各段階のディールを追跡' },
  addDeal:       { th: '+ สร้างดีลใหม่',                     en: '+ New Deal',                      jp: '+ 新規ディール' },
  totalPipeline: { th: 'มูลค่ารวม Pipeline',                 en: 'Total Pipeline',                  jp: 'パイプライン合計' },
  wonDeals:      { th: 'ปิดการขายได้',                       en: 'Won Deals',                       jp: '受注済み' },
  conversionRate:{ th: 'อัตราการปิดการขาย',                  en: 'Conversion Rate',                 jp: 'コンバージョン率' },
  avgDealSize:   { th: 'มูลค่าเฉลี่ยต่อดีล',                 en: 'Avg Deal Size',                   jp: '平均ディール規模' },
  deals:         { th: 'ดีล',                                en: 'deals',                           jp: 'ディール' },
  allCustomers:  { th: 'ลูกค้าทั้งหมด',                      en: 'All Customers',                   jp: 'すべての顧客' },
  noDeals:       { th: 'ไม่มีดีล',                           en: 'No deals',                        jp: 'ディールなし' },
  editBtn:       { th: 'แก้ไข',                              en: 'Edit',                            jp: '編集' },
  deleteBtn:     { th: 'ลบ',                                 en: 'Delete',                          jp: '削除' },
  nextStage:     { th: 'เลื่อนขั้น',                          en: 'Advance',                         jp: '次へ' },
  editDeal:      { th: 'แก้ไขดีล',                           en: 'Edit Deal',                       jp: 'ディール編集' },
  newDeal:       { th: 'สร้างดีลใหม่',                       en: 'New Deal',                        jp: '新規ディール' },
  dealTitle:     { th: 'ชื่อดีล',                             en: 'Deal Title',                      jp: 'ディール名' },
  customer:      { th: 'ลูกค้า',                             en: 'Customer',                        jp: '顧客' },
  selectCustomer:{ th: 'เลือกลูกค้า',                        en: 'Select customer',                 jp: '顧客を選択' },
  value:         { th: 'มูลค่า (฿)',                          en: 'Value (฿)',                       jp: '金額 (฿)' },
  stage:         { th: 'ขั้นตอน',                             en: 'Stage',                           jp: 'ステージ' },
  owner:         { th: 'ผู้รับผิดชอบ',                        en: 'Owner',                           jp: '担当者' },
  selectOwner:   { th: 'เลือกผู้รับผิดชอบ',                   en: 'Select owner',                    jp: '担当者を選択' },
  closeDate:     { th: 'วันปิดการขายที่คาดหวัง',               en: 'Expected Close Date',             jp: '予定クローズ日' },
  probability:   { th: 'ความน่าจะเป็น (%)',                   en: 'Probability (%)',                 jp: '確率 (%)' },
  notes:         { th: 'หมายเหตุ',                            en: 'Notes',                           jp: '備考' },
  save:          { th: 'บันทึก',                              en: 'Save',                            jp: '保存' },
  cancel:        { th: 'ยกเลิก',                             en: 'Cancel',                          jp: 'キャンセル' },
  confirmDelete: { th: 'ยืนยันการลบดีลนี้?',                  en: 'Delete this deal?',               jp: 'このディールを削除しますか？' },
};

const stageKeys: Array<'prospect' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost'> = ['prospect', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];

export default function DealsPipelinePanel({
  projects,
  members,
  filterProjectId,
  canManage = true,
  refreshKey = 0,
  lang = 'th',
}: Props) {
  const L = (key: string) => panelText[key]?.[lang] ?? panelText[key]?.th ?? key;
  const stageName = (s: string) => stageLabels[s]?.[lang] ?? stageLabels[s]?.th ?? s;

  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerFilter, setCustomerFilter] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    customer_id: '',
    owner_id: '',
    value: 0,
    stage: 'prospect' as 'prospect' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost',
    expected_close_date: '',
    probability: 50,
    notes: '',
  });

  useEffect(() => {
    fetchDeals();
    fetchCustomers();
    fetchMembers();
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
          owner_id: d.owner_id ?? '',
          owner_name: (d.owner as { display_name?: string })?.display_name ?? '',
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

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        setAllMembers(json.users ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
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
    if (!confirm(L('confirmDelete'))) return;
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
      owner_id: '',
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
      owner_id: deal.owner_id || '',
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
          <h2 className="text-2xl font-bold text-white">{L('title')}</h2>
          <p className="text-gray-400 text-sm mt-1">{L('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <TranslateButton text={`${L('title')} — ${L('subtitle')}`} />
          {canManage && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              {L('addDeal')}
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">{L('totalPipeline')}</p>
          <p className="text-2xl font-bold text-white mt-2">฿{(summary.totalPipeline / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500 mt-1">{summary.totalDeals} {L('deals')}</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">{L('wonDeals')}</p>
          <p className="text-2xl font-bold text-green-400 mt-2">฿{(summary.wonValue / 1000).toFixed(0)}K</p>
          <p className="text-xs text-gray-500 mt-1">{summary.wonCount} {L('deals')}</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">{L('conversionRate')}</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">{summary.conversionRate}%</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">{L('avgDealSize')}</p>
          <p className="text-2xl font-bold text-orange-400 mt-2">฿{(summary.avgDealSize / 1000).toFixed(0)}K</p>
        </div>
      </div>

      {/* Customer Filter */}
      <div>
        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="w-full md:w-64 bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
        >
          <option value="">{L('allCustomers')}</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.company_name}</option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stageKeys.map((stage) => (
          <div key={stage} className="flex-shrink-0 w-full md:min-w-[350px] lg:min-w-[280px]">
            <div className="rounded-xl border-2 bg-[#0F172A] overflow-hidden" style={{ borderColor: stageColors[stage] + '40' }}>
              <div className="p-3 text-white font-semibold flex items-center justify-between" style={{ backgroundColor: stageColors[stage] + '20' }}>
                <span>{stageName(stage)}</span>
                <span className="text-xs rounded-full w-6 h-6 flex items-center justify-center" style={{ backgroundColor: stageColors[stage], color: '#0F172A' }}>
                  {dealsByStage[stage].length}
                </span>
              </div>
              <div className="px-3 py-2 border-b border-[#334155] text-xs text-gray-400" style={{ backgroundColor: stageColors[stage] + '10' }}>
                ฿{(dealsByStage[stage].reduce((sum, d) => sum + d.value, 0) / 1000).toFixed(0)}K
              </div>
              <div className="p-2 space-y-2 min-h-[400px]">
                {dealsByStage[stage].length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">{L('noDeals')}</div>
                ) : (
                  dealsByStage[stage].map((deal) => (
                    <div key={deal.id} className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 hover:border-[#003087] transition group">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <GripVertical size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-white text-sm line-clamp-2">{deal.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">{deal.customer_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold px-2 py-1 rounded" style={{ color: stageColors[deal.stage], backgroundColor: stageColors[deal.stage] + '20' }}>
                            ฿{(deal.value / 1000).toFixed(0)}K
                          </span>
                          {deal.probability != null && (
                            <span className="text-xs text-gray-400">{deal.probability}%</span>
                          )}
                        </div>
                        {/* Owner */}
                        {deal.owner_name && (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <User size={11} />
                            <span>{deal.owner_name}</span>
                          </div>
                        )}
                        {deal.expected_close_date && (
                          <p className="text-xs text-gray-400">
                            {new Date(deal.expected_close_date).toLocaleDateString(lang === 'jp' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'th-TH')}
                          </p>
                        )}
                        {canManage && (
                          <div className="flex gap-1 pt-2 border-t border-[#334155] opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => handleEditDeal(deal)} className="flex-1 px-2 py-1 bg-[#003087] hover:bg-[#0040B0] text-white rounded text-xs flex items-center justify-center gap-1">
                              <Edit2 size={12} />{L('editBtn')}
                            </button>
                            <button onClick={() => handleDeleteDeal(deal.id)} className="flex-1 px-2 py-1 bg-red-900 hover:bg-red-800 text-white rounded text-xs flex items-center justify-center gap-1">
                              <Trash2 size={12} />{L('deleteBtn')}
                            </button>
                          </div>
                        )}
                        {canManage && stage !== 'won' && stage !== 'lost' && (
                          <div className="flex gap-1 pt-2">
                            <button
                              onClick={() => {
                                const nextStageIndex = stageKeys.indexOf(stage) + 1;
                                if (nextStageIndex < stageKeys.length) handleChangeStage(deal.id, stageKeys[nextStageIndex]);
                              }}
                              className="flex-1 px-2 py-1 bg-[#F7941D] hover:bg-[#FF9D2D] text-black rounded text-xs font-medium"
                            >
                              {L('nextStage')}
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
                {selectedDeal ? L('editDeal') : L('newDeal')}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">{L('dealTitle')} *</label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{L('customer')} *</label>
                  <select required value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]">
                    <option value="">{L('selectCustomer')}</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{L('owner')}</label>
                  <select value={formData.owner_id} onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]">
                    <option value="">{L('selectOwner')}</option>
                    {allMembers.map((m) => <option key={m.id} value={m.id}>{m.display_name || `${m.first_name_en ?? ''} ${m.last_name_en ?? ''}`}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{L('value')} *</label>
                  <input type="number" required value={formData.value} onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{L('stage')} *</label>
                  <select value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value as Deal['stage'] })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]">
                    {stageKeys.map((s) => <option key={s} value={s}>{stageName(s)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{L('closeDate')}</label>
                  <input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{L('probability')} *</label>
                  <input type="number" min="0" max="100" value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">{L('notes')}</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087] resize-none" rows={3} />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm font-medium">{L('save')}</button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded-lg text-sm font-medium">{L('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
