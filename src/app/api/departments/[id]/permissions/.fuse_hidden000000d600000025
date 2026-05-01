import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth-server";

// GET /api/departments/[id]/permissions - get department-level permissions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("department_permissions")
    .select("module_key, level, updated_at")
    .eq("department_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const permissions = (data ?? []).reduce(
    (acc: Record<string, number>, r: { module_key: string; level: number }) => {
      acc[r.module_key] = r.level;
      return acc;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({ permissions });
}

// PUT /api/departments/[id]/permissions - bulk set department permissions
// body: { permissions: { module_key: level } }
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const { id } = await params;
  const body = await req.json();

  const perms = (body.permissions ?? {}) as Record<string, number>;
  const rows = Object.entries(perms)
    .filter(([, level]) => level > 0) // only store non-zero levels
    .map(([module_key, level]) => ({
      department_id: id,
      module_key,
      level: Math.max(0, Math.min(5, Number(level) || 0)),
      updated_by: ctx.userId,
      updated_at: new Date().toISOString(),
    }));

  // wipe + insert
  await supabaseAdmin.from("department_permissions").delete().eq("department_id", id);
  if (rows.length) {
    const { error } = await supabaseAdmin.from("department_permissions").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
