"use client";
import type { Lang } from '@/lib/i18n';
import { useEffect, useState, useCallback } from "react";
import {
  Building2, Plus, Edit3, Trash2, Users, Shield, Save, X, Search,
  ChevronDown, ChevronRight, RotateCcw,
} from "lucide-react";
import { PERM_LABEL_TH, PERM_COLOR } from "@/lib/permissions";

/* ─── Types ─── */
interface Department {
  id: string;
  code: string;
  name_th: string;
  name_en: string | null;
  name_jp: string | null;
  head_user_id: string | null;
  is_active: boolean;
  member_count: number;
  head?: { id: string; display_name: string; email: string } | null;
}

interface AppUser {
  id: string;
  display_name: string;
  email: string;
}

interface DeptMember {
  id: string;
  display_name: string;
  email: string;
  department_id: string;
}

interface Module {
  key: string;
  label_th: string;
  label_en: string;
  category: string;
  sort: number;
}

/* ─── Constants ─── */
const CATEGORY_LABEL: Record<string, string> = {
  core: "หลัก", planning: "การวางแผน", tracking: "ติดตาม", finance: "การเงิน",
  crm: "CRM & การขาย", people: "ทีม/บุคลากร", admin: "ระบบ",
};
const CATEGORY_ORDER = ["core", "planning", "tracking", "people", "finance", "crm", "admin"];
const LEVELS = [0, 1, 2, 3, 4, 5] as const;
const PERM_LABEL_SHORT: Record<number, string> = {
  0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5",
};

interface Props {
  canManage: boolean;
  lang?: Lang;
}

