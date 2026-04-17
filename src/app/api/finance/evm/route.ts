import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requirePermission } from "@/lib/auth-server";

// Earned Value Management
// BAC = Budget at Completion (project budget_limit)
// PV (Planned Value) = BAC × planned % complete (by schedule)
// EV (Earned Value)  = BAC × actual % complete (avg task completion or progress field)
// AC (Actual Cost)   = sum(approved time_logs cost)
// SPI = EV/PV, CPI = EV/AC, EAC = BAC/CPI, ETC = EAC-AC, VAC = BAC-EAC
export async function GET(req: NextRequest) {
  const ctx = await requirePermission(req, "finance", 1);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const projectId = req.nextUrl.searchParams.get("project_id");

  let pq = supabaseAdmin.from("projects").select("id,project_code,name_th,name_en,budget_limit,start_date,end_date,progress").eq("is_archived", false);
  if (projectId) pq = pq.eq("id", projectId);
  const { data: projects } = await pq;

  const today = new Date();

  const rows = await Promise.all((projects ?? []).map(async p => {
    const bac = Number(p.budget_limit ?? 0);
    let plannedPct = 0;
    if (p.start_date && p.end_date) {
      const s = new Date(p.start_date).getTime();
      const e = new Date(p.end_date).getTime();
      const now = today.getTime();
      if (e > s) plannedPct = Math.max(0, Math.min(1, (now - s) / (e - s)));
    }
    // Actual % complete: prefer tasks completion ratio, fall back to project.progress
    const { data: tasks } = await supabaseAdmin.from("tasks").select("status").eq("project_id", p.id);
    let actualPct = (p.progress ?? 0) / 100;
    if (tasks && tasks.length) {
      const done = tasks.filter(t => t.status === "done").length;
      actualPct = done / tasks.length;
    }
    const { data: logs } = await supabaseAdmin.from("time_logs").select("hours,hourly_rate_at_log").eq("project_id", p.id).eq("status", "approved");
    const ac = (logs ?? []).reduce((s, l) => s + Number(l.hours) * Number(l.hourly_rate_at_log ?? 0), 0);

    const pv = bac * plannedPct;
    const ev = bac * actualPct;
    const cv = ev - ac;          // cost variance
    const sv = ev - pv;          // schedule variance
    const cpi = ac > 0 ? ev / ac : 0;
    const spi = pv > 0 ? ev / pv : 0;
    const eac = cpi > 0 ? bac / cpi : bac;
    const etc = eac - ac;
    const vac = bac - eac;

    let health: "green" | "yellow" | "red" = "green";
    if (cpi < 0.85 || spi < 0.85) health = "red";
    else if (cpi < 0.95 || spi < 0.95) health = "yellow";

    return {
      project_id: p.id, project_code: p.project_code, name: p.name_th || p.name_en,
      bac, pv: Math.round(pv), ev: Math.round(ev), ac: Math.round(ac),
      cv: Math.round(cv), sv: Math.round(sv),
      cpi: Math.round(cpi * 100) / 100, spi: Math.round(spi * 100) / 100,
      eac: Math.round(eac), etc: Math.round(etc), vac: Math.round(vac),
      planned_pct: Math.round(plannedPct * 1000) / 10,
      actual_pct: Math.round(actualPct * 1000) / 10,
      health,
    };
  }));

  return NextResponse.json({ rows });
}
