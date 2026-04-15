import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

const ALLOWED = [
  "employee_code", "first_name_th", "last_name_th", "first_name_en",
  "last_name_en", "first_name_jp", "last_name_jp", "position_id",
  "hourly_rate", "email", "phone", "department", "is_active", "user_id",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const update: Record<string, unknown> = {};
  for (const k of ALLOWED) if (k in body) update[k] = body[k];

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("team_members").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.role !== "admin")
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });

  const { id } = await params;
  // Soft delete — set is_active = false (safer due to FK refs)
  const { error } = await supabaseAdmin
    .from("team_members").update({ is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
