'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, User, Mail, Phone, Globe, MapPin, FileText, X, Briefcase, TrendingUp, MessageSquare, FileCheck, Clock, Eye, Heart, Users, DollarSign, ExternalLink } from 'lucide-react';
import type { Lang } from '@/lib/i18n';
import TranslateButton from './TranslateButton';

interface Props {
  projects: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null }[];
  members: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
  lang?: Lang;
  currentUserId?: string;
  onNavigate?: (pageId: string, filterId?: string) => void;
}

interface Customer {
  id: string;
  company_name: string;
  industry?: string;
  status: 'active' | 'inactive' | 'prospect' | 'churned';
  address?: string;
  google_map_url?: string;
  tax_id?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  contact_count?: number;
  referral_company?: string;
  referral_person?: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  is_primary: boolean;
}

interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  owner?: string;
}

interface Activity {
  id: string;
  type: 'call' | 'meeting' | 'email' | 'proposal' | 'other';
  description: string;
  date: string;
  performer?: string;
}

interface Comment {
  id: string;
  content: string;
  user_name?: string;
  created_at: string;
}

const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
  active: { bg: 'bg-green-50', text: 'text-green-700', badge: '#16A34A' },
  inactive: { bg: 'bg-gray-50', text: 'text-gray-700', badge: '#4B5563' },
  prospect: { bg: 'bg-blue-50', text: 'text-blue-700', badge: '#2563EB' },
  churned: { bg: 'bg-red-50', text: 'text-red-700', badge: '#DC2626' },
};
const defaultStatusColor = { bg: 'bg-gray-50', text: 'text-gray-700', badge: '#4B5563' };

const pipelineStageColors: Record<string, string> = {
  waiting_present: '#6B7280',
  contacted: '#3B82F6',
  proposal_submitted: '#F59E0B',
  proposal_confirmed: '#8B5CF6',
  quotation: '#F7941D',
  negotiation: '#EC4899',
  waiting_po: '#14B8A6',
  po_received: '#22C55E',
  payment_received: '#059669',
  cancelled: '#EF4444',
  refused: '#9CA3AF',
};

const getTextColorForBackground = (bgColor: string): string => {
  const lightColors = ['#F7941D', '#F59E0B', '#6B7280', '#9CA3AF', '#14B8A6', '#22C55E', '#EC4899'];
  const darkColors = ['#3B82F6', '#8B5CF6', '#EF4444', '#059669'];
  if (lightColors.includes(bgColor)) return '#1F2937';
  if (darkColors.includes(bgColor)) return '#FFFFFF';
  return '#FFFFFF';
};

