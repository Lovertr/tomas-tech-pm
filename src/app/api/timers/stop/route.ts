import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: tm } = await supabaseAdmin.from("team_members").select("id, hourly_rate").eq("user_id", ctx.userId).maybeSingle();
  if (!tm?.id) return NextResponse.json({ error: "No team member" }, { status: 400 });

  const { data: timer } = await supabaseAdmin.from("active_timers").select("*").eq("team_member_id", tm.id).maybeSingle();
  if (!timer) return NextResponse.json({ error: "No active timer" }, { status: 404 });

  const start = new Date(timer.started_at);
  const end = new Date();
  const hoursRaw = (end.getTime() - start.getTime()) / 3600000;
  const hours = Math.max(0.05, Math.min(24, Math.round(hoursRaw * 100) / 100));

  // Create time_log
  const { data: log, error: logErr } = await supabaseAdmin.from("time_logs").insert({
    project_id: timer.project_id,
    task_id: timer.task_id,
    team_member_id: tm.id,
    log_date: start.toISOString().slice(0, 10),
    hours,
    hourly_rate_at_log: Number(tm.hourly_rate) || 0,
    description: timer.description || "Timer session",
    is_billable: true,
    status: "pending",
  }).select().single();
  if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });

  await supabaseAdmin.from("active_timers").delete().eq("team_member_id", tm.id);
  return NextResponse.json({ timelog: log, hours });
}
