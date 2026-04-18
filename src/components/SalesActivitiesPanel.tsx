'use client';

import { useState, useEffect } from 'react';
import type { Lang } from '@/lib/i18n';
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  FileText,
  Zap,
  Trash2,
  X,
  RefreshCw,
  Video,
  MapPin,
  FileCheck,
  Receipt,
  GraduationCap,
  ShoppingCart,
  CheckCircle,
  Send,
  Presentation,
  PenLine,
  CalendarCheck,
  MonitorSmartphone,
  Building,
} from 'lucide-react';
import TranslateButton from './TranslateButton';

interface Props {
  projects: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null }[];
  members: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
  lang?: Lang;
  currentUserId?: string;
}

interface DealActivity {
  id: string;
  deal_id: string;
  deal_title: string;
  customer_name: string;
  type: ActivityType;
  description: string;
  date: string;
  performer?: string;
  performer_id?: string;
}

interface Deal {
  id: string;
  title: string;
  customer_name: string;
}

interface User {
  id: string;
  display_name?: string | null;
  display_name_th?: string | null;
  email?: string;
  department?: string | null;
}

const activityTypeConfig = {
  event_out: { name_th: 'ออก Event', name_en: 'Event Out', name_jp: 'イベント出展', icon: CalendarCheck, color: '#7C3AED', lightBg: '#F5F3FF' },
  call_contact: { name_th: 'โทรติดต่อ', name_en: 'Call Contact', name_jp: '電話連絡', icon: Phone, color: '#8B5CF6', lightBg: '#FAF5FF' },
  email_info: { name_th: 'อีเมล', name_en: 'Email', name_jp: 'メール', icon: Mail, color: '#F7941D', lightBg: '#FFFBF0' },
  online_meeting: { name_th: 'ประชุม Online', name_en: 'Online Meeting', name_jp: 'オンライン会議', icon: Video, color: '#3B82F6', lightBg: '#EFF6FF' },
  site_meeting: { name_th: 'ประชุม On Site', name_en: 'On-Site Meeting', name_jp: '現地会議', icon: MapPin, color: '#0EA5E9', lightBg: '#F0F9FF' },
  create_proposal: { name_th: 'จัดทำ Proposal', name_en: 'Create Proposal', name_jp: '提案書作成', icon: FileCheck, color: '#F59E0B', lightBg: '#FFFAF0' },
  present_proposal: { name_th: 'นำเสนอ Proposal', name_en: 'Present Proposal', name_jp: '提案書プレゼン', icon: Presentation, color: '#EC4899', lightBg: '#FDF2F8' },
  revise_proposal: { name_th: 'แก้ไขปรับปรุง Proposal', name_en: 'Revise Proposal', name_jp: '提案書修正', icon: PenLine, color: '#D946EF', lightBg: '#FAF5FF' },
  create_quotation: { name_th: 'จัดทำใบเสนอราคา', name_en: 'Create Quotation', name_jp: '見積書作成', icon: Receipt, color: '#EF4444', lightBg: '#FEF2F2' },
  submit_quotation: { name_th: 'เสนอราคา', name_en: 'Submit Quotation', name_jp: '見積提出', icon: Send, color: '#DC2626', lightBg: '#FEF2F2' },
  follow_update: { name_th: 'ติดตามอัปเดต', name_en: 'Follow Update', name_jp: 'フォローアップ', icon: RefreshCw, color: '#6B7280', lightBg: '#F3F4F6' },
  receive_po: { name_th: 'รับ PO', name_en: 'Receive PO', name_jp: 'PO受注', icon: ShoppingCart, color: '#059669', lightBg: '#F0FDF4' },
  close_sale: { name_th: 'ปิดงานขาย', name_en: 'Close Sale', name_jp: '商談成約', icon: CheckCircle, color: '#16A34A', lightBg: '#F0FDF4' },
  coordinate_online: { name_th: 'ประสานงาน Online', name_en: 'Coordinate Online', name_jp: 'オンライン調整', icon: MonitorSmartphone, color: '#06B6D4', lightBg: '#F0F9FF' },
  coordinate_onsite: { name_th: 'ประสานงาน On Site', name_en: 'Coordinate On-Site', name_jp: '現地調整', icon: Building, color: '#0369A1', lightBg: '#F0F9FF' },
  training: { name_th: 'อบรม', name_en: 'Training', name_jp: '研修', icon: GraduationCap, color: '#2563EB', lightBg: '#EFF6FF' },
  demo: { name_th: 'สาธิตงาน', name_en: 'Demo', name_jp: 'デモ', icon: Zap, color: '#14B8A6', lightBg: '#F0FDFA' },
};

type ActivityType = keyof typeof activityTypeConfig;

