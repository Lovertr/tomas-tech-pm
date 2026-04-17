"use client";
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

interface Props {
  canManage: boolean;
}

export default function DepartmentsPanel({ canManage }: Props) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "", name_th: "", name_en: "", name_jp: "", head_user_id: "", is_active: true,
  });

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
    if (!confirm("ลบแผนกนี้ใช่หรือไม่?")) return;
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
    if (!confirm("รีเซ็ตสิทธิ์แผนกนี้ทั้งหมด?")) return;
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
            <h2 className="text-lg font-bold text-white">จัดการแผนก</h2>
            <p className="text-xs text-slate-400">{departments.length} แผนก</p>
          </div>
        </div>
        {canManage && (
          <button onClick={openAdd}
            className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2">
            <Plus size={16} /> เพิ่มแผนก
          </button>
        )}
      </div>

      {/* Department Cards */}
      {loading ? (
        <div className="text-center text-slate-400 py-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map(d => (
            <div key={d.id}
              className={`bg-[#1E293B] border rounded-2xl p-4 hover:shadow-lg transition-all ${d.is_active ? "border-[#334155]" : "border-red-900/40 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#003087]/20 text-[#00AEEF] text-xs font-mono rounded">
                      {d.code}
                    </span>
                    {!d.is_active && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded">ปิดใช้งาน</span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold mt-1">{d.name_th}</h3>
                  {d.name_en && <p className="text-xs text-slate-400">{d.name_en}</p>}
                  {d.name_jp && <p className="text-xs text-slate-500">{d.name_jp}</p>}
                </div>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openPerms(d)}
                      className="p-1.5 text-purple-400 hover:bg-purple-400/10 rounded-lg" title="จัดการสิทธิ์แผนก">
                      <Shield size={14} />
                    </button>
                    <button onClick={() => openEdit(d)}
                      className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg" title="แก้ไข">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => deleteDept(d.id)}
                      className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg" title="ลบ">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Users size={12} /> {d.member_count} คน</span>
                {d.head && (
                  <span className="truncate">หัวหน้า: {d.head.display_name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Add/Edit Form Modal ─── */}
      {showForm && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#334155] px-5 py-4">
              <h3 className="text-white font-bold text-lg">
                {editingId ? "แก้ไขแผนก" : "เพิ่มแผนกใหม่"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">รหัสแผนก *</label>
                  <input value={formData.code}
                    onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="เช่น SW, INFRA" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">สถานะ</label>
                  <select value={formData.is_active ? "true" : "false"}
                    onChange={e => setFormData(p => ({ ...p, is_active: e.target.value === "true" }))}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white">
                    <option value="true">ใช้งาน</option>
                    <option value="false">ปิดใช้งาน</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">ชื่อแผนก (ไทย) *</label>
                <input value={formData.name_th}
                  onChange={e => setFormData(p => ({ ...p, name_th: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="ฝ่ายพัฒนาซอฟต์แวร์" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">ชื่อแผนก (English)</label>
                <input value={formData.name_en}
                  onChange={e => setFormData(p => ({ ...p, name_en: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="Software Development" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">ชื่อแผนก (日本語)</label>
                <input value={formData.name_jp}
                  onChange={e => setFormData(p => ({ ...p, name_jp: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="ソフトウェア開発部" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">หัวหน้าแผนก</label>
                <select value={formData.head_user_id}
                  onChange={e => setFormData(p => ({ ...p, head_user_id: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">-- ไม่ระบุ --</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.display_name} ({u.email})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="border-t border-[#334155] px-5 py-3 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white">ยกเลิก</button>
              <button onClick={saveDept}
                className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Save size={14} /> {editingId ? "อัปเดต" : "สร้างแผนก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Department Permissions Modal ─── */}
      {permDeptId && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPermDeptId(null)}>
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* header */}
            <div className="flex items-center justify-between border-b border-[#334155] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">สิทธิ์ประจำแผนก</h3>
                  <div className="text-xs text-slate-400">{permDeptName}</div>
                  <div className="text-[10px] text-slate-500">สิทธิ์นี้จะเป็นค่า default ของสมาชิกในแผนก (สามารถ override ได้เป็นรายบุคคล)</div>
                </div>
              </div>
              <button onClick={() => setPermDeptId(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            {/* toolbar */}
            <div className="px-5 py-3 border-b border-[#334155] flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={permFilter} onChange={e => setPermFilter(e.target.value)} placeholder="ค้นหาเมนู..."
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-9 pr-3 py-1.5 text-sm text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 mr-1">ตั้งทั้งหมด:</span>
                {LEVELS.map(l => (
                  <button key={l} onClick={() => setAllPermLevel(l)}
                    className="px-2 py-1 rounded text-[10px] font-medium hover:opacity-80"
                    style={{ background: `${PERM_COLOR[l]}25`, color: PERM_COLOR[l], border: `1px solid ${PERM_COLOR[l]}50` }}>
                    {PERM_LABEL_TH[l]}
                  </button>
                ))}
              </div>
              <button onClick={resetPerms} disabled={permSaving}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-[#334155] rounded-lg flex items-center gap-1 disabled:opacity-50">
                <RotateCcw size={12} /> รีเซ็ตทั้งหมด
              </button>
            </div>

            {/* legend */}
            <div className="px-5 py-2 border-b border-[#334155] flex items-center gap-3 flex-wrap text-[10px]">
              <span className="text-slate-500">ระดับสิทธิ์:</span>
              {LEVELS.map(l => (
                <span key={l} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: PERM_COLOR[l] }} />
                  <span className="text-slate-300">{l} = {PERM_LABEL_TH[l]}</span>
                </span>
              ))}
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {groupedModules.map(g => {
                const isCollapsed = collapsedCats[g.cat];
                return (
                  <div key={g.cat} className="bg-[#0F172A]/40 border border-[#334155] rounded-xl">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[#334155] cursor-pointer"
                      onClick={() => toggleCat(g.cat)}>
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronRight size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                        <h4 className="text-sm font-semibold text-purple-400">{CATEGORY_LABEL[g.cat] || g.cat}</h4>
                        <span className="text-[10px] text-slate-500">({g.items.length})</span>
                      </div>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <span className="text-[10px] text-slate-500 mr-1">ตั้งหมวดนี้:</span>
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
                      <div className="divide-y divide-[#1E293B]">
                        {g.items.map(m => {
                          const cur = deptPerms[m.key] ?? 0;
                          return (
                            <div key={m.key} className="flex items-center gap-3 px-4 py-2 hover:bg-[#1E293B]/50">
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-white truncate">{m.label_th}</span>
                                <div className="text-[10px] text-slate-500 font-mono">{m.key}</div>
                              </div>
                              <div className="flex items-center gap-1">
                                {LEVELS.map(l => (
                                  <button key={l} onClick={() => setPermLevel(m.key, l)}
                                    className={`px-2 py-1 rounded text-[10px] font-medium transition ${cur === l ? "ring-2 scale-105" : "opacity-50 hover:opacity-100"}`}
                                    style={{
                                      background: cur === l ? PERM_COLOR[l] : `${PERM_COLOR[l]}20`,
                                      color: cur === l ? "#fff" : PERM_COLOR[l],
                                      border: `1px solid ${PERM_COLOR[l]}${cur === l ? "" : "60"}`,
                                    }}
                                    title={PERM_LABEL_TH[l]}>
                                    {PERM_LABEL_TH[l]}
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
            <div className="border-t border-[#334155] px-5 py-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {permDirty ? <span className="text-purple-400">● มีการเปลี่ยนแปลงที่ยังไม่บันทึก</span> : "ไม่มีการเปลี่ยนแปลง"}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPermDeptId(null)} className="px-4 py-2 text-sm text-slate-300 hover:text-white">ยกเลิก</button>
                <button onClick={savePerms} disabled={permSaving || !permDirty}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                  <Save size={14} /> {permSaving ? "กำลังบันทึก..." : "บันทึกสิทธิ์แผนก"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
