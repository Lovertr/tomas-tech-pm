"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { translations, Lang } from "@/lib/i18n";
import {
  Users, UserPlus, Pencil, Trash2, KeyRound, Search, ArrowLeft,
  CheckCircle2, XCircle, Shield, Loader2, X, ShieldCheck,
} from "lucide-react";
import PermissionsModal from "@/components/PermissionsModal";

type Role = {
  id: string;
  name: string;
  name_th?: string;
  name_en?: string;
  name_jp?: string;
  level: number;
  is_system: boolean;
};

type Position = {
  id: string;
  name?: string;
  name_th?: string;
  name_en?: string;
  name_jp?: string;
};

type AppUser = {
  id: string;
  username: string;
  display_name: string;
  display_name_th?: string;
  display_name_jp?: string;
  email?: string;
  phone?: string;
  department?: string;
  role: string;
  role_id: string;
  role_level: number;
  position_id?: string;
  language: string;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at?: string;
  created_at: string;
};

type Department = {
  id: string;
  name_th: string;
  name_en?: string;
  name_jp?: string;
  code?: string;
};

type FormState = {
  username: string;
  first_name_en: string;
  last_name_en: string;
  first_name_th: string;
  last_name_th: string;
  first_name_jp: string;
  last_name_jp: string;
  email: string;
  phone: string;
  department_id: string;
  role_id: string;
  position_id: string;
  language: string;
  is_active: boolean;
  employee_code: string;
  hourly_rate: number;
};

