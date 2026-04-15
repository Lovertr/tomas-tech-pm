import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessionFromCookie, AppUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getSessionFromCookie(request.cookies);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up session in database
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("token", token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 });
    }

    // Check if session is expired
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 401 }
      );
    }

    // Query the user from app_users with role
    const { data: user, error: userError } = await supabaseAdmin
      .from("app_users")
      .select("*, roles(name, name_th, name_en, name_jp, level, permissions)")
      .eq("id", session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove password_hash and map role
    const { password_hash, roles: roleData, role_id, ...userBase } = user;
    const appUser = {
      ...userBase,
      role: (roleData as { name: string })?.name || 'member',
      role_id,
    };

    return NextResponse.json({ user: appUser }, { status: 200 });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
