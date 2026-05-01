import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-server";

// GET /api/departments/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("departments")
    .select("*, head:app_users!departments_head_user_id_fkey(id, display_name, email)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // members of this department
  const { data: members } = await supabaseAdmin
    .from("app_users")
    .select("id, display_name, email, department_id")
    .eq("department_id", id);

  return NextResponse.json({ department: data, members: members ?? [] });
}

// PATCH /api/departments/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const { id } = await params;
  const body = await req.json();

  const allowed = ["code", "name_th", "name_en", "name_jp", "head_user_id", "is_active"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }
  if (update.code) update.code = (update.code as string).trim().toUpperCase();

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("departments")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ department: data });
}

// DELETE /api/departments/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const { id } = await params;

  // Check if there are users assigned to this department
  const { count } = await supabaseAdmin
    .from("app_users")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${count} user(s) still assigned to this department` },
      { status: 400 }
    );
  }

  // Delete department permissions first
  await supabaseAdmin.from("department_permissions").delete().eq("department_id", id);

  const { error } = await supabaseAdmin.from("departments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
