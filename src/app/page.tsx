"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import {
  LayoutDashboard, FolderKanban, ListTodo, Users, Clock, DollarSign,
  BarChart3, Settings, ChevronLeft, ChevronRight, ChevronDown, Plus, Search,
  Calendar, TrendingUp, Briefcase, CheckCircle2, AlertCircle,
  Edit3, Trash2, Eye, Download, Sun, Moon, Activity, Target,
  UserCog, LogOut, UserPlus, Flame, CheckCheck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend,
} from "recharts";
import { translations, type Lang } from "@/lib/i18n";
import { monthlyCostData } from "@/lib/mockData";
import { useData, type DBProject, type DBTask, type DBMember, type DBPosition } from "@/lib/useData";
import ProjectModal from "@/components/modals/ProjectModal";
import TaskModal from "@/components/modals/TaskModal";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";
import KanbanBoard from "@/components/KanbanBoard";
import MyTasks from "@/components/MyTasks";
import FloatingTimer from "@/components/FloatingTimer";
import GanttChart from "@/components/GanttChart";
import { Inbox, GanttChart as GanttIcon, Flag, CalendarDays, Zap, NotebookPen, ShieldAlert, Bug, GitPullRequest, Lightbulb, FileStack, Repeat, Receipt, Wallet, Link2 } from "lucide-react";
import MilestonesPanel from "@/components/MilestonesPanel";
import CalendarView from "@/components/CalendarView";
import SprintPanel from "@/components/SprintPanel";
import MeetingNotesPanel from "@/components/MeetingNotesPanel";
import DailyStandupCard from "@/components/DailyStandupCard";
import NotificationBell from "@/components/NotificationBell";
import RisksPanel from "@/components/RisksPanel";
import IssuesPanel from "@/components/IssuesPanel";
import ChangeRequestsPanel from "@/components/ChangeRequestsPanel";
import DecisionLogPanel from "@/components/DecisionLogPanel";
import TemplatesPanel from "@/components/TemplatesPanel";
import RecurringTasksPanel from "@/components/RecurringTasksPanel";
import InvoicesPanel from "@/components/InvoicesPanel";
import FinancePanel from "@/components/FinancePanel";
import ClientPortalPanel from "@/components/ClientPortalPanel";
import CommandPalette, { type CommandItem } from "@/components/CommandPalette";
import ShortcutsHelp from "@/components/ShortcutsHelp";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import MemberModal from "@/components/modals/MemberModal";
import PositionModal from "@/components/modals/PositionModal";
import TimeLogModal from "@/components/modals/TimeLogModal";
import AllocationManager from "@/components/AllocationManager";
import WorkloadHeatmap from "@/components/WorkloadHeatmap";
import TimeLogApproval from "@/components/TimeLogApproval";
import ManpowerReport from "@/components/ManpowerReport";

// Helpers
const fmt = (n: number) => `฿${n.toLocaleString()}`;
const statusColor: Record<string, string> = {
  planning: "#6B7280", in_progress: "#003087", on_hold: "#F7941D",
  completed: "#10B981", cancelled: "#EF4444", backlog: "#9CA3AF",
  todo: "#6366F1", review: "#F59E0B", done: "#10B981",
};
const prioColor: Record<string, string> = {
  low: "#10B981", medium: "#F7941D", high: "#EF4444", urgent: "#DC2626",
};
const COLORS = ["#003087", "#F7941D", "#00AEEF", "#10B981", "#6366F1", "#EF4444", "#8B5CF6"];

