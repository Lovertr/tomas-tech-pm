// Server-only helpers for the granular permission system.
// Do NOT import this file from any "use client" component.

import { supabaseAdmin } from "./supabase-admin";
import type { PermLevel } from "./permissions";

/** Read all module → level for a single user (with role-default fallback) */
export async function loadUserPermissions(
  userId: string
): Promise<Record<string, PermLevel>> {
  // 1) get module catalog
  const { data: modules } = await supabaseAdmin
    .from("permission_modules")
    .select("key");
  if (!modules) return {};

  // 2) compute effective level per module via DB function
  const out: Record<string, PermLevel> = {};
  await Promise.all(
    modules.map(async (m: { key: string }) => {
      const { data } = await supabaseAdmin.rpc("get_user_permission_level", {
        p_user_id: userId,
        p_module_key: m.key,
      });
      out[m.key] = (data ?? 0) as PermLevel;
    })
  );
  return out;
}
