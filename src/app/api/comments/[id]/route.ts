import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { data: existing } = await supabaseAdmin.from("task_comments").select("author_id").eq("id", id).single();
  if (existing?.author_id !== ctx.userId && ctx.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await supabaseAdmin
    .from("task_comments").update({ content: body.content, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data: existing } = await supabaseAdmin.from("task_comments").select("author_id").eq("id", id).single();
  if (existing?.author_id !== ctx.userId && ctx.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { error } = await supabaseAdmin.from("task_comments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
