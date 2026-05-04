import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// GET /api/knowledge-base/categories — list all categories
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("knowledge_categories")
    .select("*, article_count:knowledge_articles(count)")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten count
  const categories = (data ?? []).map((c: any) => ({
    ...c,
    article_count: c.article_count?.[0]?.count || 0,
  }));

  return NextResponse.json({ categories });
}

// POST /api/knowledge-base/categories — create category (admin/manager only)
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("knowledge_categories")
    .insert({
      name: body.name,
      name_en: body.name_en || null,
      name_jp: body.name_jp || null,
      description: body.description || null,
      description_en: body.description_en || null,
      description_jp: body.description_jp || null,
      icon: body.icon || "BookOpen",
      sort_order: body.sort_order || 0,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data }, { status: 201 });
}
