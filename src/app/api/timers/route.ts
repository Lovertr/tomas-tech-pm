import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// GET current active timer for logged-in user
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: tm } = await supabaseAdmin.from("team_members").select("id").eq("user_id", ctx.userId).maybeSingle();
  if (!tm?.id) return NextResponse.json({ timer: null });
  const { data } = await supabaseAdmin
    .from("active_timers")
    .select("*, tasks(id,title), projects(id,name_th,name_en,project_code)")
    .eq("team_member_id", tm.id).maybeSingle();
  return NextResponse.json({ timer: data || null });
}

// POST start timer { task_id?, project_id, description? }
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: tm } = await supabaseAdmin.from("team_members").select("id").eq("user_id", ctx.userId).maybeSingle();
  if (!tm?.id) return NextResponse.json({ error: "No team member linked" }, { status: 400 });
  const body = await req.json();
  if (!body.project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  // Stop any existing timer (upsert)
  const { data, error } = await supabaseAdmin.from("active_timers").upsert({
    team_member_id: tm.id,
    task_id: body.task_id || null,
    project_id: body.project_id,
    started_at: new Date().toISOString(),
    description: body.description || null,
  }, { onConflict: "team_member_id" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ timer: data }, { status: 201 });
}
