"use client";
import { useState, useEffect, useCallback } from "react";
import {
  X, Mail, Phone, Briefcase, BarChart3, Clock, User, ChevronRight,
  TrendingUp, Target, Plus, Trash2, Star, CheckCircle2, Loader2,
} from "lucide-react";
import { InlineTranslateButton } from "./TranslateButton";

interface Props {
  open: boolean;
  onClose: () => void;
  memberId: string | null;
  lang?: string;
  currentUserId?: string;
  currentUserRole?: string;
  onNavigateProject?: (projectId: string) => void;
}

interface MemberProfile {
  id: string;
  user_id: string | null;
  first_name_th: string | null;
  first_name_en: string | null;
  last_name_th: string | null;
  last_name_en: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  position_id: string | null;
  positions?: { name_th: string | null; name_en: string | null; color: string | null } | null;
  hourly_rate: number | null;
  skills: string[] | null;
}

interface Allocation {
  id: string;
  project_id: string;
  allocation_pct: number;
  role_in_project: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  projects: { name_th: string | null; name_en: string | null; project_code: string | null; status: string } | null;
}

interface TaskInfo {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string;
  project_name?: string;
}

const UNITS = ["count", "percent", "hours", "baht", "deals"];
const CATEGORIES = ["task", "deal", "time", "quality", "general"];

const i18n: Record<string, Record<string, string>> = {
  profile: { th: "โปรไฟล์พนักงาน", en: "Employee Profile", jp: "従業員プロファイル" },
  personalInfo: { th: "ข้อมูลส่วนตัว", en: "Personal Info", jp: "個人情報" },
  myWork: { th: "งานของฉัน", en: "My Assignments", jp: "マイタスク" },
  kpi: { th: "KPI", en: "KPI", jp: "KPI" },
  position: { th: "ตำแหน่ง", en: "Position", jp: "役職" },
  department: { th: "แผนก", en: "Department", jp: "部署" },
  email: { th: "อีเมล", en: "Email", jp: "メール" },
  phone: { th: "โทรศัพท์", en: "Phone", jp: "電話" },
  skills: { th: "ทักษะ", en: "Skills", jp: "スキル" },
  workload: { th: "โหลดงาน", en: "Workload", jp: "作業負荷" },
  projects: { th: "โปรเจค", en: "Projects", jp: "プロジェクト" },
  tasks: { th: "งานที่รับผิดชอบ", en: "Assigned Tasks", jp: "担当タスク" },
  noData: { th: "ไม่มีข้อมูล", en: "No data", jp: "データなし" },
  role: { th: "บทบาท", en: "Role", jp: "役割" },
  allocation: { th: "สัดส่วน", en: "Allocation", jp: "配分" },
  active: { th: "กำลังดำเนินการ", en: "Active", jp: "進行中" },
  // KPI i18n
  autoKpi: { th: "KPI อัตโนมัติ (จากระบบ)", en: "Auto KPI (from system)", jp: "自動KPI（システム）" },
  manualKpi: { th: "KPI ที่กำหนด", en: "Assigned KPI", jp: "設定KPI" },
  addKpi: { th: "เพิ่ม KPI", en: "Add KPI", jp: "KPI追加" },
  kpiName: { th: "ชื่อ KPI", en: "KPI Name", jp: "KPI名" },
  target: { th: "เป้าหมาย", en: "Target", jp: "目標" },
  actual: { th: "ผลจริง", en: "Actual", jp: "実績" },
  weight: { th: "น้ำหนัก", en: "Weight", jp: "重み" },
  unit: { th: "หน่วย", en: "Unit", jp: "単位" },
  category: { th: "หมวด", en: "Category", jp: "カテゴリ" },
  overallScore: { th: "คะแนนรวม", en: "Overall Score", jp: "総合スコア" },
  managerScore: { th: "คะแนนจากหัวหน้า", en: "Manager Score", jp: "上司評価" },
  noKpi: { th: "ยังไม่มี KPI สำหรับเดือนนี้", en: "No KPIs for this period yet", jp: "この期間のKPIはありません" },
  tasksCompleted: { th: "งานที่เสร็จ", en: "Tasks Completed", jp: "完了タスク" },
  taskCompletion: { th: "อัตราสำเร็จงาน", en: "Task Completion Rate", jp: "タスク完了率" },
  hoursLogged: { th: "ชั่วโมงทำงาน", en: "Hours Logged", jp: "作業時間" },
  dealsClosed: { th: "ดีลที่ปิดได้", en: "Deals Closed", jp: "成約ディール" },
  dealRevenue: { th: "รายได้จากดีล", en: "Deal Revenue", jp: "ディール収益" },
  save: { th: "บันทึก", en: "Save", jp: "保存" },
  cancel: { th: "ยกเลิก", en: "Cancel", jp: "キャンセル" },
  loading: { th: "กำลังโหลด...", en: "Loading...", jp: "読み込み中..." },
  noLinkedUser: { th: "พนักงานนี้ยังไม่ได้ผูกบัญชีผู้ใช้", en: "This member has no linked user account", jp: "このメンバーにはリンクされたユーザーアカウントがありません" },
  deleteConfirm: { th: "ลบ KPI นี้?", en: "Delete this KPI?", jp: "このKPIを削除しますか？" },
  // Status translations
  todo: { th: "รอดำเนินการ", en: "Todo", jp: "未着手" },
  in_progress: { th: "กำลังดำเนินการ", en: "In Progress", jp: "進行中" },
  review: { th: "รอตรวจสอบ", en: "Review", jp: "レビュー" },
  done: { th: "เสร็จแล้ว", en: "Done", jp: "完了" },
  planning: { th: "วางแผน", en: "Planning", jp: "計画中" },
  on_hold: { th: "ระงับชั่วคราว", en: "On Hold", jp: "保留" },
  completed: { th: "เสร็จสมบูรณ์", en: "Completed", jp: "完了" },
  cancelled: { th: "ยกเลิก", en: "Cancelled", jp: "キャンセル" },
  count: { th: "จำนวน", en: "count", jp: "件" },
  percent: { th: "เปอร์เซ็นต์", en: "%", jp: "%" },
  hours: { th: "ชั่วโมง", en: "hrs", jp: "時間" },
  baht: { th: "บาท", en: "THB", jp: "バーツ" },
  deals: { th: "ดีล", en: "deals", jp: "件" },
  task: { th: "งาน", en: "Task", jp: "タスク" },
  deal: { th: "การขาย", en: "Sales", jp: "営業" },
  time: { th: "เวลา", en: "Time", jp: "時間" },
  quality: { th: "คุณภาพ", en: "Quality", jp: "品質" },
  general: { th: "ทั่วไป", en: "General", jp: "一般" },
};

