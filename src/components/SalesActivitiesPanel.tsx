'use client';

import { useState, useEffect, useRef } from 'react';
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
  Mic,
  Square,
  Upload,
  Loader2,
  Play,
  Pause,
  Volume2,
  Pencil,
  Download,
} from 'lucide-react';
import TranslateButton from './TranslateButton';
import { supabase } from '@/lib/supabase';

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

interface DealActivity {
  id: string;
  deal_id: string;
  deal_title: string;
  customer_id: string;
  customer_name: string;
  type: ActivityType;
  description: string;
  notes: string;
  date: string;
  performer?: string;
  performer_id?: string;
  participants: string[];
}

interface Deal {
  id: string;
  title: string;
  customer_name: string;
}

interface Customer {
  id: string;
  company_name: string;
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

const SEGMENT_DURATION = 180000; // 3 minutes in milliseconds
const DIRECT_UPLOAD_LIMIT = 3.5 * 1024 * 1024; // 3.5 MB

async function safeFetchJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return null;
  }
}

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
      dealLabel: 'ดีล',
      dealPlaceholder: 'เลือกดีล',
      noDeal: '— ไม่ระบุ —',
      customerLabel: 'ลูกค้า',
      customerPlaceholder: 'เลือกลูกค้า (ไม่บังคับ)',
      typeLabel: 'ประเภทกิจกรรม *',
      dateLabel: 'วันที่ *',
      descriptionLabel: 'คำอธิบาย *',
      descriptionPlaceholder: 'อธิบายกิจกรรมในรายละเอียด...',
      audioSection: 'บันทึกเสียง',
      recordButton: 'บันทึก',
      stopButton: 'หยุด',
      uploadButton: 'อัพโหลด',
      transcribeButton: 'แปลงเป็นข้อความ',
      transcribing: 'กำลังแปลง...',
      extractSection: 'สกัดข้อมูลจาก AI',
      extractButton: 'สกัดข้อมูล',
      extracting: 'กำลังสกัด...',
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
      dealLabel: 'Deal',
      dealPlaceholder: 'Select a deal',
      noDeal: '— No Deal —',
      customerLabel: 'Customer',
      customerPlaceholder: 'Select a customer (optional)',
      typeLabel: 'Activity Type *',
      dateLabel: 'Date *',
      descriptionLabel: 'Description *',
      descriptionPlaceholder: 'Describe the activity in detail...',
      audioSection: 'Audio Recording',
      recordButton: 'Record',
      stopButton: 'Stop',
      uploadButton: 'Upload',
      transcribeButton: 'Transcribe',
      transcribing: 'Transcribing...',
      extractSection: 'AI Extract',
      extractButton: 'Extract',
      extracting: 'Extracting...',
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
      dealLabel: '取引',
      dealPlaceholder: '取引を選択',
      noDeal: '— 取引なし —',
      customerLabel: '顧客',
      customerPlaceholder: '顧客を選択 (オプション)',
      typeLabel: '活動タイプ *',
      dateLabel: '日付 *',
      descriptionLabel: '説明 *',
      descriptionPlaceholder: '活動の詳細を説明してください...',
      audioSection: '音声録音',
      recordButton: '記録',
      stopButton: '停止',
      uploadButton: 'アップロード',
      transcribeButton: 'テキスト化',
      transcribing: 'テキスト化中...',
      extractSection: 'AI抽出',
      extractButton: '抽出',
      extracting: '抽出中...',
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
  userRole,
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterDealId, setFilterDealId] = useState<string>('');
  const [filterSalespersonId, setFilterSalespersonId] = useState<string>('');
  const [groupByDate, setGroupByDate] = useState(true);
  const [groupBySalesperson, setGroupBySalesperson] = useState(false);
  const [editingActivity, setEditingActivity] = useState<DealActivity | null>(null);

  // Audio states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioSegments, setAudioSegments] = useState<Blob[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>('');
  const [extractedData, setExtractedData] = useState<{
    action_items?: Array<{ text?: string; owner?: string; due_date?: string }>;
    decisions?: string[];
    risks?: string[];
    change_requests?: string[];
    summary?: string;
  } | null>(null);
  const [extracting, setExtracting] = useState(false);

  const [formData, setFormData] = useState({
    deal_id: '',
    customer_id: '',
    type: 'call_contact' as ActivityType,
    description: '',
    notes: '',
    transcript: '',
    ai_summary: '',
    date: new Date().toISOString().split('T')[0],
    audio_url: '',
    participants: [] as string[],
    action_items: [] as Array<{text: string; done: boolean}>,
    attachments: [] as Array<{name: string; url: string; type: string; size: number}>,
  });
  const [isPlayingSegments, setIsPlayingSegments] = useState(false);
  const segmentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [participantInput, setParticipantInput] = useState('');
  const [actionItemInput, setActionItemInput] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [participantDropdownOpen, setParticipantDropdownOpen] = useState(false);
  const participantDropdownRef = useRef<HTMLDivElement>(null);
  const [dealSearchText, setDealSearchText] = useState('');
  const [dealDropdownOpen, setDealDropdownOpen] = useState(false);
  const dealDropdownRef = useRef<HTMLDivElement>(null);
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dealDropdownRef.current && !dealDropdownRef.current.contains(e.target as Node)) setDealDropdownOpen(false);
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) setCustomerDropdownOpen(false);
      if (participantDropdownRef.current && !participantDropdownRef.current.contains(e.target as Node)) setParticipantDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchActivities();
    fetchDeals();
    fetchCustomers();
    fetchUsers();
  }, [filterProjectId, refreshKey]);

  useEffect(() => {
    if (editingActivity) {
      setFormData({
        deal_id: editingActivity.deal_id ?? '',
        customer_id: editingActivity.customer_id ?? '',
        type: editingActivity.type,
        description: editingActivity.description ?? '',
        notes: editingActivity.notes ?? '',
        transcript: '',
        ai_summary: '',
        date: editingActivity.date ? editingActivity.date.split('T')[0] : new Date().toISOString().split('T')[0],
        audio_url: '',
        participants: editingActivity.participants ?? [],
        action_items: (editingActivity as any).action_items ?? [],
        attachments: (editingActivity as any).attachments ?? [],
      });
      // Set customer search text for display
      if (editingActivity.customer_id) {
        setCustomerSearchText(editingActivity.customer_name ?? '');
      }
      setShowForm(true);
    }
  }, [editingActivity]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/deal-activities');
      if (res.ok) {
        const json = await res.json();
        const mapped = (json.activities ?? []).map((a: Record<string, unknown>) => ({
          id: a.id,
          deal_id: a.deal_id,
          customer_id: a.customer_id ?? '',
          deal_title: (a.deals as { title?: string })?.title ?? '',
          customer_name: (a.customers as { company_name?: string })?.company_name ?? '',
          type: (a.activity_type ?? 'call_contact') as ActivityType,
          description: a.subject ?? '',
          notes: a.notes ?? '',
          date: a.activity_date ?? '',
          performer: (a.performer as { display_name?: string })?.display_name ?? (a.performer as { email?: string })?.email ?? '',
          performer_id: (a.performer as { id?: string })?.id,
          participants: (a.participants ?? []) as string[],
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

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const json = await res.json();
        const mapped = (json.customers ?? []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          company_name: c.company_name as string,
        }));
        setCustomers(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
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
      const isEditing = !!editingActivity;
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing ? `/api/deal-activities/${editingActivity!.id}` : '/api/deal-activities';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: formData.deal_id || null,
          customer_id: formData.customer_id || null,
          activity_type: formData.type,
          subject: formData.description,
          description: formData.description,
          notes: formData.notes || null,
          activity_date: formData.date,
          audio_url: formData.audio_url || null,
          participants: formData.participants.length > 0 ? formData.participants : null,
          action_items: formData.action_items.length > 0 ? formData.action_items : null,
          attachments: formData.attachments.length > 0 ? formData.attachments : null,
        }),
      });

      if (res.ok) {
        await fetchActivities();
        setShowForm(false);
        setEditingActivity(null);
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
      customer_id: '',
      type: 'call_contact',
      description: '',
      notes: '',
      transcript: '',
      ai_summary: '',
      date: new Date().toISOString().split('T')[0],
      audio_url: '',
      participants: [],
      action_items: [],
      attachments: [],
    });
    setParticipantInput('');
    setActionItemInput('');
    setCustomerSearchText('');
    setCustomerDropdownOpen(false);
    setAudioBlob(null);
    setAudioSegments([]);
    setUploadedFile(null);
    setAudioPreviewUrl('');
    setExtractedData(null);
    setTranscribeProgress('');
    setRecordingTime(0);
    setIsRecording(false);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      let chunks: Blob[] = [];
      let segmentTime = 0;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setAudioSegments((prev) => [...prev, blob]);
          chunks = [];
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioSegments([]);
      recorder.start();

      const interval = setInterval(() => {
        setRecordingTime((t) => t + 1);
        segmentTime += 1;
        if (segmentTime >= SEGMENT_DURATION / 1000) {
          recorder.stop();
          recorder.start();
          segmentTime = 0;
        }
      }, 1000);

      const cleanup = () => clearInterval(interval);
      return cleanup;
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleUploadAudio = async (file: File) => {
    try {
      setUploading(true);
      // Always show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setAudioPreviewUrl(previewUrl);
      setUploadedFile({ name: file.name, url: '' });

      const size = file.size;

      if (size <= DIRECT_UPLOAD_LIMIT) {
        // Direct transcribe (small file)
        const fd = new FormData();
        fd.append('audio', file);
        try {
          const res = await fetch('/api/ai/transcribe-audio', {
            method: 'POST',
            body: fd,
          });
          const json = await safeFetchJson(res);
          if (json?.transcript) {
            setFormData((prev) => ({
              ...prev,
              transcript: prev.transcript ? `${prev.transcript}\n\n${json.transcript}` : json.transcript,
            }));
          } else if (json?.error) {
            alert(lang === 'th' ? `แปลงเสียงไม่สำเร็จ: ${json.error}` : `Transcribe failed: ${json.error}`);
          }
        } catch (err) {
          console.error('Transcribe failed:', err);
          alert(lang === 'th' ? 'แปลงเสียงไม่สำเร็จ กรุณาลองใหม่' : 'Transcription failed. Please try again.');
        }
      } else {
        // Upload to Supabase first
        try {
          const { data, error } = await supabase.storage
            .from('deal-activity-audio')
            .upload(`${Date.now()}-${file.name}`, file);

          if (error) throw error;
          if (data) {
            const { data: publicUrl } = supabase.storage
              .from('deal-activity-audio')
              .getPublicUrl(data.path);

            setFormData((prev) => ({ ...prev, audio_url: publicUrl.publicUrl }));
            setUploadedFile({ name: file.name, url: publicUrl.publicUrl });

            // Try to transcribe
            try {
              const res = await fetch('/api/ai/transcribe-audio-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio_url: publicUrl.publicUrl }),
              });
              const json = await safeFetchJson(res);
              if (json?.transcript) {
                setFormData((prev) => ({
                  ...prev,
                  transcript: prev.transcript ? `${prev.transcript}\n\n${json.transcript}` : json.transcript,
                }));
              }
            } catch (err) {
              console.error('Transcribe failed:', err);
            }
          }
        } catch (err) {
          console.error('Upload failed:', err);
          alert(lang === 'th' ? 'อัพโหลดไม่สำเร็จ กรุณาลองใหม่' : 'Upload failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to upload audio:', error);
      alert(lang === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'An error occurred. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleTranscribeSegments = async () => {
    if (audioSegments.length === 0) return;

    try {
      setTranscribing(true);
      let fullTranscript = '';

      for (let i = 0; i < audioSegments.length; i++) {
        setTranscribeProgress(`${i + 1}/${audioSegments.length}`);
        const blob = audioSegments[i];
        const formData = new FormData();
        formData.append('audio', blob);

        const res = await fetch('/api/ai/transcribe-audio', {
          method: 'POST',
          body: formData,
        });

        const json = await safeFetchJson(res);
        if (json?.transcript) {
          fullTranscript += json.transcript + ' ';
        }
      }

      if (fullTranscript) {
        setFormData((prev) => ({
          ...prev,
          transcript: prev.transcript ? `${prev.transcript}\n\n${fullTranscript}` : fullTranscript,
        }));
      }
    } catch (error) {
      console.error('Failed to transcribe segments:', error);
    } finally {
      setTranscribing(false);
      setTranscribeProgress('');
    }
  };

  const handleExtractData = async () => {
    // Extract from ai_summary (raw input), notes, transcript, or description
    const sourceText = formData.ai_summary || formData.notes || formData.transcript || formData.description;
    if (!sourceText) {
      alert(lang === 'th' ? 'ไม่มีข้อมูลให้สกัด กรุณากรอกบันทึกเพิ่มเติมหรือแปลงเสียงก่อน' : 'No text to extract from. Please add notes or transcribe audio first.');
      return;
    }

    try {
      setExtracting(true);
      const res = await fetch('/api/ai/extract-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: sourceText }),
      });

      if (!res.ok) {
        const errJson = await safeFetchJson(res);
        alert(lang === 'th' ? `สกัดข้อมูลไม่สำเร็จ: ${errJson?.error || res.statusText}` : `Extract failed: ${errJson?.error || res.statusText}`);
        return;
      }

      const json = await safeFetchJson(res);
      if (json && !json.error) {
        setExtractedData(json);
        // Clear the raw input field after successful extraction
        setFormData(prev => ({ ...prev, ai_summary: '' }));
        // Add extracted action_items to formData.action_items
        if (json.action_items?.length) {
          const newItems = json.action_items.map((a: any) => ({
            text: `${a.text}${a.owner ? ` (${a.owner})` : ''}${a.due_date ? ` - ${a.due_date}` : ''}`,
            done: false,
          }));
          setFormData(prev => ({
            ...prev,
            action_items: [...prev.action_items, ...newItems],
          }));
        }
      } else {
        alert(lang === 'th' ? `สกัดข้อมูลไม่สำเร็จ: ${json?.error || 'ไม่มีข้อมูล'}` : `Extract failed: ${json?.error || 'No data'}`);
      }
    } catch (error) {
      console.error('Failed to extract data:', error);
      alert(lang === 'th' ? 'เกิดข้อผิดพลาดในการสกัดข้อมูล' : 'Failed to extract data');
    } finally {
      setExtracting(false);
    }
  };

  const addActionItem = () => {
    const v = actionItemInput.trim();
    if (!v) return;
    setFormData(prev => ({ ...prev, action_items: [...prev.action_items, { text: v, done: false }] }));
    setActionItemInput('');
  };
  const toggleActionItem = (i: number) => {
    setFormData(prev => ({
      ...prev,
      action_items: prev.action_items.map((a, idx) => idx === i ? { ...a, done: !a.done } : a),
    }));
  };
  const removeActionItem = (i: number) => {
    setFormData(prev => ({
      ...prev,
      action_items: prev.action_items.filter((_, idx) => idx !== i),
    }));
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const { data, error } = await supabase.storage
        .from('deal-activity-audio')
        .upload(`attachments/${Date.now()}-${file.name}`, file);
      if (error) throw error;
      const { data: publicUrl } = supabase.storage
        .from('deal-activity-audio')
        .getPublicUrl(data.path);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, {
          name: file.name,
          url: publicUrl.publicUrl,
          type: file.type,
          size: file.size,
        }],
      }));
    } catch (err) {
      console.error('Upload failed:', err);
      alert(lang === 'th' ? 'อัพโหลดไฟล์ไม่สำเร็จ' : 'File upload failed');
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (i: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, idx) => idx !== i),
    }));
  };

  const isAdminManager = userRole === 'admin' || userRole === 'manager';
  const filteredActivities = activities.filter((a) => {
    if (filterDealId && a.deal_id !== filterDealId) return false;
    if (filterSalespersonId && a.performer_id !== filterSalespersonId) return false;
    // All users can see all activities now
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
                              <div className="flex gap-1 ml-2 flex-shrink-0">
                                <button
                                  onClick={() => setEditingActivity(activity)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                  <Pencil size={16} className="text-blue-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(activity.id)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                  <Trash2 size={16} className="text-red-600" />
                                </button>
                              </div>
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
                          {/* Badges for action items & attachments */}
                          <div className="flex items-center gap-2 mt-1">
                            {(activity as any).action_items?.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                                <CheckCircle size={10} /> {(activity as any).action_items.length} items
                              </span>
                            )}
                            {(activity as any).attachments?.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                                <FileText size={10} /> {(activity as any).attachments.length} files
                              </span>
                            )}
                          </div>
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
              <h3 className="text-xl font-bold text-gray-900">
                {editingActivity ? 'แก้ไข Activity' : L('form.title')}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingActivity(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4">
              {/* Deal Dropdown - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {L('form.dealLabel')}
                </label>
                <div className="relative" ref={dealDropdownRef}>
                  <input
                    type="text"
                    placeholder={formData.deal_id ? (deals.find(d => d.id === formData.deal_id)?.title + ' - ' + deals.find(d => d.id === formData.deal_id)?.customer_name) : L('form.noDeal')}
                    value={dealDropdownOpen ? dealSearchText : (formData.deal_id ? (deals.find(d => d.id === formData.deal_id)?.title + ' - ' + deals.find(d => d.id === formData.deal_id)?.customer_name) || '' : '')}
                    onChange={(e) => { setDealSearchText(e.target.value); setDealDropdownOpen(true); }}
                    onFocus={() => { setDealDropdownOpen(true); setDealSearchText(''); }}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600 pr-8"
                  />
                  {formData.deal_id && (
                    <button type="button" onClick={() => { setFormData({ ...formData, deal_id: '' }); setDealSearchText(''); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
                  )}
                  {dealDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div
                        className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setFormData({ ...formData, deal_id: '' }); setDealDropdownOpen(false); setDealSearchText(''); }}
                      >{L('form.noDeal')}</div>
                      {deals
                        .filter(d => {
                          if (!dealSearchText) return true;
                          const q = dealSearchText.toLowerCase();
                          return d.title.toLowerCase().includes(q) || d.customer_name.toLowerCase().includes(q);
                        })
                        .slice(0, 50)
                        .map(deal => (
                          <div key={deal.id}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formData.deal_id === deal.id ? 'bg-blue-100 font-medium text-blue-800' : 'text-gray-800'}`}
                            onClick={() => { setFormData({ ...formData, deal_id: deal.id }); setDealDropdownOpen(false); setDealSearchText(''); }}
                          >{deal.title} - {deal.customer_name}</div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Search Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {L('form.customerLabel')}
                </label>
                <div className="relative" ref={customerDropdownRef}>
                  <input
                    type="text"
                    placeholder={formData.customer_id ? (customers.find(c => c.id === formData.customer_id)?.company_name) : L('form.customerPlaceholder')}
                    value={customerDropdownOpen ? customerSearchText : (formData.customer_id ? (customers.find(c => c.id === formData.customer_id)?.company_name) || '' : '')}
                    onChange={(e) => { setCustomerSearchText(e.target.value); setCustomerDropdownOpen(true); }}
                    onFocus={() => { setCustomerDropdownOpen(true); setCustomerSearchText(''); }}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600 pr-8"
                  />
                  {formData.customer_id && (
                    <button type="button" onClick={() => { setFormData({ ...formData, customer_id: '' }); setCustomerSearchText(''); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
                  )}
                  {customerDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div
                        className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
                        onClick={() => { setFormData({ ...formData, customer_id: '' }); setCustomerDropdownOpen(false); setCustomerSearchText(''); }}
                      >{L('form.customerPlaceholder')}</div>
                      {customers
                        .filter(c => {
                          if (!customerSearchText) return true;
                          return c.company_name.toLowerCase().includes(customerSearchText.toLowerCase());
                        })
                        .slice(0, 50)
                        .map(c => (
                          <div key={c.id}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${formData.customer_id === c.id ? 'bg-blue-100 font-medium text-blue-800' : 'text-gray-800'}`}
                            onClick={() => { setFormData({ ...formData, customer_id: c.id }); setCustomerDropdownOpen(false); setCustomerSearchText(''); }}
                          >{c.company_name}</div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Type */}
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

              {/* Date */}
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

              {/* Description */}
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

              {/* Participants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'th' ? 'ผู้เข้าร่วม' : lang === 'jp' ? '参加者' : 'Participants'}
                </label>
                <div className="relative" ref={participantDropdownRef}>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={participantInput}
                      onChange={(e) => { setParticipantInput(e.target.value); setParticipantDropdownOpen(true); }}
                      onFocus={() => setParticipantDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = participantInput.trim();
                          if (val && !formData.participants.includes(val)) {
                            setFormData({ ...formData, participants: [...formData.participants, val] });
                          }
                          setParticipantInput('');
                          setParticipantDropdownOpen(false);
                        }
                      }}
                      placeholder={lang === 'th' ? 'ค้นหาพนักงาน หรือพิมพ์ชื่อคนนอก...' : lang === 'jp' ? '社員を検索、または外部名を入力...' : 'Search employee or type external name...'}
                      className="flex-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = participantInput.trim();
                        if (val && !formData.participants.includes(val)) {
                          setFormData({ ...formData, participants: [...formData.participants, val] });
                        }
                        setParticipantInput('');
                        setParticipantDropdownOpen(false);
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    >+</button>
                  </div>
                  {/* Employee dropdown */}
                  {participantDropdownOpen && (
                    <div className="absolute z-50 w-full mt-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {users
                        .filter(u => {
                          const name = getUserName(u, lang);
                          const alreadyAdded = formData.participants.includes(name);
                          if (alreadyAdded) return false;
                          if (!participantInput) return true;
                          const q = participantInput.toLowerCase();
                          return name.toLowerCase().includes(q) || (u.email?.toLowerCase().includes(q));
                        })
                        .slice(0, 20)
                        .map(u => {
                          const name = getUserName(u, lang);
                          return (
                            <div key={u.id}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 text-gray-800 flex items-center justify-between"
                              onClick={() => {
                                if (!formData.participants.includes(name)) {
                                  setFormData({ ...formData, participants: [...formData.participants, name] });
                                }
                                setParticipantInput('');
                                setParticipantDropdownOpen(false);
                              }}
                            >
                              <span>{name}</span>
                              {u.department && <span className="text-xs text-gray-400">{u.department}</span>}
                            </div>
                          );
                        })
                      }
                      {participantInput.trim() && !users.some(u => getUserName(u, lang).toLowerCase() === participantInput.trim().toLowerCase()) && (
                        <div
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-green-50 text-green-700 border-t border-gray-100"
                          onClick={() => {
                            const val = participantInput.trim();
                            if (val && !formData.participants.includes(val)) {
                              setFormData({ ...formData, participants: [...formData.participants, val] });
                            }
                            setParticipantInput('');
                            setParticipantDropdownOpen(false);
                          }}
                        >
                          + {lang === 'th' ? 'เพิ่มคนนอก' : lang === 'jp' ? '外部追加' : 'Add external'}: &quot;{participantInput.trim()}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.participants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.participants.map((p, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {p}
                        <button type="button" onClick={() => {
                          setFormData({ ...formData, participants: formData.participants.filter((_, idx) => idx !== i) });
                        }} className="text-blue-500 hover:text-blue-700">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'th' ? 'บันทึกเพิ่มเติม' : lang === 'jp' ? '追加メモ' : 'Additional Notes'}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-blue-600 resize-none"
                  rows={3}
                  placeholder={lang === 'th' ? 'บันทึกเพิ่มเติม, สิ่งที่ต้องทำต่อ...' : lang === 'jp' ? '追加メモ、次のアクション...' : 'Additional notes, next actions...'}
                />
              </div>

              {/* Audio Recording Section - Meeting Style */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-3">
                <label className="block text-xs font-semibold text-blue-700">🎙 บันทึกเสียง — อัดเสียงหรืออัปโหลดไฟล์เสียง แล้วให้ AI ถอดข้อความ</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {!isRecording ? (
                    <button type="button" onClick={handleStartRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 border border-red-200 text-red-600 hover:bg-red-200 text-xs font-medium">
                      <Mic size={14} /> {lang === 'th' ? 'เริ่มอัดเสียง' : lang === 'jp' ? '録音開始' : 'Start Recording'}
                    </button>
                  ) : (
                    <button type="button" onClick={handleStopRecording}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium animate-pulse">
                      <Square size={14} /> {lang === 'th' ? 'หยุด' : 'Stop'} ({Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')})
                    </button>
                  )}
                  <span className="text-gray-600 text-xs">{lang === 'th' ? 'หรือ' : 'or'}</span>
                  <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${uploading ? 'bg-gray-200 text-gray-500 cursor-wait' : 'bg-slate-200/50 border border-gray-300 text-gray-700 hover:bg-slate-200 cursor-pointer'} text-xs font-medium`}>
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? (lang === 'th' ? 'กำลังอัพโหลด...' : 'Uploading...') : (lang === 'th' ? 'อัปโหลดไฟล์เสียง' : lang === 'jp' ? 'ファイルアップロード' : 'Upload Audio')}
                    <input type="file" accept="audio/*" className="hidden" disabled={uploading} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadAudio(file);
                    }} />
                  </label>
                </div>
                {/* Audio Player */}
                {(audioPreviewUrl || audioSegments.length > 0) && (
                  <div className="space-y-2">
                    {audioPreviewUrl && (
                      <audio controls className="w-full h-8" src={audioPreviewUrl} />
                    )}
                    {!audioPreviewUrl && audioSegments.length > 0 && (
                      <div className="text-xs text-blue-600">{lang === 'th' ? `บันทึก ${audioSegments.length} ส่วน` : `${audioSegments.length} segments recorded`}</div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button type="button" onClick={handleTranscribeSegments} disabled={transcribing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium disabled:opacity-40">
                        {transcribing ? <><Loader2 size={14} className="animate-spin" /> {transcribeProgress || (lang === 'th' ? 'กำลังถอดเสียง...' : 'Transcribing...')}</> : <>{lang === 'th' ? '✨ AI ถอดเสียง' : '✨ Transcribe'}</>}
                      </button>
                      <button type="button" onClick={() => {
                        if (audioPreviewUrl) {
                          const a = document.createElement('a');
                          a.href = audioPreviewUrl;
                          a.download = uploadedFile?.name || `recording-${new Date().toISOString().slice(0, 10)}.webm`;
                          a.click();
                        } else if (audioSegments.length > 0) {
                          const combined = new Blob(audioSegments, { type: 'audio/webm' });
                          const url = URL.createObjectURL(combined);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `recording-${new Date().toISOString().slice(0, 10)}.webm`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }
                      }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 hover:bg-blue-200 text-xs font-medium">
                        <Download size={14} /> {lang === 'th' ? 'ดาวน์โหลด' : 'Download'}
                      </button>
                      <button type="button" onClick={() => {
                        setAudioPreviewUrl('');
                        setUploadedFile(null);
                        setAudioSegments([]);
                        if (segmentAudioRef.current) { segmentAudioRef.current.pause(); segmentAudioRef.current = null; }
                        setIsPlayingSegments(false);
                      }}
                        className="text-xs text-gray-600 hover:text-red-600">{lang === 'th' ? 'ลบเสียง' : 'Remove'}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Transcript Field (separate from description) */}
              {formData.transcript && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === 'th' ? 'ข้อความจากเสียง (Transcript)' : lang === 'jp' ? '音声テキスト' : 'Audio Transcript'}
                  </label>
                  <textarea
                    value={formData.transcript}
                    onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                    className="w-full bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:ring-2 focus:ring-green-600 resize-none"
                    rows={4}
                    placeholder={lang === 'th' ? 'ข้อความที่แปลงจากเสียง...' : 'Transcribed audio text...'}
                  />
                </div>
              )}

              {/* AI Extract Section - Meeting Style */}
              <div className="border border-purple-200 bg-purple-50 rounded-lg p-3 space-y-2">
                <label className="block text-xs font-semibold text-purple-700">✨ AI Extract — วาง raw notes แล้วให้ AI แยก action items / decisions / risks</label>
                <textarea rows={3} className="w-full bg-[#F1F5F9] border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-xs"
                  placeholder={lang === 'th' ? 'วางบันทึกดิบที่นี่...' : 'Paste raw notes here...'}
                  value={formData.ai_summary}
                  onChange={e => setFormData({ ...formData, ai_summary: e.target.value })} />
                <div className="flex items-center justify-between">
                  {extractedData?.summary && <span className="text-xs text-purple-700 flex-1 mr-2">📋 {extractedData.summary}</span>}
                  <button type="button" disabled={extracting || (!formData.notes && !formData.transcript && !formData.description && !formData.ai_summary)}
                    onClick={handleExtractData}
                    className="ml-auto px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-medium disabled:opacity-40">
                    {extracting ? (lang === 'th' ? 'กำลังวิเคราะห์...' : 'Analyzing...') : '✨ Extract'}
                  </button>
                </div>
              </div>

              {/* Action Items */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Action Items</label>
                <div className="flex gap-2">
                  <input className="flex-1 bg-[#F1F5F9] border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                    placeholder={lang === 'th' ? 'งานที่ต้องทำ' : 'Task to do'}
                    value={actionItemInput}
                    onChange={e => setActionItemInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addActionItem(); } }} />
                  <button type="button" onClick={addActionItem} className="px-3 py-2 bg-[#003087] text-white rounded-lg text-sm font-medium">
                    {lang === 'th' ? 'เพิ่ม' : 'Add'}
                  </button>
                </div>
                {formData.action_items && formData.action_items.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {formData.action_items.map((it: {text: string; done: boolean}, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm bg-[#F1F5F9] border border-gray-300 rounded-lg px-2 py-1.5">
                        <button type="button" onClick={() => toggleActionItem(i)}
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${it.done ? 'bg-[#22C55E] border-[#22C55E]' : 'border-slate-500'}`}>
                          {it.done && <CheckCircle size={10} className="text-white" />}
                        </button>
                        <span className={`flex-1 ${it.done ? 'line-through text-gray-600' : 'text-gray-700'}`}>{it.text}</span>
                        <button type="button" onClick={() => removeActionItem(i)} className="text-red-600"><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* File Attachments */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  {lang === 'th' ? 'ไฟล์แนบ' : lang === 'jp' ? '添付ファイル' : 'Attachments'}
                </label>
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 border border-gray-300 text-gray-700 hover:bg-slate-200 text-xs font-medium cursor-pointer w-fit">
                  {uploadingAttachment ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploadingAttachment ? (lang === 'th' ? 'กำลังอัพโหลด...' : 'Uploading...') : (lang === 'th' ? 'เลือกไฟล์' : 'Choose File')}
                  <input type="file" className="hidden" disabled={uploadingAttachment} onChange={handleAttachmentUpload} />
                </label>
                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {formData.attachments.map((att: {name: string; url: string; type: string; size: number}, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-[#F1F5F9] border border-gray-300 rounded-lg px-2 py-1.5">
                        <FileText size={14} className="text-blue-600 flex-shrink-0" />
                        <span className="flex-1 truncate text-gray-700">{att.name}</span>
                        <span className="text-gray-400">{(att.size / 1024).toFixed(0)}KB</span>
                        <a href={att.url} download={att.name} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"><Download size={12} /></a>
                        <button type="button" onClick={() => removeAttachment(i)} className="text-red-600"><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  {editingActivity ? 'บันทึก' : L('form.save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingActivity(null);
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

