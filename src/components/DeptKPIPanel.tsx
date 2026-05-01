"use client";
import { useEffect, useState, useCallback } from "react";
import { BarChart3, Users, Clock, CheckCircle, TrendingUp, Target, Award, AlertTriangle } from "lucide-react";

type Lang = "th" | "en" | "jp";
interface DeptKPI {
  dept_id: string;
  dept_code: string;
  dept_name: string;
  member_count: number;
  active_projects: number;
  total_tasks: number;
  done_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  total_hours: number;
  completion_rate: number;
  productivity_score: number; // tasks done per member
  avg_hours_per_member: number;
}

const T: Record<string, Record<Lang, string>> = {
  title: { th: "KPI รายแผนก", en: "Department KPIs", jp: "部門KPI" },
  members: { th: "พนักงาน", en: "Members", jp: "メンバー" },
  projects: { th: "โปรเจค", en: "Projects", jp: "プロジェクト" },
  tasks: { th: "งาน", en: "Tasks", jp: "タスク" },
  hours: { th: "ชม.", en: "hrs", jp: "時間" },
  completion: { th: "อัตราสำเร็จ", en: "Completion", jp: "完了率" },
  noData: { th: "ไม่มีข้อมูลแผนก", en: "No department data", jp: "部門データなし" },
  done: { th: "เสร็จ", en: "Done", jp: "完了" },
  inProgress: { th: "กำลังทำ", en: "In Progress", jp: "進行中" },
  overdue: { th: "เกินกำหนด", en: "Overdue", jp: "期限超過" },
  productivity: { th: "ผลิตภาพ", en: "Productivity", jp: "生産性" },
  taskPerMember: { th: "งานเสร็จ/คน", en: "Done/member", jp: "完了/人" },
  avgHours: { th: "ชม.เฉลี่ย/คน", en: "Avg hrs/member", jp: "平均時間/人" },
  howItWorks: { th: "วิธีคำนวณ KPI", en: "How KPIs are calculated", jp: "KPI計算方法" },
  howCompletion: { th: "อัตราสำเร็จ = งานสถานะ done ÷ งานทั้งหมดของสมาชิกในแผนก × 100", en: "Completion = done tasks ÷ total tasks of dept members × 100", jp: "完了率 = 完了タスク ÷ 部門メンバーの全タスク × 100" },
  howProductivity: { th: "ผลิตภาพ = จำนวนงานเสร็จ ÷ จำนวนพนักงาน", en: "Productivity = done tasks ÷ member count", jp: "生産性 = 完了タスク ÷ メンバー数" },
  howHours: { th: "ชั่วโมงทำงาน = รวม timelogs ของสมาชิกทุกคนในแผนก", en: "Hours = sum of all timelogs from dept members", jp: "作業時間 = 部門メンバーの全タイムログ合計" },
  howProjects: { th: "โปรเจค = นับจากงานที่ assign ให้สมาชิกในแผนก", en: "Projects = counted from tasks assigned to dept members", jp: "プロジェクト = 部門メンバーに割り当てられたタスクから集計" },
};

