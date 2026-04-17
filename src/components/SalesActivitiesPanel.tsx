'use client';

import { useState, useEffect } from 'react';
import type { Lang } from '@/lib/i18n';
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Zap,
  Trash2,
  X,
  Clock,
} from 'lucide-react';
import TranslateButton from './TranslateButton';

interface Props {
  projects: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null }[];
  members: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
  lang?: Lang;
}

interface DealActivity {
  id: string;
  deal_id: string;
  deal_title: string;
  customer_name: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'demo' | 'follow_up';
  description: string;
  date: string;
  performer?: string;
}

interface Deal {
  id: string;
  title: string;
  customer_name: string;
}

const activityTypeConfig = {
  call: { name: 'สาย', icon: Phone, color: '#3B82F6', bg: '#1E40AF' },
  email: { name: 'อีเมล', icon: Mail, color: '#F7941D', bg: '#92400E' },
  meeting: { name: 'การประชุม', icon: Calendar, color: '#8B5CF6', bg: '#4C1D95' },
  note: { name: 'หมายเหตุ', icon: FileText, color: '#06B6D4', bg: '#164E63' },
  task: { name: 'งาน', icon: CheckSquare, color: '#22C55E', bg: '#14532D' },
  demo: { name: 'สาธิต', icon: Zap, color: '#EC4899', bg: '#500724' },
  follow_up: { name: 'ติดตาม', icon: Clock, color: '#10B981', bg: '#064E3B' },
};

type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'demo' | 'follow_up';

const panelText = {
  th: {
    title: 'กิจกรรมการขาย',
    subtitle: 'ติดตามกิจกรรมการขายและการโต้ตอบ',
    headerTranslate: 'กิจกรรมการขาย — ติดตามกิจกรรมการขายและการโต้ตอบ',
    addActivity: 'เพิ่มกิจกรรม',
    stats: {
      total: 'ทั้งหมด',
      call: 'โทรศัพท์',
      email: 'อีเมล',
      meeting: 'ประชุม',
    },
    filters: {
      all: 'ทั้งหมด',
      groupByDate: 'จัดกลุ่มตามวันที่',
    },
    activities: {
      loading: 'กำลังโหลด...',
      noActivities: 'ไม่พบกิจกรรม',
      allActivities: 'ทั้งหมด',
      by: 'โดย',
    },
    form: {
      title: 'เพิ่มกิจกรรมใหม่',
      dealLabel: 'ดีล *',
      dealPlaceholder: 'เลือกดีล',
      typeLabel: 'ประเภทกิจกรรม *',
      dateLabel: 'วันที่ *',
      descriptionLabel: 'คำอธิบาย *',
      descriptionPlaceholder: 'อธิบายกิจกรรมในรายละเอียด...',
      save: 'บันทึก',
      cancel: 'ยกเลิก',
    },
    activityTypes: {
      call: 'โทรศัพท์',
      email: 'อีเมล',
      meeting: 'ประชุม',
      note: 'บันทึก',
      task: 'งาน',
      demo: 'สาธิต',
      follow_up: 'ติดตาม',
    },
    confirmDelete: 'ยืนยันการลบ?',
  },
  en: {
    title: 'Sales Activities',
    subtitle: 'Track sales activities and interactions',
    headerTranslate: 'Sales Activities — Track sales activities and interactions',
    addActivity: 'Add Activity',
    stats: {
      total: 'Total',
      call: 'Call',
      email: 'Email',
      meeting: 'Meeting',
    },
    filters: {
      all: 'All',
      groupByDate: 'Group by Date',
    },
    activities: {
      loading: 'Loading...',
      noActivities: 'No activities found',
      allActivities: 'All',
      by: 'by',
    },
    form: {
      title: 'Add New Activity',
      dealLabel: 'Deal *',
      dealPlaceholder: 'Select a deal',
      typeLabel: 'Activity Type *',
      dateLabel: 'Date *',
      descriptionLabel: 'Description *',
      descriptionPlaceholder: 'Describe the activity in detail...',
      save: 'Save',
      cancel: 'Cancel',
    },
    activityTypes: {
      call: 'Call',
      email: 'Email',
      meeting: 'Meeting',
      note: 'Note',
      task: 'Task',
      demo: 'Demo',
      follow_up: 'Follow-up',
    },
    confirmDelete: 'Confirm deletion?',
  },
  jp: {
    title: '営業活動',
    subtitle: '営業活動と相互作用を追跡',
    headerTranslate: '営業活動 — 営業活動と相互作用を追跡',
    addActivity: '活動を追加',
    stats: {
      total: '合計',
      call: '電話',
      email: 'メール',
      meeting: '会議',
    },
    filters: {
      all: 'すべて',
      groupByDate: '日付でグループ化',
    },
    activities: {
      loading: '読み込み中...',
      noActivities: '活動が見つかりません',
      allActivities: 'すべて',
      by: 'による',
    },
    form: {
      title: '新規活動を追加',
      dealLabel: '取引 *',
      dealPlaceholder: '取引を選択',
      typeLabel: '活動タイプ *',
      dateLabel: '日付 *',
      descriptionLabel: '説明 *',
      descriptionPlaceholder: '活動の詳細を説明してください...',
      save: '保存',
      cancel: 'キャンセル',
    },
    activityTypes: {
      call: '電話',
      email: 'メール',
      meeting: '会議',
      note: 'メモ',
      task: 'タスク',
      demo: 'デモ',
      follow_up: 'フォローアップ',
    },
    confirmDelete: '削除を確認しますか？',
  },
};

