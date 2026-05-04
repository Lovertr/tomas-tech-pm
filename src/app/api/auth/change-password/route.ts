import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessionFromCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = getSessionFromCookie(request.cookies);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: session } = await supabaseAdmin.from("sessions").select("user_id").eq("token", token).single();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { oldPassword, newPassword } = await request.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Both old and new passwords are required" }, { status: 400 });
    }
    if (newPassword.length < 4) {
      return NextResponse.json({ error: "New password must be at least 4 characters" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("change_user_password", {
      p_user_id: session.user_id,
      p_old_password: oldPassword,
      p_new_password: newPassword,
    });

    if (error) {
      console.error("Change password RPC error:", error);
      return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
    }
    if (data === false) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Clear must_change_password flag
    await supabaseAdmin.from("app_users").update({ must_change_password: false }).eq("id", session.user_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