export default function MemberProfileModal({ open, onClose, memberId, lang = "th", currentUserId, currentUserRole, onNavigateProject }: Props) {
  const L = (k: string) => i18n[k]?.[lang] ?? i18n[k]?.en ?? k;
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"info" | "work" | "kpi">("info");

  // Privacy: only admin/manager or the person themselves can see KPI & phone
  const isAdminManager = currentUserRole === "admin" || currentUserRole === "manager";
  const isSelf = !!(currentUserId && member?.user_id && currentUserId === member.user_id);
  const canViewPrivate = isAdminManager || isSelf;

  // KPI state
  const [kpiPeriod, setKpiPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [autoKpi, setAutoKpi] = useState<Record<string, number>>({});
  const [manualKpis, setManualKpis] = useState<Array<Record<string, unknown>>>([]);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [addingKpi, setAddingKpi] = useState(false);
  const [newKpi, setNewKpi] = useState({ kpi_name: "", target_value: 0, unit: "count", category: "general", weight: 1 });

  useEffect(() => {
    if (!open || !memberId) return;
    setTab("info");
    setAddingKpi(false);
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, memberId]);

  const fetchProfile = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${memberId}/profile`);
      if (res.ok) {
        const json = await res.json();
        setMember(json.member);
        setAllocations(json.allocations ?? []);
        setTasks(json.tasks ?? []);
      }
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    } finally {
      setLoading(false);
    }
  };

  // Load KPIs when tab switches to kpi or period changes
  const loadKpis = useCallback(async () => {
    if (!member?.user_id) return;
    setKpiLoading(true);
    try {
      const [autoRes, manualRes] = await Promise.all([
        fetch(`/api/personal-kpis/auto?user_id=${member.user_id}&period=${kpiPeriod}`),
        fetch(`/api/personal-kpis?user_id=${member.user_id}&period=${kpiPeriod}`),
      ]);
      if (autoRes.ok) {
        const autoData = await autoRes.json();
        setAutoKpi(autoData.metrics || {});
      }
      if (manualRes.ok) {
        const manualData = await manualRes.json();
        setManualKpis(Array.isArray(manualData) ? manualData : []);
      }
    } catch (e) {
      console.error("Failed to load KPIs:", e);
    } finally {
      setKpiLoading(false);
    }
  }, [member?.user_id, kpiPeriod]);

  useEffect(() => {
    if (tab === "kpi" && member?.user_id) {
      loadKpis();
    }
  }, [tab, loadKpis, member?.user_id]);

  // Add manual KPI
  const addManualKpi = async () => {
    if (!newKpi.kpi_name.trim() || !member?.user_id) return;
    try {
      await fetch("/api/personal-kpis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...newKpi, user_id: member.user_id, period: kpiPeriod, kpi_type: "manual" }),
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
    if (!confirm(L("deleteConfirm"))) return;
    try {
      await fetch(`/api/personal-kpis?id=${id}`, { method: "DELETE" });
      loadKpis();
    } catch {}
  };

  // Manager score update
  const updateManagerScore = async (id: string, manager_score: number) => {
    try {
      await fetch("/api/personal-kpis", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, manager_score }),
      });
      loadKpis();
    } catch {}
  };

  if (!open) return null;

  const name = member
    ? (lang === "th"
      ? [member.first_name_th, member.last_name_th].filter(Boolean).join(" ")
      : [member.first_name_en, member.last_name_en].filter(Boolean).join(" "))
    || [member.first_name_en, member.last_name_en].filter(Boolean).join(" ")
    : "";

  const posName = member?.positions
    ? (lang === "th" ? member.positions.name_th : member.positions.name_en) || member.positions.name_en || ""
    : "";

  const totalAlloc = allocations.filter(a => a.is_active).reduce((s, a) => s + a.allocation_pct, 0);
  const allocColor = totalAlloc > 100 ? "#EF4444" : totalAlloc > 80 ? "#F7941D" : "#10B981";

  const initials = name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "??";

  const statusColors: Record<string, string> = {
    todo: "#94A3B8", in_progress: "#6366F1", review: "#F59E0B", done: "#10B981",
    planning: "#94A3B8", active: "#003087", on_hold: "#F59E0B", completed: "#10B981",
  };

  // KPI calculations
  const totalWeight = manualKpis.reduce((s, k) => s + (Number(k.weight) || 1), 0);
  const weightedScore = manualKpis.reduce((s, k) => {
    const target = Number(k.target_value) || 1;
    const actual = Number(k.actual_value) || 0;
    const pct = Math.min((actual / target) * 100, 150);
    return s + pct * ((Number(k.weight) || 1) / (totalWeight || 1));
  }, 0);

  const autoKpiItems = [
    { key: "tasks_completed", label: L("tasksCompleted"), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { key: "task_completion_rate", label: L("taskCompletion"), icon: Target, color: "text-blue-600", bg: "bg-blue-50", unit: "%" },
    { key: "hours_logged", label: L("hoursLogged"), icon: Clock, color: "text-purple-600", bg: "bg-purple-50", unit: L("hours") },
    { key: "deals_closed", label: L("dealsClosed"), icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50" },
    { key: "deal_revenue", label: L("dealRevenue"), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", unit: "฿" },
  ];

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-[#003087] outline-none transition bg-white text-gray-800";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[#E2E8F0]" style={{ background: "linear-gradient(135deg, #003087 0%, #00AEEF 100%)" }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white"><X size={20} /></button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-white text-xl font-bold">{initials}</div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{name || "..."}</h2>
              <p className="text-white/80 text-sm">{posName}</p>
              {member?.department && <p className="text-white/60 text-xs mt-0.5">{member.department}</p>}
            </div>
          </div>
          {/* Workload badge */}
          <div className="absolute bottom-4 right-6 bg-white/20 rounded-lg px-3 py-1.5 text-white text-sm">
            {L("workload")}: <span className="font-bold" style={{ color: totalAlloc > 100 ? "#FCA5A5" : "#A7F3D0" }}>{totalAlloc}%</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E2E8F0]">
          {(["info", "work", ...(canViewPrivate ? ["kpi" as const] : [])] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium ${tab === t ? "text-[#003087] border-b-2 border-[#003087]" : "text-gray-500"}`}>
              {t === "info" ? L("personalInfo") : t === "work" ? L("myWork") : L("kpi")}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 200px)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">{L("loading")}</div>
          ) : tab === "info" ? (
            <div className="p-6 space-y-4">
              {/* Info rows */}
              {[
                { icon: Briefcase, label: L("position"), value: posName },
                { icon: User, label: L("department"), value: member?.department || "-" },
                { icon: Mail, label: L("email"), value: member?.email || "-" },
                ...(canViewPrivate ? [{ icon: Phone, label: L("phone"), value: member?.phone || "-" }] : []),
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="w-9 h-9 rounded-lg bg-[#003087]/10 flex items-center justify-center">
                    <row.icon size={16} className="text-[#003087]" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{row.label}</div>
                    <div className="text-sm font-medium text-gray-800">{row.value}</div>
                  </div>
                </div>
              ))}

              {/* Skills */}
              {member?.skills && member.skills.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className="text-xs text-gray-500 mb-2">{L("skills")}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#003087]/10 text-[#003087]">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Workload summary */}
              <div className="p-4 rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{L("workload")}</span>
                  <span className="text-sm font-bold" style={{ color: allocColor }}>{totalAlloc}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(totalAlloc, 100)}%`, background: allocColor }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{allocations.filter(a => a.is_active).length} {L("projects")} {L("active")}</div>
              </div>
            </div>
          ) : tab === "work" ? (
            <div className="p-6 space-y-4">
              {/* Active Allocations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#003087]" /> {L("projects")} ({allocations.filter(a => a.is_active).length})
                </h3>
                {allocations.filter(a => a.is_active).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">{L("noData")}</p>
                ) : (
                  <div className="space-y-2">
                    {allocations.filter(a => a.is_active).map(alloc => {
                      const pName = alloc.projects
                        ? (alloc.projects.project_code ? `[${alloc.projects.project_code}] ` : "") +
                          (lang === "th" ? alloc.projects.name_th || alloc.projects.name_en : alloc.projects.name_en || alloc.projects.name_th) || ""
                        : alloc.project_id.slice(0, 8);
                      return (
                        <div key={alloc.id}
                          className="p-3 rounded-xl border border-[#E2E8F0] hover:border-[#003087]/30 cursor-pointer transition-colors"
                          onClick={() => onNavigateProject?.(alloc.project_id)}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{pName}</div>
                              <div className="flex items-center gap-3 mt-1">
                                {alloc.role_in_project && (
                                  <span className="text-xs text-gray-500">{L("role")}: {alloc.role_in_project}</span>
                                )}
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                  background: `${statusColors[alloc.projects?.status || "active"] || "#94A3B8"}20`,
                                  color: statusColors[alloc.projects?.status || "active"] || "#94A3B8",
                                }}>{L(alloc.projects?.status || "active") || alloc.projects?.status || "active"}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-sm font-bold" style={{ color: alloc.allocation_pct > 50 ? "#003087" : "#94A3B8" }}>
                                  {alloc.allocation_pct}%
                                </div>
                              </div>
                              <ChevronRight size={14} className="text-gray-300" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-[#F7941D]" /> {L("tasks")} ({tasks.length})
                </h3>
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">{L("noData")}</p>
                ) : (
                  <div className="space-y-1.5">
                    {tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50">
                        <div className="w-2 h-2 rounded-full" style={{ background: statusColors[task.status] || "#94A3B8" }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-800 truncate">{task.title}</div>
                          {task.project_name && <div className="text-xs text-gray-400">{task.project_name}</div>}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: `${statusColors[task.status] || "#94A3B8"}20`,
                          color: statusColors[task.status] || "#94A3B8",
                        }}>{L(task.status) || task.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* KPI Tab */
            <div className="p-6 space-y-5">
              {/* Period selector */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#003087]" /> {L("kpi")}
                  {manualKpis.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#003087]">
                      {Math.round(weightedScore)}%
                    </span>
                  )}
                </h3>
                <input
                  type="month"
                  value={kpiPeriod}
                  onChange={e => setKpiPeriod(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600"
                />
              </div>

              {kpiLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" /> {L("loading")}
                </div>
              ) : !member?.user_id ? (
                <div className="text-center text-sm text-gray-400 py-8">
                  {L("noLinkedUser")}
                </div>
              ) : (
                <>
                  {/* Auto KPIs */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                      <TrendingUp size={13} /> {L("autoKpi")}
                    </h4>
                    <div className="grid grid-cols-5 gap-2">
                      {autoKpiItems.map(item => (
                        <div key={item.key} className={`${item.bg} rounded-xl p-2.5 text-center`}>
                          <item.icon size={16} className={`${item.color} mx-auto mb-1`} />
                          <div className={`text-lg font-bold ${item.color}`}>
                            {item.unit === "฿" ? (autoKpi[item.key] || 0).toLocaleString() : (autoKpi[item.key] || 0)}
                            {item.unit && item.unit !== "฿" && <span className="text-[10px] ml-0.5">{item.unit}</span>}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manual KPIs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                        <Target size={13} /> {L("manualKpi")}
                      </h4>
                      {isAdminManager && (
                        <button onClick={() => setAddingKpi(!addingKpi)} className="flex items-center gap-1 text-xs text-[#003087] hover:text-blue-700 font-medium">
                          <Plus size={14} /> {L("addKpi")}
                        </button>
                      )}
                    </div>

                    {/* Add KPI form */}
                    {addingKpi && (
                      <div className="bg-blue-50 rounded-xl p-4 mb-3 space-y-3">
                        <div className="grid grid-cols-4 gap-3">
                          <div className="col-span-2">
                            <label className={labelCls}>{L("kpiName")}</label>
                            <input className={inputCls} value={newKpi.kpi_name} onChange={e => setNewKpi(k => ({ ...k, kpi_name: e.target.value }))} />
                          </div>
                          <div>
                            <label className={labelCls}>{L("target")}</label>
                            <input type="number" className={inputCls} value={newKpi.target_value} onChange={e => setNewKpi(k => ({ ...k, target_value: Number(e.target.value) }))} />
                          </div>
                          <div>
                            <label className={labelCls}>{L("weight")}</label>
                            <input type="number" min={1} max={5} className={inputCls} value={newKpi.weight} onChange={e => setNewKpi(k => ({ ...k, weight: Number(e.target.value) }))} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>{L("unit")}</label>
                            <select className={inputCls} value={newKpi.unit} onChange={e => setNewKpi(k => ({ ...k, unit: e.target.value }))}>
                              {UNITS.map(u => <option key={u} value={u}>{L(u)}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>{L("category")}</label>
                            <select className={inputCls} value={newKpi.category} onChange={e => setNewKpi(k => ({ ...k, category: e.target.value }))}>
                              {CATEGORIES.map(c => <option key={c} value={c}>{L(c)}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setAddingKpi(false)} className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                            {L("cancel")}
                          </button>
                          <button onClick={addManualKpi} className="px-4 py-1.5 text-sm text-white rounded-lg" style={{ background: "linear-gradient(135deg,#003087,#0050B3)" }}>
                            {L("save")}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* KPI list */}
                    {manualKpis.length === 0 ? (
                      <div className="text-center text-sm text-gray-400 py-6">{L("noKpi")}</div>
                    ) : (
                      <div className="space-y-2">
                        {manualKpis.map((kpi) => {
                          const target = Number(kpi.target_value) || 1;
                          const actual = Number(kpi.actual_value) || 0;
                          const pct = Math.min(Math.round((actual / target) * 100), 150);
                          const barColor = pct >= 100 ? "#10B981" : pct >= 70 ? "#F59E0B" : "#EF4444";
                          return (
                            <div key={kpi.id as string} className="bg-gray-50 rounded-xl p-3.5">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-gray-800">{kpi.kpi_name as string}</span>
                                    <InlineTranslateButton text={kpi.kpi_name as string} />
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{L(kpi.category as string)}</span>
                                    <span className="text-xs text-gray-400">{L("weight")}: {kpi.weight as number}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold" style={{ color: barColor }}>{pct}%</span>
                                  {isAdminManager && (
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
                                  <span>{L("actual")}: {(isSelf || isAdminManager) ? (
                                    <input type="number" className="w-16 px-1 py-0.5 border border-gray-200 rounded text-center text-xs" value={actual} onChange={e => updateKpiActual(kpi.id as string, Number(e.target.value))} />
                                  ) : (
                                    <span className="font-medium">{actual}</span>
                                  )}</span>
                                  <span>/ {L("target")}: {target} {L(kpi.unit as string)}</span>
                                </div>
                                {isAdminManager && (
                                  <div className="flex items-center gap-1">
                                    <Star size={12} className="text-yellow-500" />
                                    <select className="text-xs border border-gray-200 rounded px-1 py-0.5" value={kpi.manager_score as number || ""} onChange={e => updateManagerScore(kpi.id as string, Number(e.target.value))}>
                                      <option value="">{L("managerScore")}</option>
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
                          <span className="text-sm font-medium text-gray-600">{L("overallScore")}:</span>
                          <span className="text-xl font-bold text-[#003087]">{Math.round(weightedScore)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
