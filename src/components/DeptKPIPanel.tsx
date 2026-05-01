"use client";
import { useEffect, useState, useCallback } from "react";
import { BarChart3, Users, Clock, CheckCircle, TrendingUp } from "lucide-react";

type Lang = "th" | "en" | "jp";
interface DeptKPI { dept_id: string; dept_name: string; member_count: number; active_projects: number; total_tasks: number; done_tasks: number; total_hours: number; completion_rate: number; }

const T: Record<string, Record<Lang, string>> = {
  title: { th: "KPI รายแผนก", en: "Department KPIs", jp: "部門KPI" },
  members: { th: "พนักงาน", en: "Members", jp: "メンバー" },
  projects: { th: "โปรเจค", en: "Projects", jp: "プロジェクト" },
  tasks: { th: "งาน", en: "Tasks", jp: "タスク" },
  hours: { th: "ชม.", en: "hrs", jp: "時間" },
  completion: { th: "อัตราสำเร็จ", en: "Completion", jp: "完了率" },
  noData: { th: "ไม่มีข้อมูล", en: "No data", jp: "データなし" },
};

export default function DeptKPIPanel({ lang = "th" }: { lang?: Lang }) {
  const L = (k: string) => T[k]?.[lang] || T[k]?.en || k;
  const [kpis, setKpis] = useState<DeptKPI[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dRes, mRes, pRes, tRes, tlRes] = await Promise.all([
        fetch("/api/departments").then(r => r.json()),
        fetch("/api/members").then(r => r.json()),
        fetch("/api/projects").then(r => r.json()),
        fetch("/api/tasks").then(r => r.json()),
        fetch("/api/timelogs").then(r => r.json()),
      ]);
      const depts = dRes.departments || [];
      const members = mRes.members || [];
      const projects = pRes.projects || [];
      const tasks = tRes.tasks || [];
      const timelogs = tlRes.timelogs || tlRes.logs || [];

      const memberDept: Record<string, string> = {};
      for (const m of members) if (m.department_id) memberDept[m.id] = m.department_id;

      const projectMembers: Record<string, string[]> = {};
      // Simplified: count projects by checking project_members or tasks assignee
      for (const t of tasks) {
        if (t.assignee_id && t.project_id) {
          if (!projectMembers[t.project_id]) projectMembers[t.project_id] = [];
          if (!projectMembers[t.project_id].includes(t.assignee_id)) projectMembers[t.project_id].push(t.assignee_id);
        }
      }

      const result: DeptKPI[] = depts.map((d: { id: string; name: string }) => {
        const dMembers = members.filter((m: { department_id?: string }) => m.department_id === d.id);
        const mIds = new Set(dMembers.map((m: { id: string }) => m.id));
        const dTasks = tasks.filter((t: { assignee_id?: string }) => t.assignee_id && mIds.has(t.assignee_id));
        const doneTasks = dTasks.filter((t: { status: string }) => t.status === "done").length;
        const dTimelogs = timelogs.filter((tl: { member_id?: string }) => tl.member_id && mIds.has(tl.member_id));
        const totalHours = dTimelogs.reduce((s: number, tl: { hours?: number }) => s + (Number(tl.hours) || 0), 0);
        const dProjects = new Set<string>();
        for (const [pid, pmembers] of Object.entries(projectMembers)) {
          if (pmembers.some(mid => mIds.has(mid))) dProjects.add(pid);
        }
        return {
          dept_id: d.id, dept_name: d.name, member_count: dMembers.length,
          active_projects: dProjects.size, total_tasks: dTasks.length, done_tasks: doneTasks,
          total_hours: Math.round(totalHours * 10) / 10,
          completion_rate: dTasks.length ? Math.round((doneTasks / dTasks.length) * 100) : 0,
        };
      }).filter((k: DeptKPI) => k.member_count > 0).sort((a: DeptKPI, b: DeptKPI) => b.completion_rate - a.completion_rate);

      setKpis(result);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  const maxTasks = Math.max(...kpis.map(k => k.total_tasks), 1);
  const maxHours = Math.max(...kpis.map(k => k.total_hours), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="text-[#003087]" size={22} /> {L("title")}</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <Users size={20} className="mx-auto mb-1 text-[#003087]" />
          <div className="text-2xl font-bold text-gray-800">{kpis.reduce((s, k) => s + k.member_count, 0)}</div>
          <div className="text-xs text-gray-500">{L("members")}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <TrendingUp size={20} className="mx-auto mb-1 text-[#00AEEF]" />
          <div className="text-2xl font-bold text-gray-800">{kpis.reduce((s, k) => s + k.active_projects, 0)}</div>
          <div className="text-xs text-gray-500">{L("projects")}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <CheckCircle size={20} className="mx-auto mb-1 text-green-600" />
          <div className="text-2xl font-bold text-gray-800">{kpis.reduce((s, k) => s + k.done_tasks, 0)}/{kpis.reduce((s, k) => s + k.total_tasks, 0)}</div>
          <div className="text-xs text-gray-500">{L("tasks")}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <Clock size={20} className="mx-auto mb-1 text-[#F7941D]" />
          <div className="text-2xl font-bold text-gray-800">{kpis.reduce((s, k) => s + k.total_hours, 0).toLocaleString()}</div>
          <div className="text-xs text-gray-500">{L("hours")}</div>
        </div>
      </div>

      {/* Department bars */}
      <div className="space-y-4">
        {kpis.map(k => (
          <div key={k.dept_id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold text-gray-800">{k.dept_name}</span>
                <span className="ml-2 text-xs text-gray-400">{k.member_count} {L("members")}</span>
              </div>
              <span className={"text-sm font-bold " + (k.completion_rate >= 70 ? "text-green-600" : k.completion_rate >= 40 ? "text-amber-600" : "text-red-600")}>{k.completion_rate}%</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-gray-500 mb-1">{L("tasks")} ({k.done_tasks}/{k.total_tasks})</div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#003087] rounded-full" style={{ width: (k.total_tasks / maxTasks * 100) + "%" }} /></div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">{L("hours")} ({k.total_hours})</div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#00AEEF] rounded-full" style={{ width: (k.total_hours / maxHours * 100) + "%" }} /></div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">{L("completion")}</div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: k.completion_rate + "%", background: k.completion_rate >= 70 ? "#22C55E" : k.completion_rate >= 40 ? "#F59E0B" : "#EF4444" }} /></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!kpis.length && <div className="text-center py-12 text-gray-400">{L("noData")}</div>}
    </div>
  );
}
