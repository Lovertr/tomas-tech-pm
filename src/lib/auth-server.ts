import { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabase-admin";
import { getSessionFromCookie } from "./auth";

export type AuthContext = {
  userId: string;
  username: string;
  role: string;
  roleLevel: number;
};

/**
 * Verify session cookie and return the current user context.
 * Returns null if session is missing, invalid, or expired.
 */
export async function getAuthContext(
  request: NextRequest
): Promise<AuthContext | null> {
  const token = getSessionFromCookie(request.cookies);
  if (!token) return null;

  const { data: session, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .single();

  if (sessionError || !session) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  const { data: user, error: userError } = await supabaseAdmin
    .from("app_users")
    .select("id, username, is_active, roles(name, level)")
    .eq("id", session.user_id)
    .single();

  if (userError || !user || !user.is_active) return null;

  const role = user.roles as unknown as { name: string; level: number } | null;
  return {
    userId: user.id,
    username: user.username,
    role: role?.name ?? "member",
    roleLevel: role?.level ?? 0,
  };
}

/** Require admin role, throws 403 if not admin. */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthContext | { error: string; status: number }> {
  const ctx = await getAuthContext(request);
  if (!ctx) return { error: "Unauthorized", status: 401 };
  if (ctx.role !== "admin")
    return { error: "Forbidden: Admin access required", status: 403 };
  return ctx;
}
