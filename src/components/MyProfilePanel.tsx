"use client";
import { useState, useEffect, useCallback } from "react";
import {
  User, Mail, Phone, Lock, Save, Loader2, Eye, EyeOff,
  CheckCircle2, XCircle, BarChart3, ListTodo, Clock, TrendingUp,
  Target, Plus, Trash2, Star, ChevronDown, ChevronUp, Briefcase
} from "lucide-react";

interface Props {
  lang: "th" | "en" | "jp";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentUser: Record<string, any> | null;
  onProfileUpdated?: () => void;
}

const t: Record<string, Record<string, string>> = {
  th: {
    title: "โปรไฟล์ของฉัน",
    personalInfo: "ข้อมูลส่วนตัว",
    displayName: "ชื่อแสดง",
    displayNameTh: "ชื่อ (ไทย)",
    displayNameJp: "名前 (日本語)",
    email: "อีเมล",
    phone: "เบอร์โทร",
    username: "ชื่อผู้ใช้",
    role: "ตำแหน่ง",
    department: "แผนก",
    save: "บันทึก",
    saving: "กำลังบันทึก...",
    saved: "บันทึกสำเร็จ",
    changePassword: "เปลี่ยนรหัสผ่าน",
    oldPassword: "รหัสผ่านเดิม",
    newPassword: "รหัสผ่านใหม่",
    confirmPassword: "ยืนยันรหัสผ่านใหม่",
    passwordChanged: "เปลี่ยนรหัสผ่านสำเร็จ",
    passwordMismatch: "รหัสผ่านใหม่ไม่ตรงกัน",
    wrongPassword: "รหัสผ่านเดิมไม่ถูกต้อง",
    workSummary: "สรุปงานของฉัน",
    tasksInProgress: "งานที่กำลังทำ",
    tasksCompleted: "งานที่เสร็จแล้ว",
    hoursThisMonth: "ชั่วโมงเดือนนี้",
    projectsActive: "โครงการที่เข้าร่วม",
    personalKpi: "KPI ส่วนบุคคล",
    autoKpi: "KPI อัตโนมัติ (จากระบบ)",
    manualKpi: "KPI ที่กำหนด",
    addKpi: "เพิ่ม KPI",
    kpiName: "ชื่อ KPI",
    target: "เป้าหมาย",
    actual: "ผลจริง",
    score: "คะแนน",
    weight: "น้ำหนัก",
    unit: "หน่วย",
    category: "หมวด",
    overallScore: "คะแนนรวม",
    period: "งวด",
    managerScore: "คะแนนจากหัวหน้า",
    noKpi: "ยังไม่มี KPI สำหรับเดือนนี้",
    taskCompletion: "อัตราสำเร็จงาน",
    hoursLogged: "ชั่วโมงทำงาน",
    dealsClosed: "ดีลที่ปิดได้",
    dealRevenue: "รายได้จากดีล",
    admin: "ผู้ดูแลระบบ",
    manager: "ผู้จัดการ",
    member: "สมาชิก",
    count: "จำนวน",
    percent: "เปอร์เซ็นต์",
    hours: "ชั่วโมง",
    baht: "บาท",
    deals: "ดีล",
    task: "งาน",
    deal: "การขาย",
    time: "เวลา",
    quality: "คุณภาพ",
    general: "ทั่วไป",
    deleteConfirm: "ลบ KPI นี้?",
  },
  en: {
    title: "My Profile",
    personalInfo: "Personal Information",
    displayName: "Display Name",
    displayNameTh: "Name (Thai)",
    displayNameJp: "Name (Japanese)",
    email: "Email",
    phone: "Phone",
    username: "Username",
    role: "Role",
    department: "Department",
    save: "Save",
    saving: "Saving...",
    saved: "Saved successfully",
    changePassword: "Change Password",
    oldPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    passwordChanged: "Password changed successfully",
    passwordMismatch: "New passwords do not match",
    wrongPassword: "Current password is incorrect",
    workSummary: "My Work Summary",
    tasksInProgress: "Tasks In Progress",
    tasksCompleted: "Tasks Completed",
    hoursThisMonth: "Hours This Month",
    projectsActive: "Active Projects",
    personalKpi: "Personal KPI",
    autoKpi: "Auto KPI (from system)",
    manualKpi: "Assigned KPI",
    addKpi: "Add KPI",
    kpiName: "KPI Name",
    target: "Target",
    actual: "Actual",
    score: "Score",
    weight: "Weight",
    unit: "Unit",
    category: "Category",
    overallScore: "Overall Score",
    period: "Period",
    managerScore: "Manager Score",
    noKpi: "No KPIs for this period yet",
    taskCompletion: "Task Completion Rate",
    hoursLogged: "Hours Logged",
    dealsClosed: "Deals Closed",
    dealRevenue: "Deal Revenue",
    admin: "Admin",
    manager: "Manager",
    member: "Member",
    count: "count",
    percent: "%",
    hours: "hrs",
    baht: "THB",
    deals: "deals",
    task: "Task",
    deal: "Sales",
    time: "Time",
    quality: "Quality",
    general: "General",
    deleteConfirm: "Delete this KPI?",
  },
  jp: {
    title: "マイプロフィール",
    personalInfo: "個人情報",
    displayName: "表示名",
    displayNameTh: "名前（タイ語）",
    displayNameJp: "名前（日本語）",
    email: "メール",
    phone: "電話番号",
    username: "ユーザー名",
    role: "役割",
    department: "部署",
    save: "保存",
    saving: "保存中...",
    saved: "保存しました",
    changePassword: "パスワード変更",
    oldPassword: "現在のパスワード",
    newPassword: "新しいパスワード",
    confirmPassword: "新しいパスワード確認",
    passwordChanged: "パスワードを変更しました",
    passwordMismatch: "新しいパスワードが一致しません",
    wrongPassword: "現在のパスワードが正しくありません",
    workSummary: "作業サマリー",
    tasksInProgress: "進行中タスク",
    tasksCompleted: "完了タスク",
    hoursThisMonth: "今月の時間",
    projectsActive: "参加プロジェクト",
    personalKpi: "個人KPI",
    autoKpi: "自動KPI（システム）",
    manualKpi: "設定KPI",
    addKpi: "KPI追加",
    kpiName: "KPI名",
    target: "目標",
    actual: "実績",
    score: "スコア",
    weight: "重み",
    unit: "単位",
    category: "カテゴリ",
    overallScore: "総合スコア",
    period: "期間",
    managerScore: "上司評価",
    noKpi: "この期間のKPIはありません",
    taskCompletion: "タスク完了率",
    hoursLogged: "作業時間",
    dealsClosed: "成約ディール",
    dealRevenue: "ディール収益",
    admin: "管理者",
    manager: "マネージャー",
    member: "メンバー",
    count: "件",
    percent: "%",
    hours: "時間",
    baht: "バーツ",
    deals: "件",
    task: "タスク",
    deal: "営業",
    time: "時間",
    quality: "品質",
    general: "一般",
    deleteConfirm: "このKPIを削除しますか？",
  },
};

