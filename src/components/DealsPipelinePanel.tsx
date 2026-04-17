'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, User, Search } from 'lucide-react';
import TranslateButton from './TranslateButton';
import type { Lang } from '@/lib/i18n';

interface Props {
  projects: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null }[];
  members: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
  lang?: Lang;
  currentUserId?: string;
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

/* ─── Stage config ─── */
const stageLabels: Record<string, Record<string, string>> = {
  prospect:      { th: 'ลูกค้าเป้าหมาย', en: 'Lead',           jp: '見込み客' },
  qualification: { th: 'คุณสมบัติ',       en: 'Qualified',      jp: '適格性評価' },
  proposal:      { th: 'เสนอราคา',        en: 'Proposal',       jp: '提案' },
  negotiation:   { th: 'เจรจาต่อรอง',     en: 'Negotiation',    jp: '交渉' },
  won:           { th: 'ปิดการขาย',        en: 'Won',            jp: '受注' },
  lost:          { th: 'ไม่สำเร็จ',        en: 'Lost',           jp: '失注' },
};

const stageColors: Record<string, string> = {
  prospect: '#6B7280', qualification: '#3B82F6', proposal: '#F7941D',
  negotiation: '#8B5CF6', won: '#22C55E', lost: '#EF4444',
};

/* ─── i18n text ─── */
const panelText: Record<string, Record<string, string>> = {
  title:           { th: 'Sales Pipeline',                        en: 'Sales Pipeline',                  jp: '営業パイプライン' },
  addDeal:         { th: 'เพิ่ม Deal',                             en: 'Add Deal',                        jp: 'ディール追加' },
  searchName:      { th: 'Deal name...',                           en: 'Deal name...',                    jp: 'ディール名...' },
  searchCustomer:  { th: 'ลูกค้า...',                              en: 'Customer...',                     jp: '顧客...' },
  searchOwner:     { th: 'ผู้รับผิดชอบ...',                         en: 'Owner...',                        jp: '担当者...' },
  myDeal:          { th: 'MY DEAL',                                en: 'MY DEAL',                         jp: 'MY DEAL' },
  clickToEdit:     { th: 'Click to edit',                          en: 'Click to edit',                   jp: 'クリックして編集' },
  noDeals:         { th: 'ไม่มีดีล',                               en: 'No deals',                        jp: 'ディールなし' },
  editDeal:        { th: 'แก้ไขดีล',                               en: 'Edit Deal',                       jp: 'ディール編集' },
  newDeal:         { th: 'สร้างดีลใหม่',                           en: 'New Deal',                        jp: '新規ディール' },
  dealTitle:       { th: 'ชื่อดีล',                                 en: 'Deal Title',                      jp: 'ディール名' },
  customer:        { th: 'ลูกค้า',                                 en: 'Customer',                        jp: '顧客' },
  selectCustomer:  { th: 'เลือกลูกค้า',                            en: 'Select customer',                 jp: '顧客を選択' },
  value:           { th: 'มูลค่า (฿)',                              en: 'Value (฿)',                       jp: '金額 (฿)' },
  stage:           { th: 'ขั้นตอน',                                 en: 'Stage',                           jp: 'ステージ' },
  owner:           { th: 'ผู้รับผิดชอบ',                            en: 'Owner',                           jp: '担当者' },
  selectOwner:     { th: 'เลือกผู้รับผิดชอบ',                       en: 'Select owner',                    jp: '担当者を選択' },
  closeDate:       { th: 'วันปิดการขายที่คาดหวัง',                   en: 'Expected Close Date',             jp: '予定クローズ日' },
  probability:     { th: 'ความน่าจะเป็น (%)',                       en: 'Probability (%)',                 jp: '確率 (%)' },
  notes:           { th: 'หมายเหตุ',                                en: 'Notes',                           jp: '備考' },
  save:            { th: 'บันทึก',                                  en: 'Save',                            jp: '保存' },
  cancel:          { th: 'ยกเลิก',                                 en: 'Cancel',                          jp: 'キャンセル' },
  confirmDelete:   { th: 'ยืนยันการลบดีลนี้?',                      en: 'Delete this deal?',               jp: 'このディールを削除しますか？' },
};

const stageKeys: Array<Deal['stage']> = ['prospect', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];

/** Format number with commas: 3800000 → "3,800,000" */
const fmt = (n: number) => n.toLocaleString('en-US');

