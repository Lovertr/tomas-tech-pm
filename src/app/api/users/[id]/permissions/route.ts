import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { loadUserPermissions } from "@/lib/permissions-server";

// GET /api/users/[id]/permissions - effective perms (overrides + role defaults)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(request);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  const perms = await loadUserPermissions(id);

  // also return raw overrides so UI can highlight which are explicit
  const { data: overrides } = await supabaseAdmin
    .from("user_permissions")
    .select("module_key, level, updated_at")
    .eq("user_id", id);

  return NextResponse.json({
    permissions: perms,
    overrides: (overrides ?? []).reduce(
      (acc, r) => ({ ...acc, [r.module_key]: r.level }),
      {} as Record<string, number>
    ),
  });
}

// PUT /api/users/[id]/permissions - bulk replace overrides
// body: { permissions: { module_key: level } } | { reset: true }
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(request);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const { id } = await params;
  const body = await request.json();

  // reset = clear all overrides → fall back to role defaults
  if (body.reset) {
    await supabaseAdmin.from("user_permissions").delete().eq("user_id", id);
    return NextResponse.json({ ok: true, reset: true });
  }

  const perms = (body.permissions ?? {}) as Record<string, number>;
  const rows = Object.entries(perms).map(([module_key, level]) => ({
    user_id: id,
    module_key,
    level: Math.max(0, Math.min(5, Number(level) || 0)),
    updated_by: ctx.userId,
    updated_at: new Date().toISOString(),
  }));

  // wipe + insert
  await supabaseAdmin.from("user_permissions").delete().eq("user_id", id);
  if (rows.length) {
    const { error } = await supabaseAdmin.from("user_permissions").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