export default function App() {
  const router = useRouter();
  const { user: currentUser, isAdmin, logout, hasPermission, canView, canCreate, canDelete, moduleLevel } = useAuth();
  void canCreate; void canDelete; void moduleLevel;
  const data = useData();
  // Aliases so existing UI code keeps working (legacy mockData shape)
  const mockPositions = data.adaptedPositions;
  const mockMembers = data.adaptedMembers;
  const mockProjects = data.adaptedProjects;
  const mockTimeLogs = data.adaptedTimelogs;
  const tasks = data.adaptedTasks;
  const [lang, setLang] = useState<Lang>("th");
  const [page, setPage] = useState("dashboard");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (k: string) => setCollapsedGroups(s => ({ ...s, [k]: !s[k] }));

  // Modal state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<DBProject | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DBTask | null>(null);
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [boardRefreshKey, setBoardRefreshKey] = useState(0);
  const [ganttProjectId, setGanttProjectId] = useState<string>("");
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DBMember | null>(null);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<DBPosition | null>(null);
  const [timelogModalOpen, setTimelogModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const openAddProject = () => { setEditingProject(null); setProjectModalOpen(true); };
  const openEditProject = (id: string) => {
    const p = data.projects.find(x => x.id === id) ?? null;
    setEditingProject(p); setProjectModalOpen(true);
  };
  const openAddTask = () => { setEditingTask(null); setTaskModalOpen(true); };
  const openAddMember = () => { setEditingMember(null); setMemberModalOpen(true); };
  const openEditMember = (id: string) => {
    const m = data.members.find(x => x.id === id) ?? null;
    setEditingMember(m); setMemberModalOpen(true);
  };
  const openAddPosition = () => { setEditingPosition(null); setPositionModalOpen(true); };
  const openEditPosition = (id: string) => {
    const p = data.positions.find(x => x.id === id) ?? null;
    setEditingPosition(p); setPositionModalOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("ลบโครงการนี้ใช่หรือไม่?")) return;
    try { await data.deleteProject(id); } catch (e) { alert(e instanceof Error ? e.message : "Delete failed"); }
  };
  const handleDeleteMember = async (id: string) => {
    if (!confirm("ลบสมาชิกนี้ใช่หรือไม่? (soft delete)")) return;
    try { await data.deleteMember(id); } catch (e) { alert(e instanceof Error ? e.message : "Delete failed"); }
  };
  const handleDeletePosition = async (id: string) => {
    if (!confirm("ลบตำแหน่งนี้ใช่หรือไม่? (soft delete)")) return;
    try { await data.deletePosition(id); } catch (e) { alert(e instanceof Error ? e.message : "Delete failed"); }
  };
  const [taskFilter, setTaskFilter] = useState("all");
  const [teamTab, setTeamTab] = useState("members");
  const [projFilter, setProjFilter] = useState("all");

  const t = translations[lang];
  const getName = useCallback((item: Record<string, unknown>, f = "name") => {
    const k = lang === "th" ? `${f}_th` : lang === "jp" ? `${f}_jp` : `${f}_en`;
    return (item[k] as string) || (item[`${f}_en`] as string) || "";
  }, [lang]);
  const getPos = useCallback((pid: string) => mockPositions.find(p => p.id === pid), [mockPositions]);

  const approvedLogs = useMemo(() => mockTimeLogs.filter(l => l.status === "approved"), [mockTimeLogs]);
  const totalCost = useMemo(() => approvedLogs.reduce((s, l) => s + l.hours * l.rate, 0), [approvedLogs]);
  const totalHrs = useMemo(() => Math.round(approvedLogs.reduce((s, l) => s + l.hours, 0) * 10) / 10, [approvedLogs]);

  const costByProject = useMemo(() => mockProjects.map(p => ({
    name: getName(p).substring(0, 18), cost: approvedLogs.filter(l => l.project_id === p.id).reduce((s, l) => s + l.hours * l.rate, 0), budget: p.budget,
  })).filter(d => d.cost > 0), [approvedLogs, getName, mockProjects]);

  const costByPos = useMemo(() => {
    const m: Record<string, number> = {};
    approvedLogs.forEach(l => {
      const mem = mockMembers.find(x => x.id === l.member_id);
      if (mem) { const pos = getPos(mem.position_id); const n = pos ? getName(pos) : "Other"; m[n] = (m[n] || 0) + l.hours * l.rate; }
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [approvedLogs, getPos, getName, mockMembers]);

  const taskStats = useMemo(() => {
    const s: Record<string, number> = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
    tasks.forEach(tk => { if (s[tk.status] !== undefined) s[tk.status]++; });
    return Object.entries(s).map(([k, value]) => ({ name: t[k] || k, value, fill: statusColor[k] || "#6B7280" }));
  }, [tasks, t]);

  const tipStyle = { background: "#1E293B", border: "none", borderRadius: 12, color: "#F8FAFC", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" };

  // ── Stat Card ──
  const Stat = ({ icon: I, label, value, sub, color = "#003087", trend }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; trend?: string }) => (
    <div className="bg-[#1E293B] rounded-2xl p-3 md:p-5 border border-[#334155] hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}25` }}><I size={18} className="md:hidden" style={{ color }} /><I size={22} className="hidden md:block" style={{ color }} /></div>
        {trend && <span className="text-[10px] md:text-xs font-medium text-emerald-400 flex items-center gap-1"><TrendingUp size={12} />{trend}</span>}
      </div>
      <div className="mt-2 md:mt-3 text-lg md:text-2xl font-bold text-white truncate">{value}</div>
      <div className="text-xs md:text-sm text-slate-400 truncate">{label}</div>
      {sub && <div className="text-[10px] md:text-xs mt-0.5 md:mt-1 truncate" style={{ color }}>{sub}</div>}
    </div>
  );

  // ── Sidebar (grouped + filtered by granular per-module permissions) ──
  // module = key in permission_modules table; level 0 hides the menu entirely
  const allNav = [
    // Core / ภาพรวม
    { id: "dashboard", icon: LayoutDashboard, label: t.dashboard, module: "dashboard", group: "core" },
    { id: "mytasks", icon: Inbox, label: t.myTasks, module: "mytasks", group: "core" },
    // Planning / การวางแผน
    { id: "projects", icon: FolderKanban, label: t.projects, module: "projects", group: "planning" },
    { id: "tasks", icon: ListTodo, label: t.tasks, module: "tasks", group: "planning" },
    { id: "gantt", icon: GanttIcon, label: t.gantt, module: "gantt", group: "planning" },
    { id: "milestones", icon: Flag, label: t.milestones, module: "milestones", group: "planning" },
    { id: "calendar", icon: CalendarDays, label: t.calendar, module: "calendar", group: "planning" },
    { id: "sprint", icon: Zap, label: t.sprint, module: "sprint", group: "planning" },
    { id: "meetings", icon: NotebookPen, label: t.meetings, module: "meetings", group: "planning" },
    // Tracking / ติดตามและควบคุม
    { id: "risks", icon: ShieldAlert, label: t.risks, module: "risks", group: "tracking" },
    { id: "issues", icon: Bug, label: t.issues, module: "issues", group: "tracking" },
    { id: "changes", icon: GitPullRequest, label: t.changeRequests, module: "change_requests", group: "tracking" },
    { id: "decisions", icon: Lightbulb, label: t.decisions, module: "decisions", group: "tracking" },
    { id: "templates", icon: FileStack, label: t.templates, module: "templates", group: "tracking" },
    { id: "recurring", icon: Repeat, label: t.recurring, module: "recurring", group: "tracking" },
    // People / ทีมและทรัพยากร
    { id: "team", icon: Users, label: t.team, module: "team", group: "people" },
    { id: "allocation", icon: UserPlus, label: t.allocation, module: "allocation", group: "people" },
    { id: "workload", icon: Flame, label: t.workload, module: "workload", group: "people" },
    { id: "timelog", icon: Clock, label: t.timeLog, module: "timelog", group: "people" },
    { id: "approval", icon: CheckCheck, label: t.approval, module: "approval", group: "people" },
    { id: "manpower", icon: BarChart3, label: t.manpower, module: "manpower", group: "people" },
    // Finance / การเงิน
    { id: "invoices", icon: Receipt, label: t.invoices, module: "invoices", group: "finance" },
    { id: "finance", icon: Wallet, label: t.finance, module: "finance", group: "finance" },
    { id: "costs", icon: DollarSign, label: t.costs, module: "costs", group: "finance" },
    { id: "client_portal", icon: Link2, label: t.clientPortal, module: "client_portal", group: "finance" },
    // Reports & Admin
    { id: "reports", icon: BarChart3, label: t.reports, module: "reports", group: "reports" },
    { id: "settings", icon: Settings, label: t.settings, module: "settings", group: "admin" },
  ];
  const nav = allNav.filter(n => canView(n.module));

  // Group definitions for sidebar (label by language + display order)
  const NAV_GROUPS: { key: string; label: string; }[] = [
    { key: "core",     label: lang === "en" ? "Overview"   : lang === "jp" ? "概要"       : "ภาพรวม" },
    { key: "planning", label: lang === "en" ? "Planning"   : lang === "jp" ? "計画"       : "การวางแผน" },
    { key: "tracking", label: lang === "en" ? "Tracking"   : lang === "jp" ? "追跡"       : "ติดตาม & ควบคุม" },
    { key: "people",   label: lang === "en" ? "Team"       : lang === "jp" ? "チーム"     : "ทีม & เวลา" },
    { key: "finance",  label: lang === "en" ? "Finance"    : lang === "jp" ? "財務"       : "การเงิน" },
    { key: "reports",  label: lang === "en" ? "Reports"    : lang === "jp" ? "レポート"   : "รายงาน" },
    { key: "admin",    label: lang === "en" ? "System"     : lang === "jp" ? "システム"   : "ระบบ" },
  ];
  const groupedNav = NAV_GROUPS
    .map(g => ({ ...g, items: nav.filter(n => n.group === g.key) }))
    .filter(g => g.items.length > 0);

  // ── KEYBOARD SHORTCUTS ──
  useKeyboardShortcuts({
    onCommandPalette: () => setPaletteOpen(true),
    onHelp: () => setHelpOpen(true),
    onNewTask: () => { setEditingTask(null); setTaskModalOpen(true); },
    onEscape: () => {
      if (paletteOpen) setPaletteOpen(false);
      else if (helpOpen) setHelpOpen(false);
      else if (taskModalOpen) setTaskModalOpen(false);
      else if (projectModalOpen) setProjectModalOpen(false);
    },
    onGoto: (pageId) => setPage(pageId),
  });

  const paletteItems: CommandItem[] = [
    ...nav.map(n => ({
      id: `nav-${n.id}`, label: `ไปที่ ${n.label}`, group: "Navigation",
      keywords: n.id, action: () => setPage(n.id),
    })),
    { id: "new-task", label: "สร้างงานใหม่", hint: "เปิด Task Modal", group: "Actions", keywords: "task new add",
      action: () => { setEditingTask(null); setTaskModalOpen(true); } },
    ...(hasPermission("can_manage_projects") ? [{ id: "new-project", label: "สร้างโครงการใหม่", group: "Actions", keywords: "project new add",
      action: () => openAddProject() }] : []),
    { id: "show-help", label: "ดู Keyboard Shortcuts", group: "ช่วยเหลือ", keywords: "help shortcut keyboard",
      action: () => setHelpOpen(true) },
    ...data.projects.slice(0, 30).map(p => ({
      id: `proj-${p.id}`, label: `${p.project_code} — ${p.name_th || p.name_en}`,
      hint: "เปิดโครงการ", group: "Projects",
      keywords: `${p.project_code} ${p.name_th} ${p.name_en}`,
      action: () => { setTaskFilter(p.id); setPage("tasks"); },
    })),
  ];

  // ── DASHBOARD ──
  const Dashboard = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2 md:gap-3">
        <div><h1 className="text-lg md:text-2xl font-bold text-white">{t.welcome}, {currentUser?.display_name ?? "..."}!</h1>
          <p className="text-xs md:text-base text-slate-400">{t.overview} — {new Date().toLocaleDateString(lang === "th" ? "th-TH" : lang === "jp" ? "ja-JP" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p></div>
        {hasPermission("can_manage_projects") && <button onClick={openAddProject} className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-white text-xs md:text-sm font-medium flex items-center gap-1.5 md:gap-2" style={{ background: "#003087" }}><Plus size={14} />{t.addProject}</button>}
      </div>
      <DailyStandupCard lang={lang} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={FolderKanban} label={t.totalProjects} value={mockProjects.length} sub={`${mockProjects.filter(p => p.status === "in_progress").length} ${t.activeProjects}`} color="#003087" trend="+2" />
        <Stat icon={ListTodo} label={t.totalTasks} value={tasks.length} sub={`${tasks.filter(tk => tk.status === "done").length} ${t.completedTasks}`} color="#00AEEF" />
        {canView("costs")
          ? <Stat icon={DollarSign} label={t.totalCost} value={fmt(totalCost)} sub={`${totalHrs.toFixed(1)} ${t.hours}`} color="#F7941D" trend="+12%" />
          : <Stat icon={Clock} label={t.hours} value={totalHrs.toFixed(1)} sub={t.approval} color="#F7941D" />}
        <Stat icon={Users} label={t.teamMembers} value={mockMembers.length} sub={`${mockPositions.length} ${t.position}`} color="#10B981" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canView("costs") && (
          <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]"><h3 className="font-semibold text-white mb-4">{t.costByProject}</h3>
            <ResponsiveContainer width="100%" height={250}><BarChart data={costByProject}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} /><Tooltip contentStyle={tipStyle} /><Bar dataKey="cost" fill="#003087" radius={[8, 8, 0, 0]} name={t.cost} /><Bar dataKey="budget" fill="#F7941D" radius={[8, 8, 0, 0]} name={t.budget} opacity={0.4} /></BarChart></ResponsiveContainer></div>
        )}
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]"><h3 className="font-semibold text-white mb-4">{t.taskDistribution}</h3>
          <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={taskStats} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" label={({ name, value }: { name?: string; value: number }) => `${name || ''}: ${value}`}>{taskStats.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip contentStyle={tipStyle} /></PieChart></ResponsiveContainer></div>
        {canView("costs") && (
          <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]"><h3 className="font-semibold text-white mb-4">{t.monthlyCost}</h3>
            <ResponsiveContainer width="100%" height={250}><AreaChart data={monthlyCostData}><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#003087" stopOpacity={0.3} /><stop offset="95%" stopColor="#003087" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} /><Tooltip contentStyle={tipStyle} /><Area type="monotone" dataKey="cost" stroke="#003087" fill="url(#cg)" strokeWidth={2.5} name={t.cost} /></AreaChart></ResponsiveContainer></div>
        )}
        {canView("costs") && (
          <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]"><h3 className="font-semibold text-white mb-4">{t.costByPosition}</h3>
            <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={costByPos} cx="50%" cy="50%" outerRadius={95} paddingAngle={3} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>{costByPos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: unknown) => fmt(Number(v))} contentStyle={tipStyle} /></PieChart></ResponsiveContainer></div>
        )}
      </div>
    </div>
  );

  // ── PROJECTS ──
  const Projects = () => {
    const filtered = projFilter === "all" ? mockProjects : mockProjects.filter(p => p.status === projFilter);
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h1 className="text-lg md:text-2xl font-bold text-white">{t.projects}</h1>
          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto">
            <div className="flex rounded-xl overflow-hidden border border-[#334155] flex-shrink-0">
              {["all", "planning", "in_progress", "on_hold", "completed"].map(s => (
                <button key={s} onClick={() => setProjFilter(s)} className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-medium whitespace-nowrap ${projFilter === s ? "text-white" : "text-slate-400"}`} style={projFilter === s ? { background: "#003087" } : { background: "#0F172A" }}>{t[s]}</button>
              ))}
            </div>
            {hasPermission("can_manage_projects") && <button onClick={openAddProject} className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-white text-xs md:text-sm font-medium flex items-center gap-1.5 flex-shrink-0" style={{ background: "#003087" }}><Plus size={14} />{t.addProject}</button>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const pc = approvedLogs.filter(l => l.project_id === p.id).reduce((s, l) => s + l.hours * l.rate, 0);
            const ph = approvedLogs.filter(l => l.project_id === p.id).reduce((s, l) => s + l.hours, 0);
            const pt = tasks.filter(tk => tk.project_id === p.id); const dt = pt.filter(tk => tk.status === "done").length;
            const pct = p.budget > 0 ? (pc / p.budget) * 100 : 0;
            return (
              <div key={p.id} className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155] hover:shadow-xl transition-all cursor-pointer" onClick={() => { setPage("tasks"); setTaskFilter(p.id); }}>
                <div className="flex items-start justify-between mb-3">
                  <div><span className="text-xs font-mono text-slate-500">{p.code}</span><h3 className="font-semibold text-white mt-1">{getName(p)}</h3></div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ background: statusColor[p.status] }}>{t[p.status]}</span>
                    {hasPermission("can_manage_projects") && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEditProject(p.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Edit3 size={14} /></button>
                        {isAdmin && <button onClick={() => handleDeleteProject(p.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-red-400"><Trash2 size={14} /></button>}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-3">{t.client}: {p.client}</p>
                <div className="mb-3"><div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{t.progress}</span><span className="text-white font-semibold">{p.progress}%</span></div>
                  <div className="w-full h-2 rounded-full bg-slate-700"><div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.progress === 100 ? "#10B981" : "linear-gradient(90deg,#003087,#00AEEF)" }} /></div></div>
                <div className={`grid ${canView("costs") ? "grid-cols-3" : "grid-cols-2"} gap-2 mb-3`}>
                  <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.tasks}</div><div className="text-sm font-semibold text-white">{dt}/{pt.length}</div></div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.hours}</div><div className="text-sm font-semibold text-white">{ph.toFixed(1)}</div></div>
                  {canView("costs") && (
                    <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.cost}</div><div className="text-sm font-semibold text-[#F7941D]">{fmt(pc)}</div></div>
                  )}
                </div>
                {canView("costs") && (
                  <div className="mb-3"><div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{t.budget}: {fmt(p.budget)}</span><span style={{ color: pct > 80 ? "#EF4444" : "#10B981" }}>{pct.toFixed(0)}%</span></div>
                    <div className="w-full h-1.5 rounded-full bg-slate-700"><div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 80 ? "#EF4444" : "#F7941D" }} /></div></div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">{p.members.slice(0, 4).map(mId => { const mem = mockMembers.find(m => m.id === mId); return mem ? <div key={mId} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-[#1E293B]" style={{ background: getPos(mem.position_id)?.color || "#003087" }}>{mem.avatar}</div> : null; })}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400"><Calendar size={12} />{p.endDate}</div>
                </div>
                <div className="mt-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: prioColor[p.priority] }} /><span className="text-xs" style={{ color: prioColor[p.priority] }}>{t[p.priority]}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── MY TASKS ──
  const MyTasksPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">งานของฉัน</h1>
      </div>
      <MyTasks
        onTaskClick={(id) => setDrawerTaskId(id)}
        refreshKey={boardRefreshKey}
      />
    </div>
  );

  // ── GANTT ──
  const GanttPage = () => {
    const pid = ganttProjectId || data.projects[0]?.id || "";
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-white">Gantt Chart</h1>
          <select value={pid} onChange={e => setGanttProjectId(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-[#1E293B] text-white border border-[#334155] outline-none">
            {data.projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
          </select>
        </div>
        <GanttChart
          projectId={pid}
          onTaskClick={(id) => setDrawerTaskId(id)}
          refreshKey={boardRefreshKey}
        />
      </div>
    );
  };

  // ── MILESTONES ──
  const MilestonesPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Milestones</h1>
        <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm bg-[#1E293B] text-white border border-[#334155] outline-none">
          <option value="all">{t.all} {t.projects}</option>
          {data.projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
        </select>
      </div>
      <MilestonesPanel
        projects={data.projects}
        filterProjectId={taskFilter}
        canManage={hasPermission("can_manage_projects")}
        refreshKey={boardRefreshKey}
      />
    </div>
  );

  // ── CALENDAR ──
  const CalendarPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm bg-[#1E293B] text-white border border-[#334155] outline-none">
          <option value="all">{t.all} {t.projects}</option>
          {data.projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
        </select>
      </div>
      <CalendarView
        projects={data.projects}
        filterProjectId={taskFilter}
        onTaskClick={(id) => setDrawerTaskId(id)}
        refreshKey={boardRefreshKey}
      />
    </div>
  );

  // ── SPRINT ──
  const SprintPage = () => {
    const pid = ganttProjectId || data.projects[0]?.id || "";
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-white">Sprint Board</h1>
          <select value={pid} onChange={e => setGanttProjectId(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm bg-[#1E293B] text-white border border-[#334155] outline-none">
            {data.projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
          </select>
        </div>
        <SprintPanel
          projects={data.projects}
          filterProjectId={pid}
          onTaskClick={(id) => setDrawerTaskId(id)}
          canManage={hasPermission("can_manage_projects")}
          refreshKey={boardRefreshKey}
        />
      </div>
    );
  };

  // ── MEETINGS ──
  const MeetingsPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Meeting Notes</h1>
        <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm bg-[#1E293B] text-white border border-[#334155] outline-none">
          <option value="all">{t.all} {t.projects}</option>
          {data.projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
        </select>
      </div>
      <MeetingNotesPanel
        projects={data.projects}
        filterProjectId={taskFilter}
        canManage={hasPermission("can_manage_projects")}
        refreshKey={boardRefreshKey}
      />
    </div>
  );

  // ── RISKS / ISSUES / CHANGE REQUESTS / DECISIONS ──
  const ProjectFilterHeader = ({ title }: { title: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3">
      <h1 className="text-lg md:text-2xl font-bold text-white">{title}</h1>
      <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)}
        className="px-3 py-2 rounded-xl text-xs md:text-sm bg-[#1E293B] text-white border border-[#334155] outline-none w-full sm:w-auto">
        <option value="all">{t.all} {t.projects}</option>
        {data.projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
      </select>
    </div>
  );

  const RisksPage = () => (
    <div className="space-y-6">
      <ProjectFilterHeader title="Risk Register" />
      <RisksPanel projects={data.projects} members={data.members} filterProjectId={taskFilter}
        canManage={hasPermission("can_manage_projects")} refreshKey={boardRefreshKey} />
    </div>
  );
  const IssuesPage = () => (
    <div className="space-y-6">
      <ProjectFilterHeader title="Issue Log" />
      <IssuesPanel projects={data.projects} members={data.members} filterProjectId={taskFilter}
        canManage={hasPermission("can_manage_projects")} refreshKey={boardRefreshKey} />
    </div>
  );
  const ChangesPage = () => (
    <div className="space-y-6">
      <ProjectFilterHeader title="Change Requests" />
      <ChangeRequestsPanel projects={data.projects} members={data.members} filterProjectId={taskFilter}
        canManage={hasPermission("can_manage_projects")} canApprove={hasPermission("can_approve_timelog")}
        refreshKey={boardRefreshKey} />
    </div>
  );
  const DecisionsPage = () => (
    <div className="space-y-6">
      <ProjectFilterHeader title="Decision Log" />
      <DecisionLogPanel projects={data.projects} members={data.members} filterProjectId={taskFilter}
        canManage={hasPermission("can_manage_projects")} refreshKey={boardRefreshKey} />
    </div>
  );

  const TemplatesPage = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Templates</h1>
      <TemplatesPanel projects={data.projects} canManage={hasPermission("can_manage_projects")}
        refreshKey={boardRefreshKey} onProjectCreated={() => setBoardRefreshKey(k => k + 1)} />
    </div>
  );
  const RecurringPage = () => (
    <div className="space-y-6">
      <ProjectFilterHeader title="Recurring Tasks" />
      <RecurringTasksPanel projects={data.projects} members={data.members} filterProjectId={taskFilter}
        canManage={hasPermission("can_manage_projects")} refreshKey={boardRefreshKey} />
    </div>
  );

  const InvoicesPage = () => (
    <div className="space-y-6">
      <ProjectFilterHeader title="ใบแจ้งหนี้ / Invoices" />
      <InvoicesPanel projects={data.projects} filterProjectId={taskFilter}
        canManage={hasPermission("can_manage_projects")} refreshKey={boardRefreshKey} />
    </div>
  );
  const FinancePage = () => (
    <div className="space-y-6">
      <ProjectFilterHeader title="Finance — P&L / EVM" />
      <FinancePanel filterProjectId={taskFilter} refreshKey={boardRefreshKey} />
    </div>
  );
  const ClientPortalPage = () => (
    <div className="space-y-6">
      <ProjectFilterHeader title="Client Portal — ลิงก์สำหรับลูกค้า" />
      <ClientPortalPanel filterProjectId={taskFilter} refreshKey={boardRefreshKey} />
    </div>
  );

  // ── TASKS (KANBAN) ──
  const Tasks = () => {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3">
          <h1 className="text-lg md:text-2xl font-bold text-white">{t.tasks}</h1>
          <div className="flex items-center gap-2 md:gap-3">
            <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)} className="px-3 py-2 rounded-xl text-xs md:text-sm bg-[#1E293B] text-white border border-[#334155] outline-none flex-1 sm:flex-none">
              <option value="all">{t.all} {t.projects}</option>
              {mockProjects.map(p => <option key={p.id} value={p.id}>{getName(p)}</option>)}
            </select>
            {hasPermission("can_manage_tasks") && <button onClick={openAddTask} className="px-3 py-2 rounded-xl text-white text-xs md:text-sm font-medium flex items-center gap-1.5 flex-shrink-0" style={{ background: "#003087" }}><Plus size={14} />{t.addTask}</button>}
          </div>
        </div>
        <KanbanBoard
          projects={data.projects}
          members={data.members}
          filterProjectId={taskFilter}
          onTaskClick={(id) => setDrawerTaskId(id)}
          onAddTask={() => openAddTask()}
          refreshKey={boardRefreshKey}
          canManage={hasPermission("can_manage_tasks")}
        />
      </div>
    );
  };

  // ── TEAM ──
  const Team = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white">{t.team}</h1>
        {hasPermission("can_manage_members") && <button onClick={teamTab === "members" ? openAddMember : openAddPosition} className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ background: "#003087" }}><Plus size={16} />{teamTab === "members" ? t.addMember : t.addPosition}</button>}</div>
      <div className="flex gap-2">{["members", "positions"].map(tb => (
        <button key={tb} onClick={() => setTeamTab(tb)} className={`px-4 py-2 rounded-xl text-sm font-medium ${teamTab === tb ? "text-white" : "text-slate-400"}`} style={teamTab === tb ? { background: "#003087" } : {}}>{tb === "members" ? t.teamMembers : t.positionMgmt}</button>
      ))}</div>
      {teamTab === "members" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockMembers.map(mem => {
            const pos = getPos(mem.position_id);
            const mh = approvedLogs.filter(l => l.member_id === mem.id).reduce((s, l) => s + l.hours, 0);
            const mc = approvedLogs.filter(l => l.member_id === mem.id).reduce((s, l) => s + l.hours * l.rate, 0);
            const mp = [...new Set(mockTimeLogs.filter(l => l.member_id === mem.id).map(l => l.project_id))].length;
            return (
              <div key={mem.id} className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg,${pos?.color || "#003087"},${pos?.color || "#003087"}88)` }}>{mem.avatar}</div>
                  <div><h3 className="font-semibold text-white">{getName(mem)}</h3><p className="text-sm" style={{ color: pos?.color }}>{pos ? getName(pos) : ""}</p></div>
                </div>
                <div className="text-xs text-slate-400 mb-3">{mem.dept}</div>
                <div className={`grid ${canView("manpower") ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
                  <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.hours}</div><div className="text-sm font-semibold text-white">{mh.toFixed(1)}</div></div>
                  {canView("manpower") && (
                    <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.cost}</div><div className="text-sm font-semibold text-[#F7941D]">฿{mc.toLocaleString()}</div></div>
                  )}
                  <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.projects}</div><div className="text-sm font-semibold text-white">{mp}</div></div>
                </div>
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#334155]">
                  {canView("manpower")
                    ? <span className="text-sm font-semibold text-[#003087]">฿{mem.rate}{t.perHour}</span>
                    : <span className="text-xs text-slate-500">{mem.dept}</span>}
                  <div className="flex gap-1">
                    {hasPermission("can_manage_members") && <button onClick={() => openEditMember(mem.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Edit3 size={14} /></button>}
                    {isAdmin && <button onClick={() => handleDeleteMember(mem.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-red-400"><Trash2 size={14} /></button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#1E293B] rounded-2xl border border-[#334155] overflow-hidden">
          <table className="w-full"><thead><tr className="bg-slate-700/50">
            {[t.position, ...(canView("manpower") ? [t.hourlyRate] : []), t.teamMembers, ...(canView("manpower") ? [t.totalCost] : []), t.actions].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
          </tr></thead><tbody>
            {mockPositions.map(pos => {
              const pm = mockMembers.filter(m => m.position_id === pos.id);
              const pc = approvedLogs.filter(l => pm.some(m => m.id === l.member_id)).reduce((s, l) => s + l.hours * l.rate, 0);
              return (<tr key={pos.id} className="border-t border-[#334155] hover:bg-slate-700/30">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${pos.color}20` }}><Briefcase size={16} style={{ color: pos.color }} /></div><span className="font-medium text-white">{getName(pos)}</span></div></td>
                {canView("manpower") && <td className="px-5 py-4 text-[#003087] font-semibold">฿{pos.rate}{t.perHour}</td>}
                <td className="px-5 py-4 text-white">{pm.length}</td>
                {canView("manpower") && <td className="px-5 py-4 text-[#F7941D] font-semibold">{fmt(pc)}</td>}
                <td className="px-5 py-4 text-right"><div className="flex justify-end gap-1">
                  {hasPermission("can_manage_members") && <button onClick={() => openEditPosition(pos.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Edit3 size={14} /></button>}
                  {isAdmin && <button onClick={() => handleDeletePosition(pos.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-red-400"><Trash2 size={14} /></button>}
                </div></td>
              </tr>);
            })}
          </tbody></table>
        </div>
      )}
    </div>
  );

  // ── TIME LOG ──
  const TimeLog = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white">{t.timeLog}</h1>
        {hasPermission("can_log_time") && <button onClick={() => setTimelogModalOpen(true)} className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ background: "#003087" }}><Plus size={16} />{t.logTime}</button>}</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Clock} label={t.totalHours} value={totalHrs} color="#003087" />
        {canView("costs") && <Stat icon={DollarSign} label={t.totalCost} value={fmt(totalCost)} color="#F7941D" />}
        <Stat icon={CheckCircle2} label={t.approved} value={mockTimeLogs.filter(l => l.status === "approved").length} color="#10B981" />
        <Stat icon={AlertCircle} label={t.pending} value={mockTimeLogs.filter(l => l.status === "pending").length} color="#F59E0B" />
      </div>
      <div className="bg-[#1E293B] rounded-2xl border border-[#334155] overflow-x-auto">
        <table className="w-full"><thead><tr className="bg-slate-700/50">
          {[t.name, t.position, t.projects, "Date", t.hours, ...(canView("costs") ? [t.rate, t.cost] : []), t.status].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
        </tr></thead><tbody>
          {mockTimeLogs.map(log => {
            const mem = mockMembers.find(m => m.id === log.member_id);
            const pos = mem ? getPos(mem.position_id) : null;
            const proj = mockProjects.find(p => p.id === log.project_id);
            return (<tr key={log.id} className="border-t border-[#334155]">
              <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: pos?.color || "#003087" }}>{mem?.avatar?.[0]}</div><span className="text-sm text-white">{mem ? getName(mem) : ""}</span></div></td>
              <td className="px-4 py-3 text-sm text-slate-400">{pos ? getName(pos) : ""}</td>
              <td className="px-4 py-3 text-sm text-white">{proj ? getName(proj).substring(0, 20) : ""}</td>
              <td className="px-4 py-3 text-sm text-slate-400">{log.date}</td>
              <td className="px-4 py-3 text-sm font-semibold text-white">{Number(log.hours).toFixed(1)}h</td>
              {canView("costs") && <td className="px-4 py-3 text-sm text-slate-400">฿{log.rate}</td>}
              {canView("costs") && <td className="px-4 py-3 text-sm font-semibold text-[#F7941D]">฿{(log.hours * log.rate).toLocaleString()}</td>}
              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${log.status === "approved" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>{t[log.status]}</span></td>
            </tr>);
          })}
        </tbody></table>
      </div>
    </div>
  );

  // ── COSTS ──
  const Costs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white">{t.costs}</h1>
        <button className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 bg-slate-700 text-slate-200"><Download size={16} />{t.export}</button></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={DollarSign} label={t.totalCost} value={fmt(totalCost)} color="#F7941D" />
        <Stat icon={Clock} label={t.totalHours} value={totalHrs} color="#003087" />
        <Stat icon={Target} label={t.totalBudget} value={fmt(mockProjects.reduce((s, p) => s + p.budget, 0))} color="#10B981" />
        <Stat icon={Activity} label={t.remaining} value={fmt(mockProjects.reduce((s, p) => s + p.budget, 0) - totalCost)} color="#00AEEF" />
      </div>
      <div className="bg-[#1E293B] rounded-2xl border border-[#334155] p-5"><h3 className="font-semibold text-white mb-4">{t.projectCost}</h3>
        <div className="space-y-4">{mockProjects.map(p => {
          const pc = approvedLogs.filter(l => l.project_id === p.id).reduce((s, l) => s + l.hours * l.rate, 0);
          const ph = approvedLogs.filter(l => l.project_id === p.id).reduce((s, l) => s + l.hours, 0);
          const mc = [...new Set(approvedLogs.filter(l => l.project_id === p.id).map(l => l.member_id))].length;
          const pct = p.budget > 0 ? (pc / p.budget) * 100 : 0;
          return (<div key={p.id} className="p-4 rounded-xl border border-[#334155]">
            <div className="flex items-center justify-between mb-2"><div><span className="font-medium text-white">{getName(p)}</span><span className="text-xs text-slate-400 ml-2">{p.code}</span></div><div className="text-right"><span className="font-semibold text-[#F7941D]">{fmt(pc)}</span><span className="text-xs text-slate-400 ml-1">/ {fmt(p.budget)}</span></div></div>
            <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 90 ? "#EF4444" : pct > 70 ? "#F7941D" : "linear-gradient(90deg,#003087,#00AEEF)" }} /></div>
            <div className="flex justify-between mt-2 text-xs text-slate-400"><span>{mc} {t.teamMembers} · {ph.toFixed(1)} {t.hours}</span><span className={pct > 90 ? "text-red-400" : pct > 70 ? "text-yellow-400" : "text-emerald-400"}>{pct.toFixed(1)}% {t.budgetUsed}</span></div>
          </div>);
        })}</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]"><h3 className="font-semibold text-white mb-4">{t.costByPosition}</h3>
          <ResponsiveContainer width="100%" height={280}><BarChart data={costByPos} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fill: "#94A3B8", fontSize: 11 }} width={130} /><Tooltip formatter={(v: unknown) => fmt(Number(v))} contentStyle={tipStyle} /><Bar dataKey="value" radius={[0, 8, 8, 0]} name={t.cost}>{costByPos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div>
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]"><h3 className="font-semibold text-white mb-4">{t.monthlyCost}</h3>
          <ResponsiveContainer width="100%" height={280}><LineChart data={monthlyCostData}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} /><Tooltip formatter={(v: unknown) => fmt(Number(v))} contentStyle={tipStyle} /><Line type="monotone" dataKey="cost" stroke="#003087" strokeWidth={3} dot={{ fill: "#F7941D", r: 5 }} name={t.cost} /></LineChart></ResponsiveContainer></div>
      </div>
    </div>
  );

  // ── REPORTS ──
  const Reports = () => {
    const mr = mockMembers.map(mem => {
      const pos = getPos(mem.position_id);
      const logs = approvedLogs.filter(l => l.member_id === mem.id);
      return { name: getName(mem), position: pos ? getName(pos) : "", hours: logs.reduce((s, l) => s + l.hours, 0), cost: logs.reduce((s, l) => s + l.hours * l.rate, 0), rate: mem.rate, projects: [...new Set(logs.map(l => l.project_id))].length };
    }).sort((a, b) => b.cost - a.cost);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white">{t.reports}</h1>
          <button className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-white" style={{ background: "#003087" }}><Download size={16} />{t.export} PDF</button></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={BarChart3} label={t.avgCostProject} value={fmt(Math.round(totalCost / Math.max(mockProjects.filter(p => p.status !== "planning").length, 1)))} color="#003087" />
          <Stat icon={Clock} label={t.avgHrsPerson} value={Math.round(totalHrs / mockMembers.length)} color="#00AEEF" />
          <Stat icon={TrendingUp} label={t.avgRateHr} value={`฿${Math.round(totalCost / Math.max(totalHrs, 1))}`} color="#F7941D" />
          <Stat icon={Target} label={t.budgetUsed} value={`${((totalCost / mockProjects.reduce((s, p) => s + p.budget, 0)) * 100).toFixed(1)}%`} color="#10B981" />
        </div>
        <div className="bg-[#1E293B] rounded-2xl border border-[#334155] p-5"><h3 className="font-semibold text-white mb-4">{t.memberCost}</h3>
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-slate-700/50">
            {["#", t.name, t.position, t.hourlyRate, t.hours, t.cost, t.projects].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
          </tr></thead><tbody>
            {mr.map((r, i) => (<tr key={i} className="border-t border-[#334155]">
              <td className="px-4 py-3 text-sm text-slate-400">{i + 1}</td><td className="px-4 py-3 text-sm font-medium text-white">{r.name}</td>
              <td className="px-4 py-3 text-sm text-slate-400">{r.position}</td><td className="px-4 py-3 text-sm text-[#003087]">฿{r.rate}</td>
              <td className="px-4 py-3 text-sm text-white">{Number(r.hours).toFixed(1)}h</td><td className="px-4 py-3 text-sm font-semibold text-[#F7941D]">{fmt(r.cost)}</td>
              <td className="px-4 py-3 text-sm text-white">{r.projects}</td>
            </tr>))}
          </tbody><tfoot><tr className="border-t-2 border-[#334155]">
            <td colSpan={4} className="px-4 py-3 text-sm font-bold text-white">{t.total}</td>
            <td className="px-4 py-3 text-sm font-bold text-white">{mr.reduce((s, r) => s + r.hours, 0).toFixed(1)}h</td>
            <td className="px-4 py-3 text-sm font-bold text-[#F7941D]">{fmt(mr.reduce((s, r) => s + r.cost, 0))}</td><td></td>
          </tr></tfoot></table></div>
        </div>
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]"><h3 className="font-semibold text-white mb-4">{t.budgetVsActual}</h3>
          <ResponsiveContainer width="100%" height={300}><BarChart data={costByProject}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} /><Tooltip formatter={(v: unknown) => fmt(Number(v))} contentStyle={tipStyle} /><Legend /><Bar dataKey="budget" fill="#003087" radius={[8, 8, 0, 0]} name={t.budget} opacity={0.5} /><Bar dataKey="cost" fill="#F7941D" radius={[8, 8, 0, 0]} name={t.cost} /></BarChart></ResponsiveContainer></div>
      </div>
    );
  };

  // ── SETTINGS ──
  const SettingsPage = () => (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">{t.settings}</h1>
      <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] space-y-6">
        <div><label className="text-sm font-semibold text-white block mb-3">{t.language}</label>
          <div className="flex gap-3">{([["th", "ไทย", "🇹🇭"], ["en", "English", "🇬🇧"], ["jp", "日本語", "🇯🇵"]] as const).map(([v, label, flag]) => (
            <button key={v} onClick={() => setLang(v)} className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-all ${lang === v ? "text-white border-transparent shadow-lg" : "text-white border-[#334155]"}`} style={lang === v ? { background: "#003087" } : {}}><span className="text-lg">{flag}</span>{label}</button>
          ))}</div>
        </div>
        <div className="pt-6 border-t border-[#334155]"><h3 className="font-semibold text-white mb-2">TOMAS TECH Project Manager</h3>
          <div className="text-sm text-slate-400 space-y-1"><p>Version 1.0.0</p><p>TOMAS TECH CO., LTD.</p><p>www.tomastc.com</p></div></div>
      </div>
    </div>
  );

  // ── RENDER ──
  const Allocation = () => (
    <AllocationManager
      projects={data.projects}
      members={data.members}
      canEdit={hasPermission("can_manage_projects") || hasPermission("can_manage_members")}
    />
  );
  const Workload = () => <WorkloadHeatmap weeks={8} />;
  const Approval = () => <TimeLogApproval canApprove={["admin","manager","leader"].includes(currentUser?.role ?? "")} />;
  const Manpower = () => <ManpowerReport positions={data.positions} members={data.members} projects={data.projects} />;
  const pages: Record<string, () => React.ReactNode> = { dashboard: Dashboard, mytasks: MyTasksPage, projects: Projects, tasks: Tasks, gantt: GanttPage, milestones: MilestonesPage, calendar: CalendarPage, sprint: SprintPage, meetings: MeetingsPage, risks: RisksPage, issues: IssuesPage, changes: ChangesPage, decisions: DecisionsPage, templates: TemplatesPage, recurring: RecurringPage, invoices: InvoicesPage, finance: FinancePage, client_portal: ClientPortalPage, team: Team, allocation: Allocation, workload: Workload, timelog: TimeLog, approval: Approval, costs: Costs, reports: Reports, manpower: Manpower, settings: SettingsPage };
  const Page = pages[page] || Dashboard;

  // Mobile bottom nav items (most used)
  const MOBILE_NAV = [
    { id: "dashboard", icon: LayoutDashboard, label: "หน้าหลัก" },
    { id: "mytasks", icon: Inbox, label: "งานของฉัน" },
    { id: "tasks", icon: ListTodo, label: "งาน" },
    { id: "projects", icon: FolderKanban, label: "โครงการ" },
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-y-0 left-0 w-72 bg-[#020617] border-r border-[#334155] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 flex items-center gap-3 border-b border-[#334155]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg,#003087,#00AEEF)" }}>TT</div>
              <div><div className="font-bold text-sm text-white">TOMAS TECH</div><div className="text-xs text-[#F7941D]">Project Manager</div></div>
              <button onClick={() => setMobileMenuOpen(false)} className="ml-auto text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-3">
              {groupedNav.map(g => {
                const collapsed = !!collapsedGroups[g.key];
                return (
                  <div key={g.key} className="space-y-1">
                    <button onClick={() => toggleGroup(g.key)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-orange-400 transition">
                      <span>{g.label}</span>
                      {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {!collapsed && g.items.map(item => (
                      <button key={item.id} onClick={() => { setPage(item.id); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${page === item.id ? "text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                        style={page === item.id ? { background: "linear-gradient(135deg,#003087,#0050B3)" } : {}}>
                        <item.icon size={20} /><span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </nav>
            {/* Mobile user info + logout */}
            <div className="p-3 border-t border-[#334155] space-y-2">
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg,#003087,#00AEEF)" }}>
                  {(currentUser?.display_name ?? "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{currentUser?.display_name}</div>
                  <div className="text-xs text-slate-400">{t[currentUser?.role as keyof typeof t] ?? currentUser?.role}</div>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => { setMobileMenuOpen(false); router.push("/admin/users"); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition">
                  <UserCog size={16} /> {t.userManagement}
                </button>
              )}
              <button onClick={() => { setMobileMenuOpen(false); logout(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-lg transition">
                <LogOut size={16} /> {t.logout}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - hidden on mobile */}
      <div className={`hidden md:flex ${sidebarOpen ? "w-64" : "w-20"} flex-col border-r border-[#334155] bg-[#020617] transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 flex items-center gap-3 border-b border-[#334155]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg,#003087,#00AEEF)" }}>TT</div>
          {sidebarOpen && <div><div className="font-bold text-sm text-white">TOMAS TECH</div><div className="text-xs text-[#F7941D]">Project Manager</div></div>}
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-3 sidebar-scroll">
          {groupedNav.map(g => {
            const collapsed = !!collapsedGroups[g.key];
            return (
              <div key={g.key} className="space-y-1">
                {sidebarOpen ? (
                  <button onClick={() => toggleGroup(g.key)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-orange-400 transition">
                    <span>{g.label}</span>
                    {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </button>
                ) : (
                  <div className="h-px bg-[#1E293B] mx-2 my-2" />
                )}
                {!collapsed && g.items.map(item => (
                  <button key={item.id} onClick={() => setPage(item.id)} title={!sidebarOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${page === item.id ? "text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                    style={page === item.id ? { background: "linear-gradient(135deg,#003087,#0050B3)" } : {}}>
                    <item.icon size={20} />{sidebarOpen && <span className="truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[#334155]"><button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white text-sm">{sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button></div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}
        <div className="h-14 md:h-16 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between px-3 md:px-6 flex-shrink-0">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-1 text-slate-300 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <span className="font-bold text-sm text-white">TT</span>
          </div>
          {/* Desktop: search bar */}
          <div className="relative flex-1 max-w-md hidden md:block"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input placeholder={t.search} className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-700 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-0.5 md:gap-1 rounded-lg p-0.5 md:p-1 bg-[#0F172A]">{(["th", "en", "jp"] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${lang === l ? "text-white shadow" : "text-slate-400"}`} style={lang === l ? { background: "#003087" } : {}}>{l.toUpperCase()}</button>
            ))}</div>
            <button onClick={() => setPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E293B] border border-[#334155] text-slate-300 hover:border-cyan-500 text-xs"
              title="Command Palette (Ctrl+K)">
              <span>ค้นหา / คำสั่ง</span>
              <kbd className="text-[10px] font-mono border border-[#334155] rounded px-1.5 py-0.5">Ctrl K</kbd>
            </button>
            <NotificationBell onNavigate={(link) => {
              if (link.startsWith("/tasks/")) {
                const tid = link.split("/")[2];
                if (tid) setDrawerTaskId(tid);
              } else if (link === "/tasks") setPage("tasks");
              else if (link === "/milestones") setPage("milestones");
              else if (link === "/meetings") setPage("meetings");
              else if (link === "/calendar") setPage("calendar");
              else if (link === "/sprint") setPage("sprint");
              else if (link === "/approval") setPage("approval");
              else if (link === "/mytasks") setPage("mytasks");
              else if (link.startsWith("/")) router.push(link);
            }} />
            {/* Desktop user menu */}
            <div className="relative hidden md:block">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg,#003087,#00AEEF)" }}>
                  {(currentUser?.display_name ?? "U").charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{currentUser?.display_name ?? "..."}</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <div className="text-sm font-medium text-white">{currentUser?.display_name}</div>
                      <div className="text-xs text-slate-400">@{currentUser?.username}</div>
                      <div className="text-xs mt-1 inline-block px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-medium">
                        {t[currentUser?.role as keyof typeof t] ?? currentUser?.role}
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => { setUserMenuOpen(false); router.push("/admin/users"); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition">
                        <UserCog size={16} /> {t.userManagement}
                      </button>
                    )}
                    <button onClick={() => { setUserMenuOpen(false); logout(); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition border-t border-slate-700">
                      <LogOut size={16} /> {t.logout}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content — less padding on mobile, extra bottom padding for bottom nav */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6 pb-20 md:pb-6"><Page /></main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#020617] border-t border-[#334155] safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {MOBILE_NAV.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${page === item.id ? "text-[#00AEEF]" : "text-slate-500"}`}>
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <button onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-slate-500`}>
            <Settings size={20} />
            <span className="text-[10px] font-medium">เมนู</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        initial={editingProject}
        onSubmit={async (payload) => {
          if (editingProject) await data.updateProject(editingProject.id, payload);
          else await data.createProject(payload);
        }}
      />
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        initial={editingTask}
        projects={data.projects}
        members={data.members}
        onSubmit={async (payload) => {
          if (editingTask) await data.updateTask(editingTask.id, payload);
          else await data.createTask(payload);
          setBoardRefreshKey(k => k + 1);
        }}
      />
      <MemberModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        initial={editingMember}
        positions={data.positions}
        onSubmit={async (payload) => {
          if (editingMember) await data.updateMember(editingMember.id, payload);
          else await data.createMember(payload);
        }}
      />
      <PositionModal
        open={positionModalOpen}
        onClose={() => setPositionModalOpen(false)}
        initial={editingPosition}
        onSubmit={async (payload) => {
          if (editingPosition) await data.updatePosition(editingPosition.id, payload);
          else await data.createPosition(payload);
        }}
      />
      <TimeLogModal
        open={timelogModalOpen}
        onClose={() => setTimelogModalOpen(false)}
        projects={data.projects}
        tasks={data.tasks}
        members={data.members}
        onSubmit={async (payload) => { await data.createTimelog(payload); }}
      />
      <TaskDetailDrawer
        open={!!drawerTaskId}
        taskId={drawerTaskId}
        onClose={() => setDrawerTaskId(null)}
        onChange={() => { data.refetchTasks?.(); setBoardRefreshKey(k => k + 1); }}
        members={data.members}
        allTasks={data.tasks}
      />
      <FloatingTimer
        onOpenTask={(id) => setDrawerTaskId(id)}
        refreshKey={boardRefreshKey}
        onChange={() => { data.refetchTimelogs?.(); setBoardRefreshKey(k => k + 1); }}
      />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={paletteItems} />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
