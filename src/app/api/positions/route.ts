import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// GET /api/positions - list positions
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("positions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Strip default_hourly_rate when caller lacks manpower view
  const { data: lvl } = await supabaseAdmin.rpc("get_user_permission_level", {
    p_user_id: ctx.userId, p_module_key: "manpower",
  });
  const canSeeRates = ((lvl ?? 0) as number) >= 1;
  const sanitized = !canSeeRates && data
    ? data.map((p: Record<string, unknown>) => {
        const { default_hourly_rate: _r, ...rest } = p;
        return rest;
      })
    : data;

  return NextResponse.json({ positions: sanitized ?? [] });
}

// POST /api/positions - create position (admin/manager)
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { name_th, name_en, name_jp, default_hourly_rate, color, icon, sort_order } = body;
    if (!name_en && !name_th) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("positions")
      .insert({
        name_th: name_th || name_en,
        name_en: name_en || name_th,
        name_jp: name_jp || null,
        default_hourly_rate: default_hourly_rate || 0,
        color: color || "#003087",
        icon: icon || "Briefcase",
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ position: data }, { status: 201 });
  } catch (err) {
    console.error("Create position error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
