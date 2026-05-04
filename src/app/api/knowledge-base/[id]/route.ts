import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// GET /api/knowledge-base/[id] — get single article + increment view_count
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("knowledge_articles")
    .select("*, category:knowledge_categories(id, name, name_en, name_jp, icon)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Increment view count
  await supabaseAdmin
    .from("knowledge_articles")
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq("id", id);

  return NextResponse.json({ article: data });
}

// PATCH /api/knowledge-base/[id] — update article (admin/manager only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: ctx.userId };
  const allowed = ["title", "title_en", "title_jp", "content", "content_en", "content_jp", "category_id", "tags", "is_pinned"];
  for (const k of allowed) {
    if (body[k] !== undefined) updates[k] = body[k];
  }

  const { data, error } = await supabaseAdmin
    .from("knowledge_articles")
    .update(updates)
    .eq("id", id)
    .select("*, category:knowledge_categories(id, name, name_en, name_jp, icon)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ article: data });
}

// DELETE /api/knowledge-base/[id] — delete article (admin/manager only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }
  const { id } = await params;

  const { error } = await supabaseAdmin.from("knowledge_articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