const L = (key: string, lang: Lang = 'th'): string => {
  const panelText: Record<string, Record<Lang, string>> = {
    title: { th: 'ลูกค้า', en: 'Customers', jp: '顧客' },
    subtitle: { th: 'จัดการข้อมูลลูกค้าและติดต่อ', en: 'Manage customer information and contacts', jp: '顧客情報と連絡先を管理' },
    addCustomer: { th: 'เพิ่มลูกค้า', en: 'Add Customer', jp: '顧客を追加' },
    total: { th: 'ทั้งหมด', en: 'Total', jp: '合計' },
    activeCustomers: { th: 'ลูกค้าใช้งาน', en: 'Active Customers', jp: 'アクティブな顧客' },
    prospects: { th: 'ผู้สนใจ', en: 'Prospects', jp: '見込み客' },
    searchPlaceholder: { th: 'ค้นหาชื่อบริษัท...', en: 'Search company name...', jp: '会社名を検索...' },
    all: { th: 'ทั้งหมด', en: 'All', jp: 'すべて' },
    loading: { th: 'กำลังโหลด...', en: 'Loading...', jp: '読み込み中...' },
    noCustomers: { th: 'ไม่พบลูกค้า', en: 'No customers found', jp: '顧客が見つかりません' },
    industry: { th: 'สาขา:', en: 'Industry:', jp: '業界:' },
    contacts: { th: 'ติดต่อ:', en: 'Contacts:', jp: '連絡先:' },
    phone: { th: 'โทร:', en: 'Phone:', jp: '電話:' },
    email: { th: 'อีเมล:', en: 'Email:', jp: 'メール:' },
    editCustomer: { th: 'แก้ไขลูกค้า', en: 'Edit Customer', jp: '顧客を編集' },
    addNewCustomer: { th: 'เพิ่มลูกค้าใหม่', en: 'Add New Customer', jp: '新しい顧客を追加' },
    companyName: { th: 'ชื่อบริษัท *', en: 'Company Name *', jp: '会社名 *' },
    industryField: { th: 'สาขาอุตสาหกรรม', en: 'Industry', jp: '業界' },
    status: { th: 'สถานะ *', en: 'Status *', jp: 'ステータス *' },
    taxId: { th: 'เลขประจำตัวผู้เสียภาษี', en: 'Tax ID', jp: '税ID' },
    phoneField: { th: 'โทรศัพท์', en: 'Phone', jp: '電話' },
    emailField: { th: 'อีเมล', en: 'Email', jp: 'メール' },
    website: { th: 'เว็บไซต์', en: 'Website', jp: 'ウェブサイト' },
    address: { th: 'ที่อยู่', en: 'Address', jp: 'アドレス' },
    notes: { th: 'หมายเหตุ', en: 'Notes', jp: 'メモ' },
    prospect: { th: 'ผู้สนใจ', en: 'Prospect', jp: '見込み客' },
    active: { th: 'ใช้งาน', en: 'Active', jp: 'アクティブ' },
    inactive: { th: 'ไม่ใช้งาน', en: 'Inactive', jp: '非アクティブ' },
    churned: { th: 'หมดสัญญา', en: 'Churned', jp: '解約' },
    save: { th: 'บันทึก', en: 'Save', jp: '保存' },
    cancel: { th: 'ยกเลิก', en: 'Cancel', jp: 'キャンセル' },
    confirmDelete: { th: 'ยืนยันการลบ?', en: 'Confirm delete?', jp: '削除を確認しますか？' },
    customerInfo: { th: 'ข้อมูลลูกค้า', en: 'Customer Information', jp: '顧客情報' },
    taxLabel: { th: 'เลขประจำตัวผู้เสียภาษี:', en: 'Tax ID:', jp: '税ID:' },
    phoneLabel: { th: 'โทร:', en: 'Phone:', jp: '電話:' },
    emailLabel: { th: 'อีเมล:', en: 'Email:', jp: 'メール:' },
    addressLabel: { th: 'ที่อยู่:', en: 'Address:', jp: 'アドレス:' },
    websiteLabel: { th: 'เว็บไซต์:', en: 'Website:', jp: 'ウェブサイト:' },
    notesLabel: { th: 'หมายเหตุ:', en: 'Notes:', jp: 'メモ:' },
    contactsList: { th: 'ติดต่อ', en: 'Contacts', jp: '連絡先' },
    addContact: { th: 'เพิ่ม', en: 'Add', jp: '追加' },
    noContacts: { th: 'ไม่มีติดต่อ', en: 'No contacts', jp: '連絡先がありません' },
    primaryContact: { th: 'หลัก', en: 'Primary', jp: 'プライマリ' },
    name: { th: 'ชื่อ *', en: 'Name *', jp: '名前 *' },
    emailRequired: { th: 'อีเมล *', en: 'Email *', jp: 'メール *' },
    phoneOptional: { th: 'โทรศัพท์', en: 'Phone', jp: '電話' },
    position: { th: 'ตำแหน่ง', en: 'Position', jp: 'ポジション' },
    isPrimary: { th: 'ติดต่อหลัก', en: 'Primary Contact', jp: 'プライマリ連絡先' },
    edit: { th: 'แก้ไข', en: 'Edit', jp: '編集' },
    close: { th: 'ปิด', en: 'Close', jp: '閉じる' },
    basicInfo: { th: 'ข้อมูลพื้นฐาน', en: 'Basic Info', jp: '基本情報' },
    deals: { th: 'ดีลทั้งหมด', en: 'Deals & Pipeline', jp: 'ディール' },
    activity: { th: 'กิจกรรม', en: 'Activity Timeline', jp: 'アクティビティ' },
    projects: { th: 'โปรเจค & ใบเสนอราคา', en: 'Projects & Quotations', jp: 'プロジェクト' },
    comments: { th: 'คอมเม้น', en: 'Comments', jp: 'コメント' },
    totalDealValue: { th: 'มูลค่ารวม', en: 'Total Deal Value', jp: '総取引額' },
    wonDeals: { th: 'ดีลชนะ', en: 'Won Deals', jp: '獲得ディール' },
    winRate: { th: 'อัตราการชนะ', en: 'Win Rate', jp: '勝率' },
    totalRevenue: { th: 'รายได้รวม', en: 'Total Revenue', jp: '総収益' },
    noDealValue: { th: 'ไม่มีดีล', en: 'No deals', jp: 'ディールなし' },
    dealValue: { th: 'มูลค่า:', en: 'Value:', jp: '価値:' },
    dealProbability: { th: 'ความน่าจะเป็น:', en: 'Probability:', jp: '確率:' },
    dealStage: { th: 'ขั้นตอน:', en: 'Stage:', jp: 'ステージ:' },
    dealOwner: { th: 'เจ้าของ:', en: 'Owner:', jp: 'オーナー:' },
    noDeals: { th: 'ไม่มีดีลสำหรับลูกค้านี้', en: 'No deals for this customer', jp: 'この顧客のディールはありません' },
    noActivities: { th: 'ไม่มีกิจกรรม', en: 'No activities', jp: 'アクティビティがありません' },
    noProjects: { th: 'ไม่มีโปรเจค', en: 'No projects', jp: 'プロジェクトがありません' },
    addComment: { th: 'เพิ่มคอมเม้น', en: 'Add Comment', jp: 'コメントを追加' },
    noComments: { th: 'ไม่มีคอมเม้น', en: 'No comments', jp: 'コメントがありません' },
    googleMap: { th: 'Google Map', en: 'Google Map', jp: 'Google Map' },
    googleMapPlaceholder: { th: 'วาง Google Maps URL ที่นี่...', en: 'Paste Google Maps URL here...', jp: 'Google Maps URLをここに貼り付け...' },
    googleMapLabel: { th: 'แผนที่', en: 'Map', jp: '地図' },
    openMap: { th: 'เปิดแผนที่', en: 'Open Map', jp: '地図を開く' },
    referralCompany: { th: 'บริษัทผู้แนะนำ', en: 'Referral Company', jp: '紹介会社' },
    referralPerson: { th: 'ผู้แนะนำ', en: 'Referral Person', jp: '紹介者' },
    referralCompanyPlaceholder: { th: 'ชื่อบริษัทที่แนะนำ...', en: 'Referral company name...', jp: '紹介会社名...' },
    referralPersonPlaceholder: { th: 'ชื่อผู้แนะนำ...', en: 'Referral person name...', jp: '紹介者名...' },
    referralInfo: { th: 'ข้อมูลผู้แนะนำ', en: 'Referral Information', jp: '紹介情報' },
    commentPlaceholder: { th: 'เขียนคอมเม้นของคุณที่นี่...', en: 'Write your comment here...', jp: 'ここにコメントを書く...' },
    submit: { th: 'ส่ง', en: 'Submit', jp: '送信' },
    translate: { th: 'แปล', en: 'Translate', jp: '翻訳' },
  };
  return panelText[key]?.[lang] || key;
};

