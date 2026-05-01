import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(_req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("task_comments")
    .select("*, author:app_users!author_id(id, email)")
    .eq("task_id", id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  if (!body.content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("task_comments")
    .insert({ task_id: id, author_id: ctx.userId, content: body.content })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Log activity
  await supabaseAdmin.from("activity_logs").insert({
    task_id: id, actor_id: ctx.userId, action: "commented",
    entity_type: "task", entity_id: id, details: { preview: body.content.slice(0, 80) },
  });
  return NextResponse.json({ comment: data }, { status: 201 });
}
