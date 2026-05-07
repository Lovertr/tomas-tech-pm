'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, X, User, Search, Users, MessageSquare, Send, Loader2, UserPlus, UserMinus, CheckCircle, XCircle, Bell, Clock } from 'lucide-react';
import TranslateButton, { InlineTranslateButton } from './TranslateButton';
import type { Lang } from '@/lib/i18n';

interface Props {
  projects: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null }[];
  members: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
  lang?: Lang;
  currentUserId?: string;
  userRole?: string;
}

interface Deal {
  id: string;
  title: string;
  customer_id: string;
  customer_name: string;
  value: number;
  stage: 'new_lead' | 'waiting_present' | 'contacted' | 'proposal_submitted' | 'proposal_confirmed' | 'quotation' | 'negotiation' | 'waiting_po' | 'po_received' | 'payment_received' | 'cancelled' | 'refused';
  expected_close_date?: string;
  probability?: number;
  owner_id?: string;
  owner_name?: string;
  notes?: string;
  contact_person?: string;
  contact_channel?: string;
  work_done?: string;
  next_steps?: string;
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

interface Collaborator {
  id: string;
  user_id: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  inviter?: { id: string; display_name?: string };
  user?: { id: string; display_name?: string; email?: string };
}

interface DealInvitation {
  id: string;
  deal_id: string;
  role: string;
  status: string;
  created_at: string;
  inviter?: { id: string; display_name?: string };
  deal?: { id: string; title: string; value: number; stage: string };
}

interface DealComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: { id: string; display_name?: string; email?: string };
}

/* --- Stage config --- */
const stageLabels: Record<string, Record<string, string>> = {
  new_lead:           { th: 'ลีดใหม่',            en: 'New Lead',              jp: '新規リード' },
  waiting_present:    { th: 'รอนำเสนอ',          en: 'Waiting to Present',    jp: 'プレゼン待ち' },
  contacted:          { th: 'ติดต่อแล้ว',         en: 'Contacted',             jp: '連絡済み' },
  proposal_submitted: { th: 'เสนอ Proposal',     en: 'Proposal Submitted',    jp: '提案済み' },
  proposal_confirmed: { th: 'คอนเฟิร์ม Proposal', en: 'Proposal Confirmed',   jp: '提案承認' },
  quotation:          { th: 'เสนอราคา',           en: 'Quotation',             jp: '見積もり' },
  negotiation:        { th: 'เจรจาต่อรอง',        en: 'Negotiation',           jp: '交渉中' },
  waiting_po:         { th: 'รอ PO',              en: 'Waiting PO',            jp: 'PO待機' },
  po_received:        { th: 'ได้รับ PO',           en: 'PO Received',           jp: 'PO受領' },
  payment_received:   { th: 'ได้รับยอดชำระแล้ว',    en: 'Payment Received',      jp: '入金済み' },
  cancelled:          { th: 'ยกเลิก',             en: 'Cancelled',             jp: 'キャンセル' },
  refused:            { th: 'ปฏิเสธ',             en: 'Refused',               jp: '拒否' },
};

const stageColors: Record<string, string> = {
  new_lead: '#0EA5E9', waiting_present: '#6B7280', contacted: '#3B82F6',
  proposal_submitted: '#F59E0B', proposal_confirmed: '#8B5CF6', quotation: '#F7941D',
  negotiation: '#EC4899', waiting_po: '#14B8A6', po_received: '#22C55E',
  payment_received: '#059669', cancelled: '#EF4444', refused: '#9CA3AF',
};

const getTextColorForBackground = (bgColor: string): string => {
  const darkColors = ['#0EA5E9', '#3B82F6', '#8B5CF6', '#EF4444', '#059669'];
  return darkColors.includes(bgColor) ? '#FFFFFF' : '#1F2937';
};

