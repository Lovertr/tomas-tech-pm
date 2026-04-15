import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSessionFromCookie, clearSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = getSessionFromCookie(request.cookies);

    if (!token) {
      return NextResponse.json(
        { error: "No session found" },
        { status: 401 }
      );
    }

    // Delete session from database
    const { error: deleteError } = await supabaseAdmin
      .from("sessions")
      .delete()
      .eq("token", token);

    if (deleteError) {
      console.error("Session deletion error:", deleteError);
      // Continue anyway to clear the cookie
    }

    // Create response with cleared cookie
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.headers.set("Set-Cookie", clearSessionCookie());
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