export default function DepartmentsPanel({ canManage, lang = 'th' }: Props) {
  /* ─── Localization ─── */
  const panelText = {
    header_title: { th: 'จัดการแผนก', en: 'Manage Departments', jp: '部門管理' },
    header_subtitle: { th: ' แผนก', en: ' Department', jp: ' 部門' },
    add_button: { th: 'เพิ่มแผนก', en: 'Add Department', jp: '部門を追加' },
    inactive_badge: { th: 'ปิดใช้งาน', en: 'Inactive', jp: '非アクティブ' },
    members_label: { th: 'คน', en: 'members', jp: '人' },
    head_label: { th: 'หัวหน้า:', en: 'Head:', jp: 'リーダー:' },
    perm_tooltip: { th: 'จัดการสิทธิ์แผนก', en: 'Manage Department Permissions', jp: '部門のアクセス権限を管理' },
    edit_tooltip: { th: 'แก้ไข', en: 'Edit', jp: '編集' },
    delete_tooltip: { th: 'ลบ', en: 'Delete', jp: '削除' },
    delete_confirm: { th: 'ลบแผนกนี้ใช่หรือไม่?', en: 'Delete this department?', jp: 'この部門を削除してもよろしいですか?' },
    form_title_add: { th: 'เพิ่มแผนกใหม่', en: 'Add New Department', jp: '新しい部門を追加' },
    form_title_edit: { th: 'แก้ไขแผนก', en: 'Edit Department', jp: '部門を編集' },
    form_code_label: { th: 'รหัสแผนก *', en: 'Department Code *', jp: '部門コード *' },
    form_code_placeholder: { th: 'เช่น SW, INFRA', en: 'e.g., SW, INFRA', jp: '例：SW、INFRA' },
    form_status_label: { th: 'สถานะ', en: 'Status', jp: 'ステータス' },
    form_status_active: { th: 'ใช้งาน', en: 'Active', jp: 'アクティブ' },
    form_status_inactive: { th: 'ปิดใช้งาน', en: 'Inactive', jp: '非アクティブ' },
    form_name_th_label: { th: 'ชื่อแผนก (ไทย) *', en: 'Department Name (Thai) *', jp: '部門名（タイ語）*' },
    form_name_th_placeholder: { th: 'ฝ่ายพัฒนาซอฟต์แวร์', en: 'Software Development', jp: 'ソフトウェア開発部' },
    form_name_en_label: { th: 'ชื่อแผนก (English)', en: 'Department Name (English)', jp: '部門名（英語）' },
    form_name_en_placeholder: { th: 'Software Development', en: 'Software Development', jp: 'Software Development' },
    form_name_jp_label: { th: 'ชื่อแผนก (日本語)', en: 'Department Name (Japanese)', jp: '部門名（日本語）' },
    form_name_jp_placeholder: { th: 'ソフトウェア開発部', en: 'Software Development Department', jp: 'ソフトウェア開発部' },
    form_head_label: { th: 'หัวหน้าแผนก', en: 'Department Head', jp: '部門長' },
    form_head_unspecified: { th: '-- ไม่ระบุ --', en: '-- Not Specified --', jp: '-- 指定なし --' },
    form_cancel: { th: 'ยกเลิก', en: 'Cancel', jp: 'キャンセル' },
    form_create: { th: 'สร้างแผนก', en: 'Create Department', jp: '部門を作成' },
    form_update: { th: 'อัปเดต', en: 'Update', jp: '更新' },
    perm_title: { th: 'สิทธิ์ประจำแผนก', en: 'Department Permissions', jp: '部門権限' },
    perm_subtitle: { th: 'สิทธิ์นี้จะเป็นค่า default ของสมาชิกในแผนก (สามารถ override ได้เป็นรายบุคคล)', en: 'These permissions are the default for department members (can be overridden individually)', jp: 'これらの権限は部門メンバーのデフォルトです（個別にオーバーライド可能）' },
    perm_search_placeholder: { th: 'ค้นหาเมนู...', en: 'Search modules...', jp: 'モジュールを検索...' },
    perm_set_all: { th: 'ตั้งทั้งหมด:', en: 'Set All:', jp: 'すべて設定:' },
    perm_reset_all: { th: 'รีเซ็ตทั้งหมด', en: 'Reset All', jp: 'すべてリセット' },
    perm_reset_confirm: { th: 'รีเซ็ตสิทธิ์แผนกนี้ทั้งหมด?', en: 'Reset all permissions for this department?', jp: 'この部門のすべての権限をリセットしてもよろしいですか?' },
    perm_legend_label: { th: 'ระดับสิทธิ์:', en: 'Permission Level:', jp: 'アクセスレベル:' },
    perm_set_category: { th: 'ตั้งหมวดนี้:', en: 'Set Category:', jp: 'カテゴリを設定:' },
    perm_no_changes: { th: 'ไม่มีการเปลี่ยนแปลง', en: 'No changes', jp: '変更なし' },
    perm_changes_pending: { th: '● มีการเปลี่ยนแปลงที่ยังไม่บันทึก', en: '● Pending changes', jp: '● 保存待機中の変更' },
    perm_save: { th: 'บันทึกสิทธิ์แผนก', en: 'Save Permissions', jp: '権限を保存' },
    perm_saving: { th: 'กำลังบันทึก...', en: 'Saving...', jp: '保存中...' },
  };

  const L = (key: string) => panelText[key as keyof typeof panelText]?.[lang] ?? panelText[key as keyof typeof panelText]?.th ?? key;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "", name_th: "", name_en: "", name_jp: "", head_user_id: "", is_active: true,
  });

  // Department detail state (member list)
  const [detailDept, setDetailDept] = useState<Department | null>(null);
  const [detailMembers, setDetailMembers] = useState<DeptMember[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = async (d: Department) => {
    setDetailDept(d);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/departments/${d.id}`);
      if (res.ok) {
        const json = await res.json();
        setDetailMembers(json.members ?? []);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  // Permissions state
  const [permDeptId, setPermDeptId] = useState<string | null>(null);
  const [permDeptName, setPermDeptName] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [deptPerms, setDeptPerms] = useState<Record<string, number>>({});
  const [permDirty, setPermDirty] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [permFilter, setPermFilter] = useState("");
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const d = await res.json();
        setDepartments(d.departments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const d = await res.json();
        setAllUsers((d.users ?? []).map((u: Record<string, unknown>) => ({
          id: u.id, display_name: u.display_name, email: u.email,
        })));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [fetchDepartments, fetchUsers]);

  /* ─── Department CRUD ─── */
  const openAdd = () => {
    setEditingId(null);
    setFormData({ code: "", name_th: "", name_en: "", name_jp: "", head_user_id: "", is_active: true });
    setShowForm(true);
  };

  const openEdit = (d: Department) => {
    setEditingId(d.id);
    setFormData({
      code: d.code, name_th: d.name_th, name_en: d.name_en ?? "",
      name_jp: d.name_jp ?? "", head_user_id: d.head_user_id ?? "", is_active: d.is_active,
    });
    setShowForm(true);
  };

  const saveDept = async () => {
    const url = editingId ? `/api/departments/${editingId}` : "/api/departments";
    const method = editingId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        head_user_id: formData.head_user_id || null,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      fetchDepartments();
    } else {
      const d = await res.json();
      alert(d.error || "Save failed");
    }
  };

  const deleteDept = async (id: string) => {
    if (!confirm(L('delete_confirm'))) return;
    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchDepartments();
    } else {
      const d = await res.json();
      alert(d.error || "Delete failed");
    }
  };

  /* ─── Department Permissions ─── */
  const openPerms = async (d: Department) => {
    setPermDeptId(d.id);
    setPermDeptName(`${d.name_th} (${d.code})`);
    setPermDirty(false);
    setPermFilter("");

    // Load modules + dept perms
    const [mr, pr] = await Promise.all([
      fetch("/api/permissions/modules"),
      fetch(`/api/departments/${d.id}/permissions`),
    ]);
    if (mr.ok) { const md = await mr.json(); setModules(md.modules ?? []); }
    if (pr.ok) { const pd = await pr.json(); setDeptPerms(pd.permissions ?? {}); }
  };

  const setPermLevel = (key: string, lvl: number) => {
    setDeptPerms(p => ({ ...p, [key]: lvl }));
    setPermDirty(true);
  };

  const setCategoryPermLevel = (cat: string, lvl: number) => {
    const next = { ...deptPerms };
    modules.filter(m => m.category === cat).forEach(m => { next[m.key] = lvl; });
    setDeptPerms(next);
    setPermDirty(true);
  };

  const setAllPermLevel = (lvl: number) => {
    const next: Record<string, number> = {};
    modules.forEach(m => { next[m.key] = lvl; });
    setDeptPerms(next);
    setPermDirty(true);
  };

  const savePerms = async () => {
    if (!permDeptId) return;
    setPermSaving(true);
    try {
      const r = await fetch(`/api/departments/${permDeptId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: deptPerms }),
      });
      if (r.ok) {
        setPermDirty(false);
        setPermDeptId(null);
      }
    } finally {
      setPermSaving(false);
    }
  };

  const resetPerms = () => {
    if (!confirm(L('perm_reset_confirm'))) return;
    const next: Record<string, number> = {};
    modules.forEach(m => { next[m.key] = 0; });
    setDeptPerms(next);
    setPermDirty(true);
  };

  /* ─── Permission modal grouped ─── */
  const filteredModules = permFilter
    ? modules.filter(m => m.label_th.toLowerCase().includes(permFilter.toLowerCase()) || m.key.includes(permFilter.toLowerCase()))
    : modules;
  const groupedModules = CATEGORY_ORDER
    .map(cat => ({ cat, items: filteredModules.filter(m => m.category === cat) }))
    .filter(g => g.items.length > 0);

  const toggleCat = (cat: string) => setCollapsedCats(p => ({ ...p, [cat]: !p[cat] }));

  /* ─── Render ─── */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003087] to-[#00AEEF] flex items-center justify-center">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{L('header_title')}</h2>
            <p className="text-xs text-gray-500">{departments.length}{L('header_subtitle')}</p>
          </div>
        </div>
        {canManage && (
          <button onClick={openAdd}
            className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2">
            <Plus size={16} /> {L('add_button')}
          </button>
        )}
      </div>

      {/* Department Cards */}
      {loading ? (
        <div className="text-center text-gray-500 py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map(d => (
            <div key={d.id} onClick={() => openDetail(d)}
              className={`bg-[#FFFFFF] border rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer ${d.is_active ? "border-[#E2E8F0]" : "border-red-300 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-mono rounded">
                      {d.code}
                    </span>
                    {!d.is_active && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] rounded">{L('inactive_badge')}</span>
                    )}
                  </div>
                  <h3 className="text-gray-900 font-semibold mt-1">{d.name_th}</h3>
                  {d.name_en && <p className="text-xs text-gray-500">{d.name_en}</p>}
                  {d.name_jp && <p className="text-xs text-slate-500">{d.name_jp}</p>}
                </div>
                {canManage && (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openPerms(d)}
                      className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg" title={L('perm_tooltip')}>
                      <Shield size={14} />
                    </button>
                    <button onClick={() => openEdit(d)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg" title={L('edit_tooltip')}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => deleteDept(d.id)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg" title={L('delete_tooltip')}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Users size={12} /> {d.member_count} {L('members_label')}</span>
                {d.head && (
                  <span className="truncate">{L('head_label')} {d.head.display_name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Add/Edit Form Modal ─── */}
      {showForm && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <h3 className="text-gray-900 font-bold text-lg">
                {editingId ? L('form_title_edit') : L('form_title_add')}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-900"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{L('form_code_label')}</label>
                  <input value={formData.code}
                    onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-gray-900"
                    placeholder={L('form_code_placeholder')} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{L('form_status_label')}</label>
                  <select value={formData.is_active ? "true" : "false"}
                    onChange={e => setFormData(p => ({ ...p, is_active: e.target.value === "true" }))}
                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-gray-900">
                    <option value="true">{L('form_status_active')}</option>
                    <option value="false">{L('form_status_inactive')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{L('form_name_th_label')}</label>
                <input value={formData.name_th}
                  onChange={e => setFormData(p => ({ ...p, name_th: e.target.value }))}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-gray-900"
                  placeholder={L('form_name_th_placeholder')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{L('form_name_en_label')}</label>
                <input value={formData.name_en}
                  onChange={e => setFormData(p => ({ ...p, name_en: e.target.value }))}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-gray-900"
                  placeholder={L('form_name_en_placeholder')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{L('form_name_jp_label')}</label>
                <input value={formData.name_jp}
                  onChange={e => setFormData(p => ({ ...p, name_jp: e.target.value }))}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-gray-900"
                  placeholder={L('form_name_jp_placeholder')} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{L('form_head_label')}</label>
                <select value={formData.head_user_id}
                  onChange={e => setFormData(p => ({ ...p, head_user_id: e.target.value }))}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-gray-900">
                  <option value="">{L('form_head_unspecified')}</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.display_name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="border-t border-[#E2E8F0] px-5 py-3 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-gray-900">{L('form_cancel')}</button>
              <button onClick={saveDept}
                className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Save size={14} /> {editingId ? L('form_update') : L('form_create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Department Permissions Modal ─── */}
      {permDeptId && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPermDeptId(null)}>
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* header */}
            <div className="flex items-start justify-between border-b border-[#E2E8F0] px-3 md:px-5 py-3 md:py-4 gap-2">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shrink-0">
                  <Shield size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-gray-900 font-bold text-base md:text-lg">{L('perm_title')}</h3>
                  <div className="text-xs text-gray-500 truncate">{permDeptName}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{L('perm_subtitle')}</div>
                </div>
              </div>
              <button onClick={() => setPermDeptId(null)} className="text-gray-500 hover:text-gray-900 shrink-0 mt-1"><X size={20} /></button>
            </div>

            {/* toolbar */}
            <div className="px-3 md:px-5 py-3 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <div className="relative flex-1 min-w-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={permFilter} onChange={e => setPermFilter(e.target.value)} placeholder={L('perm_search_placeholder')}
                  className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg pl-9 pr-3 py-1.5 text-sm text-gray-900" />
              </div>
              <div className="flex items-center gap-1 text-xs flex-wrap">
                <span className="text-gray-500 mr-1 whitespace-nowrap">{L('perm_set_all')}</span>
                {LEVELS.map(l => (
                  <button key={l} onClick={() => setAllPermLevel(l)}
                    className="px-1.5 md:px-2 py-1 rounded text-[10px] font-medium hover:opacity-80 whitespace-nowrap"
                    style={{ background: `${PERM_COLOR[l]}25`, color: PERM_COLOR[l], border: `1px solid ${PERM_COLOR[l]}50` }}>
                    <span className="hidden md:inline">{PERM_LABEL_TH[l]}</span>
                    <span className="md:hidden">{PERM_LABEL_SHORT[l]}</span>
                  </button>
                ))}
              </div>
              <button onClick={resetPerms} disabled={permSaving}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-gray-900 border border-[#E2E8F0] rounded-lg flex items-center gap-1 disabled:opacity-50 self-start md:self-auto">
                <RotateCcw size={12} /> {L('perm_reset_all')}
              </button>
            </div>

            {/* legend */}
            <div className="px-3 md:px-5 py-2 border-b border-[#E2E8F0] flex items-center gap-2 md:gap-3 flex-wrap text-[10px]">
              <span className="text-slate-500">{L('perm_legend_label')}</span>
              {LEVELS.map(l => (
                <span key={l} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PERM_COLOR[l] }} />
                  <span className="text-slate-300 whitespace-nowrap">{l} = {PERM_LABEL_TH[l]}</span>
                </span>
              ))}
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">
              {groupedModules.map(g => {
                const isCollapsed = collapsedCats[g.cat];
                return (
                  <div key={g.cat} className="bg-gray-50 border border-[#E2E8F0] rounded-xl">
                    <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-[#E2E8F0] cursor-pointer gap-2"
                      onClick={() => toggleCat(g.cat)}>
                      <div className="flex items-center gap-2 min-w-0">
                        {isCollapsed ? <ChevronRight size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
                        <h4 className="text-sm font-semibold text-purple-700 truncate">{CATEGORY_LABEL[g.cat] || g.cat}</h4>
                        <span className="text-[10px] text-slate-500 shrink-0">({g.items.length})</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <span className="text-[10px] text-slate-500 mr-1 hidden md:inline">{L('perm_set_category')}</span>
                        {LEVELS.map(l => (
                          <button key={l} onClick={() => setCategoryPermLevel(g.cat, l)}
                            className="w-5 h-5 rounded text-[10px] font-bold hover:scale-110 transition"
                            title={PERM_LABEL_TH[l]}
                            style={{ background: `${PERM_COLOR[l]}30`, color: PERM_COLOR[l], border: `1px solid ${PERM_COLOR[l]}60` }}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="divide-y divide-[#FFFFFF]">
                        {g.items.map(m => {
                          const cur = deptPerms[m.key] ?? 0;
                          return (
                            <div key={m.key} className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 px-3 md:px-4 py-2 hover:bg-[#FFFFFF]/50">
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-900 truncate block">{m.label_th}</span>
                                <div className="text-[10px] text-slate-500 font-mono">{m.key}</div>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                {LEVELS.map(l => (
                                  <button key={l} onClick={() => setPermLevel(m.key, l)}
                                    className={`px-1.5 md:px-2 py-1 rounded text-[10px] font-medium transition whitespace-nowrap ${cur === l ? "ring-2 scale-105" : "opacity-50 hover:opacity-100"}`}
                                    style={{
                                      background: cur === l ? PERM_COLOR[l] : `${PERM_COLOR[l]}20`,
                                      color: cur === l ? "#fff" : PERM_COLOR[l],
                                      border: `1px solid ${PERM_COLOR[l]}${cur === l ? "" : "60"}`,
                                    }}
                                    title={PERM_LABEL_TH[l]}>
                                    <span className="hidden md:inline">{PERM_LABEL_TH[l]}</span>
                                    <span className="md:hidden">{PERM_LABEL_SHORT[l]}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* footer */}
            <div className="border-t border-[#E2E8F0] px-3 md:px-5 py-3 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-600 truncate">
                {permDirty ? <span className="text-purple-700">{L('perm_changes_pending')}</span> : L('perm_no_changes')}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setPermDeptId(null)} className="px-3 md:px-4 py-2 text-sm text-slate-600 hover:text-gray-900">{L('form_cancel')}</button>
                <button onClick={savePerms} disabled={permSaving || !permDirty}
                  className="px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 whitespace-nowrap">
                  <Save size={14} /> {permSaving ? L('perm_saving') : L('perm_save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ─── Department Detail Modal (Members) ─── */}
      {detailDept && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailDept(null)}>
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-mono rounded">{detailDept.code}</span>
                  <h3 className="text-gray-900 font-bold text-lg">{detailDept.name_th}</h3>
                </div>
                {detailDept.name_en && <p className="text-xs text-gray-500 mt-0.5">{detailDept.name_en}</p>}
              </div>
              <button onClick={() => setDetailDept(null)} className="text-gray-500 hover:text-gray-900"><X size={20} /></button>
            </div>

            {/* Head */}
            {detailDept.head && (
              <div className="px-5 py-3 border-b border-[#E2E8F0] bg-blue-50/50">
                <p className="text-xs text-gray-500 mb-1">{L('head_label')}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003087] to-[#00AEEF] flex items-center justify-center text-white text-xs font-bold">
                    {detailDept.head.display_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{detailDept.head.display_name}</p>
                    <p className="text-xs text-gray-500">{detailDept.head.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Members */}
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                {lang === 'en' ? 'Members' : lang === 'jp' ? 'メンバー' : 'สมาชิกในแผนก'} ({detailMembers.length})
              </p>
              {detailLoading ? (
                <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
              ) : detailMembers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {lang === 'en' ? 'No members in this department' : lang === 'jp' ? 'メンバーなし' : 'ยังไม่มีสมาชิกในแผนกนี้'}
                </p>
              ) : (
                <div className="space-y-2">
                  {detailMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 border border-[#E2E8F0]">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {m.display_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.display_name}</p>
                        <p className="text-xs text-gray-500 truncate">{m.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
