"use client";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Download, Calendar, Users, FolderKanban, Briefcase } from "lucide-react";
import * as XLSX from "xlsx";

interface TimeLog {
  id: string;
  project_id: string;
  team_member_id: string;
  log_date: string;
  hours: number;
  hourly_rate_at_log: number;
  status: string;
  is_billable: boolean;
  description: string | null;
  projects?: { name_th?: string | null; name_en?: string | null; project_code?: string | null } | null;
  team_members?: { first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null; position_id?: string | null } | null;
  tasks?: { title?: string | null } | null;
}
interface Position { id: string; name_en?: string | null; name_th?: string | null; color?: string | null; }
interface Member { id: string; position_id?: string | null; first_name_en?: string | null; last_name_en?: string | null; first_name_th?: string | null; last_name_th?: string | null; }
interface Project { id: string; name_en?: string | null; name_th?: string | null; project_code?: string | null; budget_limit?: number | null; estimated_hours?: number | null; }

interface Props {
  positions: Position[];
  members: Member[];
  projects: Project[];
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthsAgo = (n: number) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0, 10); };

const memName = (m?: Member | TimeLog["team_members"] | null) => m
  ? [m.first_name_en, m.last_name_en].filter(Boolean).join(" ") || [m.first_name_th, m.last_name_th].filter(Boolean).join(" ") || "-"
  : "-";
const projName = (p?: Project | TimeLog["projects"] | null) => p
  ? (p.project_code ? `[${p.project_code}] ${p.name_th || p.name_en || ""}` : (p.name_th || p.name_en || "-"))
  : "-";
const posName = (p?: Position | null) => p ? (p.name_en || p.name_th || "-") : "-";

