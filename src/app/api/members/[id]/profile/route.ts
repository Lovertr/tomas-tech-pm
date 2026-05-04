import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Fetch member with position
  const { data: member, error } = await supabaseAdmin
    .from("team_members")
    .select("id, user_id, first_name_th, first_name_en, last_name_th, last_name_en, email, phone, department, position_id, hourly_rate, skills, positions(name_th, name_en, color)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Fetch allocations with project info
  const { data: allocations } = await supabaseAdmin
    .from("project_members")
    .select("id, project_id, allocation_pct, role_in_project, start_date, end_date, is_active, projects(name_th, name_en, project_code, status)")
    .eq("team_member_id", id)
    .order("is_active", { ascending: false })
    .order("start_date", { ascending: false });

  // Fetch tasks assigned to this member
  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select("id, title, status, priority, project_id, projects(name_th, name_en)")
    .eq("assignee_id", id)
    .in("status", ["todo", "in_progress", "review"])
    .order("priority")
    .limit(20);

  const formattedTasks = (tasks ?? []).map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    project_id: t.project_id,
    project_name: (t.projects as unknown as Record<string, string> | null)?.name_th || (t.projects as unknown as Record<string, string> | null)?.name_en || "",
  }));

  return NextResponse.json({ member, allocations: allocations ?? [], tasks: formattedTasks });
}
