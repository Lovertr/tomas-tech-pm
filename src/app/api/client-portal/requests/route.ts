import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Helper to validate token
async function validateToken(token: string) {
  const { data } = await supabaseAdmin
    .from("client_portal_tokens")
    .select("*")
    .eq("token", token)
    .eq("active", true)
    .maybeSingle();

  if (!data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return data;
}

/**
 * GET /api/client-portal/requests?token=xxx
 * Get client's submitted requests
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const tokenData = await validateToken(token);
  if (!tokenData) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("client_requests")
    .select("*")
    .eq("token_id", tokenData.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data || [] });
}

/**
 * POST /api/client-portal/requests
 * Submit a new request/issue from client portal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, title, description, request_type, priority, client_name, client_email, client_phone, attachments } = body;

    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!client_name) return NextResponse.json({ error: "Client name is required" }, { status: 400 });

    const tokenData = await validateToken(token);
    if (!tokenData) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const permissions = tokenData.permissions || { submit_requests: true };
    if (!permissions.submit_requests) {
      return NextResponse.json({ error: "Not permitted to submit requests" }, { status: 403 });
    }

    // Create the request
    const { data: newRequest, error } = await supabaseAdmin
      .from("client_requests")
      .insert({
        project_id: tokenData.project_id,
        token_id: tokenData.id,
        client_name: client_name || tokenData.client_name || "ลูกค้า",
        client_email: client_email || tokenData.client_email,
        client_phone: client_phone || null,
        request_type: request_type || "request",
        title,
        description: description || null,
        priority: priority || "medium",
        attachments: attachments || [],
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send notification to PM and project members
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("id, name_th, pm_member_id")
      .eq("id", tokenData.project_id)
      .single();

    if (project) {
      // Get PM's user_id — pm_member_id is a team_members.id
      const notifyUserIds: string[] = [];

      if (project.pm_member_id) {
        const { data: tm } = await supabaseAdmin
          .from("team_members")
          .select("user_id")
          .eq("id", project.pm_member_id)
          .single();
        if (tm?.user_id) notifyUserIds.push(tm.user_id);
      }

      // Also notify project members (manager role in project)
      const { data: projMembers } = await supabaseAdmin
        .from("project_members")
        .select("team_member_id")
        .eq("project_id", project.id)
        .eq("is_active", true);
      if (projMembers) {
        const tmIds = projMembers.map(pm => pm.team_member_id).filter(Boolean);
        if (tmIds.length > 0) {
          const { data: tms } = await supabaseAdmin
            .from("team_members")
            .select("user_id")
            .in("id", tmIds);
          if (tms) {
            for (const t of tms) {
              if (t.user_id && !notifyUserIds.includes(t.user_id)) notifyUserIds.push(t.user_id);
            }
          }
        }
      }

      // Also notify admins — role_id references roles table
      const { data: adminRole } = await supabaseAdmin
        .from("roles")
        .select("id")
        .eq("name", "admin")
        .single();

      if (adminRole) {
        const { data: admins } = await supabaseAdmin
          .from("app_users")
          .select("id")
          .eq("role_id", adminRole.id)
          .eq("is_active", true);

        if (admins) {
          for (const a of admins) {
            if (!notifyUserIds.includes(a.id)) notifyUserIds.push(a.id);
          }
        }
      }

      const typeLabels: Record<string, string> = {
        request: "คำร้องขอ",
        issue: "รายงานปัญหา",
        feedback: "ข้อเสนอแนะ",
        change_request: "ขอเปลี่ยนแปลง",
      };

      for (const uid of notifyUserIds) {
        await supabaseAdmin.from("notifications").insert({
          user_id: uid,
          title: `📩 ${typeLabels[newRequest.request_type] || "คำร้อง"}จากลูกค้า`,
          message: `${client_name} แจ้ง "${title}" ในโปรเจค ${project.name_th}`,
          type: "info",
          link: `/projects/${project.id}`,
        });
      }
    }

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
