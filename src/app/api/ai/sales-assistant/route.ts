import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import { aiCall, AiNotConfiguredError } from "@/lib/ai";

const STAGE_LABELS: Record<string, string> = {
  new_lead: "ลีดใหม่",
  waiting_present: "รอนำเสนอ",
  contacted: "ติดต่อแล้ว",
  proposal_created: "สร้าง Proposal",
  proposal_submitted: "เสนอ Proposal",
  proposal_confirmed: "คอนเฟิร์ม Proposal",
  quotation: "เสนอราคา",
  negotiation: "เจรจาต่อรอง",
  waiting_po: "รอ PO",
  po_received: "ได้รับ PO",
  payment_received: "ได้รับยอดชำระแล้ว",
  cancelled: "ยกเลิก",
  refused: "ปฏิเสธ",
};

type RequestBody = {
  message: string;
  context?: {
    dealId?: string;
    customerId?: string;
  };
  lang?: string;
};

type Deal = {
  id: string;
  title: string;
  customer_id: string;
  value: number;
  stage: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  description?: string;
  expected_close_date?: string;
  owner?: { id: string; email: string; display_name: string };
};

type Customer = {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  created_at: string;
  updated_at: string;
};

type Activity = {
  id: string;
  deal_id?: string;
  customer_id?: string;
  activity_type: string;
  activity_date: string;
  description: string;
  performed_by: string;
  performer?: { id: string; email: string; display_name: string };
};

type Comment = {
  id: string;
  deal_id?: string;
  customer_id?: string;
  content: string;
  created_at: string;
  created_by: string;
};

type Collaborator = {
  id: string;
  email: string;
  display_name: string;
};

