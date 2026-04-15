"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { translations, Lang } from "@/lib/i18n";
import {
  Users, UserPlus, Pencil, Trash2, KeyRound, Search, ArrowLeft,
  CheckCircle2, XCircle, Shield, Loader2, X,
} from "lucide-react";

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
  name: string;
  name_th?: string;
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

type FormState = {
  username: string;
  display_name: string;
  display_name_th: string;
  display_name_jp: string;
  email: string;
  phone: string;
  department: string;
  role_id: string;
  position_id: string;
  language: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  username: "", display_name: "", display_name_th: "", display_name_jp: "",
  email: "", phone: "", department: "", role_id: "", position_id: "",
  language: "th", is_active: true,
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading, isAdmin } = useAuth();
  const [lang, setLang] = useState<Lang>("th");
  const t = translations[lang];

  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

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
      const [uRes, rRes, pRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/roles"),
        fetch("/api/positions"),
      ]);
      if (uRes.ok) setUsers((await uRes.json()).users ?? []);
      if (rRes.ok) setRoles((await rRes.json()).roles ?? []);
      if (pRes.ok) setPositions((await pRes.json()).positions ?? []);
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

  const openEdit = (u: AppUser) => {
    setEditingId(u.id);
    setForm({
      username: u.username,
      display_name: u.display_name,
      display_name_th: u.display_name_th ?? "",
      display_name_jp: u.display_name_jp ?? "",
      email: u.email ?? "",
      phone: u.phone ?? "",
      department: u.department ?? "",
      role_id: u.role_id,
      position_id: u.position_id ?? "",
      language: u.language,
      is_active: u.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.display_name || !form.role_id || (!editingId && !form.username)) {
      showToast("err", "กรุณากรอกข้อมูลที่จำเป็น");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/users/${editingId}` : "/api/users";
      const method = editingId ? "PATCH" : "POST";
      const payload = editingId
        ? { ...form, username: undefined } // username immutable
        : form;

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
      admin: "bg-red-500/20 text-red-300 border-red-500/40",
      manager: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      leader: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      member: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    };
    return colors[role] ?? colors.member;
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-lg hover:bg-slate-800 transition"
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
                <p className="text-xs text-slate-400">
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
              ? "bg-green-500/10 border-green-500/40 text-green-300"
              : "bg-red-500/10 border-red-500/40 text-red-300"
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-orange-500 outline-none text-sm"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-orange-500 outline-none text-sm"
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
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">{t.noData}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">{t.username}</th>
                    <th className="px-4 py-3 text-left">{t.name}</th>
                    <th className="px-4 py-3 text-left">{t.role}</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">{t.status}</th>
                    <th className="px-4 py-3 text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {u.username}
                        {u.username === "admin" && (
                          <Shield className="w-3 h-3 inline ml-1 text-orange-400" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{u.display_name}</div>
                        {u.department && (
                          <div className="text-xs text-slate-400">{u.department}</div>
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
                      <td className="px-4 py-3 text-slate-300">{u.email ?? "-"}</td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="text-green-400 text-xs">● {t.active}</span>
                        ) : (
                          <span className="text-slate-500 text-xs">● {t.inactive}</span>
                        )}
                        {u.must_change_password && (
                          <div className="text-[10px] text-orange-400 mt-0.5">
                            ต้องเปลี่ยนรหัสผ่าน
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-orange-400 transition"
                            title={t.resetPassword}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition"
                            title={t.edit}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={u.username === "admin" || u.id === currentUser?.id}
                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-red-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? t.edit : t.addUser}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {!editingId && (
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">
                    {t.username} *
                  </label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g. somchai, tanaka"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-orange-500 outline-none text-sm"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    3-30 ตัวอักษร (a-z, A-Z, 0-9, _) — รหัสผ่านเริ่มต้น: <span className="font-mono text-orange-400">00000000</span>
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t.name} (EN) *
                </label>
                <input
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-orange-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t.name} (TH)
                </label>
                <input
                  value={form.display_name_th}
                  onChange={(e) => setForm({ ...form, display_name_th: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-orange-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t.name} (JP)
                </label>
                <input
                  value={form.display_name_jp}
                  onChange={(e) => setForm({ ...form, display_name_jp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-orange-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-orange-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-orange-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Department
                </label>
                <input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-orange-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{t.role} *</label>
                <select
                  value={form.role_id}
                  onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-orange-500 outline-none text-sm"
                >
                  <option value="">—</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {t[r.name as keyof typeof t] ?? r.name} (Lv.{r.level})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t.position}
                </label>
                <select
                  value={form.position_id}
                  onChange={(e) => setForm({ ...form, position_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-orange-500 outline-none text-sm"
                >
                  <option value="">—</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {t.language}
                </label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-orange-500 outline-none text-sm"
                >
                  <option value="th">ไทย</option>
                  <option value="en">English</option>
                  <option value="jp">日本語</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="accent-orange-500 w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm text-slate-300">
                  {t.active}
                </label>
              </div>
            </div>
            <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
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