export default function ManpowerReport({ positions, members, projects }: Props) {
  const [start, setStart] = useState(monthsAgo(1));
  const [end, setEnd] = useState(todayISO());
  const [statusFilter, setStatusFilter] = useState<"approved" | "all">("approved");
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const memberPosMap = useMemo(() => {
    const m = new Map<string, Position | undefined>();
    members.forEach(mem => m.set(mem.id, positions.find(p => p.id === mem.position_id)));
    return m;
  }, [members, positions]);

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`/api/timelogs${statusFilter === "approved" ? "?status=approved" : ""}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Load failed");
      const filtered = (j.timelogs as TimeLog[]).filter(l => l.log_date >= start && l.log_date <= end);
      setLogs(filtered);
    } catch (e) { setErr(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [start, end, statusFilter]);

  // Aggregations
  const byProject = useMemo(() => {
    const m = new Map<string, { project: Project | undefined; hours: number; cost: number; billable: number; entries: number }>();
    logs.forEach(l => {
      const k = l.project_id;
      const cur = m.get(k) ?? { project: projectMap.get(k), hours: 0, cost: 0, billable: 0, entries: 0 };
      cur.hours += Number(l.hours);
      cur.cost += Number(l.hours) * Number(l.hourly_rate_at_log);
      if (l.is_billable) cur.billable += Number(l.hours) * Number(l.hourly_rate_at_log);
      cur.entries += 1;
      m.set(k, cur);
    });
    return Array.from(m.values()).sort((a, b) => b.cost - a.cost);
  }, [logs, projectMap]);

  const byMember = useMemo(() => {
    const m = new Map<string, { member?: Member | TimeLog["team_members"]; position?: Position; hours: number; cost: number; entries: number }>();
    logs.forEach(l => {
      const k = l.team_member_id;
      const cur = m.get(k) ?? { member: l.team_members ?? members.find(x => x.id === k), position: memberPosMap.get(k), hours: 0, cost: 0, entries: 0 };
      cur.hours += Number(l.hours);
      cur.cost += Number(l.hours) * Number(l.hourly_rate_at_log);
      cur.entries += 1;
      m.set(k, cur);
    });
    return Array.from(m.values()).sort((a, b) => b.cost - a.cost);
  }, [logs, members, memberPosMap]);

  const byPosition = useMemo(() => {
    const m = new Map<string, { position?: Position; hours: number; cost: number; entries: number; memberCount: Set<string> }>();
    logs.forEach(l => {
      const pos = memberPosMap.get(l.team_member_id);
      const k = pos?.id ?? "_unassigned";
      const cur = m.get(k) ?? { position: pos, hours: 0, cost: 0, entries: 0, memberCount: new Set() };
      cur.hours += Number(l.hours);
      cur.cost += Number(l.hours) * Number(l.hourly_rate_at_log);
      cur.entries += 1;
      cur.memberCount.add(l.team_member_id);
      m.set(k, cur);
    });
    return Array.from(m.values()).sort((a, b) => b.cost - a.cost);
  }, [logs, memberPosMap]);

  const totals = useMemo(() => {
    const hours = logs.reduce((s, l) => s + Number(l.hours), 0);
    const cost = logs.reduce((s, l) => s + Number(l.hours) * Number(l.hourly_rate_at_log), 0);
    const billable = logs.filter(l => l.is_billable).reduce((s, l) => s + Number(l.hours) * Number(l.hourly_rate_at_log), 0);
    return { hours, cost, billable, nonBillable: cost - billable, entries: logs.length };
  }, [logs]);

  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["Manpower Report"],
      ["Period", `${start} → ${end}`],
      ["Status Filter", statusFilter],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Metric", "Value"],
      ["Total Hours", totals.hours.toFixed(2)],
      ["Total Cost (THB)", totals.cost.toFixed(2)],
      ["Billable Cost (THB)", totals.billable.toFixed(2)],
      ["Non-Billable Cost (THB)", totals.nonBillable.toFixed(2)],
      ["Entries Count", totals.entries],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

    // By Project
    const projData = [["Project Code", "Project Name", "Hours", "Cost (THB)", "Billable (THB)", "Entries", "Budget", "Estimated Hrs", "Cost vs Budget %"]];
    byProject.forEach(p => {
      const budget = Number(p.project?.budget_limit ?? 0);
      projData.push([
        p.project?.project_code ?? "",
        p.project?.name_en || p.project?.name_th || "",
        p.hours.toFixed(2),
        p.cost.toFixed(2),
        p.billable.toFixed(2),
        String(p.entries),
        budget.toFixed(2),
        String(p.project?.estimated_hours ?? ""),
        budget > 0 ? `${((p.cost / budget) * 100).toFixed(1)}%` : "—",
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(projData), "By Project");

    // By Member
    const memData = [["Member", "Position", "Hours", "Cost (THB)", "Avg Rate", "Entries"]];
    byMember.forEach(mb => {
      memData.push([
        memName(mb.member),
        posName(mb.position),
        mb.hours.toFixed(2),
        mb.cost.toFixed(2),
        mb.hours > 0 ? (mb.cost / mb.hours).toFixed(2) : "—",
        String(mb.entries),
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(memData), "By Member");

    // By Position
    const posData = [["Position", "Members", "Hours", "Cost (THB)", "Entries"]];
    byPosition.forEach(p => {
      posData.push([
        posName(p.position),
        String(p.memberCount.size),
        p.hours.toFixed(2),
        p.cost.toFixed(2),
        String(p.entries),
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(posData), "By Position");

    // Raw entries
    const rawData = [["Date", "Member", "Project", "Task", "Hours", "Rate", "Amount", "Billable", "Status", "Description"]];
    logs.forEach(l => {
      rawData.push([
        l.log_date,
        memName(l.team_members),
        projName(l.projects),
        l.tasks?.title ?? "",
        Number(l.hours).toFixed(2),
        Number(l.hourly_rate_at_log).toFixed(2),
        (Number(l.hours) * Number(l.hourly_rate_at_log)).toFixed(2),
        l.is_billable ? "Yes" : "No",
        l.status,
        l.description ?? "",
      ]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rawData), "Raw Logs");

    XLSX.writeFile(wb, `manpower-report_${start}_to_${end}.xlsx`);
  };

  const Card = ({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub?: string }) => (
    <div className="bg-white border border-gray-300 rounded-xl p-5">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        <Icon size={16} /><span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-900">
          <BarChart3 size={20} className="text-[#00AEEF]" />
          <h2 className="text-lg font-semibold">Manpower Report</h2>
        </div>
        <button onClick={exportXLSX} disabled={logs.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#F7941D] hover:bg-[#FFA630] disabled:opacity-50 text-gray-900 text-sm font-medium rounded-lg">
          <Download size={16} /> Export Excel
        </button>
      </div>

      <div className="flex flex-wrap gap-3 bg-white border border-gray-300 rounded-lg p-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1"><Calendar size={12} className="inline mr-1" />Start</label>
          <input type="date" className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End</label>
          <input type="date" className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900" value={end} onChange={e => setEnd(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900"
            value={statusFilter} onChange={e => setStatusFilter(e.target.value as "approved" | "all")}>
            <option value="approved">Approved only</option>
            <option value="all">All (incl. pending/rejected)</option>
          </select>
        </div>
        <div className="text-xs text-gray-500 ml-2">{loading ? "Loading..." : `${logs.length} entries`}</div>
      </div>

      {err && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{err}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card icon={Users} label="Total Hours" value={totals.hours.toFixed(1)} sub={`${totals.entries} entries`} />
        <Card icon={Briefcase} label="Total Cost" value={`฿${Math.round(totals.cost).toLocaleString()}`} />
        <Card icon={FolderKanban} label="Billable" value={`฿${Math.round(totals.billable).toLocaleString()}`} sub={totals.cost > 0 ? `${((totals.billable / totals.cost) * 100).toFixed(1)}% of total` : ""} />
        <Card icon={BarChart3} label="Avg Rate" value={totals.hours > 0 ? `฿${(totals.cost / totals.hours).toFixed(0)}/h` : "—"} />
      </div>

      {/* By Project */}
      <Section title="By Project" count={byProject.length}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Project</th>
              <th className="text-right px-4 py-2 font-medium">Hours</th>
              <th className="text-right px-4 py-2 font-medium">Cost</th>
              <th className="text-right px-4 py-2 font-medium">Billable</th>
              <th className="text-right px-4 py-2 font-medium">Budget</th>
              <th className="text-right px-4 py-2 font-medium">vs Budget</th>
            </tr>
          </thead>
          <tbody>
            {byProject.map((p, i) => {
              const budget = Number(p.project?.budget_limit ?? 0);
              const pct = budget > 0 ? (p.cost / budget) * 100 : 0;
              const over = pct > 100;
              return (
                <tr key={i} className="border-t border-gray-300">
                  <td className="px-4 py-2 text-gray-900">{projName(p.project)}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{p.hours.toFixed(1)}</td>
                  <td className="px-4 py-2 text-right text-[#F7941D] font-medium">฿{Math.round(p.cost).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-gray-600">฿{Math.round(p.billable).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-gray-500">{budget > 0 ? `฿${Math.round(budget).toLocaleString()}` : "—"}</td>
                  <td className={`px-4 py-2 text-right font-medium ${over ? "text-red-400" : "text-gray-600"}`}>
                    {budget > 0 ? `${pct.toFixed(1)}%${over ? " ⚠" : ""}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      {/* By Member */}
      <Section title="By Member" count={byMember.length}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Member</th>
              <th className="text-left px-4 py-2 font-medium">Position</th>
              <th className="text-right px-4 py-2 font-medium">Hours</th>
              <th className="text-right px-4 py-2 font-medium">Cost</th>
              <th className="text-right px-4 py-2 font-medium">Avg Rate</th>
            </tr>
          </thead>
          <tbody>
            {byMember.map((m, i) => (
              <tr key={i} className="border-t border-gray-300">
                <td className="px-4 py-2 text-gray-900">{memName(m.member)}</td>
                <td className="px-4 py-2 text-gray-600" style={{ color: m.position?.color ?? undefined }}>{posName(m.position)}</td>
                <td className="px-4 py-2 text-right text-gray-600">{m.hours.toFixed(1)}</td>
                <td className="px-4 py-2 text-right text-[#F7941D] font-medium">฿{Math.round(m.cost).toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-gray-600">฿{m.hours > 0 ? Math.round(m.cost / m.hours).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* By Position */}
      <Section title="By Position" count={byPosition.length}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Position</th>
              <th className="text-right px-4 py-2 font-medium">Members</th>
              <th className="text-right px-4 py-2 font-medium">Hours</th>
              <th className="text-right px-4 py-2 font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {byPosition.map((p, i) => (
              <tr key={i} className="border-t border-gray-300">
                <td className="px-4 py-2 text-gray-900" style={{ color: p.position?.color ?? undefined }}>{posName(p.position)}</td>
                <td className="px-4 py-2 text-right text-gray-600">{p.memberCount.size}</td>
                <td className="px-4 py-2 text-right text-gray-600">{p.hours.toFixed(1)}</td>
                <td className="px-4 py-2 text-right text-[#F7941D] font-medium">฿{Math.round(p.cost).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-300 flex items-center justify-between">
        <div className="text-gray-900 font-medium">{title}</div>
        <div className="text-xs text-gray-500">{count} rows</div>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