const emptyForm: FormState = {
  username: "", first_name_en: "", last_name_en: "", first_name_th: "", last_name_th: "",
  first_name_jp: "", last_name_jp: "", email: "", phone: "", department_id: "", role_id: "",
  position_id: "", language: "th", is_active: true, employee_code: "", hourly_rate: 0,
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading, isAdmin } = useAuth();
  const [lang, setLang] = useState<Lang>("th");
  const t = translations[lang];

  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [permsUser, setPermsUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (currentUser?.language) setLang(currentUser.language as Lang);
  }, [currentUser]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace("/");
    }
  }, [authLoading, isAdmin, router]);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, pRes, dRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/roles"),
        fetch("/api/positions"),
        fetch("/api/departments"),
      ]);
      if (uRes.ok) setUsers((await uRes.json()).users ?? []);
      if (rRes.ok) setRoles((await rRes.json()).roles ?? []);
      if (pRes.ok) setPositions((await pRes.json()).positions ?? []);
      if (dRes.ok) setDepartments((await dRes.json()).departments ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.display_name.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q);
      const matchesRole = filterRole === "all" || u.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, search, filterRole]);

  const openCreate = () => {
    setEditingId(null);
    const defaultRole = roles.find((r) => r.name === "member") ?? roles[roles.length - 1];
    setForm({ ...emptyForm, role_id: defaultRole?.id ?? "" });
    setShowModal(true);
  };

  const openEdit = async (u: AppUser) => {
    setEditingId(u.id);
    // Load team_member data for this user
    let tm: Record<string, string | number | null> = {};
    try {
      const res = await fetch(`/api/members?user_id=${u.id}`);
      if (res.ok) {
        const d = await res.json();
        const found = (d.members ?? []).find((m: { user_id: string }) => m.user_id === u.id);
        if (found) tm = found;
      }
    } catch { /* ignore */ }

    // Find department_id from user or team_member
    const deptId = (u as Record<string, unknown>).department_id as string
      ?? (tm.department_id as string)
      ?? departments.find(d => d.name_th === u.department || d.name_en === u.department)?.id
      ?? "";

    setForm({
      username: u.username,
      first_name_en: (tm.first_name_en as string) ?? u.display_name?.split(/\s+/)[0] ?? "",
      last_name_en: (tm.last_name_en as string) ?? u.display_name?.split(/\s+/).slice(1).join(" ") ?? "",
      first_name_th: (tm.first_name_th as string) ?? u.display_name_th?.split(/\s+/)[0] ?? "",
      last_name_th: (tm.last_name_th as string) ?? u.display_name_th?.split(/\s+/).slice(1).join(" ") ?? "",
      first_name_jp: (tm.first_name_jp as string) ?? "",
      last_name_jp: (tm.last_name_jp as string) ?? "",
      email: u.email ?? "",
      phone: u.phone ?? "",
      department_id: deptId,
      role_id: u.role_id,
      position_id: u.position_id ?? "",
      language: u.language,
      is_active: u.is_active,
      employee_code: (tm.employee_code as string) ?? "",
      hourly_rate: Number(tm.hourly_rate) || 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const hasName = form.first_name_en || form.first_name_th;
    if (!hasName || !form.role_id || (!editingId && !form.username)) {
      showToast("err", "กรุณากรอกชื่ออย่างน้อย 1 ภาษา + สิทธิ์" + (!editingId ? " + ชื่อผู้ใช้" : ""));
      return;
    }
    if (!form.department_id) {
      showToast("err", "กรุณาเลือกแผนก");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/users/${editingId}` : "/api/users";
      const method = editingId ? "PATCH" : "POST";
      // Build display_name from first/last name for backward compat
      const display_name = [form.first_name_en, form.last_name_en].filter(Boolean).join(" ")
        || [form.first_name_th, form.last_name_th].filter(Boolean).join(" ");
      const display_name_th = [form.first_name_th, form.last_name_th].filter(Boolean).join(" ");
      const display_name_jp = [form.first_name_jp, form.last_name_jp].filter(Boolean).join(" ");
      const payload = editingId
        ? { ...form, username: undefined, display_name, display_name_th, display_name_jp }
        : { ...form, display_name, display_name_th, display_name_jp };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast("err", data.error ?? "เกิดข้อผิดพลาด");
      } else {
        if (!editingId) {
          showToast("ok", `สร้างสำเร็จ รหัสผ่านเริ่มต้น: 00000000`);
        } else {
          showToast("ok", "บันทึกสำเร็จ");
        }
        setShowModal(false);
        loadAll();
      }
    } catch (e) {
      showToast("err", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: AppUser) => {
    if (!confirm(`ลบผู้ใช้ "${u.display_name}" (${u.username}) ?`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) showToast("err", data.error ?? "ลบไม่สำเร็จ");
    else {
      showToast("ok", "ลบสำเร็จ");
      loadAll();
    }
  };

  const handleResetPassword = async (u: AppUser) => {
    if (!confirm(`รีเซ็ตรหัสผ่านของ "${u.display_name}" เป็น 00000000 ?`)) return;
    const res = await fetch(`/api/users/${u.id}/reset-password`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) showToast("err", data.error ?? "รีเซ็ตไม่สำเร็จ");
    else showToast("ok", "รีเซ็ตรหัสผ่านเป็น 00000000 แล้ว");
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-600 border-red-200",
      manager: "bg-blue-100 text-blue-600 border-blue-200",
      member: "bg-gray-100 text-gray-600 border-gray-200",
    };
    return colors[role] ?? colors.member;
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-300 bg-white/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-lg hover:bg-gray-200 transition"
              title="กลับ"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{t.userManagement}</h1>
                <p className="text-xs text-gray-500">
                  {users.length} {t.teamMembers}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium transition shadow-lg shadow-orange-500/20"
          >
            <UserPlus className="w-4 h-4" />
            {t.addUser}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-2 ${
            toast.type === "ok"
              ? "bg-green-100 border-green-200 text-green-600"
              : "bg-red-100 border-red-200 text-red-600"
          }`}
        >
          {toast.type === "ok" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-300 focus:border-orange-500 outline-none text-sm"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 focus:border-orange-500 outline-none text-sm"
          >
            <option value="all">{t.all} ({t.role})</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {t[r.name as keyof typeof t] ?? r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-300 bg-white/50 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">{t.noData}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-300 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">{t.username}</th>
                    <th className="px-4 py-3 text-left">{t.name}</th>
                    <th className="px-4 py-3 text-left">{t.role}</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">{t.status}</th>
                    <th className="px-4 py-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 font-mono text-gray-600">
                        {u.username}
                        {u.username === "admin" && (
                          <Shield className="w-3 h-3 inline ml-1 text-orange-400" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{u.display_name}</div>
                        {u.department && (
                          <div className="text-xs text-gray-500">{u.department}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium border ${roleBadge(
                            u.role
                          )}`}
                        >
                          {t[u.role as keyof typeof t] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email ?? "-"}</td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="text-green-400 text-xs">● {t.active}</span>
                        ) : (
                          <span className="text-slate-500 text-xs">● {t.inactive}</span>
                        )}
                        {u.must_change_password && (
                          <div className="text-[10px] text-orange-600 mt-0.5">
                            ต้องเปลี่ยนรหัสผ่าน
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => setPermsUser(u)}
                            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-green-600 transition"
                            title="จัดการสิทธิ์"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-orange-600 transition"
                            title={t.resetPassword}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition"
                            title={t.edit}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={u.username === "admin" || u.id === currentUser?.id}
                            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={t.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Permissions Modal */}
      {permsUser && (
        <PermissionsModal
          user={{ id: permsUser.id, username: permsUser.username, display_name: permsUser.display_name }}
          open={!!permsUser}
          onClose={() => setPermsUser(null)}
          onSaved={() => showToast("ok", "บันทึกสิทธิ์เรียบร้อย")}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? t.edit : t.addUser}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Section: บัญชีผู้ใช้ */}
              <div>
                <div className="text-xs font-semibold text-[#003087] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> บัญชีผู้ใช้
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {!editingId && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t.username} *</label>
                      <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. somchai" className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm" />
                      <p className="text-[10px] text-gray-500 mt-0.5">รหัสผ่านเริ่มต้น: <span className="font-mono text-orange-500">00000000</span></p>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t.role} *</label>
                    <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm">
                      <option value="">—</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>{t[r.name as keyof typeof t] ?? r.name} (Lv.{r.level})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t.language}</label>
                    <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm">
                      <option value="th">ไทย</option>
                      <option value="en">English</option>
                      <option value="jp">日本語</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: ข้อมูลพนักงาน */}
              <div>
                <div className="text-xs font-semibold text-[#003087] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> ข้อมูลพนักงาน
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">ชื่อ (TH) *</label>
                    <input value={form.first_name_th} onChange={(e) => setForm({ ...form, first_name_th: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">นามสกุล (TH)</label>
                    <input value={form.last_name_th} onChange={(e) => setForm({ ...form, last_name_th: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">รหัสพนักงาน</label>
                    <input value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} placeholder="e.g. EMP-001" className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">First name (EN)</label>
                    <input value={form.first_name_en} onChange={(e) => setForm({ ...form, first_name_en: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Last name (EN)</label>
                    <input value={form.last_name_en} onChange={(e) => setForm({ ...form, last_name_en: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm" />
                  </div>
                  <div className="hidden md:block" />
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">名 (JP)</label>
                    <input value={form.first_name_jp} onChange={(e) => setForm({ ...form, first_name_jp: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">姓 (JP)</label>
                    <input value={form.last_name_jp} onChange={(e) => setForm({ ...form, last_name_jp: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm" />
                  </div>
                </div>
              </div>

              {/* Section: แผนก & ตำแหน่ง */}
              <div>
                <div className="text-xs font-semibold text-[#003087] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> แผนก & ตำแหน่ง
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">แผนก *</label>
                    <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm">
                      <option value="">— เลือกแผนก —</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{lang === "en" ? (d.name_en || d.name_th) : lang === "jp" ? (d.name_jp || d.name_th) : d.name_th} ({d.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t.position}</label>
                    <select value={form.position_id} onChange={(e) => {
                      const pid = e.target.value;
                      const pos = positions.find(p => p.id === pid);
                      setForm({ ...form, position_id: pid, hourly_rate: pos ? Number((pos as Record<string, unknown>).default_hourly_rate) || form.hourly_rate : form.hourly_rate });
                    }} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm">
                      <option value="">—</option>
                      {positions.map((p) => <option key={p.id} value={p.id}>{lang === "jp" ? (p.name_jp || p.name_th || p.name_en || p.name) : lang === "en" ? (p.name_en || p.name_th || p.name) : (p.name_th || p.name_en || p.name)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">ค่าแรง/ชม. (฿)</label>
                    <input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm" />
                  </div>
                </div>
              </div>

              {/* Section: ติดต่อ */}
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-orange-500 outline-none text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-orange-500 w-4 h-4" />
                  <label htmlFor="is_active" className="text-sm text-gray-600">{t.active}</label>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-300 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
