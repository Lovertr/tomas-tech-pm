import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("*, positions(id, name_th, name_en, name_jp, default_hourly_rate, color)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data ?? [] });
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
      department, user_id,
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
