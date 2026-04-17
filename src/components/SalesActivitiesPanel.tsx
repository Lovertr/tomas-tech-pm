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
  RefreshCw,
  Video,
  MapPin,
  FileCheck,
  Receipt,
  Lightbulb,
  Palette,
  ClipboardList,
  BookOpen,
  PenTool,
  Wrench,
  GraduationCap,
  ShoppingCart,
  Play,
  CheckCircle,
  XCircle,
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
  first_name_th?: string | null;
  last_name_th?: string | null;
  first_name_en?: string | null;
  last_name_en?: string | null;
  email?: string;
}

const activityTypeConfig = {
  follow_update: { name_th: 'ติดตามอัปเดต', name_en: 'Follow Update', name_jp: 'フォローアップ更新', icon: RefreshCw, color: '#6B7280', lightBg: '#F3F4F6' },
  online_meeting: { name_th: 'ประชุมออนไลน์', name_en: 'Online Meeting', name_jp: 'オンライン会議', icon: Video, color: '#3B82F6', lightBg: '#EFF6FF' },
  site_meeting: { name_th: 'เข้าพบลูกค้า', name_en: 'Site Meeting', name_jp: 'サイト訪問', icon: MapPin, color: '#0EA5E9', lightBg: '#F0F9FF' },
  call_contact: { name_th: 'โทรติดต่อ', name_en: 'Call Contact', name_jp: '通話', icon: Phone, color: '#8B5CF6', lightBg: '#FAF5FF' },
  meeting_minutes: { name_th: 'บันทึกการประชุม', name_en: 'Meeting Minutes', name_jp: '会議記録', icon: FileText, color: '#6366F1', lightBg: '#F5F3FF' },
  email_info: { name_th: 'อีเมล', name_en: 'E-Mail Information', name_jp: 'メール', icon: Mail, color: '#F7941D', lightBg: '#FFFBF0' },
  create_proposal: { name_th: 'สร้าง Proposal', name_en: 'Create Proposal', name_jp: '提案作成', icon: FileCheck, color: '#F59E0B', lightBg: '#FFFAF0' },
  create_quotation: { name_th: 'สร้างใบเสนอราคา', name_en: 'Create Quotation', name_jp: '見積書作成', icon: Receipt, color: '#EF4444', lightBg: '#FEF2F2' },
  create_concept: { name_th: 'สร้างแนวคิด', name_en: 'Create Concept', name_jp: 'コンセプト作成', icon: Lightbulb, color: '#EC4899', lightBg: '#FDF2F8' },
  demo: { name_th: 'สาธิต', name_en: 'Demo', name_jp: 'デモ', icon: Zap, color: '#14B8A6', lightBg: '#F0FDFA' },
  design: { name_th: 'ออกแบบ', name_en: 'Design', name_jp: 'デザイン', icon: Palette, color: '#A855F7', lightBg: '#FAF5FF' },
  create_spec: { name_th: 'สร้าง Spec', name_en: 'Create Spec Sheet', name_jp: 'スペック作成', icon: ClipboardList, color: '#06B6D4', lightBg: '#F0F9FF' },
  create_manual: { name_th: 'สร้างคู่มือ', name_en: 'Create Manual', name_jp: 'マニュアル作成', icon: BookOpen, color: '#10B981', lightBg: '#F0FDF4' },
  sign_document: { name_th: 'เซ็นเอกสาร', name_en: 'Sign Document', name_jp: '契約署名', icon: PenTool, color: '#003087', lightBg: '#F3F4F6' },
  installation: { name_th: 'ติดตั้ง', name_en: 'Installation', name_jp: 'インストール', icon: Wrench, color: '#78716C', lightBg: '#FAFAF9' },
  training: { name_th: 'อบรม', name_en: 'Training', name_jp: '訓練', icon: GraduationCap, color: '#0369A1', lightBg: '#F0F9FF' },
  po_process: { name_th: 'ดำเนิน PO', name_en: 'PO Process', name_jp: 'PO処理', icon: ShoppingCart, color: '#059669', lightBg: '#F0FDF4' },
  start: { name_th: 'เริ่มงาน', name_en: 'Start', name_jp: '開始', icon: Play, color: '#22C55E', lightBg: '#F0FDF4' },
  follow_up: { name_th: 'ติดตามผล', name_en: 'Follow Up', name_jp: 'フォローアップ', icon: Clock, color: '#D97706', lightBg: '#FFFBF0' },
  complete: { name_th: 'เสร็จสิ้น', name_en: 'Complete', name_jp: '完了', icon: CheckCircle, color: '#16A34A', lightBg: '#F0FDF4' },
  refuse: { name_th: 'ปฏิเสธ', name_en: 'Refuse', name_jp: '拒否', icon: XCircle, color: '#DC2626', lightBg: '#FEF2F2' },
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
      follow_update: 'ติดตามอัปเดต',
      online_meeting: 'ประชุมออนไลน์',
      site_meeting: 'เข้าพบลูกค้า',
      call_contact: 'โทรติดต่อ',
      meeting_minutes: 'บันทึกการประชุม',
      email_info: 'อีเมล',
      create_proposal: 'สร้าง Proposal',
      create_quotation: 'สร้างใบเสนอราคา',
      create_concept: 'สร้างแนวคิด',
      demo: 'สาธิต',
      design: 'ออกแบบ',
      create_spec: 'สร้าง Spec',
      create_manual: 'สร้างคู่มือ',
      sign_document: 'เซ็นเอกสาร',
      installation: 'ติดตั้ง',
      training: 'อบรม',
      po_process: 'ดำเนิน PO',
      start: 'เริ่มงาน',
      follow_up: 'ติดตามผล',
      complete: 'เสร็จสิ้น',
      refuse: 'ปฏิเสธ',
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
      follow_update: 'Follow Update',
      online_meeting: 'Online Meeting',
      site_meeting: 'Site Meeting',
      call_contact: 'Call Contact',
      meeting_minutes: 'Meeting Minutes',
      email_info: 'E-Mail Information',
      create_proposal: 'Create Proposal',
      create_quotation: 'Create Quotation',
      create_concept: 'Create Concept',
      demo: 'Demo',
      design: 'Design',
      create_spec: 'Create Spec Sheet',
      create_manual: 'Create Manual',
      sign_document: 'Sign Document',
      installation: 'Installation',
      training: 'Training',
      po_process: 'PO Process',
      start: 'Start',
      follow_up: 'Follow Up',
      complete: 'Complete',
      refuse: 'Refuse',
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
      follow_update: 'フォローアップ更新',
      online_meeting: 'オンライン会議',
      site_meeting: 'サイト訪問',
      call_contact: '通話',
      meeting_minutes: '会議記録',
      email_info: 'メール',
      create_proposal: '提案作成',
      create_quotation: '見積書作成',
      create_concept: 'コンセプト作成',
      demo: 'デモ',
      design: 'デザイン',
      create_spec: 'スペック作成',
      create_manual: 'マニュアル作成',
      sign_document: '契約署名',
      installation: 'インストール',
      training: '訓練',
      po_process: 'PO処理',
      start: '開始',
      follow_up: 'フォローアップ',
      complete: '完了',
      refuse: '拒否',
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
    if (lang === 'en') {
      return `${user.first_name_en || ''} ${user.last_name_en || ''}`.trim();
    }
    if (lang === 'jp') return user.email || '';
    return `${user.first_name_th || ''} ${user.last_name_th || ''}`.trim();
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
          performer: (a.performer as { email?: string })?.email ?? '',
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
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        const mapped = (json.users ?? []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          first_name_th: u.first_name_th as string | null,
          last_name_th: u.last_name_th as string | null,
          first_name_en: u.first_name_en as string | null,
          last_name_en: u.last_name_en as string | null,
          email: u.email as string,
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
      (a) => a.type === 'call_contact'
    ).length,
    meetings: filteredActivities.filter(
      (a) => a.type === 'online_meeting' || a.type === 'site_meeting'
    ).length,
    proposals: filteredActivities.filter(
      (a) => a.type === 'create_proposal' || a.type === 'create_quotation'
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
