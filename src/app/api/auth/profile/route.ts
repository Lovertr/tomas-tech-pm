import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessionFromCookie } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const token = getSessionFromCookie(request.cookies);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: session } = await supabaseAdmin.from("sessions").select("user_id").eq("token", token).single();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const allowed = ["display_name", "display_name_th", "display_name_jp", "email", "phone", "avatar_url", "language"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key] || null;
    }
    // display_name is required
    if ("display_name" in updates && !updates.display_name) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("app_users")
      .update(updates)
      .eq("id", session.user_id)
      .select("id, username, display_name, display_name_th, display_name_jp, email, phone, avatar_url, language, role_id")
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Also update team_members if display_name changed
    if (updates.display_name) {
      await supabaseAdmin
        .from("team_members")
        .update({ name: updates.display_name as string })
        .eq("user_id", session.user_id);
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
