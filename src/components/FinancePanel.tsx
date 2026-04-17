"use client";
import { useEffect, useState, useCallback } from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, BarChart3 } from "lucide-react";

interface PnLRow {
  project_id: string; project_code?: string | null; name?: string | null; status?: string | null;
  budget: number; revenue: number; paid: number; outstanding: number;
  labor_cost: number; total_cost: number; gross_profit: number; margin_pct: number;
}
interface PnLTotals { revenue: number; paid: number; outstanding: number; cost: number; profit: number; budget: number; }
interface EVMRow {
  project_id: string; project_code?: string | null; name?: string | null;
  bac: number; pv: number; ev: number; ac: number; cv: number; sv: number;
  cpi: number; spi: number; eac: number; etc: number; vac: number;
  planned_pct: number; actual_pct: number; health: "green" | "yellow" | "red";
}

const fmtMoney = (n?: number | null) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(Number(n ?? 0));
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

export default function FinancePanel({ filterProjectId = "all", refreshKey = 0 }: { filterProjectId?: string; refreshKey?: number }) {
  const [tab, setTab] = useState<"pnl" | "evm">("pnl");
  const [pnl, setPnl] = useState<{ rows: PnLRow[]; totals: PnLTotals }>({ rows: [], totals: { revenue: 0, paid: 0, outstanding: 0, cost: 0, profit: 0, budget: 0 } });
  const [evm, setEvm] = useState<EVMRow[]>([]);
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const [start, setStart] = useState(new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date(today.getFullYear(), 11, 31).toISOString().slice(0, 10));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const pq = new URLSearchParams();
      if (start) pq.set("start_date", start);
      if (end) pq.set("end_date", end);
      if (filterProjectId !== "all") pq.set("project_id", filterProjectId);
      const eq = new URLSearchParams();
      if (filterProjectId !== "all") eq.set("project_id", filterProjectId);

      const [a, b] = await Promise.all([
        fetch(`/api/finance/pnl?${pq}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/finance/evm?${eq}`).then(r => r.ok ? r.json() : null),
      ]);
      if (a) setPnl(a);
      if (b) setEvm(b.rows ?? []);
    } finally { setLoading(false); }
  }, [start, end, filterProjectId]);
  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const t = pnl.totals;
  const totalMargin = t.revenue > 0 ? (t.profit / t.revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex rounded-xl overflow-hidden border border-[#E5E7EB]">
          <button onClick={() => setTab("pnl")}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${tab === "pnl" ? "text-slate-900" : "text-slate-600"}`}
            style={tab === "pnl" ? { background: "#003087" } : { background: "#F5F5F5" }}>
            <BarChart3 size={14} /> P&L
          </button>
          <button onClick={() => setTab("evm")}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${tab === "evm" ? "text-slate-900" : "text-slate-600"}`}
            style={tab === "evm" ? { background: "#003087" } : { background: "#F5F5F5" }}>
            <Activity size={14} /> EVM
          </button>
        </div>
        {tab === "pnl" && (
          <div className="flex items-center gap-2">
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm text-slate-900" />
            <span className="text-slate-600">→</span>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm text-slate-900" />
          </div>
        )}
      </div>

      {tab === "pnl" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KPI icon={DollarSign} label="รายได้" value={fmtMoney(t.revenue)} color="#00AEEF" />
            <KPI icon={TrendingDown} label="ต้นทุน" value={fmtMoney(t.cost)} color="#EF4444" />
            <KPI icon={t.profit >= 0 ? TrendingUp : TrendingDown} label="กำไรขั้นต้น" value={fmtMoney(t.profit)}
              color={t.profit >= 0 ? "#22C55E" : "#EF4444"} sub={fmtPct(totalMargin)} />
            <KPI icon={DollarSign} label="ชำระแล้ว" value={fmtMoney(t.paid)} color="#22C55E" />
            <KPI icon={DollarSign} label="ค้างเก็บ" value={fmtMoney(t.outstanding)} color="#F7941D" />
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F5F5F5] text-slate-600 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">โครงการ</th>
                    <th className="text-right px-4 py-3">งบ</th>
                    <th className="text-right px-4 py-3">รายได้</th>
                    <th className="text-right px-4 py-3">ต้นทุน</th>
                    <th className="text-right px-4 py-3">กำไร</th>
                    <th className="text-right px-4 py-3">Margin</th>
                    <th className="text-right px-4 py-3">ค้างเก็บ</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && !pnl.rows.length && (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-600">ไม่มีข้อมูล</td></tr>
                  )}
                  {pnl.rows.map(r => (
                    <tr key={r.project_id} className="border-t border-[#E5E7EB]">
                      <td className="px-4 py-3"><span className="text-[10px] font-mono text-slate-600">{r.project_code}</span><div className="text-slate-900">{r.name}</div></td>
                      <td className="px-4 py-3 text-right text-slate-700">{fmtMoney(r.budget)}</td>
                      <td className="px-4 py-3 text-right text-cyan-300">{fmtMoney(r.revenue)}</td>
                      <td className="px-4 py-3 text-right text-red-300">{fmtMoney(r.total_cost)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${r.gross_profit >= 0 ? "text-green-300" : "text-red-300"}`}>{fmtMoney(r.gross_profit)}</td>
                      <td className={`px-4 py-3 text-right ${r.margin_pct >= 20 ? "text-green-300" : r.margin_pct >= 0 ? "text-yellow-300" : "text-red-300"}`}>{fmtPct(r.margin_pct)}</td>
                      <td className="px-4 py-3 text-right text-orange-300">{fmtMoney(r.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
                {pnl.rows.length > 0 && (
                  <tfoot className="bg-[#F5F5F5] font-bold">
                    <tr>
                      <td className="px-4 py-3 text-slate-900">รวม</td>
                      <td className="px-4 py-3 text-right text-slate-700">{fmtMoney(t.budget)}</td>
                      <td className="px-4 py-3 text-right text-cyan-300">{fmtMoney(t.revenue)}</td>
                      <td className="px-4 py-3 text-right text-red-300">{fmtMoney(t.cost)}</td>
                      <td className={`px-4 py-3 text-right ${t.profit >= 0 ? "text-green-300" : "text-red-300"}`}>{fmtMoney(t.profit)}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{fmtPct(totalMargin)}</td>
                      <td className="px-4 py-3 text-right text-orange-300">{fmtMoney(t.outstanding)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "evm" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <KPI icon={Target} label="โครงการ Healthy" value={String(evm.filter(e => e.health === "green").length)} color="#22C55E" />
            <KPI icon={Activity} label="ต้องระวัง" value={String(evm.filter(e => e.health === "yellow").length)} color="#F7941D" />
            <KPI icon={TrendingDown} label="ต้องแก้ไขด่วน" value={String(evm.filter(e => e.health === "red").length)} color="#EF4444" />
          </div>

          <div className="space-y-3">
            {!loading && !evm.length && (
              <div className="text-center py-16 bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl text-slate-600">
                <Activity size={40} className="mx-auto mb-3 text-slate-600" />ไม่มีข้อมูล EVM
              </div>
            )}
            {evm.map(e => {
              const healthColor = e.health === "green" ? "#22C55E" : e.health === "yellow" ? "#F7941D" : "#EF4444";
              return (
                <div key={e.project_id} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <div className="text-[10px] font-mono text-slate-600">{e.project_code}</div>
                      <div className="text-base font-medium text-slate-900">{e.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: healthColor }}>● {e.health === "green" ? "Healthy" : e.health === "yellow" ? "At Risk" : "Critical"}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-3">
                    <Metric label="BAC" value={fmtMoney(e.bac)} />
                    <Metric label="PV" value={fmtMoney(e.pv)} />
                    <Metric label="EV" value={fmtMoney(e.ev)} color="#00AEEF" />
                    <Metric label="AC" value={fmtMoney(e.ac)} color="#EF4444" />
                    <Metric label="EAC" value={fmtMoney(e.eac)} color="#F7941D" />
                    <Metric label="VAC" value={fmtMoney(e.vac)} color={e.vac >= 0 ? "#22C55E" : "#EF4444"} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric label="CPI" value={e.cpi.toFixed(2)} color={e.cpi >= 1 ? "#22C55E" : e.cpi >= 0.85 ? "#F7941D" : "#EF4444"} />
                    <Metric label="SPI" value={e.spi.toFixed(2)} color={e.spi >= 1 ? "#22C55E" : e.spi >= 0.85 ? "#F7941D" : "#EF4444"} />
                    <Metric label="Planned %" value={fmtPct(e.planned_pct)} />
                    <Metric label="Actual %" value={fmtPct(e.actual_pct)} color="#00AEEF" />
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Schedule progress</span>
                      <span>SV: {fmtMoney(e.sv)} · CV: {fmtMoney(e.cv)}</span>
                    </div>
                    <div className="h-2 bg-[#F5F5F5] rounded-full relative overflow-hidden">
                      <div className="absolute h-full bg-slate-600" style={{ width: `${e.planned_pct}%` }} />
                      <div className="absolute h-full" style={{ width: `${e.actual_pct}%`, background: healthColor, opacity: 0.8 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, color, sub }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-3">
      <div className="flex items-center gap-2 text-xs text-slate-600 mb-1"><Icon size={12} /> {label}</div>
      <div className="text-base font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color }}>{sub}</div>}
    </div>
  );
}
function Metric({ label, value, color = "#FFFFFF" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#F5F5F5] rounded-lg p-2">
      <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-medium" style={{ color }}>{value}</div>
    </div>
  );
}
