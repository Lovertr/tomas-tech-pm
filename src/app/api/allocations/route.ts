import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// GET /api/allocations?project_id=&member_id=&active_only=1
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("project_id");
  const memberId = request.nextUrl.searchParams.get("member_id");
  const activeOnly = request.nextUrl.searchParams.get("active_only");

  let query = supabaseAdmin
    .from("project_members")
    .select("*, projects(id, name_th, name_en, project_code), team_members(id, first_name_th, last_name_th, first_name_en, last_name_en, weekly_capacity_hours)")
    .order("start_date", { ascending: false });

  if (projectId) query = query.eq("project_id", projectId);
  if (memberId) query = query.eq("team_member_id", memberId);
  if (activeOnly === "1") query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ allocations: data ?? [] });
}

// POST /api/allocations (admin/manager)
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { project_id, team_member_id, allocation_pct, role_in_project, start_date, end_date, notes } = body;

    if (!project_id || !team_member_id || !start_date) {
      return NextResponse.json(
        { error: "project_id, team_member_id, start_date required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("project_members")
      .insert({
        project_id, team_member_id,
        allocation_pct: allocation_pct ?? 100,
        role_in_project: role_in_project || null,
        start_date,
        end_date: end_date || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ allocation: data }, { status: 201 });
  } catch (err) {
    console.error("Create allocation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
