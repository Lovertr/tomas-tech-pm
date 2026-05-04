import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getSessionFromCookie(request.cookies);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: session } = await supabaseAdmin.from("sessions").select("user_id").eq("token", token).single();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || session.user_id;
    const period = searchParams.get("period") || new Date().toISOString().slice(0, 7);

    const [year, month] = period.split("-").map(Number);
    const startDate = `${period}-01`;
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

    // Get team_member id for this user
    const { data: member } = await supabaseAdmin.from("team_members").select("id").eq("user_id", userId).single();
    const memberId = member?.id;

    // 1. Tasks completed this period
    const { count: tasksCompleted } = await supabaseAdmin
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("assigned_to", memberId || "")
      .eq("status", "done")
      .gte("updated_at", startDate)
      .lte("updated_at", endDate + "T23:59:59");

    // 2. Total tasks assigned
    const { count: tasksTotal } = await supabaseAdmin
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("assigned_to", memberId || "");

    // 3. Hours logged this period
    const { data: timelogs } = await supabaseAdmin
      .from("time_logs")
      .select("hours")
      .eq("member_id", memberId || "")
      .gte("log_date", startDate)
      .lte("log_date", endDate);
    const hoursLogged = (timelogs || []).reduce((s, t) => s + (Number(t.hours) || 0), 0);

    // 4. Deals closed this period (for sales roles)
    const { count: dealsClosed } = await supabaseAdmin
      .from("deals_pipeline")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId)
      .in("stage", ["closed_won", "payment_received"])
      .gte("updated_at", startDate)
      .lte("updated_at", endDate + "T23:59:59");

    // 5. Deal revenue this period
    const { data: dealsData } = await supabaseAdmin
      .from("deals_pipeline")
      .select("value")
      .eq("owner_id", userId)
      .in("stage", ["closed_won", "payment_received"])
      .gte("updated_at", startDate)
      .lte("updated_at", endDate + "T23:59:59");
    const dealRevenue = (dealsData || []).reduce((s, d) => s + (Number(d.value) || 0), 0);

    // 6. On-time task completion rate
    const { count: onTimeTasks } = await supabaseAdmin
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("assigned_to", memberId || "")
      .eq("status", "done")
      .gte("updated_at", startDate)
      .lte("updated_at", endDate + "T23:59:59");

    const taskCompletionRate = (tasksTotal && tasksTotal > 0) 
      ? Math.round(((tasksCompleted || 0) / tasksTotal) * 100) 
      : 0;

    return NextResponse.json({
      period,
      metrics: {
        tasks_completed: tasksCompleted || 0,
        tasks_total: tasksTotal || 0,
        task_completion_rate: taskCompletionRate,
        hours_logged: Math.round(hoursLogged * 10) / 10,
        deals_closed: dealsClosed || 0,
        deal_revenue: dealRevenue,
      },
    });
  } catch (error) {
    console.error("Auto KPI error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
