import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessionFromCookie } from "@/lib/auth";

async function getUser(request: NextRequest) {
  const token = getSessionFromCookie(request.cookies);
  if (!token) return null;
  const { data: session } = await supabaseAdmin.from("sessions").select("user_id").eq("token", token).single();
  if (!session) return null;
  const { data: user } = await supabaseAdmin.from("app_users").select("id, role_id, roles(name)").eq("id", session.user_id).single();
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleData = user.roles as any;
  const roleName = Array.isArray(roleData) ? roleData[0]?.name : roleData?.name;
  return { id: user.id, role: (roleName as string) || "member" };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || user.id;
    const period = searchParams.get("period"); // optional filter

    // Members can only see their own KPIs
    if (userId !== user.id && user.role === "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = supabaseAdmin.from("personal_kpis").select("*").eq("user_id", userId).order("category").order("kpi_name");
    if (period) query = query.eq("period", period);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Get KPIs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { user_id, ...kpiData } = body;
    const targetUserId = user_id || user.id;

    // Only admin/manager can assign KPIs to others
    if (targetUserId !== user.id && user.role === "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin.from("personal_kpis").insert({
      ...kpiData,
      user_id: targetUserId,
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create KPI error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "KPI id required" }, { status: 400 });

    // Check ownership or admin/manager role
    const { data: kpi } = await supabaseAdmin.from("personal_kpis").select("user_id, kpi_type").eq("id", id).single();
    if (!kpi) return NextResponse.json({ error: "KPI not found" }, { status: 404 });

    // Members can only update actual_value on their own KPIs
    if (user.role === "member") {
      if (kpi.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const allowed = { actual_value: updates.actual_value };
      const { data, error } = await supabaseAdmin.from("personal_kpis").update({ ...allowed, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    // Manager/admin can update everything including manager_score
    if (updates.manager_score !== undefined) {
      updates.assessed_by = user.id;
      updates.assessed_at = new Date().toISOString();
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin.from("personal_kpis").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Update KPI error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role === "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "KPI id required" }, { status: 400 });

    const { error } = await supabaseAdmin.from("personal_kpis").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete KPI error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
