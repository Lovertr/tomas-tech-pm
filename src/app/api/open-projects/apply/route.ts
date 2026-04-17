import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

/**
 * POST /api/open-projects/apply
 * Allows a user to self-enroll into a project with a specified role.
 * Body: { project_id: string, role_in_project: string }
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { project_id, role_in_project } = await request.json();

    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    // Verify the project exists and is not archived
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("id, status")
      .eq("id", project_id)
      .eq("is_archived", false)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get the user's team_member_id
    const { data: tm } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("user_id", ctx.userId)
      .maybeSingle();

    if (!tm) {
      return NextResponse.json({ error: "No team member profile found for this user" }, { status: 400 });
    }

    // Check if already joined
    const { data: existing } = await supabaseAdmin
      .from("project_members")
      .select("id")
      .eq("project_id", project_id)
      .eq("team_member_id", tm.id)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Already joined this project" }, { status: 409 });
    }

    // Insert allocation
    const today = new Date().toISOString().split("T")[0];
    const { data: allocation, error } = await supabaseAdmin
      .from("project_members")
      .insert({
        project_id,
        team_member_id: tm.id,
        allocation_pct: 0, // Will be adjusted by manager
        role_in_project: role_in_project || "developer",
        start_date: today,
        is_active: true,
        notes: "[SELF-ENROLLED]",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ allocation }, { status: 201 });
  } catch (err) {
    console.error("Apply to project error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
