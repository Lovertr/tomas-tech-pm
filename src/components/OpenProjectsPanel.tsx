'use client';

import { useState, useEffect, useCallback } from 'react';
import { Briefcase, UserPlus, Check, Clock, ChevronDown, ChevronUp, Shield, Settings, Users, X, CheckCircle, XCircle } from 'lucide-react';
import type { Lang } from '@/lib/i18n';

interface Props {
  currentUserId?: string;
  lang?: Lang;
  userRole?: string;
}

interface OpenProject {
  id: string;
  project_code: string | null;
  name_th: string | null;
  name_en: string | null;
  name_jp: string | null;
  client_name: string | null;
  status: string;
  tags: string[] | null;
  member_count: number;
  already_joined: boolean;
  application_pending: boolean;
  is_enrollment_open: boolean;
  open_positions: string[];
  pm_member_id: string | null;
  pm_name: string | null;
  pending_applications: number;
}

interface EnrollmentApp {
  id: string;
  project_id: string;
  team_member_id: string;
  role_in_project: string;
  status: string;
  applied_at: string;
  team_members: {
    first_name_th?: string | null;
    last_name_th?: string | null;
    first_name_en?: string | null;
    last_name_en?: string | null;
    positions?: { name_th?: string | null; name_en?: string | null } | null;
  };
}

/* ─── i18n ─── */
const T: Record<string, Record<string, string>> = {
  title:           { th: 'โครงการว่าง — สมัครเข้าร่วม',  en: 'Open Projects — Join',            jp: 'オープンプロジェクト — 参加申請' },
  customer:        { th: 'ลูกค้า:',                      en: 'Customer:',                       jp: '顧客:' },
  status:          { th: 'สถานะ:',                        en: 'Status:',                         jp: 'ステータス:' },
  join:            { th: 'สมัครเข้าร่วม',                  en: 'Apply to Join',                   jp: '参加申請' },
  joined:          { th: 'เข้าร่วมแล้ว',                   en: 'Joined',                          jp: '参加済み' },
  pending:         { th: 'รอการอนุมัติ',                   en: 'Pending Approval',                jp: '承認待ち' },
  noProjects:      { th: 'ไม่มีโครงการที่เปิดรับ',          en: 'No open projects',                jp: 'オープンなプロジェクトはありません' },
  members:         { th: 'สมาชิก',                        en: 'members',                         jp: 'メンバー' },
  pm:              { th: 'PM:',                           en: 'PM:',                             jp: 'PM:' },
  noPm:            { th: 'ยังไม่มี PM',                    en: 'No PM assigned',                  jp: 'PM未割当' },
  openPositions:   { th: 'ตำแหน่งที่เปิดรับ:',             en: 'Open positions:',                 jp: '募集中:' },
  allPositions:    { th: 'ทุกตำแหน่ง',                    en: 'All positions',                   jp: '全ポジション' },
  manageTitle:     { th: 'จัดการการรับสมัคร',              en: 'Manage Enrollment',               jp: '申請管理' },
  pendingApps:     { th: 'รอดำเนินการ',                   en: 'Pending',                         jp: '保留中' },
  approve:         { th: 'อนุมัติ',                        en: 'Approve',                         jp: '承認' },
  reject:          { th: 'ปฏิเสธ',                        en: 'Reject',                          jp: '拒否' },
  noApps:          { th: 'ไม่มีใบสมัครรอดำเนินการ',         en: 'No pending applications',         jp: '保留中の申請はありません' },
  position:        { th: 'ตำแหน่ง',                        en: 'Position',                        jp: '役割' },
  selectPositions: { th: 'เลือกตำแหน่งที่เปิดรับ',         en: 'Select open positions',           jp: '募集ポジションを選択' },
  savePositions:   { th: 'บันทึก',                        en: 'Save',                            jp: '保存' },
  statusLabels:    { th: 'สถานะโปรเจค',                   en: 'Project status',                  jp: 'ステータス' },
};

