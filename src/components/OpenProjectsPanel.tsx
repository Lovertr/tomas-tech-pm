'use client';

import { useState, useEffect } from 'react';
import { Briefcase, UserPlus, Check } from 'lucide-react';
import type { Lang } from '@/lib/i18n';

interface Props {
  currentUserId?: string;
  lang?: Lang;
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
}

/* ─── i18n ─── */
const panelText: Record<string, Record<string, string>> = {
  title:           { th: 'โครงการว่าง — สมัครเข้าร่วม',  en: 'Open Projects — Join',            jp: 'オープンプロジェクト — 参加申請' },
  customer:        { th: 'ลูกค้า:',                      en: 'Customer:',                       jp: '顧客:' },
  type:            { th: 'ประเภท:',                       en: 'Type:',                           jp: '種別:' },
  status:          { th: 'สถานะ:',                        en: 'Status:',                         jp: 'ステータス:' },
  join:            { th: 'สมัครเข้าร่วม',                  en: 'Join Project',                    jp: '参加申請' },
  joined:          { th: 'เข้าร่วมแล้ว',                   en: 'Joined',                          jp: '参加済み' },
  pending:         { th: 'รอการอนุมัติ',                   en: 'Pending Approval',                jp: '承認待ち' },
  noProjects:      { th: 'ไม่มีโครงการที่เปิดรับ',          en: 'No open projects',                jp: 'オープンなプロジェクトはありません' },
  selectRole:      { th: 'เลือกตำแหน่ง',                  en: 'Select role',                     jp: '役割を選択' },
  members:         { th: 'สมาชิก',                        en: 'members',                         jp: 'メンバー' },
  // status labels
  planning:        { th: 'planning',                      en: 'planning',                        jp: 'planning' },
  active:          { th: 'active',                        en: 'active',                          jp: 'active' },
  on_hold:         { th: 'on hold',                       en: 'on hold',                         jp: '保留' },
};

const ROLE_OPTIONS = [
  'developer', 'tester', 'designer', 'project_manager', 'business_analyst',
  'system_admin', 'consultant', 'support',
];

export default function OpenProjectsPanel({ currentUserId, lang = 'th' }: Props) {
  const L = (key: string) => panelText[key]?.[lang] ?? panelText[key]?.en ?? key;

  const [projects, setProjects] = useState<OpenProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [applyingIds, setApplyingIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOpenProjects();
  }, []);

  const fetchOpenProjects = async () => {
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
  };

  const handleApply = async (projectId: string) => {
    const role = selectedRoles[projectId] || 'developer';
    setApplyingIds((prev) => new Set(prev).add(projectId));
    try {
      const res = await fetch('/api/open-projects/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, role_in_project: role }),
      });
      if (res.ok) {
        setAppliedIds((prev) => new Set(prev).add(projectId));
      }
    } catch (error) {
      console.error('Failed to apply:', error);
    } finally {
      setApplyingIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  const getProjectName = (p: OpenProject) => {
    if (lang === 'jp' && p.name_jp) return p.name_jp;
    if (lang === 'en' && p.name_en) return p.name_en;
    return p.name_th || p.name_en || '';
  };

  const getProjectType = (p: OpenProject): string => {
    if (p.tags && p.tags.length > 0) return p.tags[0];
    return '';
  };

  if (loading) {
    return (
      <div className="bg-[#1E293B] rounded-2xl border border-[#334155] p-6">
        <div className="text-center text-gray-400 py-8">Loading...</div>
      </div>
    );
  }

  if (projects.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[#003087] to-[#0040B0] rounded-2xl p-5">
      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        <Briefcase size={20} />
        {L('title')}
      </h3>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {projects.map((p) => {
          const applied = appliedIds.has(p.id) || p.already_joined;
          const applying = applyingIds.has(p.id);
          const projectType = getProjectType(p);

          return (
            <div
              key={p.id}
              className="flex-shrink-0 bg-white rounded-xl p-4 shadow-md"
              style={{ minWidth: 280, maxWidth: 300 }}
            >
              <h4 className="font-bold text-gray-900 text-sm leading-tight mb-3">
                {getProjectName(p)}
              </h4>

              <div className="space-y-1 text-xs text-gray-600 mb-4">
                {p.client_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{L('customer')}</span>
                    <span className="font-medium text-gray-800 text-right">{p.client_name}</span>
                  </div>
                )}
                {projectType && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{L('type')}</span>
                    <span className="font-medium text-gray-800">{projectType}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">{L('status')}</span>
                  <span className="font-medium text-gray-800">{p.status}</span>
                </div>
              </div>

              {applied ? (
                <div className="flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  <Check size={14} />
                  {L('joined')}
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={selectedRoles[p.id] || 'developer'}
                    onChange={(e) => setSelectedRoles({ ...selectedRoles, [p.id]: e.target.value })}
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-2 py-2 text-gray-800 text-xs focus:ring-2 focus:ring-[#003087]"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleApply(p.id)}
                    disabled={applying}
                    className="px-3 py-2 bg-[#F7941D] hover:bg-[#FF9D2D] text-white rounded-lg text-xs font-bold whitespace-nowrap disabled:opacity-50"
                  >
                    {applying ? '...' : L('join')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
