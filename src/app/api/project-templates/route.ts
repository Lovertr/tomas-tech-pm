import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabaseAdmin.from("project_templates").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ templates: data ?? [] });
}

// Create template from existing project, or clone project from template
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();

  if (b.mode === "save_from_project") {
    if (!b.project_id || !b.name) return NextResponse.json({ error: "project_id, name required" }, { status: 400 });
    const [{ data: proj }, { data: tasks }, { data: milestones }, { data: pm }] = await Promise.all([
      supabaseAdmin.from("projects").select("*").eq("id", b.project_id).single(),
      supabaseAdmin.from("tasks").select("title,description,status,priority,estimated_hours,tags,parent_task_id,sort_order").eq("project_id", b.project_id),
      supabaseAdmin.from("milestones").select("title,description,sort_order").eq("project_id", b.project_id),
      supabaseAdmin.from("project_members").select("team_member_id,allocation_pct,role_in_project,notes").eq("project_id", b.project_id),
    ]);
    const templateData = { project: proj, tasks, milestones, project_members: pm };
    const { data, error } = await supabaseAdmin.from("project_templates").insert({
      name: b.name, description: b.description || null, category: b.category || null,
      template_data: templateData, created_by: ctx.userId,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ template: data }, { status: 201 });
  }

  if (b.mode === "clone_to_project") {
    if (!b.template_id || !b.project_code || !b.name_th) return NextResponse.json({ error: "template_id, project_code, name_th required" }, { status: 400 });
    const { data: tpl } = await supabaseAdmin.from("project_templates").select("*").eq("id", b.template_id).single();
    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    const td = tpl.template_data;

    const { data: newProj, error: pErr } = await supabaseAdmin.from("projects").insert({
      project_code: b.project_code, name_th: b.name_th, name_en: b.name_en || null,
      description: td.project?.description || null, status: "planning",
      priority: td.project?.priority || "medium",
      budget_limit: b.budget_limit ?? td.project?.budget_limit ?? null,
      estimated_hours: td.project?.estimated_hours ?? null,
      start_date: b.start_date || null, end_date: b.end_date || null,
    }).select().single();
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

    if (td.tasks?.length) {
      await supabaseAdmin.from("tasks").insert(td.tasks.map((t: Record<string, unknown>) => ({ ...t, project_id: newProj.id, parent_task_id: null })));
    }
    if (td.milestones?.length) {
      await supabaseAdmin.from("milestones").insert(td.milestones.map((m: Record<string, unknown>) => ({ ...m, project_id: newProj.id, due_date: b.start_date || new Date().toISOString().slice(0, 10) })));
    }
    if (td.project_members?.length && b.copy_allocations) {
      await supabaseAdmin.from("project_members").insert(td.project_members.map((pm: Record<string, unknown>) => ({ ...pm, project_id: newProj.id, start_date: b.start_date || new Date().toISOString().slice(0, 10), is_active: true })));
    }
    return NextResponse.json({ project: newProj }, { status: 201 });
  }

  return NextResponse.json({ error: "mode must be 'save_from_project' or 'clone_to_project'" }, { status: 400 });
}
