import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

/**
 * GET /api/client-portal/manage?project_id=xxx
 * List client requests for a project (internal, auth required)
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("client_requests")
    .select(`
      *,
      assigned_member:team_members!client_requests_assigned_to_fkey(id, first_name_th, last_name_th),
      linked_task:tasks!client_requests_task_id_fkey(id, title, status)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    // Fallback without joins if FK names differ
    const { data: fallback, error: err2 } = await supabaseAdmin
      .from("client_requests")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (err2) return NextResponse.json({ error: err2.message }, { status: 500 });
    return NextResponse.json({ requests: fallback || [] });
  }

  return NextResponse.json({ requests: data || [] });
}

/**
 * PATCH /api/client-portal/manage
 * Update a client request: accept, cancel, assign, convert to task, respond
 */
export async function PATCH(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, action } = body;

  if (!id || !action) {
    return NextResponse.json({ error: "id and action required" }, { status: 400 });
  }

  // Get existing request
  const { data: existing } = await supabaseAdmin
    .from("client_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  switch (action) {
    case "accept": {
      const { error } = await supabaseAdmin
        .from("client_requests")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, status: "accepted" });
    }

    case "cancel": {
      const { error } = await supabaseAdmin
        .from("client_requests")
        .update({
          status: "cancelled",
          internal_notes: body.internal_notes || existing.internal_notes,
          response_to_client: body.response_to_client || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, status: "cancelled" });
    }

    case "assign": {
      const { assigned_to } = body;
      if (!assigned_to) return NextResponse.json({ error: "assigned_to required" }, { status: 400 });

      const { error } = await supabaseAdmin
        .from("client_requests")
        .update({
          assigned_to,
          status: existing.status === "pending" ? "accepted" : existing.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Notify assigned person
      const { data: tm } = await supabaseAdmin
        .from("team_members")
        .select("user_id, first_name_th")
        .eq("id", assigned_to)
        .single();

      if (tm?.user_id) {
        await supabaseAdmin.from("notifications").insert({
          user_id: tm.user_id,
          title: "📋 ได้รับมอบหมายงานจากลูกค้า",
          message: `คุณได้รับมอบหมายให้ดูแล "${existing.title}" จาก ${existing.client_name}`,
          type: "task_assigned",
          link: `/projects/${existing.project_id}`,
        });
      }

      return NextResponse.json({ success: true });
    }

    case "convert_to_task": {
      const { assignee_id, due_date, priority } = body;

      // Create task from request
      const { data: newTask, error: taskError } = await supabaseAdmin
        .from("tasks")
        .insert({
          project_id: existing.project_id,
          title: `[ลูกค้า] ${existing.title}`,
          description: `${existing.description || ""}\n\n---\nแจ้งโดย: ${existing.client_name}\nประเภท: ${existing.request_type}\nวันที่แจ้ง: ${new Date(existing.created_at).toLocaleDateString("th-TH")}`,
          status: "backlog",
          priority: priority || existing.priority || "medium",
          assignee_id: assignee_id || null,
          due_date: due_date || null,
          source: "client_portal",
          client_request_id: existing.id,
          tags: ["client-request"],
        })
        .select()
        .single();

      if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 });

      // Update request with task link
      await supabaseAdmin
        .from("client_requests")
        .update({
          task_id: newTask.id,
          assigned_to: assignee_id || existing.assigned_to,
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json({ success: true, task: newTask });
    }

    case "resolve": {
      const { error } = await supabaseAdmin
        .from("client_requests")
        .update({
          status: "resolved",
          response_to_client: body.response_to_client || null,
          internal_notes: body.internal_notes || existing.internal_notes,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, status: "resolved" });
    }

    case "update_response": {
      const { error } = await supabaseAdmin
        .from("client_requests")
        .update({
          response_to_client: body.response_to_client,
          internal_notes: body.internal_notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
