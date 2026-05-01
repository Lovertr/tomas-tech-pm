import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [blocks, blockedBy] = await Promise.all([
    supabaseAdmin.from("task_dependencies").select("*, depends:tasks!depends_on_task_id(id, title, status)").eq("task_id", id),
    supabaseAdmin.from("task_dependencies").select("*, blocking:tasks!task_id(id, title, status)").eq("depends_on_task_id", id),
  ]);
  return NextResponse.json({ blockedBy: blocks.data ?? [], blocking: blockedBy.data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  if (!body.depends_on_task_id) return NextResponse.json({ error: "depends_on_task_id required" }, { status: 400 });
  if (body.depends_on_task_id === id) return NextResponse.json({ error: "Cannot depend on self" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("task_dependencies")
    .insert({ task_id: id, depends_on_task_id: body.depends_on_task_id, dependency_type: body.dependency_type || "finish_to_start" })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ dependency: data }, { status: 201 });
}
