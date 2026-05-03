import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessionFromCookie } from "@/lib/auth";

// GET /api/audit-logs?page=1&limit=50&user_id=xxx&table_name=xxx&from=2026-01-01&to=2026-12-31&search=xxx
export async function GET(request: NextRequest) {
  try {
    const token = getSessionFromCookie(request.cookies);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: session } = await supabaseAdmin
      .from("sessions").select("*").eq("token", token).single();
    if (!session || new Date(session.expires_at) < new Date())
      return NextResponse.json({ error: "Session expired" }, { status: 401 });

    // Only admin can view audit logs
    const { data: user } = await supabaseAdmin
      .from("app_users")
      .select("id, role_id, roles(name)")
      .eq("id", session.user_id)
      .single();

    const role = (user?.roles as unknown as { name: string } | null)?.name;
    if (role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get("page") || "1"));
    const limit = Math.min(100, Math.max(10, parseInt(params.get("limit") || "50")));
    const userId = params.get("user_id");
    const tableName = params.get("table_name");
    const from = params.get("from");
    const to = params.get("to");
    const search = params.get("search");
    const actionFilter = params.get("action");

    let query = supabaseAdmin
      .from("audit_logs")
      .select("*, app_users(username, first_name, last_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (userId) query = query.eq("user_id", userId);
    if (tableName) query = query.eq("table_name", tableName);
    if (actionFilter) query = query.eq("action", actionFilter);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to + "T23:59:59.999Z");
    if (search) query = query.or(`description.ilike.%${search}%,table_name.ilike.%${search}%,record_id.ilike.%${search}%`);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error("Audit logs query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      logs: logs ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (error) {
    console.error("Audit logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
