import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("task_templates").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager", "leader"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();

  // mode: 'apply_to_project' — instantiate template tasks into a project
  if (b.mode === "apply_to_project") {
    if (!b.template_id || !b.project_id) return NextResponse.json({ error: "template_id, project_id required" }, { status: 400 });
    const { data: tpl } = await supabaseAdmin.from("task_templates").select("*").eq("id", b.template_id).single();
    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    const tasks = (tpl.tasks_data ?? []) as Record<string, unknown>[];
    if (!tasks.length) return NextResponse.json({ tasks: [], inserted: 0 });
    const baseDate = b.start_date ? new Date(b.start_date) : new Date();
    const rows = tasks.map((t, idx) => ({
      ...t, project_id: b.project_id,
      start_date: t.start_date || baseDate.toISOString().slice(0, 10),
      due_date: t.due_date || new Date(baseDate.getTime() + (idx + 1) * 86400000 * 3).toISOString().slice(0, 10),
      status: "todo", parent_task_id: null, sort_order: idx,
    }));
    const { data, error } = await supabaseAdmin.from("tasks").insert(rows).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tasks: data, inserted: data?.length ?? 0 }, { status: 201 });
  }

  // default: create a new template (optionally from existing project tasks)
  if (!b.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  let tasksData = b.tasks_data ?? [];
  if (b.from_project_id) {
    const { data: srcTasks } = await supabaseAdmin.from("tasks").select("title,description,priority,estimated_hours,tags").eq("project_id", b.from_project_id).order("sort_order");
    tasksData = srcTasks ?? [];
  }
  const { data, error } = await supabaseAdmin.from("task_templates").insert({
    name: b.name, description: b.description || null, tasks_data: tasksData, created_by: ctx.userId,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data }, { status: 201 });
}
