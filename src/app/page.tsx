"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import {
  LayoutDashboard, FolderKanban, ListTodo, Users, Clock, DollarSign,
  BarChart3, Settings, ChevronLeft, ChevronRight, Plus, Search, Bell,
  Calendar, TrendingUp, Briefcase, CheckCircle2, AlertCircle,
  Edit3, Trash2, Eye, Download, Sun, Moon, Activity, Target,
  UserCog, LogOut,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend,
} from "recharts";
import { translations, type Lang } from "@/lib/i18n";
import { mockPositions, mockMembers, mockProjects, mockTasks, mockTimeLogs, monthlyCostData } from "@/lib/mockData";

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
  const { user: currentUser, isAdmin, logout } = useAuth();
  const [lang, setLang] = useState<Lang>("th");
  const [page, setPage] = useState("dashboard");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tasks, setTasks] = useState(mockTasks);
  const [taskFilter, setTaskFilter] = useState("all");
  const [teamTab, setTeamTab] = useState("members");
  const [projFilter, setProjFilter] = useState("all");

  const t = translations[lang];
  const getName = useCallback((item: Record<string, unknown>, f = "name") => {
    const k = lang === "th" ? `${f}_th` : lang === "jp" ? `${f}_jp` : `${f}_en`;
    return (item[k] as string) || (item[`${f}_en`] as string) || "";
  }, [lang]);
  const getPos = useCallback((pid: string) => mockPositions.find(p => p.id === pid), []);

  const approvedLogs = useMemo(() => mockTimeLogs.filter(l => l.status === "approved"), []);
  const totalCost = useMemo(() => approvedLogs.reduce((s, l) => s + l.hours * l.rate, 0), [approvedLogs]);
  const totalHrs = useMemo(() => approvedLogs.reduce((s, l) => s + l.hours, 0), [approvedLogs]);

  const costByProject = useMemo(() => mockProjects.map(p => ({
    name: getName(p).substring(0, 18), cost: approvedLogs.filter(l => l.project_id === p.id).reduce((s, l) => s + l.hours * l.rate, 0), budget: p.budget,
  })).filter(d => d.cost > 0), [approvedLogs, getName]);

  const costByPos = useMemo(() => {
    const m: Record<string, number> = {};
    approvedLogs.forEach(l => {
      const mem = mockMembers.find(x => x.id === l.member_id);
      if (mem) { const pos = getPos(mem.position_id); const n = pos ? getName(pos) : "Other"; m[n] = (m[n] || 0) + l.hours * l.rate; }
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [approvedLogs, getPos, getName]);

  const taskStats = useMemo(() => {
    const s: Record<string, number> = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
    tasks.forEach(tk => { if (s[tk.status] !== undefined) s[tk.status]++; });
    return Object.entries(s).map(([k, value]) => ({ name: t[k] || k, value, fill: statusColor[k] || "#6B7280" }));
  }, [tasks, t]);

  const tipStyle = { background: "#1E293B", border: "none", borderRadius: 12, color: "#F8FAFC", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" };

  // ── Stat Card ──
  const Stat = ({ icon: I, label, value, sub, color = "#003087", trend }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string; trend?: string }) => (
    <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155] hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}25` }}><I size={22} style={{ color }} /></div>
        {trend && <span className="text-xs font-medium text-emerald-400 flex items-center gap-1"><TrendingUp size={14} />{trend}</span>}
      </div>
      <div className="mt-3 text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
    </div>
  );

  // ── Sidebar ──
  const nav = [
    { id: "dashboard", icon: LayoutDashboard, label: t.dashboard },
    { id: "projects", icon: FolderKanban, label: t.projects },
    { id: "tasks", icon: ListTodo, label: t.tasks },
    { id: "team", icon: Users, label: t.team },
    { id: "timelog", icon: Clock, label: t.timeLog },
    { id: "costs", icon: DollarSign, label: t.costs },
    { id: "reports", icon: BarChart3, label: t.reports },
    { id: "settings", icon: Settings, label: t.settings },
  ];

  // ── DASHBOARD ──
  const Dashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-white">{t.welcome}, Tomas Tech!</h1>
          <p className="text-slate-400">{t.overview} — {new Date().toLocaleDateString(lang === "th" ? "th-TH" : lang === "jp" ? "ja-JP" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p></div>
        <button className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ background: "#003087" }}><Plus size={16} />{t.addProject}</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={FolderKanban} label={t.totalProjects} value={mockProjects.length} sub={`${mockProjects.filter(p => p.status === "in_progress").length} ${t.activeProjects}`} color="#003087" trend="+2" />
        <Stat icon={ListTodo} label={t.totalTasks} value={tasks.length} sub={`${tasks.filter(tk => tk.status === "done").length} ${t.completedTasks}`} color="#00AEEF" />
        <Stat icon={DollarSign} label={t.totalCost} value={fmt(totalCost)} sub={`${totalHrs} ${t.hours}`} color="#F7941D" trend="+12%" />
        <Stat icon={Users} label={t.teamMembers} value={mockMembers.length} sub={`${mockPositions.length} ${t.position}`} color="#10B981" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]"><h3 className="font-semibold text-white mb-4">{t.costByProject}</h3>
          <ResponsiveContainer width="100%" height={250}><BarChart data={costByProject}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} /><Tooltip contentStyle={tipStyle} /><Bar dataKey="cost" fill="#003087" radius={[8, 8, 0, 0]} name={t.cost} /><Bar dataKey="budget" fill="#F7941D" radius={[8, 8, 0, 0]} name={t.budget} opacity={0.4} /></BarChart></ResponsiveContainer></div>
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]"><h3 className="font-semibold text-white mb-4">{t.taskDistribution}</h3>
          <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={taskStats} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" label={({ name, value }: { name?: string; value: number }) => `${name || ''}: ${value}`}>{taskStats.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip contentStyle={tipStyle} /></PieChart></ResponsiveContainer></div>
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]"><h3 className="font-semibold text-white mb-4">{t.monthlyCost}</h3>
          <ResponsiveContainer width="100%" height={250}><AreaChart data={monthlyCostData}><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#003087" stopOpacity={0.3} /><stop offset="95%" stopColor="#003087" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 12 }} /><YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} /><Tooltip contentStyle={tipStyle} /><Area type="monotone" dataKey="cost" stroke="#003087" fill="url(#cg)" strokeWidth={2.5} name={t.cost} /></AreaChart></ResponsiveContainer></div>
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-[#334155]"><h3 className="font-semibold text-white mb-4">{t.costByPosition}</h3>
          <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={costByPos} cx="50%" cy="50%" outerRadius={95} paddingAngle={3} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}>{costByPos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: unknown) => fmt(Number(v))} contentStyle={tipStyle} /></PieChart></ResponsiveContainer></div>
      </div>
    </div>
  );

  // ── PROJECTS ──
  const Projects = () => {
    const filtered = projFilter === "all" ? mockProjects : mockProjects.filter(p => p.status === projFilter);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-white">{t.projects}</h1>
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl overflow-hidden border border-[#334155]">
              {["all", "planning", "in_progress", "on_hold", "completed"].map(s => (
                <button key={s} onClick={() => setProjFilter(s)} className={`px-3 py-1.5 text-xs font-medium ${projFilter === s ? "text-white" : "text-slate-400"}`} style={projFilter === s ? { background: "#003087" } : { background: "#0F172A" }}>{t[s]}</button>
              ))}
            </div>
            <button className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ background: "#003087" }}><Plus size={16} />{t.addProject}</button>
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
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ background: statusColor[p.status] }}>{t[p.status]}</span>
                </div>
                <p className="text-sm text-slate-400 mb-3">{t.client}: {p.client}</p>
                <div className="mb-3"><div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{t.progress}</span><span className="text-white font-semibold">{p.progress}%</span></div>
                  <div className="w-full h-2 rounded-full bg-slate-700"><div className="h-full rounded-full" style={{ width: `${p.progress}%`, background: p.progress === 100 ? "#10B981" : "linear-gradient(90deg,#003087,#00AEEF)" }} /></div></div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.tasks}</div><div className="text-sm font-semibold text-white">{dt}/{pt.length}</div></div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.hours}</div><div className="text-sm font-semibold text-white">{ph}</div></div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.cost}</div><div className="text-sm font-semibold text-[#F7941D]">{fmt(pc)}</div></div>
                </div>
                <div className="mb-3"><div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{t.budget}: {fmt(p.budget)}</span><span style={{ color: pct > 80 ? "#EF4444" : "#10B981" }}>{pct.toFixed(0)}%</span></div>
                  <div className="w-full h-1.5 rounded-full bg-slate-700"><div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 80 ? "#EF4444" : "#F7941D" }} /></div></div>
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

  // ── TASKS (KANBAN) ──
  const Tasks = () => {
    const cols = ["backlog", "todo", "in_progress", "review", "done"];
    const ft = taskFilter === "all" ? tasks : tasks.filter(tk => tk.project_id === taskFilter);
    const move = (id: string, to: string) => setTasks(prev => prev.map(tk => tk.id === id ? { ...tk, status: to } : tk));
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-white">{t.tasks}</h1>
          <div className="flex items-center gap-3">
            <select value={taskFilter} onChange={e => setTaskFilter(e.target.value)} className="px-3 py-2 rounded-xl text-sm bg-[#1E293B] text-white border border-[#334155] outline-none">
              <option value="all">{t.all} {t.projects}</option>
              {mockProjects.map(p => <option key={p.id} value={p.id}>{getName(p)}</option>)}
            </select>
            <button className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ background: "#003087" }}><Plus size={16} />{t.addTask}</button>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {cols.map(col => {
            const ct = ft.filter(tk => tk.status === col);
            return (
              <div key={col} className="min-w-[280px] flex-shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: statusColor[col] }} /><span className="font-semibold text-sm text-white">{t[col]}</span><span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{ct.length}</span></div>
                </div>
                <div className="space-y-3 p-2 rounded-2xl min-h-[400px] bg-[#0F172A]/60">
                  {ct.map(task => {
                    const asg = mockMembers.find(m => m.id === task.assignee);
                    const proj = mockProjects.find(p => p.id === task.project_id);
                    const ci = cols.indexOf(col);
                    return (
                      <div key={task.id} className="kanban-card bg-[#1E293B] rounded-xl p-4 border border-[#334155]">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${statusColor[proj?.status || "planning"]}20`, color: statusColor[proj?.status || "planning"] }}>{proj?.code}</span>
                          <div className="flex gap-1">
                            {ci > 0 && <button onClick={() => move(task.id, cols[ci - 1])} className="p-1 rounded text-slate-400 hover:text-blue-400"><ChevronLeft size={14} /></button>}
                            {ci < cols.length - 1 && <button onClick={() => move(task.id, cols[ci + 1])} className="p-1 rounded text-slate-400 hover:text-blue-400"><ChevronRight size={14} /></button>}
                          </div>
                        </div>
                        <h4 className="text-sm font-medium text-white mb-2">{task.title}</h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {asg && <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: getPos(asg.position_id)?.color || "#003087" }}>{asg.avatar[0]}</div>}
                            <span className="text-xs text-slate-400">{task.hours}h</span>
                          </div>
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: prioColor[task.priority] }} /><span className="text-xs text-slate-400">{task.dueDate?.slice(5)}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── TEAM ──
  const Team = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white">{t.team}</h1>
        <button className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ background: "#003087" }}><Plus size={16} />{teamTab === "members" ? t.addMember : t.addPosition}</button></div>
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
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.hours}</div><div className="text-sm font-semibold text-white">{mh}</div></div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.cost}</div><div className="text-sm font-semibold text-[#F7941D]">฿{mc.toLocaleString()}</div></div>
                  <div className="text-center p-2 rounded-lg bg-slate-700/50"><div className="text-xs text-slate-400">{t.projects}</div><div className="text-sm font-semibold text-white">{mp}</div></div>
                </div>
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#334155]">
                  <span className="text-sm font-semibold text-[#003087]">฿{mem.rate}{t.perHour}</span>
                  <div className="flex gap-1"><button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Edit3 size={14} /></button><button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Eye size={14} /></button></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#1E293B] rounded-2xl border border-[#334155] overflow-hidden">
          <table className="w-full"><thead><tr className="bg-slate-700/50">
            {[t.position, t.hourlyRate, t.teamMembers, t.totalCost, t.actions].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
          </tr></thead><tbody>
            {mockPositions.map(pos => {
              const pm = mockMembers.filter(m => m.position_id === pos.id);
              const pc = approvedLogs.filter(l => pm.some(m => m.id === l.member_id)).reduce((s, l) => s + l.hours * l.rate, 0);
              return (<tr key={pos.id} className="border-t border-[#334155] hover:bg-slate-700/30">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${pos.color}20` }}><Briefcase size={16} style={{ color: pos.color }} /></div><span className="font-medium text-white">{getName(pos)}</span></div></td>
                <td className="px-5 py-4 text-[#003087] font-semibold">฿{pos.rate}{t.perHour}</td>
                <td className="px-5 py-4 text-white">{pm.length}</td>
                <td className="px-5 py-4 text-[#F7941D] font-semibold">{fmt(pc)}</td>
                <td className="px-5 py-4 text-right"><div className="flex justify-end gap-1"><button className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><Edit3 size={14} /></button><button className="p-1.5 rounded-lg hover:bg-slate-700 text-red-400"><Trash2 size={14} /></button></div></td>
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
        <button className="px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2" style={{ background: "#003087" }}><Plus size={16} />{t.logTime}</button></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Clock} label={t.totalHours} value={totalHrs} color="#003087" />
        <Stat icon={DollarSign} label={t.totalCost} value={fmt(totalCost)} color="#F7941D" />
        <Stat icon={CheckCircle2} label={t.approved} value={mockTimeLogs.filter(l => l.status === "approved").length} color="#10B981" />
        <Stat icon={AlertCircle} label={t.pending} value={mockTimeLogs.filter(l => l.status === "pending").length} color="#F59E0B" />
      </div>
      <div className="bg-[#1E293B] rounded-2xl border border-[#334155] overflow-x-auto">
        <table className="w-full"><thead><tr className="bg-slate-700/50">
          {[t.name, t.position, t.projects, "Date", t.hours, t.rate, t.cost, t.status].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">{h}</th>)}
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
              <td className="px-4 py-3 text-sm font-semibold text-white">{log.hours}h</td>
              <td className="px-4 py-3 text-sm text-slate-400">฿{log.rate}</td>
              <td className="px-4 py-3 text-sm font-semibold text-[#F7941D]">฿{(log.hours * log.rate).toLocaleString()}</td>
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
            <div className="flex justify-between mt-2 text-xs text-slate-400"><span>{mc} {t.teamMembers} · {ph} {t.hours}</span><span className={pct > 90 ? "text-red-400" : pct > 70 ? "text-yellow-400" : "text-emerald-400"}>{pct.toFixed(1)}% {t.budgetUsed}</span></div>
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
              <td className="px-4 py-3 text-sm text-white">{r.hours}h</td><td className="px-4 py-3 text-sm font-semibold text-[#F7941D]">{fmt(r.cost)}</td>
              <td className="px-4 py-3 text-sm text-white">{r.projects}</td>
            </tr>))}
          </tbody><tfoot><tr className="border-t-2 border-[#334155]">
            <td colSpan={4} className="px-4 py-3 text-sm font-bold text-white">{t.total}</td>
            <td className="px-4 py-3 text-sm font-bold text-white">{mr.reduce((s, r) => s + r.hours, 0)}h</td>
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
  const pages: Record<string, () => React.ReactNode> = { dashboard: Dashboard, projects: Projects, tasks: Tasks, team: Team, timelog: TimeLog, costs: Costs, reports: Reports, settings: SettingsPage };
  const Page = pages[page] || Dashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A]">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-20"} flex flex-col border-r border-[#334155] bg-[#020617] transition-all duration-300 flex-shrink-0`}>
        <div className="p-4 flex items-center gap-3 border-b border-[#334155]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg,#003087,#00AEEF)" }}>TT</div>
          {sidebarOpen && <div><div className="font-bold text-sm text-white">TOMAS TECH</div><div className="text-xs text-[#F7941D]">Project Manager</div></div>}
        </div>
        <nav className="flex-1 p-3 space-y-1">{nav.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${page === item.id ? "text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"}`} style={page === item.id ? { background: "linear-gradient(135deg,#003087,#0050B3)" } : {}}>
            <item.icon size={20} />{sidebarOpen && <span>{item.label}</span>}
          </button>
        ))}</nav>
        <div className="p-3 border-t border-[#334155]"><button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white text-sm">{sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button></div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}
        <div className="h-16 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between px-6 flex-shrink-0">
          <div className="relative flex-1 max-w-md"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input placeholder={t.search} className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-700 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg p-1 bg-[#0F172A]">{(["th", "en", "jp"] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${lang === l ? "text-white shadow" : "text-slate-400"}`} style={lang === l ? { background: "#003087" } : {}}>{l.toUpperCase()}</button>
            ))}</div>
            <button className="p-2 rounded-xl bg-slate-700 relative text-slate-400"><Bell size={18} /><span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center bg-[#F7941D]">3</span></button>
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm transition">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg,#003087,#00AEEF)" }}>
                  {(currentUser?.display_name ?? "U").charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline font-medium">{currentUser?.display_name ?? "..."}</span>
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

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6"><Page /></main>
      </div>
    </div>
  );
}
