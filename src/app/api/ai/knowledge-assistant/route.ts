import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import { aiCall, AiNotConfiguredError } from "@/lib/ai";

type RequestBody = {
  message: string;
  categoryId?: string;
  lang?: string;
};

// POST /api/ai/knowledge-assistant
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as RequestBody;
    const message = (body.message ?? "").toString().trim();
    const lang = body.lang || "th";

    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    // Fetch relevant articles for context
    // 1. Try text search first
    let articles: any[] = [];

    // Search by keyword match across title and content
    const searchTerms = message
      .replace(/[?？。、，！!]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1)
      .slice(0, 5);

    if (searchTerms.length > 0) {
      const orClauses = searchTerms
        .map(
          (t) =>
            `title.ilike.%${t}%,title_en.ilike.%${t}%,content.ilike.%${t}%,content_en.ilike.%${t}%`
        )
        .join(",");

      const { data } = await supabaseAdmin
        .from("knowledge_articles")
        .select("*, category:knowledge_categories(id, name, name_en, icon)")
        .or(orClauses)
        .order("view_count", { ascending: false })
        .limit(8);

      articles = data || [];
    }

    // 2. If category specified, also fetch articles from that category
    if (body.categoryId && body.categoryId !== "all") {
      const { data: catArticles } = await supabaseAdmin
        .from("knowledge_articles")
        .select("*, category:knowledge_categories(id, name, name_en, icon)")
        .eq("category_id", body.categoryId)
        .order("view_count", { ascending: false })
        .limit(5);

      if (catArticles) {
        const existingIds = new Set(articles.map((a) => a.id));
        for (const a of catArticles) {
          if (!existingIds.has(a.id)) articles.push(a);
        }
      }
    }

    // 3. If still no articles, fetch top pinned/popular ones
    if (articles.length === 0) {
      const { data: topArticles } = await supabaseAdmin
        .from("knowledge_articles")
        .select("*, category:knowledge_categories(id, name, name_en, icon)")
        .order("is_pinned", { ascending: false })
        .order("view_count", { ascending: false })
        .limit(10);
      articles = topArticles || [];
    }

    // Fetch all categories for general awareness
    const { data: categories } = await supabaseAdmin
      .from("knowledge_categories")
      .select("id, name, name_en, description, description_en")
      .order("sort_order", { ascending: true });

    // Build context
    const articlesContext = articles
      .map((a) => {
        const catName = a.category?.name || "ไม่ระบุหมวด";
        const tags = (a.tags || []).join(", ");
        const title = lang === "en" ? a.title_en || a.title : a.title;
        const content = lang === "en" ? a.content_en || a.content : a.content;
        // Truncate long content
        const truncated = content.length > 1500 ? content.slice(0, 1500) + "..." : content;
        return `## ${title}\nหมวด: ${catName} | แท็ก: ${tags}\n${truncated}`;
      })
      .join("\n\n---\n\n");

    const categoriesList = (categories || [])
      .map((c) => `- ${c.name} (${c.name_en || ""})${c.description ? ": " + c.description : ""}`)
      .join("\n");

    const isThaiLang = lang.startsWith("th");

    const systemPrompt = `You are TOMAS TECH's internal knowledge assistant. Your job is to answer questions about the company's technical knowledge base — including IoT, WMS, MES, PLC, AGV/AMR, Production Control, PEGASUS, ASPROVA, and other automation/manufacturing topics.

AVAILABLE KNOWLEDGE CATEGORIES:
${categoriesList}

RELEVANT ARTICLES FROM KNOWLEDGE BASE:
${articlesContext || "(ไม่พบบทความที่เกี่ยวข้อง)"}

INSTRUCTIONS:
- Answer based ONLY on the knowledge base content provided above.
- If the answer is not in the knowledge base, say so clearly and suggest what categories might be relevant.
- Provide specific, practical answers with references to article titles when possible.
- ${isThaiLang ? "ตอบเป็นภาษาไทย ใช้ภาษาที่เข้าใจง่าย" : "Respond in English clearly and concisely."}
- When referencing an article, mention its title so users can find it.
- For technical topics, explain in a way that both technical and non-technical staff can understand.`;

    const reply = await aiCall(message, {
      model: "sonnet",
      system: systemPrompt,
      lang,
      maxTokens: 2048,
    });

    return NextResponse.json({ reply, articlesUsed: articles.length });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json(
        { error: "AI not configured. Set API key in environment." },
        { status: 503 }
      );
    }
    console.error("knowledge-assistant error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
