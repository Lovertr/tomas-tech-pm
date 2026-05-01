import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requirePermission, getAuthContext, getAccessibleProjectIds } from "@/lib/auth-server";

// GET /api/workload?start=YYYY-MM-DD&end=YYYY-MM-DD
// Returns: per-member allocation % + actual hours logged within [start,end]
// Used by Workload Heatmap
export async function GET(request: NextRequest) {
  const ctx = await requirePermission(request, "workload", 1);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start and end required (YYYY-MM-DD)" }, { status: 400 });
  }

  // Get the auth context for role check
  const authCtx = await getAuthContext(request);
  if (!authCtx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // For members: only show their own workload
  let membersQuery = supabaseAdmin
    .from("team_members")
    .select("id, first_name_en, last_name_en, first_name_th, last_name_th, weekly_capacity_hours, position_id, positions(color, name_en, name_th)")
    .eq("is_active", true);

  if (authCtx.role === "member") {
    membersQuery = membersQuery.eq("user_id", authCtx.userId);
  }

  // Fetch members
  const { data: members, error: e1 } = await membersQuery;
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  // Allocations overlapping the range
  let allocationsQuery = supabaseAdmin
    .from("project_members")
    .select("id, project_id, team_member_id, allocation_pct, start_date, end_date, projects(name_en, name_th, project_code)")
    .eq("is_active", true)
    .lte("start_date", end)
    .or(`end_date.is.null,end_date.gte.${start}`);

  // For members: filter to their own allocations or accessible projects
  if (authCtx.role === "member") {
    const { data: tm } = await supabaseAdmin.from("team_members").select("id").eq("user_id", authCtx.userId).maybeSingle();
    if (tm?.id) {
      const accessible = await getAccessibleProjectIds(authCtx);
      if (accessible !== null && accessible.length > 0) {
        allocationsQuery = allocationsQuery.or(`team_member_id.eq.${tm.id},project_id.in.(${accessible.join(",")})`);
      } else {
        allocationsQuery = allocationsQuery.eq("team_member_id", tm.id);
      }
    } else {
      allocationsQuery = allocationsQuery.eq("team_member_id", "");
    }
  }

  const { data: allocations, error: e2 } = await allocationsQuery;
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  // Actual approved timelog hours within range, grouped by member
  const { data: logs, error: e3 } = await supabaseAdmin
    .from("time_logs")
    .select("team_member_id, hours, log_date, status")
    .eq("status", "approved")
    .gte("log_date", start)
    .lte("log_date", end);
  if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

  // Aggregate
  const hoursByMember = new Map<string, number>();
  (logs ?? []).forEach(l => {
    hoursByMember.set(l.team_member_id, (hoursByMember.get(l.team_member_id) ?? 0) + Number(l.hours));
  });

  const allocByMember = new Map<string, typeof allocations>();
  (allocations ?? []).forEach(a => {
    if (!allocByMember.has(a.team_member_id)) allocByMember.set(a.team_member_id, []);
    allocByMember.get(a.team_member_id)!.push(a);
  });

  // Compute weeks in range for capacity calc
  const msPerDay = 86400000;
  const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / msPerDay) + 1;
  const weeks = days / 7;

  const rows = (members ?? []).map(m => {
    const memberAllocs = allocByMember.get(m.id) ?? [];
    const totalAllocPct = memberAllocs.reduce((s, a) => s + Number(a.allocation_pct), 0);
    const capacity = Number(m.weekly_capacity_hours ?? 40) * weeks;
    const actualHours = hoursByMember.get(m.id) ?? 0;
    const utilization = capacity > 0 ? (actualHours / capacity) * 100 : 0;
    return {
      member_id: m.id,
      name: [m.first_name_en, m.last_name_en].filter(Boolean).join(" ")
        || [m.first_name_th, m.last_name_th].filter(Boolean).join(" "),
      position: m.positions,
      weekly_capacity_hours: Number(m.weekly_capacity_hours ?? 40),
      total_allocation_pct: totalAllocPct,
      capacity_hours_in_range: capacity,
      actual_hours: actualHours,
      utilization_pct: Math.round(utilization * 10) / 10,
      allocations: memberAllocs,
    };
  });

  return NextResponse.json({ workload: rows, range: { start, end, weeks } });
}
