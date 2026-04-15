import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

const ALLOWED = [
  "title", "description", "status", "priority", "assignee_id",
  "reporter_id", "start_date", "due_date", "completed_at",
  "estimated_hours", "actual_hours", "sort_order", "tags", "parent_task_id",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Members can only edit own tasks - check assignee
  if (ctx.role === "member") {
    const { data: existing } = await supabaseAdmin
      .from("tasks")
      .select("assignee_id, team_members!tasks_assignee_id_fkey(user_id)")
      .eq("id", id)
      .single();
    const assigneeUserId = (existing?.team_members as unknown as { user_id?: string } | null)?.user_id;
    if (assigneeUserId !== ctx.userId) {
      return NextResponse.json({ error: "Forbidden: not your task" }, { status: 403 });
    }
  }

  const update: Record<string, unknown> = {};
  for (const k of ALLOWED) if (k in body) update[k] = body[k];
  if ("status" in body && body.status === "done" && !body.completed_at) {
    update.completed_at = new Date().toISOString();
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("tasks").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager", "leader"].includes(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { error } = await supabaseAdmin.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
