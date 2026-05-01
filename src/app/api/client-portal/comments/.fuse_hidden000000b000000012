import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

/**
 * GET /api/client-portal/comments?request_id=xxx&token=xxx
 * Get comments for a client request
 * - If token is provided: public access (client portal)
 * - If authenticated: internal access (team)
 */
export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("request_id");
  if (!requestId) return NextResponse.json({ error: "request_id required" }, { status: 400 });

  const token = request.nextUrl.searchParams.get("token");

  if (token) {
    // Public access — validate token owns this request
    const { data: tokenData } = await supabaseAdmin
      .from("client_portal_tokens")
      .select("id")
      .eq("token", token)
      .eq("active", true)
      .maybeSingle();

    if (!tokenData) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    // Verify request belongs to this token
    const { data: req } = await supabaseAdmin
      .from("client_requests")
      .select("id")
      .eq("id", requestId)
      .eq("token_id", tokenData.id)
      .maybeSingle();

    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  } else {
    // Internal access — require auth
    const ctx = await getAuthContext(request);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("client_request_comments")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data || [] });
}

/**
 * POST /api/client-portal/comments
 * Post a comment on a client request
 * Body: { request_id, message, token?, attachments? }
 * - If token: client comment
 * - If authenticated: team comment
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { request_id, message, token, attachments } = body;

  if (!request_id || !message?.trim()) {
    return NextResponse.json({ error: "request_id and message required" }, { status: 400 });
  }

  let senderType: "client" | "team";
  let senderName: string;
  let senderId: string | null = null;

  if (token) {
    // Client posting
    const { data: tokenData } = await supabaseAdmin
      .from("client_portal_tokens")
      .select("id, client_name")
      .eq("token", token)
      .eq("active", true)
      .maybeSingle();

    if (!tokenData) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    // Verify request belongs to this token
    const { data: req } = await supabaseAdmin
      .from("client_requests")
      .select("id, client_name")
      .eq("id", request_id)
      .eq("token_id", tokenData.id)
      .maybeSingle();

    if (!req) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    senderType = "client";
    senderName = req.client_name || tokenData.client_name || "ลูกค้า";

    // Notify project team about client reply
    const { data: cr } = await supabaseAdmin
      .from("client_requests")
      .select("project_id, title")
      .eq("id", request_id)
      .single();

    if (cr) {
      const { data: project } = await supabaseAdmin
        .from("projects")
        .select("name_th, pm_member_id")
        .eq("id", cr.project_id)
        .single();

      if (project?.pm_member_id) {
        const { data: tm } = await supabaseAdmin
          .from("team_members")
          .select("user_id")
          .eq("id", project.pm_member_id)
          .single();

        if (tm?.user_id) {
          await supabaseAdmin.from("notifications").insert({
            user_id: tm.user_id,
            title: `💬 ลูกค้าตอบกลับคำร้อง`,
            message: `${senderName} ตอบกลับ "${cr.title}" ในโปรเจค ${project.name_th}`,
            type: "info",
            link: `/projects/${cr.project_id}`,
          });
        }
      }
    }
  } else {
    // Team posting — require auth
    const ctx = await getAuthContext(request);
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Look up team member name
    const { data: tm } = await supabaseAdmin
      .from("team_members")
      .select("id, first_name_th, last_name_th")
      .eq("user_id", ctx.userId)
      .maybeSingle();

    senderType = "team";
    senderName = tm ? `${tm.first_name_th} ${tm.last_name_th}` : ctx.username;
    senderId = tm?.id || null;
  }

  const { data, error } = await supabaseAdmin
    .from("client_request_comments")
    .insert({
      request_id,
      sender_type: senderType,
      sender_name: senderName,
      sender_id: senderId,
      message: message.trim(),
      attachments: attachments || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data }, { status: 201 });
}
