import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/project-membership
 * Returns the current user's project memberships:
 * - Which projects they belong to
 * - Their role_in_project for each
 * - Whether they are PM of each project
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the user's team_member_id
  const { data: tm } = await supabaseAdmin
    .from("team_members")
    .select("id")
    .eq("user_id", auth.userId)
    .eq("is_active", true)
    .single();

  if (!tm) {
    return NextResponse.json({
      memberships: [],
      pm_projects: [],
      team_member_id: null,
      role: auth.role,
    });
  }

  // Get all project memberships
  const { data: memberships } = await supabaseAdmin
    .from("project_members")
    .select("project_id, role_in_project, is_active")
    .eq("team_member_id", tm.id)
    .eq("is_active", true);

  // Get all projects where user is PM
  const { data: pmProjects } = await supabaseAdmin
    .from("projects")
    .select("id")
    .eq("pm_member_id", tm.id)
    .eq("is_archived", false);

  return NextResponse.json({
    memberships: (memberships ?? []).map(m => ({
      project_id: m.project_id,
      role_in_project: m.role_in_project,
    })),
    pm_projects: (pmProjects ?? []).map(p => p.id),
    team_member_id: tm.id,
    role: auth.role,
  });
}
