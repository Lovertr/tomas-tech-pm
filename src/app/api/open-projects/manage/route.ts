import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

/**
 * GET /api/open-projects/manage
 * Returns enrollment applications for projects the user can manage.
 * Admin/Manager/Leader: all projects without PM + projects where they are PM
 * PM: only their assigned projects
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's team_member_id
  const { data: tm } = await supabaseAdmin
    .from("team_members")
    .select("id")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  const isAdmin = ["admin", "manager"].includes(ctx.role);

  // Determine which projects this user can manage
  let managedProjectIds: string[] = [];

  if (isAdmin) {
    // Admin can manage all projects
    const { data: allProjects } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("is_archived", false);
    managedProjectIds = (allProjects ?? []).map(p => p.id);
  } else if (tm?.id) {
    // Check if user is PM of any project
    const { data: pmProjects } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("pm_member_id", tm.id)
      .eq("is_archived", false);
    managedProjectIds = (pmProjects ?? []).map(p => p.id);
  }

  if (managedProjectIds.length === 0) {
    return NextResponse.json({ applications: [], projects: [] });
  }

  // Get pending applications
  const { data: applications } = await supabaseAdmin
    .from("enrollment_applications")
    .select(`
      id, project_id, team_member_id, role_in_project, status, applied_at, review_note,
      team_members!inner(first_name_th, last_name_th, first_name_en, last_name_en, positions(name_th, name_en))
    `)
    .in("project_id", managedProjectIds)
    .eq("status", "pending")
    .order("applied_at", { ascending: true });

  // Get project details for managed projects
  const { data: projects } = await supabaseAdmin
    .from("projects")
    .select("id, project_code, name_th, name_en, is_enrollment_open, open_positions, pm_member_id, status")
    .in("id", managedProjectIds)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    applications: applications ?? [],
    projects: projects ?? [],
  });
}

/**
 * POST /api/open-projects/manage
 * Approve/reject enrollment applications OR update project enrollment settings.
 * Body: 
 *   { action: "approve"|"reject", application_id: string, note?: string }
 *   { action: "update_settings", project_id: string, is_enrollment_open: boolean, open_positions?: string[] }
 *   { action: "assign_pm", project_id: string, pm_member_id: string }
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { action } = body;

    const { data: tm } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("user_id", ctx.userId)
      .maybeSingle();

    const isAdmin = ["admin", "manager"].includes(ctx.role);

    // Helper: check if user can manage a project
    const canManage = async (projectId: string): Promise<boolean> => {
      if (isAdmin) return true;
      if (!tm?.id) return false;
      const { data: proj } = await supabaseAdmin
        .from("projects")
        .select("pm_member_id")
        .eq("id", projectId)
        .maybeSingle();
      return proj?.pm_member_id === tm.id;
    };

    if (action === "approve" || action === "reject") {
      const { application_id, note } = body;
      if (!application_id) return NextResponse.json({ error: "application_id required" }, { status: 400 });

      // Get the application
      const { data: app } = await supabaseAdmin
        .from("enrollment_applications")
        .select("*")
        .eq("id", application_id)
        .eq("status", "pending")
        .maybeSingle();

      if (!app) return NextResponse.json({ error: "Application not found or already processed" }, { status: 404 });

      // Check permission
      if (!(await canManage(app.project_id))) {
        return NextResponse.json({ error: "Not authorized to manage this project" }, { status: 403 });
      }

      // Update application status
      await supabaseAdmin
        .from("enrollment_applications")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          reviewed_by: ctx.userId,
          reviewed_at: new Date().toISOString(),
          review_note: note || null,
        })
        .eq("id", application_id);

      // If approved, create project_member allocation
      if (action === "approve") {
        const today = new Date().toISOString().split("T")[0];

        // Check not already a member
        const { data: existing } = await supabaseAdmin
          .from("project_members")
          .select("id")
          .eq("project_id", app.project_id)
          .eq("team_member_id", app.team_member_id)
          .eq("is_active", true)
          .maybeSingle();

        if (!existing) {
          await supabaseAdmin.from("project_members").insert({
            project_id: app.project_id,
            team_member_id: app.team_member_id,
            allocation_pct: 0,
            role_in_project: app.role_in_project,
            start_date: today,
            is_active: true,
            notes: "[ENROLLMENT-APPROVED]",
          });
        }

        // If role is PM, also set pm_member_id on the project
        if (app.role_in_project === "pm" || app.role_in_project === "project_manager") {
          await supabaseAdmin
            .from("projects")
            .update({ pm_member_id: app.team_member_id })
            .eq("id", app.project_id);
        }
      }

      // Notify the applicant
      try {
        const { data: applicantMember } = await supabaseAdmin
          .from("team_members")
          .select("user_id")
          .eq("id", app.team_member_id)
          .maybeSingle();

        if (applicantMember?.user_id) {
          const { data: projInfo } = await supabaseAdmin
            .from("projects")
            .select("project_code, name_th, name_en")
            .eq("id", app.project_id)
            .single();
          const projName = projInfo
            ? (projInfo.project_code ? `[${projInfo.project_code}] ` : "") + (projInfo.name_th || projInfo.name_en || "")
            : "";

          await supabaseAdmin.from("notifications").insert({
            user_id: applicantMember.user_id,
            title: action === "approve"
              ? "\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34\u0e40\u0e02\u0e49\u0e32\u0e23\u0e48\u0e27\u0e21\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23"
              : "\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34\u0e40\u0e02\u0e49\u0e32\u0e23\u0e48\u0e27\u0e21\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23",
            message: action === "approve"
              ? `\u0e04\u0e38\u0e13\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34\u0e40\u0e02\u0e49\u0e32\u0e23\u0e48\u0e27\u0e21 ${projName}`
              : `\u0e01\u0e32\u0e23\u0e2a\u0e21\u0e31\u0e04\u0e23\u0e40\u0e02\u0e49\u0e32\u0e23\u0e48\u0e27\u0e21 ${projName} \u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e23\u0e31\u0e1a\u0e2d\u0e19\u0e38\u0e21\u0e31\u0e15\u0e34`,
            type: "project_enrollment",
            link: `/allocation`,
            is_read: false,
          });
        }
      } catch (_) { /* non-critical */ }

      return NextResponse.json({ success: true, action });
    }

    if (action === "update_settings") {
      const { project_id, is_enrollment_open, open_positions } = body;
      if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

      if (!(await canManage(project_id))) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      const updateData: Record<string, unknown> = {};
      if (typeof is_enrollment_open === "boolean") updateData.is_enrollment_open = is_enrollment_open;
      if (Array.isArray(open_positions)) updateData.open_positions = open_positions;

      const { error } = await supabaseAdmin
        .from("projects")
        .update(updateData)
        .eq("id", project_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === "assign_pm") {
      const { project_id, pm_member_id } = body;
      if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

      // Only admin/manager can assign PM
      if (!isAdmin) {
        return NextResponse.json({ error: "Only admin/manager can assign PM" }, { status: 403 });
      }

      const { error } = await supabaseAdmin
        .from("projects")
        .update({ pm_member_id: pm_member_id || null })
        .eq("id", project_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // If assigning a PM, also ensure they are a project member
      if (pm_member_id) {
        const { data: existingMember } = await supabaseAdmin
          .from("project_members")
          .select("id, role_in_project")
          .eq("project_id", project_id)
          .eq("team_member_id", pm_member_id)
          .eq("is_active", true)
          .maybeSingle();

        if (!existingMember) {
          const today = new Date().toISOString().split("T")[0];
          await supabaseAdmin.from("project_members").insert({
            project_id,
            team_member_id: pm_member_id,
            allocation_pct: 100,
            role_in_project: "project_manager",
            start_date: today,
            is_active: true,
            notes: "[PM-ASSIGNED]",
          });
        } else if (existingMember.role_in_project !== "project_manager" && existingMember.role_in_project !== "pm") {
          await supabaseAdmin
            .from("project_members")
            .update({ role_in_project: "project_manager" })
            .eq("id", existingMember.id);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Manage enrollment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
