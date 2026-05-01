import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/client-portal?token=xxx
 * Public endpoint — validates token and returns project info for client portal
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  // Validate token
  const { data: tokenData, error: tokenErr } = await supabaseAdmin
    .from("client_portal_tokens")
    .select("*")
    .eq("token", token)
    .eq("active", true)
    .maybeSingle();

  if (tokenErr || !tokenData) {
    return NextResponse.json({ error: "Invalid or inactive token" }, { status: 403 });
  }

  // Check expiry
  if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token has expired" }, { status: 403 });
  }

  // Update access tracking
  await supabaseAdmin
    .from("client_portal_tokens")
    .update({
      last_accessed_at: new Date().toISOString(),
      access_count: (tokenData.access_count || 0) + 1,
    })
    .eq("id", tokenData.id);

  // Get project info
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id, project_code, name_th, name_en, name_jp, description, status, priority, start_date, end_date, progress, client_name")
    .eq("id", tokenData.project_id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const permissions = tokenData.permissions || {
    view_progress: true, submit_requests: true, view_tasks: true, view_milestones: true
  };

  // Get milestones if permitted
  let milestones: unknown[] = [];
  if (permissions.view_milestones) {
    const { data } = await supabaseAdmin
      .from("milestones")
      .select("id, title, status, due_date, completed_date")
      .eq("project_id", project.id)
      .order("due_date", { ascending: true });
    milestones = data || [];
  }

  // Get tasks summary if permitted (no internal details)
  let tasks: unknown[] = [];
  if (permissions.view_tasks) {
    const { data } = await supabaseAdmin
      .from("tasks")
      .select("id, title, status, priority, due_date, start_date, source, client_request_id")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });
    tasks = data || [];
  }

  // Get client's own requests
  let clientRequests: unknown[] = [];
  if (permissions.submit_requests) {
    const { data } = await supabaseAdmin
      .from("client_requests")
      .select("id, request_type, title, description, status, priority, attachments, response_to_client, created_at, updated_at, resolved_at")
      .eq("token_id", tokenData.id)
      .order("created_at", { ascending: false });
    clientRequests = data || [];
  }

  return NextResponse.json({
    project,
    milestones,
    tasks,
    clientRequests,
    permissions,
    tokenInfo: {
      id: tokenData.id,
      client_name: tokenData.client_name,
      client_email: tokenData.client_email,
    },
  });
}
