import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin, requireManager } from "@/lib/auth-server";

// PATCH /api/users/[id] - update a user (admin or manager)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireManager(request);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const allowed = [
      "display_name",
      "display_name_th",
      "display_name_jp",
      "email",
      "phone",
      "department",
      "department_id",
      "role_id",
      "position_id",
      "language",
      "is_active",
    ];
    const update: Record<string, unknown> = {};
    for (const k of allowed) {
      if (k in body) update[k] = body[k];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("app_users")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - delete a user (admin or manager, cannot delete self or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireManager(request);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { id } = await params;

  if (id === ctx.userId) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 }
    );
  }

  // Protect the default admin account
  const { data: target } = await supabaseAdmin
    .from("app_users")
    .select("username")
    .eq("id", id)
    .single();

  if (target?.username === "admin") {
    return NextResponse.json(
      { error: "Cannot delete the default admin account" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("app_users")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
