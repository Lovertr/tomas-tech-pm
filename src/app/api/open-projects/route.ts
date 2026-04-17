import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

/**
 * GET /api/open-projects
 * Returns projects that are not archived and in planning/active status,
 * with a flag indicating if the current user has already joined.
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the user's team_member_id
  const { data: tm } = await supabaseAdmin
    .from("team_members")
    .select("id")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  const teamMemberId = tm?.id ?? null;

  // Fetch non-archived projects in planning or active status
  const { data: projects, error } = await supabaseAdmin
    .from("projects")
    .select("id, project_code, name_th, name_en, name_jp, client_name, status, tags")
    .eq("is_archived", false)
    .in("status", ["planning", "active"])
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get member counts per project
  const { data: memberCounts } = await supabaseAdmin
    .from("project_members")
    .select("project_id")
    .eq("is_active", true);

  const countMap: Record<string, number> = {};
  (memberCounts ?? []).forEach((m: { project_id: string }) => {
    countMap[m.project_id] = (countMap[m.project_id] ?? 0) + 1;
  });

  // Get projects the user already joined
  const joinedSet = new Set<string>();
  if (teamMemberId) {
    const { data: myAllocations } = await supabaseAdmin
      .from("project_members")
      .select("project_id")
      .eq("team_member_id", teamMemberId)
      .eq("is_active", true);

    (myAllocations ?? []).forEach((a: { project_id: string }) => joinedSet.add(a.project_id));
  }

  const result = (projects ?? []).map((p) => ({
    ...p,
    member_count: countMap[p.id] ?? 0,
    already_joined: joinedSet.has(p.id),
  }));

  return NextResponse.json({ projects: result });
}
