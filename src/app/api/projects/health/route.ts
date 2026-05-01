import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

interface HealthScore {
  project_id: string;
  score: number;         // 0-100
  status: "healthy" | "at_risk" | "critical";
  factors: {
    schedule: number;    // 0-100
    tasks: number;       // 0-100
    risks: number;       // 0-100
    budget: number;      // 0-100
  };
  details: {
    total_tasks: number;
    done_tasks: number;
    overdue_tasks: number;
    open_risks: number;
    days_remaining: number;
    days_total: number;
    progress: number;
    expected_progress: number;
    budget_used_pct: number;
  };
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("project_id");

  // Get projects
  let pQuery = supabaseAdmin.from("projects").select("*").eq("is_archived", false);
  if (projectId) pQuery = pQuery.eq("id", projectId);
  const { data: projects, error } = await pQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date();
  const scores: HealthScore[] = [];

  for (const p of projects || []) {
    // Skip completed/on_hold projects
    if (p.status === "completed" || p.status === "on_hold") {
      scores.push({
        project_id: p.id,
        score: p.status === "completed" ? 100 : 50,
        status: p.status === "completed" ? "healthy" : "at_risk",
        factors: { schedule: 100, tasks: 100, risks: 100, budget: 100 },
        details: { total_tasks: 0, done_tasks: 0, overdue_tasks: 0, open_risks: 0, days_remaining: 0, days_total: 0, progress: p.progress || 0, expected_progress: 100, budget_used_pct: 0 },
      });
      continue;
    }

    // Fetch task stats
    const { data: tasks } = await supabaseAdmin.from("tasks").select("id, status, due_date").eq("project_id", p.id);
    const totalTasks = tasks?.length || 0;
    const doneTasks = tasks?.filter(t => t.status === "done").length || 0;
    const overdueTasks = tasks?.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "done").length || 0;

    // Fetch open risks
    const { count: openRisks } = await supabaseAdmin.from("risks").select("id", { count: "exact", head: true }).eq("project_id", p.id).eq("status", "open");

    // Fetch budget usage
    const { data: budgetRows } = await supabaseAdmin.from("project_budgets").select("actual_cost").eq("project_id", p.id);
    const actualCost = budgetRows?.reduce((s, b) => s + Number(b.actual_cost || 0), 0) || 0;
    const budgetLimit = Number(p.budget_limit || 0);
    const budgetUsedPct = budgetLimit > 0 ? (actualCost / budgetLimit) * 100 : 0;

    // Schedule calculation
    const startDate = p.start_date ? new Date(p.start_date) : null;
    const endDate = p.end_date ? new Date(p.end_date) : null;
    let daysTotal = 0, daysRemaining = 0, expectedProgress = 0;
    if (startDate && endDate) {
      daysTotal = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
      const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / 86400000);
      daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));
      expectedProgress = Math.min(100, Math.max(0, (daysElapsed / daysTotal) * 100));
    }

    // Factor scores (0-100, higher = better)
    // Schedule: compare actual progress vs expected
    const progress = p.progress || 0;
    let scheduleScore = 100;
    if (expectedProgress > 0) {
      const ratio = progress / expectedProgress;
      if (ratio >= 0.9) scheduleScore = 100;
      else if (ratio >= 0.7) scheduleScore = 70;
      else if (ratio >= 0.5) scheduleScore = 50;
      else scheduleScore = 30;
    }
    if (daysRemaining <= 0 && progress < 100) scheduleScore = Math.min(scheduleScore, 20);

    // Tasks: based on overdue ratio
    let taskScore = 100;
    if (totalTasks > 0) {
      const overdueRatio = overdueTasks / totalTasks;
      if (overdueRatio === 0) taskScore = 100;
      else if (overdueRatio <= 0.1) taskScore = 80;
      else if (overdueRatio <= 0.25) taskScore = 60;
      else if (overdueRatio <= 0.5) taskScore = 40;
      else taskScore = 20;
    }

    // Risks: based on open risk count
    const riskCount = openRisks || 0;
    let riskScore = 100;
    if (riskCount === 0) riskScore = 100;
    else if (riskCount <= 2) riskScore = 80;
    else if (riskCount <= 5) riskScore = 60;
    else riskScore = 40;

    // Budget: based on usage vs expected
    let budgetScore = 100;
    if (budgetLimit > 0) {
      if (budgetUsedPct <= 80) budgetScore = 100;
      else if (budgetUsedPct <= 100) budgetScore = 70;
      else if (budgetUsedPct <= 120) budgetScore = 40;
      else budgetScore = 20;
    }

    // Composite (weighted average)
    const composite = Math.round(scheduleScore * 0.35 + taskScore * 0.30 + riskScore * 0.15 + budgetScore * 0.20);
    const healthStatus = composite >= 70 ? "healthy" : composite >= 40 ? "at_risk" : "critical";

    scores.push({
      project_id: p.id,
      score: composite,
      status: healthStatus,
      factors: { schedule: scheduleScore, tasks: taskScore, risks: riskScore, budget: budgetScore },
      details: {
        total_tasks: totalTasks, done_tasks: doneTasks, overdue_tasks: overdueTasks,
        open_risks: riskCount, days_remaining: daysRemaining, days_total: daysTotal,
        progress, expected_progress: Math.round(expectedProgress), budget_used_pct: Math.round(budgetUsedPct),
      },
    });
  }

  return NextResponse.json({ health: scores });
}
