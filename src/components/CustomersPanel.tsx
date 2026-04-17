'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, User, Mail, Phone, Globe, MapPin, FileText, X } from 'lucide-react';
import type { Lang } from '@/lib/i18n';
import TranslateButton from './TranslateButton';

interface Props {
  projects: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null }[];
  members: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
  lang?: Lang;
}

interface Customer {
  id: string;
  company_name: string;
  industry?: string;
  status: 'active' | 'inactive' | 'prospect' | 'churned';
  address?: string;
  tax_id?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  contact_count?: number;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  is_primary: boolean;
}

const statusColors = {
  active: { bg: 'bg-green-900', text: 'text-green-200', badge: '#22C55E' },
  inactive: { bg: 'bg-gray-900', text: 'text-gray-200', badge: '#6B7280' },
  prospect: { bg: 'bg-blue-900', text: 'text-blue-200', badge: '#3B82F6' },
  churned: { bg: 'bg-red-900', text: 'text-red-200', badge: '#EF4444' },
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
}: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    address: '',
    tax_id: '',
    phone: '',
    email: '',
    website: '',
    notes: '',
    status: 'prospect' as 'active' | 'inactive' | 'prospect' | 'churned',
  });

  const [contactFormData, setContactFormData] = useState({
    name: '',
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
    try {
      const res = await fetch(`/api/customers/${customer.id}/contacts`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
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
        setContacts([...contacts, newContact]);
        setContactFormData({ name: '', email: '', phone: '', position: '', is_primary: false });
        setShowAddContact(false);
      }
    } catch (error) {
      console.error('Failed to add contact:', error);
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
          <h2 className="text-2xl font-bold text-white">{L('title', lang)}</h2>
          <p className="text-gray-400 text-sm mt-1">{L('subtitle', lang)}</p>
        </div>
        <div className="flex gap-2">
          <TranslateButton text={`${L('title', lang)} — ${L('subtitle', lang)}`} />
          {canManage && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              {L('addCustomer', lang)}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">{L('total', lang)}</p>
          <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">{L('activeCustomers', lang)}</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{stats.active}</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">{L('prospects', lang)}</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{stats.prospect}</p>
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
            className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'prospect', 'inactive', 'churned'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                statusFilter === status
                  ? 'bg-[#003087] text-white'
                  : 'bg-[#1E293B] text-gray-300 border border-[#334155]'
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
          <div className="text-center py-8 text-gray-400">{L('loading', lang)}</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">{L('noCustomers', lang)}</div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => handleViewDetail(customer)}
              className="bg-[#1E293B] rounded-xl border border-[#334155] p-4 hover:border-[#003087] cursor-pointer transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{customer.company_name}</h3>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: statusColors[customer.status].badge + '20',
                        color: statusColors[customer.status].badge,
                      }}
                    >
                      {customer.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-400 mb-2">
                    {customer.industry && <p>{L('industry', lang)} {customer.industry}</p>}
                    <p>{L('contacts', lang)} {customer.contact_count ?? 0}</p>
                    {customer.phone && <p>{L('phone', lang)} {customer.phone}</p>}
                    {customer.email && <p>{L('email', lang)} {customer.email}</p>}
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCustomer(customer);
                      }}
                      className="p-2 hover:bg-[#334155] rounded-lg transition"
                    >
                      <Edit2 size={16} className="text-blue-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomer(customer.id);
                      }}
                      className="p-2 hover:bg-[#334155] rounded-lg transition"
                    >
                      <Trash2 size={16} className="text-red-400" />
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
          <div className="bg-[#0F172A] rounded-xl border border-[#334155] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {selectedCustomer ? L('editCustomer', lang) : L('addNewCustomer', lang)}
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

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {L('companyName', lang)}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) =>
                      setFormData({ ...formData, company_name: e.target.value })
                    }
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {L('industryField', lang)}
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {L('status', lang)}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as any })
                    }
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  >
                    <option value="prospect">{L('prospect', lang)}</option>
                    <option value="active">{L('active', lang)}</option>
                    <option value="inactive">{L('inactive', lang)}</option>
                    <option value="churned">{L('churned', lang)}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {L('taxId', lang)}
                  </label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {L('phoneField', lang)}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {L('emailField', lang)}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {L('website', lang)}
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {L('address', lang)}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {L('notes', lang)}
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
                  {L('save', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded-lg text-sm font-medium"
                >
                  {L('cancel', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] rounded-xl border border-[#334155] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{selectedCustomer.company_name}</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Customer Info */}
            <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4 mb-4">
              <h4 className="font-semibold text-white mb-3">{L('customerInfo', lang)}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {selectedCustomer.industry && (
                  <div>
                    <span className="text-gray-400">{L('industry', lang)}</span>
                    <p className="text-white">{selectedCustomer.industry}</p>
                  </div>
                )}
                {selectedCustomer.tax_id && (
                  <div>
                    <span className="text-gray-400">{L('taxLabel', lang)}</span>
                    <p className="text-white">{selectedCustomer.tax_id}</p>
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <div>
                      <span className="text-gray-400">{L('phoneLabel', lang)}</span>
                      <p className="text-white">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <div>
                      <span className="text-gray-400">{L('emailLabel', lang)}</span>
                      <p className="text-white">{selectedCustomer.email}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <MapPin size={16} className="text-gray-400" />
                    <div>
                      <span className="text-gray-400">{L('addressLabel', lang)}</span>
                      <p className="text-white">{selectedCustomer.address}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.website && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <Globe size={16} className="text-gray-400" />
                    <div>
                      <span className="text-gray-400">{L('websiteLabel', lang)}</span>
                      <p className="text-white">{selectedCustomer.website}</p>
                    </div>
                  </div>
                )}
              </div>
              {selectedCustomer.notes && (
                <div className="mt-3 pt-3 border-t border-[#334155]">
                  <span className="text-gray-400 text-sm">{L('notesLabel', lang)}</span>
                  <p className="text-white text-sm">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>

            {/* Contacts */}
            <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-white">{L('contactsList', lang)} ({contacts.length})</h4>
                {canManage && (
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="px-3 py-1 bg-[#003087] hover:bg-[#0040B0] text-white rounded text-xs flex items-center gap-1"
                  >
                    <Plus size={14} />
                    {L('addContact', lang)}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {contacts.length === 0 ? (
                  <p className="text-gray-400 text-sm">{L('noContacts', lang)}</p>
                ) : (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="bg-[#0F172A] rounded-lg border border-[#334155] p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{contact.name}</p>
                            {contact.is_primary && (
                              <span className="px-2 py-0.5 bg-[#F7941D] text-black text-xs rounded">
                                {L('primaryContact', lang)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                            {contact.email && (
                              <p className="flex items-center gap-1">
                                <Mail size={12} />
                                {contact.email}
                              </p>
                            )}
                            {contact.phone && (
                              <p className="flex items-center gap-1">
                                <Phone size={12} />
                                {contact.phone}
                              </p>
                            )}
                            {contact.position && (
                              <p className="flex items-center gap-1">
                                <User size={12} />
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
                <form onSubmit={handleAddContact} className="mt-4 p-4 bg-[#0F172A] rounded-lg border border-[#334155] space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      {L('name', lang)}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactFormData.name}
                      onChange={(e) =>
                        setContactFormData({ ...contactFormData, name: e.target.value })
                      }
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      {L('emailRequired', lang)}
                    </label>
                    <input
                      type="email"
                      required
                      value={contactFormData.email}
                      onChange={(e) =>
                        setContactFormData({ ...contactFormData, email: e.target.value })
                      }
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      {L('phoneOptional', lang)}
                    </label>
                    <input
                      type="tel"
                      value={contactFormData.phone}
                      onChange={(e) =>
                        setContactFormData({ ...contactFormData, phone: e.target.value })
                      }
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      {L('position', lang)}
                    </label>
                    <input
                      type="text"
                      value={contactFormData.position}
                      onChange={(e) =>
                        setContactFormData({ ...contactFormData, position: e.target.value })
                      }
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
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
                      className="flex-1 px-3 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded text-sm font-medium"
                    >
                      {L('save', lang)}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddContact(false);
                        setContactFormData({ name: '', email: '', phone: '', position: '', is_primary: false });
                      }}
                      className="flex-1 px-3 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded text-sm font-medium"
                    >
                      {L('cancel', lang)}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {canManage && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditCustomer(selectedCustomer)}
                  className="flex-1 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm font-medium"
                >
                  {L('edit', lang)}
                </button>
                <button
                  onClick={() => setShowDetail(false)}
                  className="flex-1 px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded-lg text-sm font-medium"
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
