import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

/**
 * GET /api/open-projects
 * Returns projects that are open for enrollment (is_enrollment_open=true),
 * with member count, open positions, PM info, and whether current user already applied/joined.
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

  // Fetch non-archived projects that are open for enrollment
  const { data: projects, error } = await supabaseAdmin
    .from("projects")
    .select("id, project_code, name_th, name_en, name_jp, client_name, status, tags, is_enrollment_open, open_positions, pm_member_id")
    .eq("is_archived", false)
    .eq("is_enrollment_open", true)
    .in("status", ["planning", "in_progress"])
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

  // Get pending applications for current user
  const pendingSet = new Set<string>();
  if (teamMemberId) {
    const { data: myApps } = await supabaseAdmin
      .from("enrollment_applications")
      .select("project_id")
      .eq("team_member_id", teamMemberId)
      .eq("status", "pending");
    (myApps ?? []).forEach((a: { project_id: string }) => pendingSet.add(a.project_id));
  }

  // Get PM names
  const pmIds = [...new Set((projects ?? []).map(p => p.pm_member_id).filter(Boolean))];
  const pmMap: Record<string, string> = {};
  if (pmIds.length > 0) {
    const { data: pms } = await supabaseAdmin
      .from("team_members")
      .select("id, first_name_th, last_name_th, first_name_en, last_name_en")
      .in("id", pmIds);
    (pms ?? []).forEach((pm: { id: string; first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null }) => {
      pmMap[pm.id] = [pm.first_name_th, pm.last_name_th].filter(Boolean).join(" ")
        || [pm.first_name_en, pm.last_name_en].filter(Boolean).join(" ");
    });
  }

  // Get pending application counts per project (for PM/admin view)
  const pendingCountMap: Record<string, number> = {};
  if (["admin", "manager"].includes(ctx.role)) {
    const { data: pendingApps } = await supabaseAdmin
      .from("enrollment_applications")
      .select("project_id")
      .eq("status", "pending");
    (pendingApps ?? []).forEach((a: { project_id: string }) => {
      pendingCountMap[a.project_id] = (pendingCountMap[a.project_id] ?? 0) + 1;
    });
  }

  const result = (projects ?? []).map((p) => ({
    ...p,
    member_count: countMap[p.id] ?? 0,
    already_joined: joinedSet.has(p.id),
    application_pending: pendingSet.has(p.id),
    pm_name: p.pm_member_id ? (pmMap[p.pm_member_id] || null) : null,
    pending_applications: pendingCountMap[p.id] ?? 0,
  }));

  return NextResponse.json({ projects: result });
}
