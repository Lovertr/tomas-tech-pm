import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

const ALLOWED = [
  "name_th", "name_en", "name_jp", "default_hourly_rate",
  "color", "icon", "sort_order", "is_active",
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
    .from("positions").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ position: data });
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
  // Soft delete
  const { error } = await supabaseAdmin
    .from("positions").update({ is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