export default function DeptKPIPanel({ lang = "th" }: { lang?: Lang }) {
  const L = (k: string) => T[k]?.[lang] || T[k]?.en || k;
  const [kpis, setKpis] = useState<DeptKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const getDeptName = useCallback((d: Record<string, string>) => {
    if (lang === "en" && d.name_en) return d.name_en;
    if (lang === "jp" && d.name_jp) return d.name_jp || d.name_en || d.name_th;
    return d.name_th || d.name_en || d.code || "—";
  }, [lang]);

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
      const today = new Date().toISOString().split("T")[0];

      const memberDept: Record<string, string> = {};
      for (const m of members) if (m.department_id) memberDept[m.id] = m.department_id;

      // Build project-member mapping from tasks
      const projectMembers: Record<string, string[]> = {};
      for (const t of tasks) {
        if (t.assignee_id && t.project_id) {
          if (!projectMembers[t.project_id]) projectMembers[t.project_id] = [];
          if (!projectMembers[t.project_id].includes(t.assignee_id)) projectMembers[t.project_id].push(t.assignee_id);
        }
      }

      const result: DeptKPI[] = depts.map((d: Record<string, string>) => {
        const dMembers = members.filter((m: { department_id?: string }) => m.department_id === d.id);
        const mIds = new Set(dMembers.map((m: { id: string }) => m.id));

        // Tasks assigned to department members
        const dTasks = tasks.filter((t: { assignee_id?: string }) => t.assignee_id && mIds.has(t.assignee_id));
        const doneTasks = dTasks.filter((t: { status: string }) => t.status === "done").length;
        const inProgressTasks = dTasks.filter((t: { status: string }) => t.status === "in_progress").length;
        const overdueTasks = dTasks.filter((t: { status: string; due_date?: string }) =>
          t.status !== "done" && t.due_date && t.due_date < today
        ).length;

        // Timelogs from department members
        const dTimelogs = timelogs.filter((tl: { member_id?: string }) => tl.member_id && mIds.has(tl.member_id));
        const totalHours = dTimelogs.reduce((s: number, tl: { hours?: number }) => s + (Number(tl.hours) || 0), 0);

        // Projects where department members have tasks
        const dProjects = new Set<string>();
        for (const [pid, pmembers] of Object.entries(projectMembers)) {
          if ((pmembers as string[]).some(mid => mIds.has(mid))) dProjects.add(pid);
        }

        const memberCount = dMembers.length;
        const completionRate = dTasks.length ? Math.round((doneTasks / dTasks.length) * 100) : 0;
        const productivityScore = memberCount > 0 ? Math.round((doneTasks / memberCount) * 10) / 10 : 0;
        const avgHoursPerMember = memberCount > 0 ? Math.round((totalHours / memberCount) * 10) / 10 : 0;

        return {
          dept_id: d.id,
          dept_code: d.code || "",
          dept_name: getDeptName(d),
          member_count: memberCount,
          active_projects: dProjects.size,
          total_tasks: dTasks.length,
          done_tasks: doneTasks,
          in_progress_tasks: inProgressTasks,
          overdue_tasks: overdueTasks,
          total_hours: Math.round(totalHours * 10) / 10,
          completion_rate: completionRate,
          productivity_score: productivityScore,
          avg_hours_per_member: avgHoursPerMember,
        };
      }).filter((k: DeptKPI) => k.member_count > 0).sort((a: DeptKPI, b: DeptKPI) => b.completion_rate - a.completion_rate);

      setKpis(result);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [getDeptName]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (kpis.length === 0) return <div className="text-center py-12 text-gray-400">{L("noData")}</div>;

  const totalMembers = kpis.reduce((s, k) => s + k.member_count, 0);
  const totalProjects = kpis.reduce((s, k) => s + k.active_projects, 0);
  const totalDone = kpis.reduce((s, k) => s + k.done_tasks, 0);
  const totalTasks = kpis.reduce((s, k) => s + k.total_tasks, 0);
  const totalHours = kpis.reduce((s, k) => s + k.total_hours, 0);
  const totalOverdue = kpis.reduce((s, k) => s + k.overdue_tasks, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="text-[#003087]" size={22} /> {L("title")}
        </h2>
        <button onClick={() => setShowHelp(!showHelp)}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          {showHelp ? "✕" : "?"} {L("howItWorks")}
        </button>
      </div>

      {/* How KPI is calculated */}
      {showHelp && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-gray-700 space-y-1.5">
          <p><strong>1.</strong> {L("howCompletion")}</p>
          <p><strong>2.</strong> {L("howProductivity")}</p>
          <p><strong>3.</strong> {L("howHours")}</p>
          <p><strong>4.</strong> {L("howProjects")}</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <Users size={20} className="mx-auto mb-1 text-[#003087]" />
          <div className="text-2xl font-bold text-gray-800">{totalMembers}</div>
          <div className="text-xs text-gray-500">{L("members")}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <TrendingUp size={20} className="mx-auto mb-1 text-[#00AEEF]" />
          <div className="text-2xl font-bold text-gray-800">{totalProjects}</div>
          <div className="text-xs text-gray-500">{L("projects")}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <CheckCircle size={20} className="mx-auto mb-1 text-green-600" />
          <div className="text-2xl font-bold text-gray-800">{totalDone}/{totalTasks}</div>
          <div className="text-xs text-gray-500">{L("tasks")}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          {totalOverdue > 0
            ? <AlertTriangle size={20} className="mx-auto mb-1 text-red-500" />
            : <Clock size={20} className="mx-auto mb-1 text-[#F7941D]" />}
          <div className="text-2xl font-bold text-gray-800">{totalOverdue > 0 ? totalOverdue : totalHours.toLocaleString()}</div>
          <div className="text-xs text-gray-500">{totalOverdue > 0 ? L("overdue") : L("hours")}</div>
        </div>
      </div>

      {/* Department rows */}
      <div className="space-y-3">
        {kpis.map(k => {
          const rateColor = k.completion_rate >= 70 ? "text-green-600" : k.completion_rate >= 40 ? "text-amber-600" : "text-red-500";
          const rateBg = k.completion_rate >= 70 ? "#22C55E" : k.completion_rate >= 40 ? "#F59E0B" : "#EF4444";
          return (
            <div key={k.dept_id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              {/* Row header: dept name + completion % */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#003087] text-white">{k.dept_code}</span>
                  <span className="font-semibold text-gray-800 truncate">{k.dept_name}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{k.member_count} {L("members")}</span>
                </div>
                <div className="flex items-center gap-2">
                  {k.overdue_tasks > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full flex items-center gap-1">
                      <AlertTriangle size={10} /> {k.overdue_tasks} {L("overdue")}
                    </span>
                  )}
                  <span className={`text-lg font-bold ${rateColor}`}>{k.completion_rate}%</span>
                </div>
              </div>

              {/* Completion bar */}
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: k.completion_rate + "%", background: rateBg }} />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500 mb-0.5">{L("tasks")}</div>
                  <div className="font-semibold text-gray-800">
                    <span className="text-green-600">{k.done_tasks}</span>
                    <span className="text-gray-400"> / </span>
                    <span>{k.total_tasks}</span>
                    {k.in_progress_tasks > 0 && <span className="text-blue-500 ml-1">({k.in_progress_tasks} {L("inProgress")})</span>}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500 mb-0.5">{L("projects")}</div>
                  <div className="font-semibold text-gray-800">{k.active_projects}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500 mb-0.5">{L("taskPerMember")}</div>
                  <div className="font-semibold text-gray-800">{k.productivity_score}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500 mb-0.5">{L("avgHours")}</div>
                  <div className="font-semibold text-gray-800">{k.avg_hours_per_member} {L("hours")}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
