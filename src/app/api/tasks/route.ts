import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// GET /api/tasks - list all tasks (optionally filter by project_id)
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("project_id");
  let query = supabaseAdmin.from("tasks").select("*").order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [] });
}

// POST /api/tasks - create task
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager", "leader"].includes(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const {
      project_id, parent_task_id, title, description, status, priority,
      assignee_id, reporter_id, start_date, due_date, estimated_hours, tags,
    } = body;

    if (!project_id || !title) {
      return NextResponse.json({ error: "project_id and title are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        project_id,
        parent_task_id: parent_task_id || null,
        title,
        description: description || null,
        status: status || "backlog",
        priority: priority || "medium",
        assignee_id: assignee_id || null,
        reporter_id: reporter_id || null,
        start_date: start_date || null,
        due_date: due_date || null,
        estimated_hours: estimated_hours || 0,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: data }, { status: 201 });
  } catch (err) {
    console.error("Create task error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
