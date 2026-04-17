'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, User, Mail, Phone, Globe, MapPin, FileText, X } from 'lucide-react';
import TranslateButton from './TranslateButton';

interface Props {
  projects: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null }[];
  members: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
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

export default function CustomersPanel({
  projects,
  members,
  filterProjectId,
  canManage = true,
  refreshKey = 0,
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
    status: 'prospect' as const,
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
    if (!confirm('ยืนยันการลบ?')) return;
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
          <h2 className="text-2xl font-bold text-white">ลูกค้า</h2>
          <p className="text-gray-400 text-sm mt-1">จัดการข้อมูลลูกค้าและติดต่อ</p>
        </div>
        <div className="flex gap-2">
          <TranslateButton text="ลูกค้า — จัดการข้อมูลลูกค้าและติดต่อ" />
          {canManage && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm flex items-center gap-2"
            >
              <Plus size={16} />
              เพิ่มลูกค้า
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">ทั้งหมด</p>
          <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">ลูกค้าใช้งาน</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{stats.active}</p>
        </div>
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
          <p className="text-gray-400 text-sm">ผู้สนใจ</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{stats.prospect}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="ค้นหาชื่อบริษัท..."
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
              {status === 'all' ? 'ทั้งหมด' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">กำลังโหลด...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">ไม่พบลูกค้า</div>
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
                    {customer.industry && <p>สาขา: {customer.industry}</p>}
                    <p>ติดต่อ: {customer.contact_count ?? 0}</p>
                    {customer.phone && <p>โทร: {customer.phone}</p>}
                    {customer.email && <p>อีเมล: {customer.email}</p>}
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
                {selectedCustomer ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}
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
                    ชื่อบริษัท *
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
                    สาขาอุตสาหกรรม
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
                    สถานะ *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as any })
                    }
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]"
                  >
                    <option value="prospect">ผู้สนใจ</option>
                    <option value="active">ใช้งาน</option>
                    <option value="inactive">ไม่ใช้งาน</option>
                    <option value="churned">หมดสัญญา</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    เลขประจำตัวผู้เสียภาษี
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
                    โทรศัพท์
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
                    อีเมล
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
                    เว็บไซต์
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
                    ที่อยู่
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
              <h4 className="font-semibold text-white mb-3">ข้อมูลลูกค้า</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {selectedCustomer.industry && (
                  <div>
                    <span className="text-gray-400">สาขา:</span>
                    <p className="text-white">{selectedCustomer.industry}</p>
                  </div>
                )}
                {selectedCustomer.tax_id && (
                  <div>
                    <span className="text-gray-400">เลขประจำตัวผู้เสียภาษี:</span>
                    <p className="text-white">{selectedCustomer.tax_id}</p>
                  </div>
                )}
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <div>
                      <span className="text-gray-400">โทร:</span>
                      <p className="text-white">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    <div>
                      <span className="text-gray-400">อีเมล:</span>
                      <p className="text-white">{selectedCustomer.email}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <MapPin size={16} className="text-gray-400" />
                    <div>
                      <span className="text-gray-400">ที่อยู่:</span>
                      <p className="text-white">{selectedCustomer.address}</p>
                    </div>
                  </div>
                )}
                {selectedCustomer.website && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <Globe size={16} className="text-gray-400" />
                    <div>
                      <span className="text-gray-400">เว็บไซต์:</span>
                      <p className="text-white">{selectedCustomer.website}</p>
                    </div>
                  </div>
                )}
              </div>
              {selectedCustomer.notes && (
                <div className="mt-3 pt-3 border-t border-[#334155]">
                  <span className="text-gray-400 text-sm">หมายเหตุ:</span>
                  <p className="text-white text-sm">{selectedCustomer.notes}</p>
                </div>
              )}
            </div>

            {/* Contacts */}
            <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-white">ติดต่อ ({contacts.length})</h4>
                {canManage && (
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="px-3 py-1 bg-[#003087] hover:bg-[#0040B0] text-white rounded text-xs flex items-center gap-1"
                  >
                    <Plus size={14} />
                    เพิ่ม
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {contacts.length === 0 ? (
                  <p className="text-gray-400 text-sm">ไม่มีติดต่อ</p>
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
                                หลัก
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
                      ชื่อ *
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
                      อีเมล *
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
                      โทรศัพท์
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
                      ตำแหน่ง
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
                    ติดต่อหลัก
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-3 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded text-sm font-medium"
                    >
                      บันทึก
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddContact(false);
                        setContactFormData({ name: '', email: '', phone: '', position: '', is_primary: false });
                      }}
                      className="flex-1 px-3 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded text-sm font-medium"
                    >
                      ยกเลิก
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
                  แก้ไข
                </button>
                <button
                  onClick={() => setShowDetail(false)}
                  className="flex-1 px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded-lg text-sm font-medium"
                >
                  ปิด
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