const UNITS = ["count", "percent", "hours", "baht", "deals"];
const CATEGORIES = ["task", "deal", "time", "quality", "general"];

export default function MyProfilePanel({ lang, currentUser, onProfileUpdated }: Props) {
  const L = t[lang] || t.th;
  const isManagerOrAdmin = currentUser?.role === "admin" || currentUser?.role === "manager";

  // Profile form
  const [form, setForm] = useState({
    display_name: "",
    display_name_th: "",
    display_name_jp: "",
    email: "",
    phone: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  // Work summary
  const [workStats, setWorkStats] = useState({ tasksInProgress: 0, tasksCompleted: 0, hoursThisMonth: 0, projectsActive: 0 });

  // KPI
  const [currentPeriod, setCurrentPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [autoKpi, setAutoKpi] = useState<Record<string, number>>({});
  const [manualKpis, setManualKpis] = useState<Array<Record<string, unknown>>>([]);
  const [kpiOpen, setKpiOpen] = useState(true);
  const [addingKpi, setAddingKpi] = useState(false);
  const [newKpi, setNewKpi] = useState({ kpi_name: "", target_value: 0, unit: "count", category: "general", weight: 1 });

  // Load profile
  useEffect(() => {
    if (currentUser) {
      setForm({
        display_name: currentUser.display_name || "",
        display_name_th: currentUser.display_name_th || "",
        display_name_jp: currentUser.display_name_jp || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
      });
    }
  }, [currentUser]);

  // Load work summary
  const loadWorkSummary = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [tasksRes, timelogsRes, projRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/timelogs"),
        fetch("/api/projects"),
      ]);
      const tasks = await tasksRes.json();
      const timelogs = await timelogsRes.json();
      const projects = await projRes.json();

      const membersRes = await fetch("/api/members");
      const members = await membersRes.json();
      const myMember = (members.data || members || []).find((m: Record<string, unknown>) => m.user_id === currentUser.id);
      const myMemberId = myMember?.id;

      const myTasks = (tasks.data || tasks || []).filter((t: Record<string, unknown>) => t.assigned_to === myMemberId);
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const myLogs = (timelogs.data || timelogs || []).filter((l: Record<string, unknown>) => l.member_id === myMemberId && (l.log_date as string) >= monthStart);
      const hours = myLogs.reduce((s: number, l: Record<string, unknown>) => s + (Number(l.hours) || 0), 0);

      const allProjects = projects.data || projects || [];
      const activeProjects = allProjects.filter((p: Record<string, unknown>) => p.status === "in_progress");

      setWorkStats({
        tasksInProgress: myTasks.filter((t: Record<string, unknown>) => t.status === "in_progress").length,
        tasksCompleted: myTasks.filter((t: Record<string, unknown>) => t.status === "done").length,
        hoursThisMonth: Math.round(hours * 10) / 10,
        projectsActive: activeProjects.length,
      });
    } catch {}
  }, [currentUser]);

  // Load KPIs
  const loadKpis = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [autoRes, manualRes] = await Promise.all([
        fetch(`/api/personal-kpis/auto?period=${currentPeriod}`),
        fetch(`/api/personal-kpis?period=${currentPeriod}`),
      ]);
      const autoData = await autoRes.json();
      const manualData = await manualRes.json();
      setAutoKpi(autoData.metrics || {});
      setManualKpis(Array.isArray(manualData) ? manualData : []);
    } catch {}
  }, [currentUser, currentPeriod]);

  useEffect(() => { loadWorkSummary(); }, [loadWorkSummary]);
  useEffect(() => { loadKpis(); }, [loadKpis]);

  // Save profile
  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      setProfileMsg({ type: "success", text: L.saved });
      onProfileUpdated?.();
    } catch (e) {
      setProfileMsg({ type: "error", text: e instanceof Error ? e.message : "Error" });
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  // Change password
  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", text: L.passwordMismatch });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error === "Current password is incorrect" ? L.wrongPassword : d.error || "Failed");
      }
      setPwMsg({ type: "success", text: L.passwordChanged });
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      setPwMsg({ type: "error", text: e instanceof Error ? e.message : "Error" });
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMsg(null), 4000);
    }
  };

  // Add manual KPI
  const addManualKpi = async () => {
    if (!newKpi.kpi_name.trim()) return;
    try {
      await fetch("/api/personal-kpis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...newKpi, period: currentPeriod, kpi_type: "manual" }),
      });
      setAddingKpi(false);
      setNewKpi({ kpi_name: "", target_value: 0, unit: "count", category: "general", weight: 1 });
      loadKpis();
    } catch {}
  };

  // Update KPI actual value
  const updateKpiActual = async (id: string, actual_value: number) => {
    try {
      await fetch("/api/personal-kpis", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, actual_value }),
      });
      loadKpis();
    } catch {}
  };

  // Delete KPI
  const deleteKpi = async (id: string) => {
    if (!confirm(L.deleteConfirm)) return;
    try {
      await fetch(`/api/personal-kpis?id=${id}`, { method: "DELETE" });
      loadKpis();
    } catch {}
  };

  // Manager score update
  const updateManagerScore = async (id: string, manager_score: number, manager_comment?: string) => {
    try {
      await fetch("/api/personal-kpis", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, manager_score, manager_comment }),
      });
      loadKpis();
    } catch {}
  };

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#003087] outline-none transition bg-white text-gray-800";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  const autoKpiItems = [
    { key: "tasks_completed", label: L.tasksCompleted, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { key: "task_completion_rate", label: L.taskCompletion, icon: Target, color: "text-blue-600", bg: "bg-blue-50", unit: "%" },
    { key: "hours_logged", label: L.hoursLogged, icon: Clock, color: "text-purple-600", bg: "bg-purple-50", unit: L.hours },
    { key: "deals_closed", label: L.dealsClosed, icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50" },
    { key: "deal_revenue", label: L.dealRevenue, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", unit: "฿" },
  ];

  // Overall manual KPI score
  const totalWeight = manualKpis.reduce((s, k) => s + (Number(k.weight) || 1), 0);
  const weightedScore = manualKpis.reduce((s, k) => {
    const target = Number(k.target_value) || 1;
    const actual = Number(k.actual_value) || 0;
    const pct = Math.min((actual / target) * 100, 150);
    return s + pct * ((Number(k.weight) || 1) / (totalWeight || 1));
  }, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{ background: "linear-gradient(135deg,#003087,#00AEEF)" }}>
          {(currentUser?.display_name ?? "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{L.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">@{currentUser?.username}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#003087]">
              {L[currentUser?.role ?? "member"] ?? currentUser?.role}
            </span>
            {currentUser?.department && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
                {currentUser.department}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Work Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: L.tasksInProgress, value: workStats.tasksInProgress, icon: ListTodo, color: "text-blue-600", bg: "bg-blue-50" },
          { label: L.tasksCompleted, value: workStats.tasksCompleted, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: L.hoursThisMonth, value: workStats.hoursThisMonth, icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
          { label: L.projectsActive, value: workStats.projectsActive, icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center`}>
                <card.icon size={16} className={card.color} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800">{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <User size={18} className="text-[#003087]" />
          <h2 className="text-base font-semibold text-gray-800">{L.personalInfo}</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{L.displayName} *</label>
              <input className={inputCls} value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>{L.username}</label>
              <input className={inputCls + " bg-gray-50 cursor-not-allowed"} value={currentUser?.username ?? ""} disabled />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{L.displayNameTh}</label>
              <input className={inputCls} value={form.display_name_th} onChange={e => setForm(f => ({ ...f, display_name_th: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>{L.displayNameJp}</label>
              <input className={inputCls} value={form.display_name_jp} onChange={e => setForm(f => ({ ...f, display_name_jp: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}><Mail size={12} className="inline mr-1" />{L.email}</label>
              <input type="email" className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}><Phone size={12} className="inline mr-1" />{L.phone}</label>
              <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="08X-XXX-XXXX" />
            </div>
          </div>
          {profileMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${profileMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {profileMsg.type === "success" ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {profileMsg.text}
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={saveProfile} disabled={profileSaving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50" style={{ background: "linear-gradient(135deg,#003087,#0050B3)" }}>
              {profileSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {profileSaving ? L.saving : L.save}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <button onClick={() => setPwOpen(!pwOpen)} className="w-full px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-[#003087]" />
            <h2 className="text-base font-semibold text-gray-800">{L.changePassword}</h2>
          </div>
          {pwOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {pwOpen && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            <div>
              <label className={labelCls}>{L.oldPassword}</label>
              <div className="relative">
                <input type={showOld ? "text" : "password"} className={inputCls + " pr-10"} value={pwForm.oldPassword} onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))} />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{L.newPassword}</label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} className={inputCls + " pr-10"} value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>{L.confirmPassword}</label>
                <input type={showNew ? "text" : "password"} className={inputCls} value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              </div>
            </div>
            {pwMsg && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${pwMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {pwMsg.type === "success" ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {pwMsg.text}
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={changePassword} disabled={pwSaving || !pwForm.oldPassword || !pwForm.newPassword} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50" style={{ background: "linear-gradient(135deg,#003087,#0050B3)" }}>
                {pwSaving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                {pwSaving ? L.saving : L.changePassword}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <button onClick={() => setKpiOpen(!kpiOpen)} className="w-full px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-[#003087]" />
            <h2 className="text-base font-semibold text-gray-800">{L.personalKpi}</h2>
            {manualKpis.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#003087]">
                {Math.round(weightedScore)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input type="month" value={currentPeriod} onChange={e => setCurrentPeriod(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600" onClick={e => e.stopPropagation()} />
            {kpiOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
        </button>
        {kpiOpen && (
          <div className="px-5 pb-5 space-y-5 border-t border-gray-100 pt-4">
            {/* Auto KPIs */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                <TrendingUp size={14} /> {L.autoKpi}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {autoKpiItems.map(item => (
                  <div key={item.key} className={`${item.bg} rounded-xl p-3 text-center`}>
                    <item.icon size={18} className={`${item.color} mx-auto mb-1`} />
                    <div className={`text-xl font-bold ${item.color}`}>
                      {item.unit === "฿" ? (autoKpi[item.key] || 0).toLocaleString() : (autoKpi[item.key] || 0)}
                      {item.unit && item.unit !== "฿" && <span className="text-xs ml-0.5">{item.unit}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual KPIs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Target size={14} /> {L.manualKpi}
                </h3>
                {isManagerOrAdmin && (
                  <button onClick={() => setAddingKpi(!addingKpi)} className="flex items-center gap-1 text-xs text-[#003087] hover:text-blue-700 font-medium">
                    <Plus size={14} /> {L.addKpi}
                  </button>
                )}
              </div>

              {/* Add KPI form */}
              {addingKpi && (
                <div className="bg-blue-50 rounded-xl p-4 mb-3 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className={labelCls}>{L.kpiName}</label>
                      <input className={inputCls} value={newKpi.kpi_name} onChange={e => setNewKpi(k => ({ ...k, kpi_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelCls}>{L.target}</label>
                      <input type="number" className={inputCls} value={newKpi.target_value} onChange={e => setNewKpi(k => ({ ...k, target_value: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className={labelCls}>{L.weight}</label>
                      <input type="number" min={1} max={5} className={inputCls} value={newKpi.weight} onChange={e => setNewKpi(k => ({ ...k, weight: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{L.unit}</label>
                      <select className={inputCls} value={newKpi.unit} onChange={e => setNewKpi(k => ({ ...k, unit: e.target.value }))}>
                        {UNITS.map(u => <option key={u} value={u}>{L[u] || u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>{L.category}</label>
                      <select className={inputCls} value={newKpi.category} onChange={e => setNewKpi(k => ({ ...k, category: e.target.value }))}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{L[c] || c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setAddingKpi(false)} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                      {lang === "th" ? "ยกเลิก" : lang === "jp" ? "キャンセル" : "Cancel"}
                    </button>
                    <button onClick={addManualKpi} className="px-4 py-1.5 text-sm text-white rounded-lg" style={{ background: "linear-gradient(135deg,#003087,#0050B3)" }}>
                      {L.save}
                    </button>
                  </div>
                </div>
              )}

              {/* KPI list */}
              {manualKpis.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-6">{L.noKpi}</div>
              ) : (
                <div className="space-y-2">
                  {manualKpis.map((kpi) => {
                    const target = Number(kpi.target_value) || 1;
                    const actual = Number(kpi.actual_value) || 0;
                    const pct = Math.min(Math.round((actual / target) * 100), 150);
                    const barColor = pct >= 100 ? "#10B981" : pct >= 70 ? "#F59E0B" : "#EF4444";
                    return (
                      <div key={kpi.id as string} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-sm font-medium text-gray-800">{kpi.kpi_name as string}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{L[kpi.category as string] || kpi.category as string}</span>
                              <span className="text-xs text-gray-400">{L.weight}: {kpi.weight as number}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold" style={{ color: barColor }}>{pct}%</span>
                            {isManagerOrAdmin && (
                              <button onClick={() => deleteKpi(kpi.id as string)} className="text-gray-300 hover:text-red-500 transition">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            <span>{L.actual}: <input type="number" className="w-16 px-1 py-0.5 border border-gray-200 rounded text-center text-xs" value={actual} onChange={e => updateKpiActual(kpi.id as string, Number(e.target.value))} /></span>
                            <span>/ {L.target}: {target} {L[kpi.unit as string] || kpi.unit as string}</span>
                          </div>
                          {isManagerOrAdmin && (
                            <div className="flex items-center gap-1">
                              <Star size={12} className="text-yellow-500" />
                              <select className="text-xs border border-gray-200 rounded px-1 py-0.5" value={kpi.manager_score as number || ""} onChange={e => updateManagerScore(kpi.id as string, Number(e.target.value))}>
                                <option value="">{L.managerScore}</option>
                                {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* Overall score */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-600">{L.overallScore}:</span>
                    <span className="text-xl font-bold text-[#003087]">{Math.round(weightedScore)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
