import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, requireAdmin } from "@/lib/auth-server";

// GET /api/departments - list all departments
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("departments")
    .select("*, head:app_users!departments_head_user_id_fkey(id, display_name, email)")
    .order("code", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also count members per department
  const { data: users } = await supabaseAdmin
    .from("app_users")
    .select("department_id");

  const memberCount: Record<string, number> = {};
  (users ?? []).forEach((u: { department_id: string | null }) => {
    if (u.department_id) memberCount[u.department_id] = (memberCount[u.department_id] || 0) + 1;
  });

  const departments = (data ?? []).map((d: Record<string, unknown>) => ({
    ...d,
    member_count: memberCount[d.id as string] || 0,
  }));

  return NextResponse.json({ departments });
}

// POST /api/departments - create a department (admin only)
export async function POST(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const body = await req.json();
  if (!body.code?.trim() || !body.name_th?.trim())
    return NextResponse.json({ error: "code and name_th are required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("departments")
    .insert({
      code: body.code.trim().toUpperCase(),
      name_th: body.name_th.trim(),
      name_en: body.name_en?.trim() || null,
      name_jp: body.name_jp?.trim() || null,
      head_user_id: body.head_user_id || null,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ department: data }, { status: 201 });
}
