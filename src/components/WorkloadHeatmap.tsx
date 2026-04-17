"use client";
import { useEffect, useMemo, useState } from "react";
import { Activity, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface Allocation {
  id: string;
  project_id: string;
  allocation_pct: number;
  start_date: string;
  end_date: string | null;
  projects?: { name_th?: string | null; name_en?: string | null; project_code?: string | null };
}

interface WorkloadRow {
  member_id: string;
  name: string;
  position?: { color?: string | null; name_th?: string | null; name_en?: string | null } | null;
  weekly_capacity_hours: number;
  total_allocation_pct: number;
  capacity_hours_in_range: number;
  actual_hours: number;
  utilization_pct: number;
  allocations: Allocation[];
}

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

// Get Monday of week containing date
function startOfWeek(d: Date) {
  const x = new Date(d);
  const dow = x.getDay(); // 0=Sun
  const diff = (dow + 6) % 7; // days since Monday
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// Color for utilization %  (0=gray, <60=blue, 60-90=green, 90-110=orange, >110=red)
function utilColor(pct: number) {
  if (pct === 0) return { bg: "#F3F4F6", text: "#9CA3AF", border: "#D1D5DB" };
  if (pct < 60) return { bg: "#DBEAFE", text: "#1D4ED8", border: "#2563EB" };
  if (pct < 90) return { bg: "#DCFCE7", text: "#15803D", border: "#16A34A" };
  if (pct < 110) return { bg: "#FEF3C7", text: "#B45309", border: "#D97706" };
  return { bg: "#FEE2E2", text: "#B91C1C", border: "#DC2626" };
}

interface Props { weeks?: number; }

export default function WorkloadHeatmap({ weeks: weeksCount = 8 }: Props) {
  const [anchor, setAnchor] = useState<Date>(() => startOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rangeRows, setRangeRows] = useState<WorkloadRow[]>([]);
  const [weekRows, setWeekRows] = useState<Map<string, WorkloadRow[]>>(new Map());

  const weekStarts = useMemo(() => {
    return Array.from({ length: weeksCount }, (_, i) => addDays(anchor, i * 7));
  }, [anchor, weeksCount]);

  const rangeStart = weekStarts[0];
  const rangeEnd = addDays(weekStarts[weekStarts.length - 1], 6);

  // Fetch overall range (for member list + totals) AND each week
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true); setErr(null);
      try {
        const overallReq = fetch(`/api/workload?start=${fmtDate(rangeStart)}&end=${fmtDate(rangeEnd)}`).then(r => r.json());
        const weekReqs = weekStarts.map(ws => {
          const we = addDays(ws, 6);
          return fetch(`/api/workload?start=${fmtDate(ws)}&end=${fmtDate(we)}`).then(r => r.json());
        });
        const [overall, ...weekResults] = await Promise.all([overallReq, ...weekReqs]);
        if (cancelled) return;
        if (overall.error) throw new Error(overall.error);
        setRangeRows(overall.workload || []);
        const map = new Map<string, WorkloadRow[]>();
        weekStarts.forEach((ws, i) => map.set(fmtDate(ws), weekResults[i]?.workload || []));
        setWeekRows(map);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor, weeksCount]);

  const utilByMemberWeek = useMemo(() => {
    const m = new Map<string, Map<string, WorkloadRow>>();
    weekStarts.forEach(ws => {
      const key = fmtDate(ws);
      const rows = weekRows.get(key) || [];
      const inner = new Map<string, WorkloadRow>();
      rows.forEach(r => inner.set(r.member_id, r));
      m.set(key, inner);
    });
    return m;
  }, [weekRows, weekStarts]);

  const shift = (n: number) => setAnchor(addDays(anchor, n * 7));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 text-gray-900">
          <Activity size={20} className="text-[#00AEEF]" />
          <h2 className="text-lg font-semibold">Workload Heatmap</h2>
          <span className="text-xs text-gray-500">{fmtDate(rangeStart)} → {fmtDate(rangeEnd)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-weeksCount)} className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-600">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setAnchor(startOfWeek(new Date()))} className="px-3 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm flex items-center gap-1.5">
            <Calendar size={14} /> วันนี้
          </button>
          <button onClick={() => shift(weeksCount)} className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-600">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 bg-white border border-gray-300 rounded-lg p-3">
        <span className="font-medium text-gray-600">Utilization %:</span>
        <span className="px-2 py-0.5 rounded" style={{ background: "#F3F4F6", color: "#9CA3AF", border: "1px solid #D1D5DB" }}>0</span>
        <span className="px-2 py-0.5 rounded" style={{ background: "#DBEAFE", color: "#1D4ED8", border: "1px solid #2563EB" }}>&lt;60% Under</span>
        <span className="px-2 py-0.5 rounded" style={{ background: "#DCFCE7", color: "#15803D", border: "1px solid #16A34A" }}>60-90% Optimal</span>
        <span className="px-2 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#B45309", border: "1px solid #D97706" }}>90-110% High</span>
        <span className="px-2 py-0.5 rounded" style={{ background: "#FEE2E2", color: "#B91C1C", border: "1px solid #DC2626" }}>&gt;110% Over ⚠</span>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{err}</div>}

      <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 bg-gray-50 text-left px-4 py-3 font-medium text-gray-500 z-10 min-w-[180px]">Member</th>
                <th className="text-right px-3 py-3 font-medium text-gray-500">Cap (h/wk)</th>
                <th className="text-right px-3 py-3 font-medium text-gray-500">Alloc %</th>
                {weekStarts.map(ws => (
                  <th key={fmtDate(ws)} className="text-center px-2 py-3 font-medium text-gray-500 min-w-[90px]">
                    <div className="text-xs">{ws.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    <div className="text-[10px] text-gray-400">W{Math.ceil((ws.getTime() - new Date(ws.getFullYear(), 0, 1).getTime()) / 604800000)}</div>
                  </th>
                ))}
                <th className="text-right px-3 py-3 font-medium text-gray-500">Total Hrs</th>
                <th className="text-right px-3 py-3 font-medium text-gray-500">Avg Util</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={weekStarts.length + 5} className="text-center py-12 text-gray-500">Loading...</td></tr>
              ) : rangeRows.length === 0 ? (
                <tr><td colSpan={weekStarts.length + 5} className="text-center py-12 text-gray-500">ไม่มีข้อมูลสมาชิก</td></tr>
              ) : rangeRows.map(r => {
                const overAlloc = r.total_allocation_pct > 100;
                return (
                  <tr key={r.member_id} className="border-t border-gray-300 hover:bg-gray-50/50">
                    <td className="sticky left-0 bg-white px-4 py-3 z-10">
                      <div className="text-gray-900 font-medium">{r.name}</div>
                      {r.position?.name_en && (
                        <div className="text-xs" style={{ color: r.position?.color || "#6B7280" }}>
                          {r.position.name_en}
                        </div>
                      )}
                    </td>
                    <td className="text-right px-3 py-3 text-gray-600">{r.weekly_capacity_hours}</td>
                    <td className={`text-right px-3 py-3 font-medium ${overAlloc ? "text-red-600" : "text-gray-600"}`}>
                      {r.total_allocation_pct}%{overAlloc && " ⚠"}
                    </td>
                    {weekStarts.map(ws => {
                      const w = utilByMemberWeek.get(fmtDate(ws))?.get(r.member_id);
                      const pct = w?.utilization_pct ?? 0;
                      const c = utilColor(pct);
                      const hours = w?.actual_hours ?? 0;
                      return (
                        <td key={fmtDate(ws)} className="text-center px-1 py-1.5">
                          <div
                            className="rounded-md py-2 text-xs font-medium border"
                            style={{ background: c.bg, color: c.text, borderColor: c.border }}
                            title={`${pct}% • ${hours.toFixed(1)}h logged`}>
                            <div>{pct}%</div>
                            <div className="text-[10px] opacity-70">{hours.toFixed(1)}h</div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-right px-3 py-3 text-gray-900 font-medium">{r.actual_hours.toFixed(1)}h</td>
                    <td className="text-right px-3 py-3" style={{ color: utilColor(r.utilization_pct).text }}>
                      <span className="font-semibold">{r.utilization_pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
