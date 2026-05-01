import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import { supabaseAdmin as _admin } from "@/lib/supabase-admin";

// Strip rate-related fields when the caller lacks "manpower" view permission
async function userCanSeeRates(userId: string): Promise<boolean> {
  const { data } = await _admin.rpc("get_user_permission_level", {
    p_user_id: userId, p_module_key: "manpower",
  });
  return ((data ?? 0) as number) >= 1;
}

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("*, positions(id, name_th, name_en, name_jp, default_hourly_rate, color)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sanitize sensitive fields for users without manpower view
  const canSeeRates = await userCanSeeRates(ctx.userId);
  const sanitized = !canSeeRates && data
    ? data.map((m: Record<string, unknown>) => {
        const { hourly_rate: _r, salary: _s, ...rest } = m as { hourly_rate?: unknown; salary?: unknown; positions?: { default_hourly_rate?: unknown } & Record<string, unknown> };
        const positions = rest.positions
          ? (() => { const { default_hourly_rate: _d, ...pr } = rest.positions as Record<string, unknown>; return pr; })()
          : rest.positions;
        return { ...rest, positions };
      })
    : data;

  return NextResponse.json({ members: sanitized ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const {
      employee_code, first_name_th, last_name_th, first_name_en, last_name_en,
      first_name_jp, last_name_jp, position_id, hourly_rate, email, phone,
      department, department_id, user_id,
    } = body;

    if (!first_name_en && !first_name_th) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("team_members")
      .insert({
        employee_code: employee_code || null,
        first_name_th, last_name_th, first_name_en, last_name_en,
        first_name_jp, last_name_jp,
        position_id: position_id || null,
        hourly_rate: hourly_rate || 0,
        email: email || null,
        phone: phone || null,
        department: department || null,
        department_id: department_id || null,
        user_id: user_id || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ member: data }, { status: 201 });
  } catch (err) {
    console.error("Create member error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