/* --- i18n text --- */
const panelText: Record<string, Record<string, string>> = {
  title:           { th: 'Sales Pipeline',                        en: 'Sales Pipeline',                  jp: '営業パイプライン' },
  addDeal:         { th: 'เพิ่ม Deal',                             en: 'Add Deal',                        jp: 'ディール追加' },
  searchName:      { th: 'Deal name...',                           en: 'Deal name...',                    jp: 'ディール名...' },
  searchCustomer:  { th: 'ลูกค้า...',                              en: 'Customer...',                     jp: '顧客...' },
  searchOwner:     { th: 'ผู้รับผิดชอบ...',                         en: 'Owner...',                        jp: '担当者...' },
  myDeal:          { th: 'MY DEAL',                                en: 'MY DEAL',                         jp: 'MY DEAL' },
  collaborator:    { th: 'ผู้ร่วมงาน',                             en: 'Collaborator',                    jp: 'コラボレーター' },
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
  contactPerson:   { th: 'ชื่อผู้ติดต่อ',                            en: 'Contact Person',                  jp: '担当者名' },
  contactChannel:  { th: 'ช่องทางติดต่อ',                            en: 'Contact Channel',                 jp: '連絡手段' },
  workDone:        { th: 'รายละเอียดที่ทำไปแล้ว',                     en: 'Work Done',                       jp: '完了済みの作業' },
  nextSteps:       { th: 'สิ่งที่จะต้องทำต่อ',                       en: 'Next Steps',                      jp: '次のステップ' },
  save:            { th: 'บันทึก',                                  en: 'Save',                            jp: '保存' },
  cancel:          { th: 'ยกเลิก',                                 en: 'Cancel',                          jp: 'キャンセル' },
  confirmDelete:   { th: 'ยืนยันการลบดีลนี้?',                      en: 'Delete this deal?',               jp: 'このディールを削除しますか？' },
  edit:            { th: 'แก้ไข',                                   en: 'Edit',                            jp: '編集' },
  del:             { th: 'ลบ',                                      en: 'Del',                             jp: '削除' },
  collaborators:   { th: 'ผู้ร่วมงาน',                             en: 'Collaborators',                   jp: 'コラボレーター' },
  inviteFriend:    { th: 'ชวนเพื่อน',                              en: 'Invite Friend',                   jp: '友達を招待' },
  addCollaborator: { th: 'เพิ่มผู้ร่วมงาน',                        en: 'Add Collaborator',                jp: 'コラボレーター追加' },
  selectMember:    { th: 'เลือกสมาชิก',                            en: 'Select member',                   jp: 'メンバーを選択' },
  removeCollab:    { th: 'ลบผู้ร่วมงาน?',                          en: 'Remove collaborator?',            jp: 'コラボレーターを削除？' },
  alreadyCollab:   { th: 'เป็นผู้ร่วมงานอยู่แล้ว',                  en: 'Already a collaborator',           jp: '既にコラボレーター' },
  comments:        { th: 'ความคิดเห็น',                             en: 'Comments',                        jp: 'コメント' },
  writeComment:    { th: 'เขียนความคิดเห็น...',                    en: 'Write a comment...',              jp: 'コメントを書く...' },
  noComments:      { th: 'ยังไม่มีความคิดเห็น',                     en: 'No comments yet',                 jp: 'コメントなし' },
  deleteComment:   { th: 'ลบความคิดเห็นนี้?',                      en: 'Delete this comment?',            jp: 'このコメントを削除？' },
  notSpecified:    { th: 'ยังไม่ระบุ',                               en: 'Not specified',                    jp: '未指定' },
  contactInfo:     { th: 'ข้อมูลผู้ติดต่อ',                          en: 'Contact Info',                     jp: '連絡先情報' },
  pendingInvite:   { th: 'รอตอบรับ',                                en: 'Pending',                          jp: '承認待ち' },
  accepted:        { th: 'ตอบรับแล้ว',                               en: 'Accepted',                         jp: '承認済み' },
  rejected:        { th: 'ปฏิเสธแล้ว',                               en: 'Rejected',                         jp: '拒否済み' },
  acceptInvite:    { th: 'ยอมรับ',                                   en: 'Accept',                           jp: '承認' },
  rejectInvite:    { th: 'ปฏิเสธ',                                   en: 'Reject',                           jp: '拒否' },
  pendingDeals:    { th: 'คำเชิญเข้าร่วมดีล',                        en: 'Deal Invitations',                 jp: 'ディール招待' },
  invitedBy:       { th: 'เชิญโดย',                                  en: 'Invited by',                       jp: '招待者' },
  forbidden:       { th: 'คุณไม่มีสิทธิ์แก้ไขดีลนี้',                en: "You don't have permission to edit this deal", jp: 'このディールを編集する権限がありません' },
  viewDetail:      { th: 'ดูรายละเอียด',                            en: 'View Detail',                     jp: '詳細を見る' },
  dealDetail:      { th: 'รายละเอียดดีล',                           en: 'Deal Detail',                     jp: 'ディール詳細' },
  loading:         { th: 'กำลังโหลด...',                            en: 'Loading...',                      jp: '読み込み中...' },
};