const ROLE_LABELS: Record<string, Record<string, string>> = {
  developer:        { th: 'นักพัฒนา', en: 'Developer', jp: 'Developer' },
  tester:           { th: 'ผู้ทดสอบ', en: 'Tester', jp: 'Tester' },
  designer:         { th: 'นักออกแบบ', en: 'Designer', jp: 'Designer' },
  project_manager:  { th: 'ผู้จัดการโปรเจค', en: 'Project Manager', jp: 'PM' },
  pm:               { th: 'ผู้จัดการโปรเจค', en: 'Project Manager', jp: 'PM' },
  business_analyst: { th: 'นักวิเคราะห์ธุรกิจ', en: 'Business Analyst', jp: 'BA' },
  system_admin:     { th: 'ผู้ดูแลระบบ', en: 'System Admin', jp: 'SA' },
  consultant:       { th: 'ที่ปรึกษา', en: 'Consultant', jp: 'Consultant' },
  support:          { th: 'ซัพพอร์ต', en: 'Support', jp: 'Support' },
  engineer:         { th: 'วิศวกร', en: 'Engineer', jp: 'Engineer' },
  qa:               { th: 'QA', en: 'QA', jp: 'QA' },
  devops:           { th: 'DevOps', en: 'DevOps', jp: 'DevOps' },
  data_scientist:   { th: 'Data Scientist', en: 'Data Scientist', jp: 'Data Scientist' },
};

const ALL_ROLES = [
  'developer', 'tester', 'designer', 'project_manager', 'business_analyst',
  'system_admin', 'consultant', 'support', 'engineer', 'qa', 'devops', 'data_scientist',
];

const STATUS_MAP: Record<string, Record<string, string>> = {
  planning:    { th: 'วางแผน', en: 'Planning', jp: '計画中' },
  in_progress: { th: 'กำลังดำเนินการ', en: 'In Progress', jp: '進行中' },
  on_hold:     { th: 'พักไว้', en: 'On Hold', jp: '保留' },
  completed:   { th: 'เสร็จสิ้น', en: 'Completed', jp: '完了' },
};

const STATUS_COLOR: Record<string, string> = {
  planning: '#64748B', in_progress: '#00AEEF', on_hold: '#F7941D', completed: '#22C55E',
};

