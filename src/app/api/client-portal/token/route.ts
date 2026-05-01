import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import crypto from "crypto";

/**
 * GET /api/client-portal/token?project_id=xxx
 * List all tokens for a project (internal, auth required)
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("client_portal_tokens")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tokens: data || [] });
}

/**
 * POST /api/client-portal/token
 * Generate a new portal token (admin/manager/leader)
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager", "leader"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { project_id, client_name, client_email, expires_days, description, permissions } = body;

  if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  // Generate secure token
  const token = crypto.randomBytes(24).toString("base64url");

  const expiresAt = expires_days
    ? new Date(Date.now() + expires_days * 86400000).toISOString()
    : null;

  const { data, error } = await supabaseAdmin
    .from("client_portal_tokens")
    .insert({
      project_id,
      token,
      client_name: client_name || null,
      client_email: client_email || null,
      description: description || null,
      expires_at: expiresAt,
      permissions: permissions || {
        view_progress: true,
        submit_requests: true,
        view_tasks: true,
        view_milestones: true,
      },
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token: data }, { status: 201 });
}

/**
 * PATCH /api/client-portal/token
 * Update token (activate/deactivate, change permissions)
 */
export async function PATCH(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, active, permissions, client_name, client_email, description } = body;

  if (!id) return NextResponse.json({ error: "Token id required" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof active === "boolean") update.active = active;
  if (permissions) update.permissions = permissions;
  if (client_name !== undefined) update.client_name = client_name;
  if (client_email !== undefined) update.client_email = client_email;
  if (description !== undefined) update.description = description;

  const { data, error } = await supabaseAdmin
    .from("client_portal_tokens")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token: data });
}

/**
 * DELETE /api/client-portal/token?id=xxx
 * Delete a token permanently
 */
export async function DELETE(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Token id required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("client_portal_tokens")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
