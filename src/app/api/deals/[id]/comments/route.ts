import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("deal_comments")
    .select("id, content, created_at, updated_at, user:app_users!user_id(id, display_name, email)")
    .eq("deal_id", id)
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

  // Any authenticated user can comment (owner, collaborator, admin, manager)
  const { data, error } = await supabaseAdmin
    .from("deal_comments")
    .insert({ deal_id: id, user_id: ctx.userId, content: body.content.trim() })
    .select("id, content, created_at, updated_at, user:app_users!user_id(id, display_name, email)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const commentId = req.nextUrl.searchParams.get("comment_id");
  if (!commentId) return NextResponse.json({ error: "comment_id required" }, { status: 400 });

  // Only comment author or admin/manager can delete
  if (ctx.role === "member") {
    const { data: comment } = await supabaseAdmin.from("deal_comments").select("user_id").eq("id", commentId).single();
    if (!comment || comment.user_id !== ctx.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from("deal_comments").delete().eq("id", commentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
