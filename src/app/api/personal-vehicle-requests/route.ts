import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, requireManager } from "@/lib/auth-server";
import { logAudit, getClientIp } from "@/lib/auditLog";

// GET /api/personal-vehicle-requests — list requests
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");

  let query = supabaseAdmin
    .from("personal_vehicle_requests")
    .select(`
      *,
      requester:app_users!personal_vehicle_requests_requester_id_fkey(id, username, full_name),
      approver:app_users!personal_vehicle_requests_approved_by_fkey(id, username, full_name)
    `)
    .order("created_at", { ascending: false });

  // Members only see their own requests
  if (ctx.role === "member") {
    query = query.eq("requester_id", ctx.userId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requests: data ?? [] });
}

// POST /api/personal-vehicle-requests — create a request
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      request_date, end_date, reason, destination,
      estimated_distance, reimbursement_rate, notes,
    } = body;

    if (!request_date || !reason) {
      return NextResponse.json(
        { error: "request_date and reason are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("personal_vehicle_requests")
      .insert({
        requester_id: ctx.userId,
        request_date,
        end_date: end_date || null,
        reason: reason.trim(),
        destination: destination?.trim() || null,
        estimated_distance: estimated_distance ?? null,
        reimbursement_rate: reimbursement_rate ?? null,
        notes: notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    logAudit({
      userId: ctx.userId, action: "INSERT", tableName: "personal_vehicle_requests",
      recordId: data.id, newValue: { request_date, reason, destination },
      description: `Personal vehicle request: ${reason.substring(0, 50)}`,
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ request: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/personal-vehicle-requests — update / approve / reject
export async function PUT(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, action, rejection_reason, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { data: req, error: fetchErr } = await supabaseAdmin
      .from("personal_vehicle_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // ACTION: approve
    if (action === "approve") {
      if (ctx.role !== "admin" && ctx.role !== "manager") {
        return NextResponse.json({ error: "Only admin/manager can approve" }, { status: 403 });
      }
      if (req.status !== "pending") {
        return NextResponse.json({ error: "Only pending requests can be approved" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("personal_vehicle_requests")
        .update({
          status: "approved",
          approved_by: ctx.userId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      logAudit({
        userId: ctx.userId, action: "UPDATE", tableName: "personal_vehicle_requests",
        recordId: id, newValue: { status: "approved" },
        description: `Approved personal vehicle request #${id}`, ip: getClientIp(request.headers),
      });

      return NextResponse.json({ request: data });
    }

    // ACTION: reject
    if (action === "reject") {
      if (ctx.role !== "admin" && ctx.role !== "manager") {
        return NextResponse.json({ error: "Only admin/manager can reject" }, { status: 403 });
      }
      if (req.status !== "pending") {
        return NextResponse.json({ error: "Only pending requests can be rejected" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("personal_vehicle_requests")
        .update({
          status: "rejected",
          approved_by: ctx.userId,
          approved_at: new Date().toISOString(),
          rejection_reason: rejection_reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      logAudit({
        userId: ctx.userId, action: "UPDATE", tableName: "personal_vehicle_requests",
        recordId: id, newValue: { status: "rejected", rejection_reason },
        description: `Rejected personal vehicle request #${id}`, ip: getClientIp(request.headers),
      });

      return NextResponse.json({ request: data });
    }

    // ACTION: cancel
    if (action === "cancel") {
      if (req.requester_id !== ctx.userId && ctx.role !== "admin") {
        return NextResponse.json({ error: "Only requester or admin can cancel" }, { status: 403 });
      }
      if (req.status !== "pending") {
        return NextResponse.json({ error: "Only pending requests can be cancelled" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("personal_vehicle_requests")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      logAudit({
        userId: ctx.userId, action: "UPDATE", tableName: "personal_vehicle_requests",
        recordId: id, newValue: { status: "cancelled" },
        description: `Cancelled personal vehicle request #${id}`, ip: getClientIp(request.headers),
      });

      return NextResponse.json({ request: data });
    }

    // General update (only requester can edit their pending request)
    if (req.requester_id !== ctx.userId && ctx.role !== "admin") {
      return NextResponse.json({ error: "Only requester or admin can edit" }, { status: 403 });
    }
    if (req.status !== "pending") {
      return NextResponse.json({ error: "Only pending requests can be edited" }, { status: 400 });
    }

    const cleaned: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const allowedFields = ["request_date", "end_date", "reason", "destination", "estimated_distance", "reimbursement_rate", "notes"];
    for (const [k, v] of Object.entries(updates)) {
      if (allowedFields.includes(k)) {
        cleaned[k] = v === "" ? null : v;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("personal_vehicle_requests")
      .update(cleaned)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    logAudit({
      userId: ctx.userId, action: "UPDATE", tableName: "personal_vehicle_requests",
      recordId: id, newValue: cleaned,
      description: `Updated personal vehicle request #${id}`, ip: getClientIp(request.headers),
    });

    return NextResponse.json({ request: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/personal-vehicle-requests — hard delete (admin only)
export async function DELETE(request: NextRequest) {
  const adminCtx = await requireManager(request);
  if ("error" in adminCtx) return NextResponse.json({ error: adminCtx.error }, { status: adminCtx.status });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("personal_vehicle_requests")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: adminCtx.userId, action: "DELETE", tableName: "personal_vehicle_requests",
    recordId: id, description: `Deleted personal vehicle request #${id}`,
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ success: true });
}
