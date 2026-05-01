import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

function computeNext(freq: string, base: Date, dayOfWeek?: number | null, dayOfMonth?: number | null): string {
  const d = new Date(base);
  if (freq === "daily") d.setDate(d.getDate() + 1);
  else if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "biweekly") d.setDate(d.getDate() + 14);
  else if (freq === "monthly") {
    d.setMonth(d.getMonth() + 1);
    if (dayOfMonth) d.setDate(Math.min(dayOfMonth, 28));
  }
  if (freq === "weekly" || freq === "biweekly") {
    if (dayOfWeek != null) {
      const diff = (dayOfWeek - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + diff);
    }
  }
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.searchParams.get("project_id");
  let q = supabaseAdmin.from("recurring_tasks").select("*, projects(id,project_code,name_th,name_en)").order("next_run_date");
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager", "leader"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();

  // mode: 'run_due' — generate tasks for everything due today or earlier
  if (b.mode === "run_due") {
    const today = new Date().toISOString().slice(0, 10);
    const { data: due } = await supabaseAdmin.from("recurring_tasks").select("*").eq("active", true).lte("next_run_date", today);
    if (!due?.length) return NextResponse.json({ generated: 0 });
    const newTasks = due.map(r => ({
      project_id: r.project_id, title: r.title, title_en: r.title_en || null, title_jp: r.title_jp || null,
      description: r.description, priority: r.priority, assignee_id: r.assignee_id,
      estimated_hours: r.estimated_hours, tags: r.tags, status: "todo", due_date: r.next_run_date,
    }));
    await supabaseAdmin.from("tasks").insert(newTasks);
    for (const r of due) {
      const next = computeNext(r.frequency, new Date(r.next_run_date), r.day_of_week, r.day_of_month);
      await supabaseAdmin.from("recurring_tasks").update({ last_run_date: r.next_run_date, next_run_date: next }).eq("id", r.id);
    }
    return NextResponse.json({ generated: due.length });
  }

  if (!b.title || !b.project_id || !b.frequency || !b.next_run_date) {
    return NextResponse.json({ error: "title, project_id, frequency, next_run_date required" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from("recurring_tasks").insert({
    project_id: b.project_id, title: b.title, title_en: b.title_en || null, title_jp: b.title_jp || null,
    description: b.description || null, priority: b.priority || "medium", assignee_id: b.assignee_id || null,
    estimated_hours: b.estimated_hours ?? null, tags: b.tags ?? null,
    frequency: b.frequency, day_of_week: b.day_of_week ?? null, day_of_month: b.day_of_month ?? null,
    next_run_date: b.next_run_date, active: b.active ?? true, created_by: ctx.userId,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