type KnowledgeArticle = {
  id: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  tags?: string[];
  category?: { id: string; name: string; name_en?: string };
};

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as RequestBody;
    const message: string = (body.message ?? "").toString().trim();
    const lang = body.lang || "th";
    const { dealId, customerId } = body.context || {};

    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    let deals: Deal[] = [];
    let customers: Customer[] = [];
    let activities: Activity[] = [];
    let comments: Comment[] = [];
    let collaborators: Collaborator[] = [];

    if (dealId) {
      const { data: dealData } = await supabaseAdmin
        .from("deals")
        .select("*, owner:app_users!owner_id(id, email, display_name)")
        .eq("id", dealId)
        .single();

      if (dealData) {
        deals = [dealData as Deal];

        if (dealData.customer_id) {
          const { data: customerData } = await supabaseAdmin
            .from("customers")
            .select("*")
            .eq("id", dealData.customer_id)
            .single();
          if (customerData) customers = [customerData as Customer];
        }

        const { data: activitiesData } = await supabaseAdmin
          .from("deal_activities")
          .select("*, performer:app_users!performed_by(id, email, display_name)")
          .eq("deal_id", dealId)
          .order("activity_date", { ascending: false })
          .limit(20);
        activities = (activitiesData as Activity[]) || [];

        const { data: commentsData } = await supabaseAdmin
          .from("deal_comments")
          .select("*")
          .eq("deal_id", dealId)
          .order("created_at", { ascending: false })
          .limit(20);
        comments = (commentsData as Comment[]) || [];

        const { data: collaboratorsData } = await supabaseAdmin
          .from("deal_collaborators")
          .select("collaborator:app_users!collaborator_id(id, email, display_name)")
          .eq("deal_id", dealId);
        if (collaboratorsData) {
          collaborators = collaboratorsData
            .map((c: any) => c.collaborator)
            .filter((c: any) => c) as Collaborator[];
        }
      }
    } else if (customerId) {
      const { data: customerData } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();
      if (customerData) customers = [customerData as Customer];

      const { data: dealsData } = await supabaseAdmin
        .from("deals")
        .select("*, owner:app_users!owner_id(id, email, display_name)")
        .eq("customer_id", customerId)
        .order("updated_at", { ascending: false });
      deals = (dealsData as Deal[]) || [];

      const { data: activitiesData } = await supabaseAdmin
        .from("deal_activities")
        .select("*, performer:app_users!performed_by(id, email, display_name)")
        .eq("customer_id", customerId)
        .order("activity_date", { ascending: false })
        .limit(30);
      activities = (activitiesData as Activity[]) || [];

      const { data: commentsData } = await supabaseAdmin
        .from("customer_comments")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(30);
      comments = (commentsData as Comment[]) || [];
    } else {
      const { data: ownedDeals } = await supabaseAdmin
        .from("deals")
        .select("*, owner:app_users!owner_id(id, email, display_name), customer:customers!customer_id(id, company_name)")
        .eq("owner_id", ctx.userId)
        .order("updated_at", { ascending: false })
        .limit(50);

      const { data: collabRows } = await supabaseAdmin
        .from("deal_collaborators")
        .select("deal_id")
        .eq("collaborator_id", ctx.userId);
      const collabDealIds = (collabRows || []).map((r: any) => r.deal_id);
      let collabDeals: Deal[] = [];
      if (collabDealIds.length > 0) {
        const { data: cd } = await supabaseAdmin
          .from("deals")
          .select("*, owner:app_users!owner_id(id, email, display_name), customer:customers!customer_id(id, company_name)")
          .in("id", collabDealIds)
          .order("updated_at", { ascending: false });
        collabDeals = (cd as Deal[]) || [];
      }

      const allDeals = [...(ownedDeals || []), ...collabDeals];
      const seen = new Set<string>();
      deals = allDeals.filter((d) => { if (seen.has(d.id)) return false; seen.add(d.id); return true; }) as Deal[];

      const customerIds = [...new Set(deals.map((d) => d.customer_id).filter(Boolean))];
      if (customerIds.length > 0) {
        const { data: customersData } = await supabaseAdmin
          .from("customers")
          .select("*")
          .in("id", customerIds);
        customers = (customersData as Customer[]) || [];
      }

      const dealIds = deals.map((d) => d.id);
      if (dealIds.length > 0) {
        const { data: activitiesData } = await supabaseAdmin
          .from("deal_activities")
          .select("*, performer:app_users!performed_by(id, email, display_name)")
          .in("deal_id", dealIds)
          .order("activity_date", { ascending: false })
          .limit(50);
        activities = (activitiesData as Activity[]) || [];
      }
    }

    // Fetch company knowledge base for product/service context
    let knowledgeArticles: KnowledgeArticle[] = [];
    try {
      const { data: kbData } = await supabaseAdmin
        .from("knowledge_articles")
        .select("id, title, title_en, content, content_en, tags, category:knowledge_categories(id, name, name_en)")
        .order("is_pinned", { ascending: false })
        .order("view_count", { ascending: false })
        .limit(20);
      knowledgeArticles = ((kbData as unknown) as KnowledgeArticle[]) || [];
    } catch {
      // Knowledge base fetch failed - continue without it
    }

    // Build comprehensive system prompt with sales data + company knowledge
    const systemPrompt = buildSystemPrompt(deals, customers, activities, comments, collaborators, knowledgeArticles, lang);

    const reply = await aiCall(message, {
      model: "sonnet",
      system: systemPrompt,
      lang,
      maxTokens: 8192,
    });

    return NextResponse.json({ reply });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json(
        { error: "AI not configured. Set ANTHROPIC_API_KEY in .env.local" },
        { status: 503 }
      );
    }
    console.error("sales-assistant error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildSystemPrompt(
  deals: Deal[],
  customers: Customer[],
  activities: Activity[],
  comments: Comment[],
  collaborators: Collaborator[],
  knowledgeArticles: KnowledgeArticle[],
  lang: string
): string {
  const isThaiLang = (lang || "th").toLowerCase().startsWith("th");

  const dealsSummary = deals
    .map((deal) => {
      const stageTh = STAGE_LABELS[deal.stage] || deal.stage;
      const stageLabel = isThaiLang ? stageTh : deal.stage;
      return "- " + deal.title + " (ID: " + deal.id + "): " + stageLabel + ", Value: $" + (deal.value || 0) + ", Owner: " + (deal.owner?.display_name || "Unknown") + ", Updated: " + new Date(deal.updated_at).toLocaleDateString();
    })
    .join("\n");

  const customersSummary = customers
    .map((cust) => {
      return "- " + cust.company_name + " (ID: " + cust.id + "): " + (cust.contact_person || "N/A") + ", Email: " + (cust.email || "N/A") + ", Phone: " + (cust.phone || "N/A") + ", Industry: " + (cust.industry || "N/A");
    })
    .join("\n");

  const activitiesSummary = activities
    .slice(0, 15)
    .map((act) => {
      return "[" + new Date(act.activity_date).toLocaleDateString() + "] " + act.activity_type + ": " + act.description + " (by " + (act.performer?.display_name || "Unknown") + ")";
    })
    .join("\n");

  const commentsSummary = comments
    .slice(0, 10)
    .map((c) => {
      return "[" + new Date(c.created_at).toLocaleDateString() + "] " + c.content;
    })
    .join("\n");

  const collaboratorsList = collaborators.map((c) => c.display_name + " (" + c.email + ")").join(", ");

  let basePrompt = "You are a personal sales assistant for TOMAS TECH, an IT solutions company based in Thailand. Your role is to help sales professionals analyze deals, strategize, draft communications, and prepare for customer interactions.\n\nYou have access to the following sales data:";

  if (dealsSummary) {
    basePrompt += "\n\nDEALS:\n" + dealsSummary;
  }
  if (customersSummary) {
    basePrompt += "\n\nCUSTOMERS:\n" + customersSummary;
  }
  if (activitiesSummary) {
    basePrompt += "\n\nRECENT ACTIVITIES:\n" + activitiesSummary;
  }
  if (commentsSummary) {
    basePrompt += "\n\nCOMMENTS:\n" + commentsSummary;
  }
  if (collaboratorsList) {
    basePrompt += "\n\nCOLLABORATORS:\n" + collaboratorsList;
  }

  // Add company knowledge base (products, services, strengths)
  if (knowledgeArticles.length > 0) {
    const articleBlocks: string[] = [];
    for (const article of knowledgeArticles) {
      const catName = isThaiLang
        ? (article.category?.name || "")
        : (article.category?.name_en || article.category?.name || "");
      const artTitle = isThaiLang
        ? article.title
        : (article.title_en || article.title);
      const artContent = isThaiLang
        ? (article.content || "")
        : (article.content_en || article.content || "");
      let trimmed = artContent;
      if (artContent.length > 1500) {
        trimmed = artContent.slice(0, 1500) + "...";
      }
      const header = catName ? "[" + catName + "] " + artTitle : artTitle;
      articleBlocks.push("### " + header + "\n" + trimmed);
    }
    const knowledgeSummary = articleBlocks.join("\n\n");

    basePrompt += "\n\n=== COMPANY KNOWLEDGE BASE (TOMAS TECH Products, Services & Strengths) ===\n"
      + "Use this information to answer questions about our company, recommend solutions to customers, draft proposals, and support sales conversations.\n\n"
      + knowledgeSummary;
  }

  if (isThaiLang) {
    basePrompt += "\n\n" + [
      "คุณสามารถช่วยในการ:",
      "- วิเคราะห์สถานะของการเจรจา (deal analysis)",
      "- แนะนำกลยุทธ์การขายตามข้อมูลจริง",
      "- ร่างอีเมล, ข้อความ, หรือเสนอราคา",
      "- สรุปข้อมูลลูกค้าและประวัติการติดต่อ",
      "- เตรียมการประชุมกับลูกค้า",
      "- ระบุความเสี่ยง, โอกาส, และพื้นที่สำหรับการปรับปรุง",
      "- ตอบคำถามเกี่ยวกับการจัดการสัมพันธ์ลูกค้า",
      "- อธิบายผลิตภัณฑ์และบริการของ TOMAS TECH (PEGASUS, i-Reporter, Hardware, Infrastructure)",
      "- แนะนำ solution ที่เหมาะกับอุตสาหกรรม/ปัญหาของลูกค้า",
      "- ร่างสคริปต์การขาย, ตอบข้อโต้แย้ง, เปรียบเทียบกับคู่แข่ง",
    ].join("\n");
    basePrompt += "\n\nกรุณาตอบเป็นภาษาไทยและให้คำแนะนำที่เป็นประโยชน์และสามารถปฏิบัติได้จริง";
  } else {
    basePrompt += "\n\n" + [
      "You can help with:",
      "- Deal analysis and stage assessment",
      "- Sales strategy recommendations based on actual data",
      "- Drafting emails, messages, and proposals",
      "- Customer summary and interaction history",
      "- Meeting preparation",
      "- Risk and opportunity identification",
      "- Customer relationship management advice",
      "- Explaining TOMAS TECH products and services (PEGASUS, i-Reporter, Hardware, Infrastructure, etc.)",
      "- Recommending solutions based on customer industry and pain points",
      "- Drafting sales scripts, handling objections, and competitive comparisons",
    ].join("\n");
    basePrompt += "\n\nProvide actionable, practical advice tailored to the sales context.";
  }

  return basePrompt;
}
