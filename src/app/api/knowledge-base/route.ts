import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// GET /api/knowledge-base — list articles (with optional filters)
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categoryId = req.nextUrl.searchParams.get("category_id");
  const search = req.nextUrl.searchParams.get("search");
  const tag = req.nextUrl.searchParams.get("tag");
  const pinned = req.nextUrl.searchParams.get("pinned");

  let q = supabaseAdmin
    .from("knowledge_articles")
    .select("*, category:knowledge_categories(id, name, name_en, name_jp, icon)")
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (categoryId && categoryId !== "all") q = q.eq("category_id", categoryId);
  if (tag) q = q.contains("tags", [tag]);
  if (pinned === "true") q = q.eq("is_pinned", true);
  if (search) {
    q = q.or(`title.ilike.%${search}%,title_en.ilike.%${search}%,content.ilike.%${search}%,content_en.ilike.%${search}%`);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ articles: data ?? [] });
}

// POST /api/knowledge-base — create article (admin/manager only)
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("knowledge_articles")
    .insert({
      category_id: body.category_id || null,
      title: body.title,
      title_en: body.title_en || null,
      title_jp: body.title_jp || null,
      content: body.content || "",
      content_en: body.content_en || null,
      content_jp: body.content_jp || null,
      tags: body.tags || [],
      is_pinned: body.is_pinned || false,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select("*, category:knowledge_categories(id, name, name_en, name_jp, icon)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ article: data }, { status: 201 });
}
