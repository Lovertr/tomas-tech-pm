import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import { logAudit, getClientIp } from "@/lib/auditLog";
import { notify } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = req.nextUrl.searchParams.get("member_id");
  const status = req.nextUrl.searchParams.get("status");
  const year = parseInt(req.nextUrl.searchParams.get("year") || String(new Date().getFullYear()));

  // Get user's team_member record
  const { data: myMember } = await supabaseAdmin.from("team_members").select("id, department_id").eq("user_id", ctx.userId).single();

  let query = supabaseAdmin
    .from("leave_requests")
    .select("*, team_members(id, first_name, last_name, nickname, department_id, departments(name))")
    .order("created_at", { ascending: false });

  if (memberId) {
    query = query.eq("member_id", memberId);
  } else if (ctx.role === "member" && myMember) {
    query = query.eq("member_id", myMember.id);
  }
  if (status) query = query.eq("status", status);

  const { data: requests } = await query;

  // Get balances
  let balanceQuery = supabaseAdmin.from("leave_balances").select("*, team_members(first_name, last_name, nickname)").eq("year", year);
  if (memberId) balanceQuery = balanceQuery.eq("member_id", memberId);
  else if (ctx.role === "member" && myMember) balanceQuery = balanceQuery.eq("member_id", myMember.id);
  const { data: balances } = await balanceQuery;

  return NextResponse.json({ requests: requests ?? [], balances: balances ?? [], myMemberId: myMember?.id || null });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  // Action: approve/reject
  if (body.action === "approve" || body.action === "reject") {
    if (!["admin", "manager"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const update: Record<string, unknown> = {
      status: body.action === "approve" ? "approved" : "rejected",
      approved_by: ctx.userId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (body.action === "reject") update.rejection_reason = body.rejection_reason || null;

    const { data, error } = await supabaseAdmin.from("leave_requests").update(update).eq("id", body.id).select("*, team_members(first_name, last_name, user_id)").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update leave balance if approved
    if (body.action === "approve" && data) {
      const yr = new Date(data.start_date).getFullYear();
      const typeCol = data.type === "annual" ? "used_annual" : data.type === "sick" ? "used_sick" : data.type === "personal" ? "used_personal" : null;
      if (typeCol) {
        // Ensure balance row exists
        await supabaseAdmin.from("leave_balances").upsert({ member_id: data.member_id, year: yr }, { onConflict: "member_id,year" });
        const { data: bal } = await supabaseAdmin.from("leave_balances").select("*").eq("member_id", data.member_id).eq("year", yr).single();
        if (bal) {
          await supabaseAdmin.from("leave_balances").update({ [typeCol]: (bal as Record<string, number>)[typeCol] + Number(data.days) }).eq("id", bal.id);
        }
      }
      const mem = data.team_members as unknown as { user_id: string; first_name: string };
      if (mem?.user_id) await notify(mem.user_id, "คำขอลาได้รับอนุมัติ", data.type + " " + data.start_date + " - " + data.end_date, "leave_approved");
    }
    if (body.action === "reject" && data) {
      const mem = data.team_members as unknown as { user_id: string };
      if (mem?.user_id) await notify(mem.user_id, "คำขอลาถูกปฏิเสธ", (body.rejection_reason || data.type) + "", "leave_rejected");
    }

    return NextResponse.json({ request: data });
  }

  // Create new leave request
  if (!body.member_id || !body.type || !body.start_date || !body.end_date)
    return NextResponse.json({ error: "member_id, type, start_date, end_date required" }, { status: 400 });

  const start = new Date(body.start_date);
  const end = new Date(body.end_date);
  const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);

  const { data, error } = await supabaseAdmin.from("leave_requests").insert({
    member_id: body.member_id, type: body.type, start_date: body.start_date, end_date: body.end_date,
    days: body.days || diffDays, reason: body.reason || null, status: "pending",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify admin/managers
  try {
    const { data: admins } = await supabaseAdmin.from("app_users").select("id").in("role_id",
      (await supabaseAdmin.from("roles").select("id").in("name", ["admin", "manager"])).data?.map(r => r.id) || []);
    const { data: mem } = await supabaseAdmin.from("team_members").select("first_name, last_name").eq("id", body.member_id).single();
    const name = mem ? mem.first_name + " " + mem.last_name : "";
    for (const a of admins || []) {
      await notify(a.id, "คำขอลาใหม่", name + " ขอลา " + body.type + " " + body.start_date, "leave_request");
    }
  } catch (e) { console.error("Leave notify error:", e); }

  logAudit({ userId: ctx.userId, action: "INSERT", tableName: "leave_requests", recordId: data.id, newValue: body, description: "Created leave request", ip: getClientIp(req.headers) });
  return NextResponse.json({ request: data }, { status: 201 });
}
