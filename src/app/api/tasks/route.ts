import { NextRequest, NextResponse } from "next/server";
import { logAudit, getClientIp } from "@/lib/auditLog";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, getScopedAccess } from "@/lib/auth-server";
import { notify, getMemberUserId } from "@/lib/notify";

// GET /api/tasks - list tasks (scoped for role=member: only assigned to them
// or in projects they have access to)
export async function GET(request: NextRequest) {
  const scope = await getScopedAccess(request);
  if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
  const { ctx, projectIds, memberId } = scope;

  const projectId = request.nextUrl.searchParams.get("project_id");
  let query = supabaseAdmin.from("tasks").select("*").order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);

  if (ctx.role === "member") {
    if (!memberId) return NextResponse.json({ tasks: [] });
    const ids = projectIds ?? [];
    // visible if assigned to me OR in any project I can access
    if (ids.length === 0) {
      query = query.eq("assignee_id", memberId);
    } else {
      query = query.or("assignee_id.eq." + memberId + ",project_id.in.(" + ids.join(",") + ")");
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [] });
}

// POST /api/tasks - create task
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const {
      project_id, parent_task_id, title, title_en, title_jp, description, status, priority,
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
        title_en: title_en || null,
        title_jp: title_jp || null,
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

    // Notify assignee if set
    if (assignee_id) {
      try {
        const assigneeUserId = await getMemberUserId(assignee_id);
        if (assigneeUserId) {
          const { data: project } = await supabaseAdmin
            .from("projects")
            .select("name_th, name_en")
            .eq("id", project_id)
            .maybeSingle();
          const projectName = project?.name_th || project?.name_en || "โครงการ";
          await notify(
            assigneeUserId,
            "ได้รับมอบหมายงานใหม่",
            title + " ในโครงการ " + projectName,
            "task_assigned"
          );
        }
      } catch (notifyErr) {
        console.error("Task notification error:", notifyErr);
      }
    }

    logAudit({ userId: ctx.userId, action: "INSERT", tableName: "tasks", recordId: data.id, newValue: { title: data.title, status: data.status, project_id: data.project_id }, description: "Created task: " + data.title, ip: getClientIp(request.headers) });

    return NextResponse.json({ task: data }, { status: 201 });
  } catch (err) {
    console.error("Create task error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
