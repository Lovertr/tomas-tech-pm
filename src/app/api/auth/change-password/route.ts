import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessionFromCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = getSessionFromCookie(request.cookies);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("token", token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 });
    }

    // Get request body
    const { current_password, new_password } = await request.json();

    if (!new_password) {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    // Validate new_password length
    if (new_password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Get user to check must_change_password flag
    const { data: user, error: userError } = await supabaseAdmin
      .from("app_users")
      .select("*")
      .eq("id", session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If must_change_password is false, verify current password
    if (!user.must_change_password && current_password) {
      const { data: isPasswordValid, error: verifyError } =
        await supabaseAdmin.rpc("verify_password", {
          p_username: user.username,
          p_password: current_password,
        });

      if (verifyError || !isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }
    } else if (!user.must_change_password && !current_password) {
      // If must_change_password is false and current_password not provided
      return NextResponse.json(
        { error: "Current password is required" },
        { status: 400 }
      );
    }

    // Update password using RPC function
    const { data, error: updateError } = await supabaseAdmin.rpc(
      "change_user_password",
      {
        p_user_id: session.user_id,
        p_new_password: new_password,
      }
    );

    if (updateError) {
      // If RPC function doesn't exist, try direct update approach
      // This is a fallback in case the RPC isn't created yet
      console.warn(
        "RPC change_user_password not available, attempting direct update"
      );

      // For direct update, we need to hash the password
      // Since we can't do bcrypt in JS easily, we rely on the RPC
      // If the RPC doesn't exist, the migration needs to create it
      return NextResponse.json(
        { error: "Password change service not available" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Password changed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