const stageKeys: Array<Deal['stage']> = [
  'new_lead', 'waiting_present', 'contacted', 'proposal_submitted', 'proposal_confirmed',
  'quotation', 'negotiation', 'waiting_po', 'po_received', 'payment_received', 'cancelled', 'refused',
];

const fmt = (n: number | null | undefined) => n != null ? n.toLocaleString('en-US') : '-';

export default function DealsPipelinePanel({
  projects, members, filterProjectId, canManage = true, refreshKey = 0, lang = 'th', currentUserId, userRole,
}: Props) {
  const L = (key: string) => panelText[key]?.[lang] ?? panelText[key]?.en ?? key;
  const stageName = (s: string) => stageLabels[s]?.[lang] ?? stageLabels[s]?.en ?? s;

  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* --- Detail modal state --- */
  const [detailDeal, setDetailDeal] = useState<Deal | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<DealComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [collabLoading, setCollabLoading] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  /* --- Search / filter state --- */
  const [searchName, setSearchName] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchOwner, setSearchOwner] = useState('');

  const [formData, setFormData] = useState({
    title: '', customer_id: '', owner_id: '', value: 0,
    stage: 'new_lead' as Deal['stage'], expected_close_date: '', probability: 0, notes: '',
    contact_person: '', contact_channel: '', work_done: '', next_steps: '',
  });

  useEffect(() => { fetchDeals(); fetchCustomers(); fetchMembers(); }, [filterProjectId, refreshKey]);

  /* --- Data fetching --- */
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
    } catch (error) { console.error('Failed to fetch deals:', error); }
    finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) { const json = await res.json(); setCustomers(json.customers ?? []); }
    } catch (error) { console.error('Failed to fetch customers:', error); }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) { const json = await res.json(); setAllMembers(json.users ?? []); }
    } catch (error) { console.error('Failed to fetch members:', error); }
  };

  /* --- Collaborators & Comments --- */
  const fetchCollaborators = async (dealId: string) => {
    try {
      setCollabLoading(true);
      const res = await fetch(`/api/deals/${dealId}/collaborators`);
      if (res.ok) { const json = await res.json(); setCollaborators(json.collaborators ?? []); }
    } catch (e) { console.error(e); }
    finally { setCollabLoading(false); }
  };

  const fetchComments = async (dealId: string) => {
    try {
      setCommentLoading(true);
      const res = await fetch(`/api/deals/${dealId}/comments`);
      if (res.ok) { const json = await res.json(); setComments(json.comments ?? []); }
    } catch (e) { console.error(e); }
    finally { setCommentLoading(false); }
  };

  const addCollaborator = async () => {
    if (!detailDeal || !inviteUserId) return;
    try {
      const res = await fetch(`/api/deals/${detailDeal.id}/collaborators`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: inviteUserId }),
      });
      if (res.ok) { await fetchCollaborators(detailDeal.id); setInviteUserId(''); }
      else if (res.status === 409) { alert(L('alreadyCollab')); }
    } catch (e) { console.error(e); }
  };

  const removeCollaborator = async (userId: string) => {
    if (!detailDeal || !confirm(L('removeCollab'))) return;
    try {
      const res = await fetch(`/api/deals/${detailDeal.id}/collaborators?user_id=${userId}`, { method: 'DELETE' });
      if (res.ok) await fetchCollaborators(detailDeal.id);
    } catch (e) { console.error(e); }
  };

  const addComment = async () => {
    if (!detailDeal || !newComment.trim()) return;
    try {
      const res = await fetch(`/api/deals/${detailDeal.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) { setNewComment(''); await fetchComments(detailDeal.id); setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }
    } catch (e) { console.error(e); }
  };

  const deleteComment = async (commentId: string) => {
    if (!detailDeal || !confirm(L('deleteComment'))) return;
    try {
      const res = await fetch(`/api/deals/${detailDeal.id}/comments?comment_id=${commentId}`, { method: 'DELETE' });
      if (res.ok) await fetchComments(detailDeal.id);
    } catch (e) { console.error(e); }
  };

  /* --- Pending Invitations --- */
  const [pendingInvitations, setPendingInvitations] = useState<DealInvitation[]>([]);

  const fetchMyInvitations = async () => {
    try {
      const res = await fetch('/api/deals/my-invitations');
      if (res.ok) { const json = await res.json(); setPendingInvitations(json.invitations ?? []); }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchMyInvitations(); }, [refreshKey]);

  const respondInvitation = async (dealId: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`/api/deals/${dealId}/collaborators`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchMyInvitations();
        await fetchDeals();
        // Refresh accepted deal IDs
        if (status === 'accepted') {
          setMyAcceptedDealIds(prev => new Set([...prev, dealId]));
        }
        // Refresh collaborators if detail modal is open for this deal
        if (detailDeal?.id === dealId) await fetchCollaborators(dealId);
      }
    } catch (e) { console.error(e); }
  };

  const openDetail = (deal: Deal) => {
    setDetailDeal(deal);
    fetchCollaborators(deal.id);
    fetchComments(deal.id);
  };

  /* --- CRUD --- */
  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const method = selectedDeal ? 'PATCH' : 'POST';
      const url = selectedDeal ? `/api/deals/${selectedDeal.id}` : '/api/deals';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData, expected_close_date: formData.expected_close_date || null, owner_id: formData.owner_id || null,
          contact_person: formData.contact_person || null, contact_channel: formData.contact_channel || null,
          work_done: formData.work_done || null, next_steps: formData.next_steps || null,
        }),
      });
      if (res.ok) { await fetchDeals(); setShowForm(false); resetForm(); }
      else {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error || 'Error ' + res.status;
        if (res.status === 403) alert(L('forbidden'));
        else alert(lang === 'th' ? 'บันทึกไม่สำเร็จ: ' + msg : lang === 'jp' ? '保存に失敗しました: ' + msg : 'Save failed: ' + msg);
      }
    } catch (error) {
      console.error('Failed to save deal:', error);
      alert(lang === 'th' ? 'เกิดข้อผิดพลาดในการบันทึก' : lang === 'jp' ? '保存中にエラーが発生しました' : 'An error occurred while saving');
    } finally { setSaving(false); }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm(L('confirmDelete'))) return;
    try {
      const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchDeals();
      else if (res.status === 403) alert(L('forbidden'));
    } catch (error) { console.error('Failed to delete deal:', error); }
  };

  const handleChangeStage = async (dealId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) await fetchDeals();
    } catch (error) { console.error('Failed to update deal stage:', error); }
  };

  const resetForm = () => {
    setFormData({
      title: '', customer_id: '', owner_id: (userRole === 'member' && currentUserId) ? currentUserId : '', value: 0,
      stage: 'new_lead', expected_close_date: '', probability: 0, notes: '',
      contact_person: '', contact_channel: '', work_done: '', next_steps: '',
    });
    setSelectedDeal(null);
  };

  const handleEditDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setFormData({
      title: deal.title, customer_id: deal.customer_id, owner_id: deal.owner_id || '',
      value: deal.value, stage: deal.stage, expected_close_date: deal.expected_close_date || '',
      probability: deal.probability || 50, notes: deal.notes || '',
      contact_person: deal.contact_person || '', contact_channel: deal.contact_channel || '',
      work_done: deal.work_done || '', next_steps: deal.next_steps || '',
    });
    setShowForm(true);
  };

  /* --- Filtering --- */
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
  const isAdminManager = userRole === 'admin' || userRole === 'manager';

  // Track accepted collaborator deal IDs
  const [myAcceptedDealIds, setMyAcceptedDealIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const fetchMyCollabs = async () => {
      try {
        const res = await fetch('/api/deals/my-collaborations');
        if (res.ok) { const json = await res.json(); setMyAcceptedDealIds(new Set((json.deal_ids ?? []) as string[])); }
      } catch (e) { console.error(e); }
    };
    fetchMyCollabs();
  }, [refreshKey]);

  const isMyCollab = (deal: Deal) => myAcceptedDealIds.has(deal.id);
  const canEditDeal = (deal: Deal) => isAdminManager || isMyDeal(deal) || isMyCollab(deal);

  /* --- Render --- */
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">{L('title')}</h2>
        <div className="flex gap-2">
          <TranslateButton text={L('title')} />
          {canManage && (
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-[#F7941D] hover:bg-[#FF9D2D] text-gray-900 rounded-lg text-sm font-semibold flex items-center gap-2">
              {L('addDeal')}
            </button>
          )}
        </div>
      </div>

      {/* Search / filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input type="text" placeholder={L('searchName')} value={searchName} onChange={(e) => setSearchName(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm w-full md:w-48 focus:ring-2 focus:ring-[#003087] placeholder:text-gray-500" />
        <input type="text" placeholder={L('searchCustomer')} value={searchCustomer} onChange={(e) => setSearchCustomer(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm w-[calc(50%-0.25rem)] md:w-40 focus:ring-2 focus:ring-[#003087] placeholder:text-gray-500" />
        <input type="text" placeholder={L('searchOwner')} value={searchOwner} onChange={(e) => setSearchOwner(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm w-[calc(50%-0.25rem)] md:w-40 focus:ring-2 focus:ring-[#003087] placeholder:text-gray-500" />
        <button onClick={() => {}} className="p-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg"><Search size={16} /></button>
        <span className="text-sm text-gray-500 ml-1">{filteredDeals.length}/{deals.length}</span>
      </div>

      {/* Pending Invitations Banner */}
      {pendingInvitations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-yellow-800 flex items-center gap-2 mb-3">
            <Bell size={16} className="text-yellow-600" /> {L('pendingDeals')} ({pendingInvitations.length})
          </h4>
          <div className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-yellow-100">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{inv.deal?.title || inv.deal_id}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                    {inv.deal?.value != null && <span>{fmt(inv.deal.value)} THB</span>}
                    {inv.deal?.stage && (
                      <span className="px-1.5 py-0.5 rounded text-white text-[10px]" style={{ backgroundColor: stageColors[inv.deal.stage] }}>
                        {stageName(inv.deal.stage)}
                      </span>
                    )}
                    {inv.inviter?.display_name && <span>{L('invitedBy')}: {inv.inviter.display_name}</span>}
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(inv.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => respondInvitation(inv.deal_id, 'accepted')}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> {L('acceptInvite')}
                  </button>
                  <button onClick={() => respondInvitation(inv.deal_id, 'rejected')}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                    <XCircle size={12} /> {L('rejectInvite')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
        {stageKeys.map((stage) => {
          const col = dealsByStage[stage];
          return (
            <div key={stage} className="flex-shrink-0" style={{ minWidth: 220, width: 220 }}>
              <div className="rounded-t-lg px-3 py-2 font-bold flex items-center justify-between"
                style={{ backgroundColor: stageColors[stage], color: getTextColorForBackground(stageColors[stage]) }}>
                <span>{stageName(stage)} ({col.length})</span>
              </div>
              <div className="bg-[#F1F5F9] border border-t-0 rounded-b-lg p-2 space-y-2 min-h-[420px]" style={{ borderColor: stageColors[stage] + '40' }}>
                {col.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">{L('noDeals')}</div>
                ) : (
                  col.map((deal) => {
                    const mine = isMyDeal(deal);
                    const editable = canEditDeal(deal);
                    return (
                      <div key={deal.id}
                        className={`rounded-lg p-3 border transition cursor-pointer ${
                          mine ? 'bg-[#FFF7ED] border-[#F7941D] hover:shadow-md'
                          : isMyCollab(deal) ? 'bg-blue-50 border-blue-300 hover:shadow-md'
                          : 'bg-white border-gray-200 hover:border-[#003087] hover:shadow-md'
                        }`}
                        onClick={() => openDetail(deal)}>
                        {/* MY DEAL / COLLABORATOR badge */}
                        <div className="flex gap-1 mb-1.5">
                          {mine && (
                            <span className="inline-block text-[10px] font-bold text-gray-900 bg-[#F7941D] rounded px-1.5 py-0.5">
                              {L('myDeal')}
                            </span>
                          )}
                          {!mine && isMyCollab(deal) && (
                            <span className="inline-block text-[10px] font-bold text-blue-800 bg-blue-200 rounded px-1.5 py-0.5">
                              {L('collaborator')}
                            </span>
                          )}
                        </div>

                        <h4 className={`font-semibold text-sm leading-tight ${mine ? 'text-[#003087]' : 'text-gray-900'}`}>
                          {deal.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{deal.customer_name}</p>

                        <p className={`text-sm font-bold mt-2 ${
                          stage === 'po_received' || stage === 'payment_received' ? 'text-green-600'
                            : stage === 'cancelled' || stage === 'refused' ? 'text-red-500' : 'text-gray-800'
                        }`}>{fmt(deal.value)} THB</p>

                        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                          <span>{deal.probability ?? 0}%</span>
                          {deal.owner_name && (
                            <span className="flex items-center gap-1"><User size={10} />{deal.owner_name}</span>
                          )}
                        </div>

                        {/* Click hint */}
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">{L('viewDetail')}</p>

                        {/* Action buttons for editable deals */}
                        {canManage && editable && (
                          <div className="flex gap-1 pt-2 mt-2 border-t border-gray-100 opacity-0 hover:opacity-100 transition">
                            <button onClick={(e) => { e.stopPropagation(); handleEditDeal(deal); }}
                              className="flex-1 px-2 py-1 bg-[#003087] hover:bg-[#0040B0] text-white rounded text-xs flex items-center justify-center gap-1">
                              <Edit2 size={10} /> {L('edit')}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }}
                              className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center justify-center gap-1">
                              <Trash2 size={10} /> {L('del')}
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

      {/* Deal Detail Modal (View + Collaborators + Comments) */}
      {detailDeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h3 className="text-xl font-bold text-gray-900">{L('dealDetail')}</h3>
              <button onClick={() => setDetailDeal(null)} className="text-gray-500 hover:text-gray-900"><X size={24} /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Deal Info */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-900">{detailDeal.title}</h4>
                  <InlineTranslateButton text={detailDeal.title} />
                </div>
                <p className="text-sm text-gray-600">{detailDeal.customer_name}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="font-bold text-gray-800">{fmt(detailDeal.value)} THB</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: stageColors[detailDeal.stage] }}>
                    {stageName(detailDeal.stage)}
                  </span>
                  <span className="text-gray-500">{detailDeal.probability ?? 0}%</span>
                  {detailDeal.owner_name && <span className="text-gray-600 flex items-center gap-1"><User size={12} />{detailDeal.owner_name}</span>}
                </div>
                {/* Contact info — always show */}
                <div className="mt-2 bg-blue-50/50 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1"><User size={12} className="text-blue-500" /> {L('contactInfo')}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-gray-700"><span className="font-medium text-gray-500">{L('contactPerson')}:</span> {detailDeal.contact_person || <span className="italic text-gray-400">{L('notSpecified')}</span>}</span>
                    <span className="text-gray-700"><span className="font-medium text-gray-500">{L('contactChannel')}:</span> {detailDeal.contact_channel || <span className="italic text-gray-400">{L('notSpecified')}</span>}</span>
                  </div>
                </div>
                {detailDeal.notes && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">{L('notes')}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailDeal.notes}</p>
                    <InlineTranslateButton text={detailDeal.notes} />
                  </div>
                )}
                {/* Edit / Delete buttons for authorized users */}
                {canManage && canEditDeal(detailDeal) && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { handleEditDeal(detailDeal); setDetailDeal(null); }}
                      className="px-3 py-1.5 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-xs font-medium flex items-center gap-1">
                      <Edit2 size={12} /> {L('edit')}
                    </button>
                    <button onClick={() => { handleDeleteDeal(detailDeal.id); setDetailDeal(null); }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                      <Trash2 size={12} /> {L('del')}
                    </button>
                  </div>
                )}
              </div>

              {/* Work Done & Next Steps — always show */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> {L('workDone')}
                  </h5>
                  {detailDeal.work_done ? (
                    <>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailDeal.work_done}</p>
                      <InlineTranslateButton text={detailDeal.work_done} />
                    </>
                  ) : (
                    <p className="text-sm italic text-gray-400">{L('notSpecified')}</p>
                  )}
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" /> {L('nextSteps')}
                  </h5>
                  {detailDeal.next_steps ? (
                    <>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailDeal.next_steps}</p>
                      <InlineTranslateButton text={detailDeal.next_steps} />
                    </>
                  ) : (
                    <p className="text-sm italic text-gray-400">{L('notSpecified')}</p>
                  )}
                </div>
              </div>

              {/* Collaborators Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Users size={16} className="text-blue-600" /> {L('collaborators')} ({collaborators.length})
                  </h5>
                </div>

                {collabLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={14} className="animate-spin" /> {L('loading')}</div>
                ) : (
                  <>
                    {/* Collaborator list */}
                    <div className="space-y-2 mb-3">
                      {collaborators.length === 0 ? (
                        <p className="text-xs text-gray-500">{lang === 'th' ? 'ยังไม่มีผู้ร่วมงาน' : lang === 'jp' ? 'コラボレーターなし' : 'No collaborators yet'}</p>
                      ) : collaborators.map((c) => (
                        <div key={c.id} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${c.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : c.status === 'rejected' ? 'bg-red-50 border-red-100' : 'bg-white border-blue-100'}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${c.status === 'pending' ? 'bg-yellow-100' : c.status === 'rejected' ? 'bg-red-100' : 'bg-blue-100'}`}>
                              <User size={14} className={c.status === 'pending' ? 'text-yellow-600' : c.status === 'rejected' ? 'text-red-600' : 'text-blue-600'} />
                            </div>
                            <span className="text-sm text-gray-800 font-medium">{c.user?.display_name || c.user?.email || c.user_id}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : c.status === 'rejected' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                              {c.status === 'pending' ? L('pendingInvite') : c.status === 'rejected' ? L('rejected') : L('accepted')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Accept/reject buttons for the invited user themselves */}
                            {c.status === 'pending' && c.user_id === currentUserId && (
                              <>
                                <button onClick={() => respondInvitation(detailDeal.id, 'accepted')}
                                  className="text-green-600 hover:text-green-800 p-1" title={L('acceptInvite')}><CheckCircle size={16} /></button>
                                <button onClick={() => respondInvitation(detailDeal.id, 'rejected')}
                                  className="text-red-400 hover:text-red-600 p-1" title={L('rejectInvite')}><XCircle size={16} /></button>
                              </>
                            )}
                            {(isAdminManager || isMyDeal(detailDeal)) && (
                              <button onClick={() => removeCollaborator(c.user_id)}
                                className="text-red-400 hover:text-red-600"><UserMinus size={14} /></button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Invite form */}
                    {(isAdminManager || isMyDeal(detailDeal)) && (
                      <div className="flex gap-2">
                        <select value={inviteUserId} onChange={(e) => setInviteUserId(e.target.value)}
                          className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-400">
                          <option value="">{L('selectMember')}</option>
                          {allMembers
                            .filter(m => m.id !== detailDeal.owner_id && !collaborators.some(c => c.user_id === m.id))
                            .map(m => <option key={m.id} value={m.id}>{m.display_name || `${m.first_name_en ?? ''} ${m.last_name_en ?? ''}`}</option>)}
                        </select>
                        <button onClick={addCollaborator} disabled={!inviteUserId}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50">
                          <UserPlus size={12} /> {L('inviteFriend')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Comments Section */}
              <div className="bg-amber-50 rounded-lg p-4">
                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <MessageSquare size={16} className="text-amber-600" /> {L('comments')} ({comments.length})
                </h5>

                {commentLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 size={14} className="animate-spin" /> {L('loading')}</div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
                    {comments.length === 0 ? (
                      <p className="text-xs text-gray-500">{L('noComments')}</p>
                    ) : comments.map((c) => (
                      <div key={c.id} className="bg-white rounded-lg px-3 py-2 border border-amber-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-700">{c.user?.display_name || c.user?.email || '??'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleString()}</span>
                            {(isAdminManager || c.user?.id === currentUserId) && (
                              <button onClick={() => deleteComment(c.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</p>
                        <InlineTranslateButton text={c.content} />
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                )}

                {/* Add comment */}
                <div className="flex gap-2">
                  <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={L('writeComment')}
                    className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:ring-2 focus:ring-amber-400" rows={2} />
                  <button onClick={addComment} disabled={!newComment.trim()}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg self-end disabled:opacity-50">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedDeal ? L('editDeal') : L('newDeal')}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-500 hover:text-gray-900"><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveDeal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('dealTitle')} *</label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('customer')} *</label>
                  <select required value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]">
                    <option value="">{L('selectCustomer')}</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('owner')}</label>
                  {userRole === 'member' ? (
                    <input type="text" readOnly
                      value={allMembers.find(m => m.id === currentUserId)?.display_name || allMembers.find(m => m.id === currentUserId)?.first_name_en || currentUserId || ''}
                      className="w-full bg-gray-100 border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-700 text-sm cursor-not-allowed" />
                  ) : (
                    <select value={formData.owner_id} onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                      className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]">
                      <option value="">{L('selectOwner')}</option>
                      {allMembers.map((m) => <option key={m.id} value={m.id}>{m.display_name || `${m.first_name_en ?? ''} ${m.last_name_en ?? ''}`}</option>)}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('value')} *</label>
                  <input type="number" required value={formData.value} onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('stage')} *</label>
                  <select value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value as Deal['stage'] })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]">
                    {stageKeys.map((s) => <option key={s} value={s}>{stageName(s)}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('closeDate')}</label>
                  <input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('probability')} *</label>
                  <input type="number" min="0" max="100" value={formData.probability} onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('contactPerson')}</label>
                  <input type="text" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('contactChannel')}</label>
                  <input type="text" value={formData.contact_channel} onChange={(e) => setFormData({ ...formData, contact_channel: e.target.value })}
                    placeholder={lang === 'th' ? 'เช่น LINE, โทรศัพท์, อีเมล' : lang === 'jp' ? '例: LINE, 電話, メール' : 'e.g. LINE, Phone, Email'}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087]" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('notes')}</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087] resize-none" rows={2} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('workDone')}</label>
                  <textarea value={formData.work_done} onChange={(e) => setFormData({ ...formData, work_done: e.target.value })}
                    placeholder={lang === 'th' ? 'รายละเอียดที่ทำไปแล้ว...' : lang === 'jp' ? '完了済みの作業...' : 'Details of completed work...'}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087] resize-none" rows={3} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-2">{L('nextSteps')}</label>
                  <textarea value={formData.next_steps} onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
                    placeholder={lang === 'th' ? 'สิ่งที่จะต้องทำต่อ...' : lang === 'jp' ? '次のステップ...' : 'Next steps to take...'}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-[#003087] resize-none" rows={3} />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">{saving ? '...' : L('save')}</button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 px-4 py-2 bg-[#E2E8F0] hover:bg-[#475569] text-gray-900 rounded-lg text-sm font-medium">{L('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
