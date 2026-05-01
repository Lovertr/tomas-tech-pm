export type AppUser = {
  id: string;
  username: string;
  display_name: string;
  display_name_th: string;
  display_name_jp: string;
  role: string;
  position_id: string | null;
  department: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  language: string;
  theme: string;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
};

export type Session = {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
};

export type AuthResponse = {
  user: AppUser | null;
  error: string | null;
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "can_manage_users",
    "can_manage_projects",
    "can_manage_tasks",
    "can_manage_positions",
    "can_view_reports",
    "can_manage_settings",
    "can_approve_timelog",
    "can_manage_members",
    "can_view_projects",
    "can_edit_own_tasks",
    "can_log_time",
  ],
  manager: [
    "can_manage_projects",
    "can_manage_tasks",
    "can_view_reports",
    "can_approve_timelog",
    "can_manage_members",
    "can_view_projects",
    "can_edit_own_tasks",
    "can_log_time",
  ],
  leader: [
    "can_manage_tasks",
    "can_view_reports",
    "can_approve_timelog",
    "can_view_projects",
    "can_edit_own_tasks",
    "can_log_time",
  ],
  member: [
    "can_view_projects",
    "can_edit_own_tasks",
    "can_log_time",
  ],
};

export function generateToken(): string {
  // Use crypto.randomUUID() for token generation
  return crypto.randomUUID();
}

export function getSessionFromCookie(
  cookies: { get: (name: string) => { value: string } | undefined }
): string | null {
  return cookies.get("tt_session")?.value ?? null;
}

export function createSessionCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  return `tt_session=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie(): string {
  return "tt_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict";
}

export function hasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role.toLowerCase()] || [];
  return permissions.includes(permission);
}

export function getUserPermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role.toLowerCase()] || [];
}