export default function SalesActivitiesPanel({
  projects,
  members,
  filterProjectId,
  canManage = true,
  refreshKey = 0,
  lang = 'th',
}: Props) {
  const L = (key: string) => {
    const keys = key.split('.');
    let value: any = panelText[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterDealId, setFilterDealId] = useState<string>('');
  const [groupByDate, setGroupByDate] = useState(true);

  const [formData, setFormData] = useState({
    deal_id: '',
    type: 'note' as 'call' | 'email' | 'meeting' | 'note' | 'task' | 'demo' | 'follow_up',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchActivities();
    fetchDeals();
  }, [filterProjectId, refreshKey]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/deal-activities');
      if (res.ok) {
        const json = await res.json();
        const mapped = (json.activities ?? []).map((a: Record<string, unknown>) => ({
          id: a.id,
          deal_id: a.deal_id,
          deal_title: (a.deals as { title?: string })?.title ?? '',
          customer_name: (a.customers as { company_name?: string })?.company_name ?? '',
          type: a.activity_type ?? 'note',
          description: a.subject ?? '',
          date: a.activity_date ?? '',
          performer: (a.performer as { email?: string })?.email ?? '',
        }));
        setActivities(mapped.sort((a: DealActivity, b: DealActivity) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals');
      if (res.ok) {
        const json = await res.json();
        const mapped = (json.deals ?? []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          title: d.title as string,
          customer_name: (d.customers as { company_name?: string })?.company_name ?? '',
        }));
        setDeals(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/deal-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: formData.deal_id,
          activity_type: formData.type,
          subject: formData.description,
          activity_date: formData.date,
        }),
      });

      if (res.ok) {
        await fetchActivities();
        setShowForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to add activity:', error);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm(L('confirmDelete'))) return;
    try {
      const res = await fetch(`/api/deal-activities/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchActivities();
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      deal_id: '',
      type: 'note',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const filteredActivities = filterDealId
    ? activities.filter((a) => a.deal_id === filterDealId)
    : activities;

  const groupedActivities = groupByDate
    ? filteredActivities.reduce((acc, activity) => {
        const dateStr = new Date(activity.date).toLocaleDateString('th-TH');
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(activity);
        return acc;
      }, {} as Record<string, DealActivity[]>)
    : { [L('activities.allActivities')]: filteredActivities };

  const stats = {
    total: activities.length,
    byType: Object.keys(activityTypeConfig).reduce((acc, type) => {
      acc[type] = activities.filter((a) => a.type === type).length;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{L('title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{L('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <TranslateButton text={L('headerTranslate')} />
          {canManage && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              {L('addActivity')}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <p className="text-gray-500 text-sm">{L('stats.total')}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <p className="text-gray-500 text-sm">{L('stats.call')}</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.byType['call']}</p>
        </div>
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <p className="text-gray-500 text-sm">{L('stats.email')}</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.byType['email']}</p>
        </div>
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <p className="text-gray-500 text-sm">{L('stats.meeting')}</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.byType['meeting']}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1">
          <select
            value={filterDealId}
            onChange={(e) => setFilterDealId(e.target.value)}
            className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
          >
            <option value="">{L('filters.all')}</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.title} - {deal.customer_name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
          <input
            type="checkbox"
            checked={groupByDate}
            onChange={(e) => setGroupByDate(e.target.checked)}
            className="rounded"
          />
          {L('filters.groupByDate')}
        </label>
      </div>

      {/* Activities Timeline */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">{L('activities.loading')}</div>
        ) : Object.entries(groupedActivities).length === 0 ? (
          <div className="text-center py-8 text-gray-500">{L('activities.noActivities')}</div>
        ) : (
          Object.entries(groupedActivities).map(([dateLabel, dateActivities]) => (
            <div key={dateLabel}>
              {groupByDate && (
                <h3 className="text-sm font-semibold text-gray-700 mb-3 px-4">
                  {dateLabel}
                </h3>
              )}

              <div className="space-y-3">
                {dateActivities.map((activity) => {
                  const typeConfig = activityTypeConfig[activity.type];
                  const IconComponent = typeConfig.icon;

                  return (
                    <div
                      key={activity.id}
                      className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4 hover:border-[#003087] transition"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className="p-3 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: typeConfig.bg }}
                        >
                          <IconComponent size={20} style={{ color: typeConfig.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {activity.deal_title}
                              </h4>
                              <p className="text-sm text-gray-500">{activity.customer_name}</p>
                            </div>
                            {canManage && (
                              <button
                                onClick={() => handleDeleteActivity(activity.id)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition ml-2"
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </button>
                            )}
                          </div>

                          {/* Activity Type Badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: typeConfig.bg,
                                color: typeConfig.color,
                              }}
                            >
                              {typeConfig.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(activity.date).toLocaleString('th-TH')}
                            </span>
                            {activity.performer && (
                              <span className="text-xs text-gray-400">
                                {L('activities.by')} {activity.performer}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {activity.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{L('form.title')}</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {L('form.dealLabel')}
                </label>
                <select
                  required
                  value={formData.deal_id}
                  onChange={(e) => setFormData({ ...formData, deal_id: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">{L('form.dealPlaceholder')}</option>
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.title} - {deal.customer_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {L('form.typeLabel')}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
                >
                  {Object.entries(activityTypeConfig).map(([key, value]) => (
                    <option key={key} value={key}>
                      {L(`activityTypes.${key as ActivityType}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {L('form.dateLabel')}
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {L('form.descriptionLabel')}
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600 resize-none"
                  rows={4}
                  placeholder={L('form.descriptionPlaceholder')}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  {L('form.save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg text-sm font-medium"
                >
                  {L('form.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
