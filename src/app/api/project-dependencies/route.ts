import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.searchParams.get("project_id");
  let query = supabaseAdmin.from("project_dependencies")
    .select("*, project:projects!project_dependencies_project_id_fkey(id, name_th, project_code, status), depends_on:projects!project_dependencies_depends_on_project_id_fkey(id, name_th, project_code, status)")
    .order("created_at");
  if (projectId) query = query.or("project_id.eq." + projectId + ",depends_on_project_id.eq." + projectId);
  const { data } = await query;
  return NextResponse.json({ dependencies: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  if (body.project_id === body.depends_on_project_id) return NextResponse.json({ error: "Cannot depend on self" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("project_dependencies").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ dependency: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await supabaseAdmin.from("project_dependencies").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
