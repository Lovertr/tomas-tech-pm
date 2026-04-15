import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateToken, createSessionCookie, AppUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Query user from app_users table with role name
    const { data: users, error: queryError } = await supabaseAdmin
      .from("app_users")
      .select("*, roles(name, name_th, name_en, name_jp, level, permissions)")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (queryError || !users) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password using Supabase RPC function
    // verify_password returns rows if valid, empty if invalid
    const { data: verifyResult, error: verifyError } =
      await supabaseAdmin.rpc("verify_password", {
        p_username: username,
        p_password: password,
      });

    if (verifyError || !verifyResult || (Array.isArray(verifyResult) && verifyResult.length === 0)) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate session token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Create session record
    const { error: sessionError } = await supabaseAdmin
      .from("sessions")
      .insert({
        user_id: users.id,
        token,
        expires_at: expiresAt,
      });

    if (sessionError) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Update last_login_at
    await supabaseAdmin
      .from("app_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", users.id);

    // Remove password_hash and map role
    const { password_hash, roles: roleData, role_id, ...userBase } = users;
    const appUser = {
      ...userBase,
      role: (roleData as { name: string })?.name || 'member',
      role_id,
    } as AppUser & { role_id: string };

    // Create response with cookie
    const response = NextResponse.json(
      {
        user: appUser,
        must_change_password: appUser.must_change_password,
      },
      { status: 200 }
    );

    response.headers.set("Set-Cookie", createSessionCookie(token));
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
