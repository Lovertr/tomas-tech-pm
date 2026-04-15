import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-server";

// POST /api/users/[id]/reset-password - reset a user's password to "00000000" (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(request);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { id } = await params;

  // Use change_user_password RPC to set new password
  const { error } = await supabaseAdmin.rpc("change_user_password", {
    p_user_id: id,
    p_new_password: "00000000",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Force user to change password on next login
  await supabaseAdmin
    .from("app_users")
    .update({ must_change_password: true })
    .eq("id", id);

  // Invalidate all existing sessions for this user
  await supabaseAdmin.from("sessions").delete().eq("user_id", id);

  return NextResponse.json({
    success: true,
    default_password: "00000000",
  });
}
