import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getScopedAccess } from "@/lib/auth-server";

// Returns tasks + per-task aggregate counts in one call (for Kanban board)
// Scoped for role=member.
export async function GET(req: NextRequest) {
  const scope = await getScopedAccess(req);
  if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
  const { ctx, projectIds, memberId } = scope;
  const projectId = req.nextUrl.searchParams.get("project_id");

  let q = supabaseAdmin.from("tasks").select("*");
  if (projectId && projectId !== "all") q = q.eq("project_id", projectId);
  if (ctx.role === "member") {
    if (!memberId) return NextResponse.json({ tasks: [] });
    const ids = projectIds ?? [];
    if (ids.length === 0) q = q.eq("assignee_id", memberId);
    else q = q.or(`assignee_id.eq.${memberId},project_id.in.(${ids.join(",")})`);
  }
  const { data: tasks, error } = await q.order("sort_order", { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = (tasks ?? []).map(t => t.id);
  if (!ids.length) return NextResponse.json({ tasks: [] });

  const [cm, cl, dp] = await Promise.all([
    supabaseAdmin.from("task_comments").select("task_id").in("task_id", ids),
    supabaseAdmin.from("task_checklist").select("task_id,is_completed").in("task_id", ids),
    supabaseAdmin.from("task_dependencies").select("task_id,depends_on_task_id").or(`task_id.in.(${ids.join(",")}),depends_on_task_id.in.(${ids.join(",")})`),
  ]);

  const cmCount: Record<string, number> = {};
  (cm.data ?? []).forEach((r: { task_id: string }) => { cmCount[r.task_id] = (cmCount[r.task_id] ?? 0) + 1; });

  const clTotal: Record<string, number> = {};
  const clDone: Record<string, number> = {};
  (cl.data ?? []).forEach((r: { task_id: string; is_completed: boolean }) => {
    clTotal[r.task_id] = (clTotal[r.task_id] ?? 0) + 1;
    if (r.is_completed) clDone[r.task_id] = (clDone[r.task_id] ?? 0) + 1;
  });

  const blockedBy: Record<string, number> = {};
  (dp.data ?? []).forEach((r: { task_id: string }) => { blockedBy[r.task_id] = (blockedBy[r.task_id] ?? 0) + 1; });

  return NextResponse.json({
    tasks: (tasks ?? []).map(t => ({
      ...t,
      _comments: cmCount[t.id] ?? 0,
      _checklist_total: clTotal[t.id] ?? 0,
      _checklist_done: clDone[t.id] ?? 0,
      _blocked_by: blockedBy[t.id] ?? 0,
    })),
  });
}
