import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, getAccessibleProjectIds } from "@/lib/auth-server";

// Returns combined gantt data: tasks + milestones + dependencies for a project
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  const accessible = await getAccessibleProjectIds(ctx);
  if (accessible !== null && !accessible.includes(projectId)) {
    return NextResponse.json({ project: null, tasks: [], milestones: [], dependencies: [] });
  }

  const [tasksRes, msRes, depsRes, projRes] = await Promise.all([
    supabaseAdmin.from("tasks").select("*, team_members!assignee_id(id,first_name_th,last_name_th,first_name_en,last_name_en)").eq("project_id", projectId).order("start_date", { ascending: true, nullsFirst: false }),
    supabaseAdmin.from("milestones").select("*").eq("project_id", projectId).order("due_date"),
    supabaseAdmin.from("task_dependencies").select("*").in("task_id", (await supabaseAdmin.from("tasks").select("id").eq("project_id", projectId)).data?.map(t => t.id) ?? []),
    supabaseAdmin.from("projects").select("*").eq("id", projectId).single(),
  ]);
  return NextResponse.json({
    project: projRes.data,
    tasks: tasksRes.data ?? [],
    milestones: msRes.data ?? [],
    dependencies: depsRes.data ?? [],
  });
}
