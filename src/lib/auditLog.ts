import { supabaseAdmin } from "@/lib/supabase-admin";

export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  tableName: string;
  recordId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  description?: string;
  ip?: string;
}

/**
 * Log an audit trail entry.
 * Call this in API routes after any INSERT / UPDATE / DELETE.
 * Runs fire-and-forget so it never blocks the response.
 */
export function logAudit(params: AuditLogParams): void {
  const { userId, action, tableName, recordId, oldValue, newValue, description, ip } = params;

  // Fire-and-forget — don't await, don't block the response
  supabaseAdmin
    .from("audit_logs")
    .insert({
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_value: oldValue ?? null,
      new_value: newValue ?? null,
      description: description ?? null,
      ip_address: ip ?? null,
    })
    .then(({ error }) => {
      if (error) console.error("Audit log insert failed:", error.message);
    });
}

/**
 * Compute a diff between old and new objects (shallow, top-level keys only).
 * Returns { field: { old, new } } for changed fields.
 */
export function diffObjects(
  oldObj: Record<string, unknown> | null | undefined,
  newObj: Record<string, unknown> | null | undefined,
): Record<string, { old: unknown; new: unknown }> | null {
  if (!oldObj || !newObj) return null;
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  for (const key of allKeys) {
    // Skip internal fields
    if (["updated_at", "created_at"].includes(key)) continue;
    const o = oldObj[key];
    const n = newObj[key];
    if (JSON.stringify(o) !== JSON.stringify(n)) {
      changes[key] = { old: o, new: n };
    }
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Helper to extract client IP from request headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