export default function CustomersPanel({
  projects,
  members,
  filterProjectId,
  canManage = true,
  refreshKey = 0,
  lang = 'th',
  currentUserId,
  onNavigate,
}: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'basic' | 'deals' | 'activity' | 'projects' | 'comments'>('basic');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [customerProjects, setCustomerProjects] = useState<{ id: string; project_code?: string; name_th?: string; name_en?: string; status?: string; budget_limit?: number }[]>([]);
  const [customerQuotations, setCustomerQuotations] = useState<{ id: string; quotation_number?: string; title?: string; total_amount?: number; status?: string; created_at?: string }[]>([]);

  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    address: '',
    tax_id: '',
    phone: '',
    email: '',
    website: '',
    notes: '',
    google_map_url: '',
    referral_company: '',
    referral_person: '',
    status: 'prospect' as 'active' | 'inactive' | 'prospect' | 'churned',
  });

  const [contactFormData, setContactFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    is_primary: false,
  });

  useEffect(() => {
    fetchCustomers();
  }, [filterProjectId, refreshKey]);

  useEffect(() => {
    filterCustomers();
  }, [customers, statusFilter, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.customers ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const method = selectedCustomer ? 'PATCH' : 'POST';
      const url = selectedCustomer ? `/api/customers/${selectedCustomer.id}` : '/api/customers';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchCustomers();
        setShowForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save customer:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm(L('confirmDelete', lang))) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCustomers();
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const handleViewDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailTab('basic');
    setLoadingDetail(true);
    try {
      // Fetch contacts
      const contactsRes = await fetch(`/api/customers/${customer.id}/contacts`);
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts ?? []);
      }

      // Fetch detail data (deals, activities, comments)
      const detailRes = await fetch(`/api/customers/${customer.id}/detail`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        // Map deals: extract owner display_name from joined object
        setDeals((detailData.deals ?? []).map((d: any) => ({
          id: d.id,
          title: d.title,
          stage: d.stage,
          value: d.value || 0,
          probability: d.probability || 0,
          owner: d.owner?.display_name || d.owner?.email || '',
        })));
        // Map activities: extract performer display_name from joined object
        setActivities((detailData.activities ?? []).map((a: any) => ({
          id: a.id,
          type: a.activity_type || 'follow_update',
          description: a.subject || a.description || '',
          date: a.activity_date || a.created_at,
          performer: a.performer?.display_name || a.performer?.email || '',
        })));
        // Set projects & quotations
        setCustomerProjects(detailData.projects ?? []);
        setCustomerQuotations(detailData.quotations ?? []);
      }

      // Fetch comments
      const commentsRes = await fetch(`/api/customers/${customer.id}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments((commentsData.comments ?? []).map((c: any) => ({
          id: c.id,
          content: c.content,
          user_name: c.user_name || c.author?.display_name || c.author?.email || 'Anonymous',
          created_at: c.created_at,
        })));
      }

      // Projects & quotations already set above from detailData
    } catch (error) {
      console.error('Failed to fetch customer detail:', error);
    } finally {
      setLoadingDetail(false);
    }
    setShowDetail(true);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactFormData),
      });

      if (res.ok) {
        const newContact = await res.json();
        setContacts([...contacts, newContact.contact]);
        setContactFormData({ first_name: '', last_name: '', email: '', phone: '', position: '', is_primary: false });
        setShowAddContact(false);
      }
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newComment.trim()) return;

    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const commentData = await res.json();
        const c = commentData.comment;
        setComments([{
          id: c.id,
          content: c.content,
          user_name: c.user_name || c.author?.display_name || c.author?.email || 'You',
          created_at: c.created_at,
        }, ...comments]);
        setNewComment('');
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Comment POST failed:', res.status, err);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      industry: '',
      address: '',
      tax_id: '',
      phone: '',
      email: '',
      website: '',
      notes: '',
      google_map_url: '',
      referral_company: '',
      referral_person: '',
      status: 'prospect',
    });
    setSelectedCustomer(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      company_name: customer.company_name,
      industry: customer.industry || '',
      address: customer.address || '',
      tax_id: customer.tax_id || '',
      phone: customer.phone || '',
      email: customer.email || '',
      website: customer.website || '',
      notes: customer.notes || '',
      google_map_url: customer.google_map_url || '',
      referral_company: customer.referral_company || '',
      referral_person: customer.referral_person || '',
      status: customer.status,
    });
    setShowForm(true);
    setShowDetail(false);
  };

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    prospect: customers.filter(c => c.status === 'prospect').length,
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{L('title', lang)}</h2>
          <p className="text-gray-500 text-sm mt-1">{L('subtitle', lang)}</p>
        </div>
        <div className="flex gap-2">
          <TranslateButton text={`${L('title', lang)} — ${L('subtitle', lang)}`} />
          {canManage && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              {L('addCustomer', lang)}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <p className="text-gray-500 text-sm">{L('total', lang)}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <p className="text-gray-500 text-sm">{L('activeCustomers', lang)}</p>
          <p className="text-3xl font-bold text-green-700 mt-2">{stats.active}</p>
        </div>
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4">
          <p className="text-gray-500 text-sm">{L('prospects', lang)}</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.prospect}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input
            type="text"
            placeholder={L('searchPlaceholder', lang)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg pl-10 pr-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'prospect', 'inactive', 'churned'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#FFFFFF] text-gray-700 border border-[#E2E8F0]'
              }`}
            >
              {status === 'all' ? L('all', lang) : L(status, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">{L('loading', lang)}</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{L('noCustomers', lang)}</div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => handleViewDetail(customer)}
              className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-4 hover:border-[#003087] cursor-pointer transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{customer.company_name}</h3>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: (statusColors[customer.status] ?? defaultStatusColor).badge + '20',
                        color: (statusColors[customer.status] ?? defaultStatusColor).badge,
                      }}
                    >
                      {customer.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-500 mb-2">
                    {customer.industry && <p>{L('industry', lang)} {customer.industry}</p>}
                    <p>{L('contacts', lang)} {customer.contact_count ?? 0}</p>
                    {customer.phone && <p>{L('phone', lang)} {customer.phone}</p>}
                    {customer.email && <p>{L('email', lang)} {customer.email}</p>}
                    {customer.referral_company && <p>{L('referralCompany', lang)}: {customer.referral_company}</p>}
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCustomer(customer);
                      }}
                      className="p-2 hover:bg-[#E2E8F0] rounded-lg transition"
                    >
                      <Edit2 size={16} className="text-blue-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(customer.id);
                      }}
                      className="p-2 hover:bg-[#E2E8F0] rounded-lg transition"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedCustomer ? L('editCustomer', lang) : L('addNewCustomer', lang)}
              </h3>
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

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('companyName', lang)}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('industryField', lang)}
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('status', lang)}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as any })
                    }
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                  >
                    <option value="prospect">{L('prospect', lang)}</option>
                    <option value="active">{L('active', lang)}</option>
                    <option value="inactive">{L('inactive', lang)}</option>
                    <option value="churned">{L('churned', lang)}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('taxId', lang)}
                  </label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('phoneField', lang)}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('emailField', lang)}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('website', lang)}
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('address', lang)}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('googleMap', lang)}
                  </label>
                  <input type="url" placeholder={L('googleMapPlaceholder', lang)}
                    value={formData.google_map_url}
                    onChange={(e) => setFormData({ ...formData, google_map_url: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]" />
                  {formData.google_map_url && (
                    <a href={formData.google_map_url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm text-[#003087] hover:underline">
                      <MapPin className="w-4 h-4" /> {L('openMap', lang)}
                    </a>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('referralCompany', lang)}
                  </label>
                  <input type="text" placeholder={L('referralCompanyPlaceholder', lang)}
                    value={formData.referral_company}
                    onChange={(e) => setFormData({ ...formData, referral_company: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('referralPerson', lang)}
                  </label>
                  <input type="text" placeholder={L('referralPersonPlaceholder', lang)}
                    value={formData.referral_person}
                    onChange={(e) => setFormData({ ...formData, referral_person: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {L('notes', lang)}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087] resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  {L('save', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg text-sm font-medium"
                >
                  {L('cancel', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer - Full Screen Panel */}
      {showDetail && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowDetail(false)}
          ></div>

          {/* Side Panel */}
          <div className="relative ml-auto w-full max-w-4xl bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-[#E2E8F0] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.company_name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: (statusColors[selectedCustomer.status] ?? defaultStatusColor).badge + '20',
                        color: (statusColors[selectedCustomer.status] ?? defaultStatusColor).badge,
                      }}
                    >
                      {L(selectedCustomer.status, lang)}
                    </span>
                    {selectedCustomer.industry && (
                      <span className="text-sm text-gray-600">{selectedCustomer.industry}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-gray-500 hover:text-gray-900 p-2"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Summary Stats Bar */}
              {deals.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#E2E8F0]">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{L('totalDealValue', lang)}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(
                        deals.reduce((sum, d) => sum + (d.value || 0), 0)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{L('wonDeals', lang)}</p>
                    <p className="text-lg font-bold text-green-600">
                      {deals.filter(d => d.stage === 'po_received' || d.stage === 'payment_received').length} / {deals.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{L('winRate', lang)}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {deals.length > 0 ? Math.round((deals.filter(d => d.stage === 'po_received' || d.stage === 'payment_received').length / deals.length) * 100) : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{L('totalRevenue', lang)}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(
                        deals.filter(d => d.stage === 'po_received' || d.stage === 'payment_received').reduce((sum, d) => sum + (d.value || 0), 0)
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 border-b border-[#E2E8F0] bg-gray-50">
              <div className="flex overflow-x-auto">
                {[
                  { key: 'basic' as const, label: L('basicInfo', lang), icon: User },
                  { key: 'deals' as const, label: L('deals', lang), icon: Briefcase },
                  { key: 'activity' as const, label: L('activity', lang), icon: Clock },
                  { key: 'projects' as const, label: L('projects', lang), icon: FileCheck },
                  { key: 'comments' as const, label: L('comments', lang), icon: MessageSquare },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setDetailTab(key)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
                      detailTab === key
                        ? 'border-[#003087] text-[#003087]'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">{L('loading', lang)}</p>
                </div>
              ) : detailTab === 'basic' ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User size={20} className="text-[#003087]" />
                      {L('basicInfo', lang)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedCustomer.company_name && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">{L('companyName', lang)}</p>
                          <p className="mt-1 text-gray-900">{selectedCustomer.company_name}</p>
                        </div>
                      )}
                      {selectedCustomer.industry && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">{L('industryField', lang)}</p>
                          <p className="mt-1 text-gray-900">{selectedCustomer.industry}</p>
                        </div>
                      )}
                      {selectedCustomer.tax_id && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">{L('taxId', lang)}</p>
                          <p className="mt-1 text-gray-900">{selectedCustomer.tax_id}</p>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">{L('phoneField', lang)}</p>
                          <p className="mt-1 text-gray-900 flex items-center gap-2">
                            <Phone size={14} className="text-gray-500" />
                            {selectedCustomer.phone}
                          </p>
                        </div>
                      )}
                      {selectedCustomer.email && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">{L('emailField', lang)}</p>
                          <p className="mt-1 text-gray-900 flex items-center gap-2">
                            <Mail size={14} className="text-gray-500" />
                            {selectedCustomer.email}
                          </p>
                        </div>
                      )}
                      {selectedCustomer.website && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">{L('website', lang)}</p>
                          <p className="mt-1 text-gray-900 flex items-center gap-2">
                            <Globe size={14} className="text-gray-500" />
                            {selectedCustomer.website}
                          </p>
                        </div>
                      )}
                      {selectedCustomer.address && (
                        <div className="md:col-span-2">
                          <p className="text-xs font-medium text-gray-500 uppercase">{L('address', lang)}</p>
                          <p className="mt-1 text-gray-900 flex items-start gap-2">
                            <MapPin size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                            {selectedCustomer.address}
                          </p>
                        </div>
                      )}
                      {selectedCustomer.google_map_url && (
                        <div className="md:col-span-2">
                          <p className="text-xs font-medium text-gray-500 uppercase">{L('googleMapLabel', lang)}</p>
                          <a href={selectedCustomer.google_map_url} target="_blank" rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#003087] rounded-full flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#003087]">{L('openMap', lang)}</p>
                              <p className="text-xs text-gray-500 truncate">{selectedCustomer.google_map_url}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </a>
                        </div>
                      )}
                      {(selectedCustomer.referral_company || selectedCustomer.referral_person) && (
                        <div className="md:col-span-2">
                          <p className="text-xs font-medium text-gray-500 uppercase">{L('referralInfo', lang)}</p>
                          <div className="mt-1 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex-shrink-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              {selectedCustomer.referral_company && (
                                <p className="text-sm font-medium text-gray-900">{selectedCustomer.referral_company}</p>
                              )}
                              {selectedCustomer.referral_person && (
                                <p className="text-sm text-gray-600">{selectedCustomer.referral_person}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedCustomer.notes && (
                        <div className="md:col-span-2">
                          <p className="text-xs font-medium text-gray-500 uppercase">{L('notes', lang)}</p>
                          <p className="mt-1 text-gray-900">{selectedCustomer.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contacts Section */}
                  <div className="border-t border-[#E2E8F0] pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Users size={20} className="text-[#003087]" />
                        {L('contactsList', lang)} ({contacts.length})
                      </h3>
                      {canManage && (
                        <button
                          onClick={() => setShowAddContact(true)}
                          className="px-3 py-1 bg-[#003087] hover:bg-[#002060] text-white rounded text-xs flex items-center gap-1"
                        >
                          <Plus size={14} />
                          {L('addContact', lang)}
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {contacts.length === 0 ? (
                        <p className="text-gray-500 text-sm">{L('noContacts', lang)}</p>
                      ) : (
                        contacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="bg-gray-50 rounded-lg border border-[#E2E8F0] p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-semibold text-gray-900">{contact.first_name} {contact.last_name || ''}</p>
                                  {contact.is_primary && (
                                    <span className="px-2 py-0.5 bg-[#F7941D] text-gray-900 text-xs rounded font-medium">
                                      {L('primaryContact', lang)}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  {contact.email && (
                                    <p className="flex items-center gap-2">
                                      <Mail size={14} className="text-gray-500" />
                                      {contact.email}
                                    </p>
                                  )}
                                  {contact.phone && (
                                    <p className="flex items-center gap-2">
                                      <Phone size={14} className="text-gray-500" />
                                      {contact.phone}
                                    </p>
                                  )}
                                  {contact.position && (
                                    <p className="flex items-center gap-2">
                                      <User size={14} className="text-gray-500" />
                                      {contact.position}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {showAddContact && (
                      <form onSubmit={handleAddContact} className="mt-4 p-4 bg-gray-50 rounded-lg border border-[#E2E8F0] space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {L('name', lang)}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={lang === 'th' ? 'ชื่อ' : 'First name'}
                              value={contactFormData.first_name}
                              onChange={(e) =>
                                setContactFormData({ ...contactFormData, first_name: e.target.value })
                              }
                              className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {lang === 'th' ? 'นามสกุล' : lang === 'jp' ? '姓' : 'Last Name'}
                            </label>
                            <input
                              type="text"
                              placeholder={lang === 'th' ? 'นามสกุล' : 'Last name'}
                              value={contactFormData.last_name}
                              onChange={(e) =>
                                setContactFormData({ ...contactFormData, last_name: e.target.value })
                              }
                              className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {L('emailRequired', lang)}
                          </label>
                          <input
                            type="email"
                            value={contactFormData.email}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, email: e.target.value })
                            }
                            className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {L('phoneOptional', lang)}
                          </label>
                          <input
                            type="tel"
                            value={contactFormData.phone}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, phone: e.target.value })
                            }
                            className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {L('position', lang)}
                          </label>
                          <input
                            type="text"
                            value={contactFormData.position}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, position: e.target.value })
                            }
                            className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={contactFormData.is_primary}
                            onChange={(e) =>
                              setContactFormData({ ...contactFormData, is_primary: e.target.checked })
                            }
                            className="rounded"
                          />
                          {L('isPrimary', lang)}
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 px-3 py-2 bg-[#003087] hover:bg-[#002060] text-white rounded text-sm font-medium"
                          >
                            {L('save', lang)}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddContact(false);
                              setContactFormData({ first_name: '', last_name: '', email: '', phone: '', position: '', is_primary: false });
                            }}
                            className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded text-sm font-medium"
                          >
                            {L('cancel', lang)}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ) : detailTab === 'deals' ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase size={20} className="text-[#003087]" />
                    {L('deals', lang)}
                  </h3>
                  {deals.length === 0 ? (
                    <p className="text-gray-500">{L('noDeals', lang)}</p>
                  ) : (
                    <div className="space-y-3">
                      {deals.map((deal) => (
                        <div
                          key={deal.id}
                          className="bg-gray-50 rounded-lg border border-[#E2E8F0] p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{deal.title}</h4>
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{ backgroundColor: pipelineStageColors[deal.stage] || '#6B7280', color: getTextColorForBackground(pipelineStageColors[deal.stage] || '#6B7280') }}
                            >
                              {deal.stage}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">{L('dealValue', lang)}</p>
                              <p className="font-semibold text-gray-900">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(deal.value || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">{L('dealProbability', lang)}</p>
                              <p className="font-semibold text-gray-900">{deal.probability}%</p>
                            </div>
                            {deal.owner && (
                              <div>
                                <p className="text-gray-500 text-xs">{L('dealOwner', lang)}</p>
                                <p className="font-semibold text-gray-900">{deal.owner}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : detailTab === 'activity' ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-[#003087]" />
                    {L('activity', lang)}
                  </h3>
                  {activities.length === 0 ? (
                    <p className="text-gray-500">{L('noActivities', lang)}</p>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => {
                        const getActivityIcon = () => {
                          switch (activity.type) {
                            case 'call': return <Phone size={16} className="text-blue-500" />;
                            case 'meeting': return <Users size={16} className="text-green-500" />;
                            case 'email': return <Mail size={16} className="text-purple-500" />;
                            case 'proposal': return <FileText size={16} className="text-orange-500" />;
                            default: return <Clock size={16} className="text-gray-500" />;
                          }
                        };
                        return (
                          <div key={activity.id} className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              {getActivityIcon()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                {activity.performer && <span>{activity.performer}</span>}
                                <span>{new Date(activity.date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : detailTab === 'projects' ? (
                <div className="space-y-6">
                  {/* Projects Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase size={20} className="text-[#003087]" />
                      {lang === 'th' ? 'โปรเจค' : lang === 'jp' ? 'プロジェクト' : 'Projects'}
                    </h3>
                    {customerProjects.length === 0 ? (
                      <p className="text-gray-500 text-sm">{lang === 'th' ? 'ไม่มีโปรเจค' : 'No projects'}</p>
                    ) : (
                      <div className="space-y-3">
                        {customerProjects.map((p: any) => (
                          <div key={p.id} className="bg-white border border-[#E2E8F0] rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                              setShowDetail(false);
                              if (onNavigate) onNavigate('tasks', p.id);
                            }}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {p.project_code && <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{p.project_code}</span>}
                                  <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'active' || p.status === 'in_progress' ? 'bg-green-50 text-green-700' : p.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {p.status || 'planning'}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">{p.name_th || p.name_en || 'Untitled'}</p>
                              </div>
                              {p.budget_limit > 0 && (
                                <span className="text-sm font-bold text-[#003087]">
                                  {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(p.budget_limit)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quotations Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileCheck size={20} className="text-[#F7941D]" />
                      {lang === 'th' ? 'ใบเสนอราคา' : lang === 'jp' ? '見積書' : 'Quotations'}
                    </h3>
                    {customerQuotations.length === 0 ? (
                      <p className="text-gray-500 text-sm">{lang === 'th' ? 'ไม่มีใบเสนอราคา' : 'No quotations'}</p>
                    ) : (
                      <div className="space-y-3">
                        {customerQuotations.map((q: any) => (
                          <div key={q.id} className="bg-white border border-[#E2E8F0] rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                              setShowDetail(false);
                              if (onNavigate) onNavigate('quotations');
                            }}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {q.quotation_number && <span className="text-xs font-mono bg-orange-50 text-orange-700 px-2 py-0.5 rounded">{q.quotation_number}</span>}
                                  <span className={`text-xs px-2 py-0.5 rounded ${q.status === 'accepted' ? 'bg-green-50 text-green-700' : q.status === 'rejected' ? 'bg-red-50 text-red-700' : q.status === 'sent' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {q.status || 'draft'}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900">{q.title || q.quotation_number || 'Untitled'}</p>
                                {q.created_at && <p className="text-xs text-gray-500 mt-1">{new Date(q.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}</p>}
                              </div>
                              {q.total_amount > 0 && (
                                <span className="text-sm font-bold text-[#F7941D]">
                                  {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(q.total_amount)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare size={20} className="text-[#003087]" />
                    {L('comments', lang)}
                  </h3>

                  {/* Comments List */}
                  <div className="space-y-4 mb-6">
                    {comments.length === 0 ? (
                      <p className="text-gray-500 text-sm">{L('noComments', lang)}</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg border border-[#E2E8F0] p-4">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-gray-900">{comment.user_name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                          <div className="mt-2">
                            <TranslateButton text={comment.content} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Form */}
                  {canManage && (
                    <form onSubmit={handleAddComment} className="border-t border-[#E2E8F0] pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {L('addComment', lang)}
                      </label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={L('commentPlaceholder', lang)}
                        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087] resize-none"
                        rows={3}
                      />
                      <div className="mt-3 flex gap-2">
                        <button
                          type="submit"
                          disabled={!newComment.trim()}
                          className="px-4 py-2 bg-[#003087] hover:bg-[#002060] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {L('submit', lang)}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {canManage && (
              <div className="flex-shrink-0 border-t border-[#E2E8F0] p-6 bg-gray-50 flex gap-2">
                <button
                  onClick={() => handleEditCustomer(selectedCustomer)}
                  className="flex-1 px-4 py-2 bg-[#003087] hover:bg-[#002060] text-white rounded-lg text-sm font-medium"
                >
                  {L('edit', lang)}
                </button>
                <button
                  onClick={() => setShowDetail(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg text-sm font-medium"
                >
                  {L('close', lang)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
