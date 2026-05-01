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

/** Require admin or manager role. */
export async function requireManager(
  request: NextRequest
): Promise<AuthContext | { error: string; status: number }> {
  const ctx = await getAuthContext(request);
  if (!ctx) return { error: "Unauthorized", status: 401 };
  if (ctx.role !== "admin" && ctx.role !== "manager")
    return { error: "Forbidden: Manager access required", status: 403 };
  return ctx;
}

/**
 * For role=member, return the list of project IDs they can access:
 *   - projects they're allocated to via project_members
 *   - projects containing tasks assigned to them
 * For other roles (admin/manager), returns null = "no scoping, see all".
 */
export async function getAccessibleProjectIds(ctx: AuthContext): Promise<string[] | null> {
  if (ctx.role !== "member") return null;

  // Find the team_member linked to this user
  const { data: tm } = await supabaseAdmin
    .from("team_members").select("id").eq("user_id", ctx.userId).maybeSingle();
  const memberId = tm?.id;
  if (!memberId) return []; // not linked → see nothing

  const [alloc, assigned] = await Promise.all([
    supabaseAdmin.from("project_members").select("project_id").eq("team_member_id", memberId).eq("is_active", true),
    supabaseAdmin.from("tasks").select("project_id").eq("assignee_id", memberId),
  ]);
  const ids = new Set<string>();
  (alloc.data ?? []).forEach(r => r.project_id && ids.add(r.project_id));
  (assigned.data ?? []).forEach(r => r.project_id && ids.add(r.project_id));
  return Array.from(ids);
}

/** Convenience: same as above but uses request to look up ctx. Returns ctx + ids. */
export async function getScopedAccess(request: NextRequest): Promise<
  | { error: string; status: number }
  | { ctx: AuthContext; projectIds: string[] | null; memberId: string | null }
> {
  const ctx = await getAuthContext(request);
  if (!ctx) return { error: "Unauthorized", status: 401 };
  const { data: tm } = await supabaseAdmin
    .from("team_members").select("id").eq("user_id", ctx.userId).maybeSingle();
  const memberId = tm?.id ?? null;
  const projectIds = await getAccessibleProjectIds(ctx);
  return { ctx, projectIds, memberId };
}

/** Require a minimum permission level on a specific module.
 *  Levels: 0=none 1=view 2=comment 3=edit 4=create 5=full
 */
export async function requirePermission(
  request: NextRequest,
  moduleKey: string,
  minLevel: number
): Promise<AuthContext | { error: string; status: number }> {
  const ctx = await getAuthContext(request);
  if (!ctx) return { error: "Unauthorized", status: 401 };
  const { data, error } = await supabaseAdmin.rpc("get_user_permission_level", {
    p_user_id: ctx.userId,
    p_module_key: moduleKey,
  });
  if (error) return { error: "Permission check failed", status: 500 };
  const lvl = (data ?? 0) as number;
  if (lvl < minLevel) return { error: `Forbidden: requires level ${minLevel} on ${moduleKey}`, status: 403 };
  return ctx;
}
