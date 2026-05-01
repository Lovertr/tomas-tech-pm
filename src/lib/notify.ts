import { supabaseAdmin } from "./supabase-admin";

// Insert one notification
export async function notify(
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
): Promise<void> {
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      link: link || null,
      is_read: false,
    });
  } catch (err) {
    console.error("notify() error:", err);
  }
}

// Insert multiple notifications (batch)
export async function notifyMany(
  userIds: string[],
  title: string,
  message: string,
  type: string,
  link?: string
): Promise<void> {
  try {
    if (!userIds.length) return;
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      title,
      message,
      type,
      link: link || null,
      is_read: false,
    }));
    await supabaseAdmin.from("notifications").insert(notifications);
  } catch (err) {
    console.error("notifyMany() error:", err);
  }
}

// Get user_id from team_member_id
export async function getMemberUserId(memberId: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from("team_members")
      .select("user_id")
      .eq("id", memberId)
      .maybeSingle();
    return data?.user_id || null;
  } catch (err) {
    console.error("getMemberUserId() error:", err);
    return null;
  }
}

// Role IDs (from roles table)
const ROLE_IDS = {
  admin: "63b1d7bc-f82b-4d1e-8c6e-4fa1f0fef9bf",
  manager: "28966e05-7e97-4aef-8ee4-14a8fca1abb9",
  member: "9c592967-d51c-4c1e-9eab-3c963f552069",
};

// Business Development department ID
const BD_DEPT_ID = "d0000001-0000-0000-0000-000000000003";

// Get admin + manager user IDs
export async function getAdminManagerIds(): Promise<string[]> {
  try {
    const { data } = await supabaseAdmin
      .from("app_users")
      .select("id")
      .in("role_id", [ROLE_IDS.admin, ROLE_IDS.manager])
      .eq("is_active", true);
    return data?.map((u) => u.id) || [];
  } catch (err) {
    console.error("getAdminManagerIds() error:", err);
    return [];
  }
}

// Get BD department managers (was formerly "sales leaders")
export async function getBDManagerIds(): Promise<string[]> {
  try {
    const { data } = await supabaseAdmin
      .from("app_users")
      .select("id")
      .in("role_id", [ROLE_IDS.admin, ROLE_IDS.manager])
      .eq("department_id", BD_DEPT_ID)
      .eq("is_active", true);
    return data?.map((u) => u.id) || [];
  } catch (err) {
    console.error("getBDManagerIds() error:", err);
    return [];
  }
}