export default function OpenProjectsPanel({ currentUserId, lang = 'th', userRole = 'member' }: Props) {
  const L = (key: string) => T[key]?.[lang] ?? T[key]?.en ?? key;
  const roleLabel = (r: string) => ROLE_LABELS[r]?.[lang] ?? ROLE_LABELS[r]?.en ?? r;
  const statusLabel = (s: string) => STATUS_MAP[s]?.[lang] ?? STATUS_MAP[s]?.en ?? s;

  const [projects, setProjects] = useState<OpenProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Management state
  const [showManage, setShowManage] = useState(false);
  const [manageApps, setManageApps] = useState<EnrollmentApp[]>([]);
  const [manageProjects, setManageProjects] = useState<OpenProject[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  // Position editor state
  const [editingPositions, setEditingPositions] = useState<string | null>(null); // project id
  const [positionDraft, setPositionDraft] = useState<string[]>([]);
  const [savingPositions, setSavingPositions] = useState(false);

  const isManager = ['admin', 'manager'].includes(userRole);

  const fetchOpenProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/open-projects');
      if (res.ok) {
        const json = await res.json();
        setProjects(json.projects ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch open projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchManageData = useCallback(async () => {
    try {
      const res = await fetch('/api/open-projects/manage');
      if (res.ok) {
        const json = await res.json();
        setManageApps(json.applications ?? []);
        setManageProjects(json.projects ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch manage data:', error);
    }
  }, []);

  useEffect(() => { fetchOpenProjects(); }, [fetchOpenProjects]);
  useEffect(() => { if (showManage) fetchManageData(); }, [showManage, fetchManageData]);

  const handleApply = async (projectId: string) => {
    const role = selectedRoles[projectId] || 'developer';
    setApplyingIds(prev => new Set(prev).add(projectId));
    try {
      const res = await fetch('/api/open-projects/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, role_in_project: role }),
      });
      if (res.ok) {
        setAppliedIds(prev => new Set(prev).add(projectId));
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, application_pending: true } : p));
      }
    } catch (error) {
      console.error('Failed to apply:', error);
    } finally {
      setApplyingIds(prev => { const next = new Set(prev); next.delete(projectId); return next; });
    }
  };

  const handleReviewApp = async (appId: string, action: 'approve' | 'reject') => {
    setProcessingIds(prev => new Set(prev).add(appId));
    try {
      const res = await fetch('/api/open-projects/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, application_id: appId }),
      });
      if (res.ok) {
        setManageApps(prev => prev.filter(a => a.id !== appId));
        fetchOpenProjects();
      }
    } catch (error) {
      console.error('Review failed:', error);
    } finally {
      setProcessingIds(prev => { const next = new Set(prev); next.delete(appId); return next; });
    }
  };

  const handleToggleEnrollment = async (projectId: string, isOpen: boolean) => {
    try {
      await fetch('/api/open-projects/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', project_id: projectId, is_enrollment_open: isOpen }),
      });
      fetchManageData();
      fetchOpenProjects();
    } catch (error) {
      console.error('Toggle enrollment failed:', error);
    }
  };

  const handleSavePositions = async (projectId: string) => {
    setSavingPositions(true);
    try {
      await fetch('/api/open-projects/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', project_id: projectId, open_positions: positionDraft }),
      });
      setEditingPositions(null);
      fetchManageData();
      fetchOpenProjects();
    } catch (error) {
      console.error('Save positions failed:', error);
    } finally {
      setSavingPositions(false);
    }
  };

  const togglePositionDraft = (role: string) => {
    setPositionDraft(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const getProjectName = (p: { name_th?: string | null; name_en?: string | null; name_jp?: string | null }) => {
    if (lang === 'jp' && p.name_jp) return p.name_jp;
    if (lang === 'en' && p.name_en) return p.name_en;
    return p.name_th || p.name_en || '';
  };

  const getApplicantName = (a: EnrollmentApp) => {
    const m = a.team_members;
    return [m.first_name_th, m.last_name_th].filter(Boolean).join(' ')
      || [m.first_name_en, m.last_name_en].filter(Boolean).join(' ') || '—';
  };

  const getRolesForProject = (p: OpenProject): string[] => {
    if (p.open_positions && p.open_positions.length > 0) return p.open_positions;
    return ALL_ROLES;
  };

  const totalPending = projects.reduce((s, p) => s + (p.pending_applications || 0), 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
        <div className="text-center text-gray-500 py-8">Loading...</div>
      </div>
    );
  }

  if (projects.length === 0 && !isManager) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#003087] font-bold text-lg flex items-center gap-2">
          <Briefcase size={20} />
          {L('title')}
        </h3>
        {isManager && (
          <button
            onClick={() => setShowManage(!showManage)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003087] text-white rounded-lg text-xs font-medium hover:bg-[#002266] transition-colors"
          >
            <Settings size={14} />
            {L('manageTitle')}
            {totalPending > 0 && (
              <span className="ml-1 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">{totalPending}</span>
            )}
            {showManage ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Management Panel */}
      {showManage && isManager && (
        <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
          {/* Pending Applications */}
          <div>
            <h4 className="text-sm font-bold text-[#003087] mb-2 flex items-center gap-1.5">
              <Users size={14} />
              {L('pendingApps')} ({manageApps.length})
            </h4>
            {manageApps.length === 0 ? (
              <p className="text-xs text-gray-500">{L('noApps')}</p>
            ) : (
              <div className="space-y-2">
                {manageApps.map(app => {
                  const proj = manageProjects.find(p => p.id === app.project_id);
                  const isProcessing = processingIds.has(app.id);
                  return (
                    <div key={app.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-blue-100 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900">{getApplicantName(app)}</span>
                        {app.team_members.positions && (
                          <span className="text-gray-400 text-xs ml-1">
                            ({lang === 'th' ? app.team_members.positions.name_th : app.team_members.positions.name_en})
                          </span>
                        )}
                        <span className="text-gray-500 mx-1.5">&rarr;</span>
                        <span className="text-[#003087] font-medium">
                          {proj ? (proj.project_code ? `[${proj.project_code}] ` : '') + getProjectName(proj) : app.project_id.slice(0, 8)}
                        </span>
                        <span className="ml-2 inline-block bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                          {roleLabel(app.role_in_project)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                        <button onClick={() => handleReviewApp(app.id, 'approve')} disabled={isProcessing}
                          className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                          <CheckCircle size={12} /> {L('approve')}
                        </button>
                        <button onClick={() => handleReviewApp(app.id, 'reject')} disabled={isProcessing}
                          className="flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 disabled:opacity-50">
                          <XCircle size={12} /> {L('reject')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enrollment Settings per project */}
          <div>
            <h4 className="text-sm font-bold text-[#003087] mb-2 flex items-center gap-1.5">
              <Settings size={14} />
              {lang === 'th' ? 'ตั้งค่าการรับสมัคร' : 'Enrollment Settings'}
            </h4>
            <div className="space-y-2">
              {manageProjects.map(p => {
                const isEditingThis = editingPositions === p.id;
                const posCount = p.open_positions?.length || 0;
                return (
                  <div key={p.id} className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <span className="font-medium text-gray-800 truncate">
                          {p.project_code ? `[${p.project_code}] ` : ''}{getProjectName(p)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: `${STATUS_COLOR[p.status] || '#64748B'}15`, color: STATUS_COLOR[p.status] || '#64748B' }}>
                          {statusLabel(p.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {p.pm_member_id && (
                          <span className="text-blue-600 text-[10px] bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Shield size={10} /> PM
                          </span>
                        )}
                        {/* Position count badge */}
                        <button onClick={() => {
                          if (isEditingThis) { setEditingPositions(null); }
                          else { setEditingPositions(p.id); setPositionDraft(p.open_positions ?? []); }
                        }}
                          className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-0.5 transition-colors ${isEditingThis ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          <Users size={10} />
                          {posCount > 0 ? `${posCount} ${lang === 'th' ? 'ตำแหน่ง' : 'pos'}` : (lang === 'th' ? 'ทุกตำแหน่ง' : 'All')}
                        </button>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <span className={p.is_enrollment_open ? 'text-green-600 font-medium' : 'text-gray-400'}>
                            {p.is_enrollment_open ? (lang === 'th' ? 'เปิดรับ' : 'Open') : (lang === 'th' ? 'ปิดรับ' : 'Closed')}
                          </span>
                          <input type="checkbox" checked={p.is_enrollment_open}
                            onChange={(e) => handleToggleEnrollment(p.id, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[#003087] focus:ring-[#003087] accent-[#003087]" />
                        </label>
                      </div>
                    </div>
                    {/* Position multi-select dropdown */}
                    {isEditingThis && (
                      <div className="px-3 pb-3 border-t border-blue-100 pt-2">
                        <div className="text-[10px] text-gray-500 mb-1.5">{L('selectPositions')} ({lang === 'th' ? 'ไม่เลือก = รับทุกตำแหน่ง' : 'none = all positions'})</div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mb-2">
                          {ALL_ROLES.map(role => {
                            const selected = positionDraft.includes(role);
                            return (
                              <button key={role} type="button" onClick={() => togglePositionDraft(role)}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-left ${selected ? 'bg-[#00AEEF]/15 border border-[#00AEEF]/40 text-[#00AEEF]' : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                                <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${selected ? 'bg-[#00AEEF] border-[#00AEEF]' : 'border-gray-400'}`}>
                                  {selected && <Check size={7} className="text-white" />}
                                </div>
                                <span className="truncate">{roleLabel(role)}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">
                            {positionDraft.length === 0 ? (lang === 'th' ? 'รับทุกตำแหน่ง' : 'All positions') : `${positionDraft.length} ${lang === 'th' ? 'ตำแหน่ง' : 'selected'}`}
                          </span>
                          <div className="flex gap-1.5">
                            <button onClick={() => setEditingPositions(null)}
                              className="px-2.5 py-1 text-[10px] text-gray-500 hover:text-gray-700">
                              {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                            </button>
                            <button onClick={() => handleSavePositions(p.id)} disabled={savingPositions}
                              className="px-3 py-1 bg-[#003087] text-white rounded-md text-[10px] font-medium hover:bg-[#002266] disabled:opacity-50">
                              {savingPositions ? '...' : L('savePositions')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Project Cards */}
      {projects.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-4">{L('noProjects')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const applied = appliedIds.has(p.id) || p.already_joined;
            const isPending = p.application_pending && !applied;
            const applying = applyingIds.has(p.id);
            const roles = getRolesForProject(p);
            const hasSpecificPositions = p.open_positions && p.open_positions.length > 0;

            return (
              <div key={p.id} className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                {/* Header: project code + status */}
                <div className="flex items-center justify-between mb-2">
                  {p.project_code && (
                    <span className="inline-block bg-[#003087]/10 text-[#003087] text-[10px] font-bold px-2 py-0.5 rounded">
                      {p.project_code}
                    </span>
                  )}
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: `${STATUS_COLOR[p.status] || '#64748B'}15`, color: STATUS_COLOR[p.status] || '#64748B' }}>
                    {statusLabel(p.status)}
                  </span>
                </div>

                <h4 className="font-bold text-gray-900 text-sm leading-tight mb-2">
                  {getProjectName(p)}
                </h4>

                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  {p.client_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{L('customer')}</span>
                      <span className="font-medium text-gray-800 text-right">{p.client_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">{L('members')}</span>
                    <span className="font-medium text-gray-800">{p.member_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{L('pm')}</span>
                    <span className={`font-medium ${p.pm_name ? 'text-[#003087]' : 'text-gray-400 italic'}`}>
                      {p.pm_name || L('noPm')}
                    </span>
                  </div>
                </div>

                {/* Open Positions Tags */}
                <div className="mb-3">
                  <span className="text-[10px] text-gray-500 block mb-1">{L('openPositions')}</span>
                  {hasSpecificPositions ? (
                    <div className="flex flex-wrap gap-1">
                      {p.open_positions.map(pos => (
                        <span key={pos} className="bg-[#00AEEF]/10 text-[#00AEEF] text-[10px] px-1.5 py-0.5 rounded font-medium">
                          {roleLabel(pos)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded">{L('allPositions')}</span>
                  )}
                </div>

                {/* Action area */}
                {applied ? (
                  <div className="flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                    <Check size={14} /> {L('joined')}
                  </div>
                ) : isPending ? (
                  <div className="flex items-center justify-center gap-2 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium">
                    <Clock size={14} /> {L('pending')}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={selectedRoles[p.id] || roles[0] || 'developer'}
                      onChange={(e) => setSelectedRoles({ ...selectedRoles, [p.id]: e.target.value })}
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-2 py-2 text-gray-800 text-xs focus:ring-2 focus:ring-[#003087]"
                    >
                      {roles.map(r => (
                        <option key={r} value={r}>{roleLabel(r)}</option>
                      ))}
                    </select>
                    <button onClick={() => handleApply(p.id)} disabled={applying}
                      className="px-3 py-2 bg-[#F7941D] hover:bg-[#e0850f] text-white rounded-lg text-xs font-bold whitespace-nowrap disabled:opacity-50 flex items-center gap-1">
                      <UserPlus size={12} />
                      {applying ? '...' : L('join')}
                    </button>
                  </div>
                )}

                {/* Pending count for managers */}
                {isManager && p.pending_applications > 0 && (
                  <div className="mt-2 text-center">
                    <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-medium">
                      {p.pending_applications} {L('pendingApps')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