const panelText = {
  th: {
    title: 'กิจกรรมการขาย',
    subtitle: 'ติดตามกิจกรรมการขายและการโต้ตอบ',
    headerTranslate: 'กิจกรรมการขาย — ติดตามกิจกรรมการขายและการโต้ตอบ',
    addActivity: 'เพิ่มกิจกรรม',
    stats: {
      total: 'ทั้งหมด',
      calls: 'โทรศัพท์',
      meetings: 'ประชุม',
      proposals: 'Proposal/ใบเสนอราคา',
    },
    filters: {
      all: 'ทั้งหมด',
      groupByDate: 'จัดกลุ่มตามวันที่',
      groupBySalesperson: 'จัดกลุ่มตามพนักงาน',
      salesperson: 'พนักงาน',
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
      event_out: 'ออก Event',
      call_contact: 'โทรติดต่อ',
      email_info: 'อีเมล',
      online_meeting: 'ประชุม Online',
      site_meeting: 'ประชุม On Site',
      create_proposal: 'จัดทำ Proposal',
      present_proposal: 'นำเสนอ Proposal',
      revise_proposal: 'แก้ไขปรับปรุง Proposal',
      create_quotation: 'จัดทำใบเสนอราคา',
      submit_quotation: 'เสนอราคา',
      follow_update: 'ติดตามอัปเดต',
      receive_po: 'รับ PO',
      close_sale: 'ปิดงานขาย',
      coordinate_online: 'ประสานงาน Online',
      coordinate_onsite: 'ประสานงาน On Site',
      training: 'อบรม',
      demo: 'สาธิตงาน',
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
      calls: 'Calls',
      meetings: 'Meetings',
      proposals: 'Proposals',
    },
    filters: {
      all: 'All',
      groupByDate: 'Group by Date',
      groupBySalesperson: 'Group by Salesperson',
      salesperson: 'Salesperson',
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
      event_out: 'Event Out',
      call_contact: 'Call Contact',
      email_info: 'Email',
      online_meeting: 'Online Meeting',
      site_meeting: 'On-Site Meeting',
      create_proposal: 'Create Proposal',
      present_proposal: 'Present Proposal',
      revise_proposal: 'Revise Proposal',
      create_quotation: 'Create Quotation',
      submit_quotation: 'Submit Quotation',
      follow_update: 'Follow Update',
      receive_po: 'Receive PO',
      close_sale: 'Close Sale',
      coordinate_online: 'Coordinate Online',
      coordinate_onsite: 'Coordinate On-Site',
      training: 'Training',
      demo: 'Demo',
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
      calls: '通話',
      meetings: '会議',
      proposals: '提案',
    },
    filters: {
      all: 'すべて',
      groupByDate: '日付でグループ化',
      groupBySalesperson: '営業員でグループ化',
      salesperson: '営業員',
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
      event_out: 'イベント出展',
      call_contact: '電話連絡',
      email_info: 'メール',
      online_meeting: 'オンライン会議',
      site_meeting: '現地会議',
      create_proposal: '提案書作成',
      present_proposal: '提案書プレゼン',
      revise_proposal: '提案書修正',
      create_quotation: '見積書作成',
      submit_quotation: '見積提出',
      follow_update: 'フォローアップ',
      receive_po: 'PO受注',
      close_sale: '商談成約',
      coordinate_online: 'オンライン調整',
      coordinate_onsite: '現地調整',
      training: '研修',
      demo: 'デモ',
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
  currentUserId,
}: Props) {
  const L = (key: string) => {
    const keys = key.split('.');
    let value: any = panelText[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const getActivityTypeName = (type: ActivityType): string => {
    const config = activityTypeConfig[type];
    if (lang === 'en') return config.name_en;
    if (lang === 'jp') return config.name_jp;
    return config.name_th;
  };

  const getUserName = (user: User | undefined, lang: Lang): string => {
    if (!user) return '';
    if (lang === 'th' && user.display_name_th) return user.display_name_th;
    return user.display_name || user.email || '';
  };

  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterDealId, setFilterDealId] = useState<string>('');
  const [filterSalespersonId, setFilterSalespersonId] = useState<string>('');
  const [groupByDate, setGroupByDate] = useState(true);
  const [groupBySalesperson, setGroupBySalesperson] = useState(false);

  const [formData, setFormData] = useState({
    deal_id: '',
    type: 'call_contact' as ActivityType,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchActivities();
    fetchDeals();
    fetchUsers();
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
          type: (a.activity_type ?? 'call_contact') as ActivityType,
          description: a.subject ?? '',
          date: a.activity_date ?? '',
          performer: (a.performer as { display_name?: string })?.display_name ?? (a.performer as { email?: string })?.email ?? '',
          performer_id: (a.performer as { id?: string })?.id,
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

  const fetchUsers = async () => {
    try {
      // Try /api/users first (admin), fallback to extracting performers from activities
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        const mapped = (json.users ?? [])
          .filter((u: Record<string, unknown>) => u.is_active)
          .map((u: Record<string, unknown>) => ({
            id: u.id as string,
            display_name: u.display_name as string | null,
            display_name_th: u.display_name_th as string | null,
            email: u.email as string,
            department: u.department as string | null,
          }));
        setUsers(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
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
      type: 'call_contact',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const filteredActivities = activities.filter((a) => {
    if (filterDealId && a.deal_id !== filterDealId) return false;
    if (filterSalespersonId && a.performer_id !== filterSalespersonId) return false;
    if (!canManage && a.performer_id !== currentUserId) return false;
    return true;
  });

  const groupedActivities = groupBySalesperson
    ? filteredActivities.reduce((acc, activity) => {
        const performer = users.find((u) => u.id === activity.performer_id);
        const salespersonName = getUserName(performer, lang) || 'Unknown';
        if (!acc[salespersonName]) acc[salespersonName] = [];
        acc[salespersonName].push(activity);
        return acc;
      }, {} as Record<string, DealActivity[]>)
    : groupByDate
    ? filteredActivities.reduce((acc, activity) => {
        const dateStr = new Date(activity.date).toLocaleDateString(
          lang === 'en' ? 'en-US' : lang === 'jp' ? 'ja-JP' : 'th-TH'
        );
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(activity);
        return acc;
      }, {} as Record<string, DealActivity[]>)
    : { [L('activities.allActivities')]: filteredActivities };

  const stats = {
    total: filteredActivities.length,
    calls: filteredActivities.filter(
      (a) => a.type === 'call_contact' || a.type === 'email_info'
    ).length,
    meetings: filteredActivities.filter(
      (a) => a.type === 'online_meeting' || a.type === 'site_meeting' || a.type === 'coordinate_online' || a.type === 'coordinate_onsite'
    ).length,
    proposals: filteredActivities.filter(
      (a) => a.type === 'create_proposal' || a.type === 'present_proposal' || a.type === 'revise_proposal' || a.type === 'create_quotation' || a.type === 'submit_quotation'
    ).length,
  };

  const salespersonStats = users.map((user) => {
    const userActivities = activities.filter((a) => a.performer_id === user.id);
    return {
      user,
      count: userActivities.length,
    };
  }).filter((s) => s.count > 0);

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
          <p className="text-gray-500 text-sm">{L('stats.calls')}</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.calls}</p>
        </div>
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <p className="text-gray-500 text-sm">{L('stats.meetings')}</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.meetings}</p>
        </div>
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <p className="text-gray-500 text-sm">{L('stats.proposals')}</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.proposals}</p>
        </div>
      </div>

      {/* Salesperson Summary Cards */}
      {canManage && salespersonStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {salespersonStats.map((stat) => (
            <button
              key={stat.user.id}
              onClick={() => {
                setFilterSalespersonId(
                  filterSalespersonId === stat.user.id ? '' : stat.user.id
                );
              }}
              className={`rounded-lg border p-3 text-left transition ${
                filterSalespersonId === stat.user.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#CBD5E1]'
              }`}
            >
              <p className="text-sm font-medium text-gray-900">
                {getUserName(stat.user, lang)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stat.count} activities</p>
            </button>
          ))}
        </div>
      )}

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

        {canManage && users.length > 0 && (
          <div className="w-full md:w-48">
            <select
              value={filterSalespersonId}
              onChange={(e) => setFilterSalespersonId(e.target.value)}
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
            >
              <option value="">{L('filters.salesperson')}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserName(user, lang)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 whitespace-nowrap">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={groupByDate}
              onChange={(e) => {
                setGroupByDate(e.target.checked);
                if (e.target.checked) setGroupBySalesperson(false);
              }}
              className="rounded"
            />
            {L('filters.groupByDate')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={groupBySalesperson}
              onChange={(e) => {
                setGroupBySalesperson(e.target.checked);
                if (e.target.checked) setGroupByDate(false);
              }}
              className="rounded"
            />
            {L('filters.groupBySalesperson')}
          </label>
        </div>
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
                  const performer = users.find((u) => u.id === activity.performer_id);

                  return (
                    <div
                      key={activity.id}
                      className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4 hover:border-[#003087] transition"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className="p-3 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: typeConfig.lightBg }}
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
                                className="p-2 hover:bg-gray-100 rounded-lg transition ml-2 flex-shrink-0"
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </button>
                            )}
                          </div>

                          {/* Activity Type Badge */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: typeConfig.lightBg,
                                color: typeConfig.color,
                              }}
                            >
                              {getActivityTypeName(activity.type)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(activity.date).toLocaleString(
                                lang === 'en' ? 'en-US' : lang === 'jp' ? 'ja-JP' : 'th-TH'
                              )}
                            </span>
                            {performer && (
                              <span className="text-xs text-gray-500">
                                {L('activities.by')} {getUserName(performer, lang)}
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
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityType })}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
                >
                  {Object.entries(activityTypeConfig).map(([key]) => (
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