export default function DealsPipelinePanel({
  projects,
  members,
  filterProjectId,
  canManage = true,
  refreshKey = 0,
  lang = 'th',
  currentUserId,
}: Props) {
  const L = (key: string) => panelText[key]?.[lang] ?? panelText[key]?.en ?? key;
  const stageName = (s: string) => stageLabels[s]?.[lang] ?? stageLabels[s]?.en ?? s;

  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(false);

  /* ─── Search / filter state ─── */
  const [searchName, setSearchName] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchOwner, setSearchOwner] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    customer_id: '',
    owner_id: '',
    value: 0,
    stage: 'prospect' as Deal['stage'],
    expected_close_date: '',
    probability: 50,
    notes: '',
  });

  useEffect(() => {
    fetchDeals();
    fetchCustomers();
    fetchMembers();
  }, [filterProjectId, refreshKey]);

  /* ─── Data fetching ─── */
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

  /* ─── CRUD ─── */
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
      if (res.ok) await fetchDeals();
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
      if (res.ok) await fetchDeals();
    } catch (error) {
      console.error('Failed to update deal stage:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', customer_id: '', owner_id: '', value: 0,
      stage: 'prospect', expected_close_date: '', probability: 50, notes: '',
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

  /* ─── Filtering ─── */
  const filteredDeals = deals.filter((d) => {
    if (searchName && !d.title.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchCustomer && !d.customer_name.toLowerCase().includes(searchCustomer.toLowerCase())) return false;
    if (searchOwner && !d.owner_name?.toLowerCase().includes(searchOwner.toLowerCase())) return false;
    return true;
  });

  const dealsByStage = stageKeys.reduce((acc, stage) => {
    acc[stage] = filteredDeals.filter((d) => d.stage === stage);
    return acc;
  }, {} as Record<string, Deal[]>);

  const isMyDeal = (deal: Deal) => currentUserId ? deal.owner_id === currentUserId : false;

  /* ─── Render ─── */
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">{L('title')}</h2>
        <div className="flex gap-2">
          <TranslateButton text={L('title')} />
          {canManage && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-[#F7941D] hover:bg-[#FF9D2D] text-white rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              {L('addDeal')}
            </button>
          )}
        </div>
      </div>

      {/* Search / filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder={L('searchName')}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm w-full md:w-48 focus:ring-2 focus:ring-[#003087] placeholder:text-gray-400"
        />
        <input
          type="text"
          placeholder={L('searchCustomer')}
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm w-[calc(50%-0.25rem)] md:w-40 focus:ring-2 focus:ring-[#003087] placeholder:text-gray-400"
        />
        <input
          type="text"
          placeholder={L('searchOwner')}
          value={searchOwner}
          onChange={(e) => setSearchOwner(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm w-[calc(50%-0.25rem)] md:w-40 focus:ring-2 focus:ring-[#003087] placeholder:text-gray-400"
        />
        <button
          onClick={() => { /* filters are live */ }}
          className="p-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg"
        >
          <Search size={16} />
        </button>
        <span className="text-sm text-gray-400 ml-1">{filteredDeals.length}/{deals.length}</span>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
        {stageKeys.map((stage) => {
          const col = dealsByStage[stage];
          return (
            <div key={stage} className="flex-shrink-0" style={{ minWidth: 240, width: 240 }}>
              {/* Column header */}
              <div
                className="rounded-t-lg px-3 py-2 font-bold text-white flex items-center justify-between"
                style={{ backgroundColor: stageColors[stage] }}
              >
                <span>{stageName(stage)} ({col.length})</span>
              </div>

              {/* Cards */}
              <div className="bg-[#0F172A] border border-t-0 rounded-b-lg p-2 space-y-2 min-h-[420px]" style={{ borderColor: stageColors[stage] + '40' }}>
                {col.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">{L('noDeals')}</div>
                ) : (
                  col.map((deal) => {
                    const mine = isMyDeal(deal);
                    return (
                      <div
                        key={deal.id}
                        className={`rounded-lg p-3 border transition cursor-pointer ${
                          mine
                            ? 'bg-[#FFF7ED] border-[#F7941D] hover:shadow-md'
                            : 'bg-white border-gray-200 hover:border-[#003087] hover:shadow-md'
                        }`}
                        onClick={() => mine && canManage ? handleEditDeal(deal) : undefined}
                      >
                        {/* MY DEAL badge */}
                        {mine && (
                          <span className="inline-block text-[10px] font-bold text-white bg-[#F7941D] rounded px-1.5 py-0.5 mb-1.5">
                            {L('myDeal')}
                          </span>
                        )}

                        <h4 className={`font-semibold text-sm leading-tight ${mine ? 'text-[#003087]' : 'text-gray-900'}`}>
                          {deal.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{deal.customer_name}</p>

                        {/* Value */}
                        <p className={`text-sm font-bold mt-2 ${
                          stage === 'won' ? 'text-green-600'
                            : stage === 'lost' ? 'text-red-500'
                            : 'text-gray-800'
                        }`}>
                          {fmt(deal.value)} THB
                        </p>

                        {/* Probability + Owner */}
                        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                          <span>{deal.probability ?? 0}%</span>
                          {deal.owner_name && (
                            <span className="flex items-center gap-1">
                              <User size={10} />
                              {deal.owner_name}
                            </span>
                          )}
                        </div>

                        {/* Click to edit hint for my deals */}
                        {mine && canManage && (
                          <p className="text-[10px] text-[#F7941D] mt-1 font-medium">{L('clickToEdit')}</p>
                        )}

                        {/* Action buttons (admin/manager — hover) */}
                        {canManage && !mine && (
                          <div className="flex gap-1 pt-2 mt-2 border-t border-gray-100 opacity-0 hover:opacity-100 transition">
                            <button onClick={(e) => { e.stopPropagation(); handleEditDeal(deal); }}
                              className="flex-1 px-2 py-1 bg-[#003087] hover:bg-[#0040B0] text-white rounded text-xs flex items-center justify-center gap-1">
                              <Edit2 size={10} /> {lang === 'th' ? 'แก้ไข' : lang === 'jp' ? '編集' : 'Edit'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }}
                              className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center justify-center gap-1">
                              <Trash2 size={10} /> {lang === 'th' ? 'ลบ' : lang === 'jp' ? '削除' : 'Del'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
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
