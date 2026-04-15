import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("project_id");
  const memberId = request.nextUrl.searchParams.get("member_id");
  const status = request.nextUrl.searchParams.get("status");

  let query = supabaseAdmin
    .from("time_logs")
    .select("*")
    .order("log_date", { ascending: false });

  if (projectId) query = query.eq("project_id", projectId);
  if (memberId) query = query.eq("team_member_id", memberId);
  if (status) query = query.eq("status", status);

  // Members only see their own logs
  if (ctx.role === "member") {
    const { data: tm } = await supabaseAdmin
      .from("team_members").select("id").eq("user_id", ctx.userId).maybeSingle();
    if (tm?.id) query = query.eq("team_member_id", tm.id);
    else return NextResponse.json({ timelogs: [] });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ timelogs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      project_id, task_id, team_member_id, log_date, hours,
      hourly_rate_at_log, description, is_billable,
    } = body;

    if (!project_id || !team_member_id || !hours || !hourly_rate_at_log) {
      return NextResponse.json(
        { error: "project_id, team_member_id, hours, hourly_rate_at_log required" },
        { status: 400 }
      );
    }

    // Members can only log for themselves
    if (ctx.role === "member") {
      const { data: tm } = await supabaseAdmin
        .from("team_members").select("id").eq("user_id", ctx.userId).maybeSingle();
      if (tm?.id !== team_member_id) {
        return NextResponse.json({ error: "Forbidden: can only log own time" }, { status: 403 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("time_logs")
      .insert({
        project_id, task_id: task_id || null, team_member_id,
        log_date: log_date || new Date().toISOString().slice(0, 10),
        hours, hourly_rate_at_log,
        description: description || null,
        is_billable: is_billable ?? true,
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ timelog: data }, { status: 201 });
  } catch (err) {
    console.error("Create timelog error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
