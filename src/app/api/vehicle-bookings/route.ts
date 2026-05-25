import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, requireManager } from "@/lib/auth-server";
import { logAudit, getClientIp } from "@/lib/auditLog";

// GET /api/vehicle-bookings — list bookings
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");
  const vehicleId = request.nextUrl.searchParams.get("vehicle_id");

  let query = supabaseAdmin
    .from("vehicle_bookings")
    .select(`
      *,
      vehicle:company_vehicles(id, license_plate, brand, model, color, vehicle_type),
      requester:app_users!vehicle_bookings_requester_id_fkey(id, username, full_name),
      approver:app_users!vehicle_bookings_approved_by_fkey(id, username, full_name)
    `)
    .order("start_datetime", { ascending: false });

  // Members only see their own bookings; admin/manager see all
  if (ctx.role === "member") {
    query = query.eq("requester_id", ctx.userId);
  }

  if (status) {
    query = query.eq("status", status);
  }
  if (vehicleId) {
    query = query.eq("vehicle_id", vehicleId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ bookings: data ?? [] });
}

// POST /api/vehicle-bookings — create a booking request
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      vehicle_id, start_datetime, end_datetime,
      destination, purpose, passenger_count, notes,
    } = body;

    if (!vehicle_id || !start_datetime || !end_datetime || !destination || !purpose) {
      return NextResponse.json(
        { error: "vehicle_id, start_datetime, end_datetime, destination, purpose are required" },
        { status: 400 }
      );
    }

    if (new Date(end_datetime) <= new Date(start_datetime)) {
      return NextResponse.json({ error: "end_datetime must be after start_datetime" }, { status: 400 });
    }

    // Check for overlapping approved/pending bookings on the same vehicle
    const { data: overlaps } = await supabaseAdmin
      .from("vehicle_bookings")
      .select("id")
      .eq("vehicle_id", vehicle_id)
      .in("status", ["pending", "approved"])
      .lt("start_datetime", end_datetime)
      .gt("end_datetime", start_datetime);

    if (overlaps && overlaps.length > 0) {
      return NextResponse.json(
        { error: "รถคันนี้ถูกจองในช่วงเวลาที่เลือกแล้ว / Vehicle already booked for this period" },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("vehicle_bookings")
      .insert({
        vehicle_id,
        requester_id: ctx.userId,
        start_datetime,
        end_datetime,
        destination: destination.trim(),
        purpose: purpose.trim(),
        passenger_count: passenger_count ?? 1,
        notes: notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    logAudit({
      userId: ctx.userId, action: "INSERT", tableName: "vehicle_bookings",
      recordId: data.id, newValue: { vehicle_id, destination, purpose },
      description: `Booking request: ${destination}`, ip: getClientIp(request.headers),
    });

    return NextResponse.json({ booking: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/vehicle-bookings — update booking / approve / reject
export async function PUT(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, action, rejection_reason, mileage_before, mileage_after, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Fetch the current booking
    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from("vehicle_bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // ACTION: approve
    if (action === "approve") {
      if (ctx.role !== "admin" && ctx.role !== "manager") {
        return NextResponse.json({ error: "Only admin/manager can approve" }, { status: 403 });
      }
      if (booking.status !== "pending") {
        return NextResponse.json({ error: "Only pending bookings can be approved" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("vehicle_bookings")
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
        userId: ctx.userId, action: "UPDATE", tableName: "vehicle_bookings",
        recordId: id, newValue: { status: "approved" },
        description: `Approved booking #${id}`, ip: getClientIp(request.headers),
      });

      return NextResponse.json({ booking: data });
    }

    // ACTION: reject
    if (action === "reject") {
      if (ctx.role !== "admin" && ctx.role !== "manager") {
        return NextResponse.json({ error: "Only admin/manager can reject" }, { status: 403 });
      }
      if (booking.status !== "pending") {
        return NextResponse.json({ error: "Only pending bookings can be rejected" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("vehicle_bookings")
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
        userId: ctx.userId, action: "UPDATE", tableName: "vehicle_bookings",
        recordId: id, newValue: { status: "rejected", rejection_reason },
        description: `Rejected booking #${id}`, ip: getClientIp(request.headers),
      });

      return NextResponse.json({ booking: data });
    }

    // ACTION: complete (record mileage)
    if (action === "complete") {
      if (booking.status !== "approved") {
        return NextResponse.json({ error: "Only approved bookings can be completed" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("vehicle_bookings")
        .update({
          status: "completed",
          mileage_before: mileage_before ?? null,
          mileage_after: mileage_after ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Update vehicle current mileage if provided
      if (mileage_after && booking.vehicle_id) {
        await supabaseAdmin
          .from("company_vehicles")
          .update({ current_mileage: mileage_after, updated_at: new Date().toISOString() })
          .eq("id", booking.vehicle_id);
      }

      logAudit({
        userId: ctx.userId, action: "UPDATE", tableName: "vehicle_bookings",
        recordId: id, newValue: { status: "completed", mileage_before, mileage_after },
        description: `Completed booking #${id}`, ip: getClientIp(request.headers),
      });

      return NextResponse.json({ booking: data });
    }

    // ACTION: cancel (requester or admin)
    if (action === "cancel") {
      if (booking.requester_id !== ctx.userId && ctx.role !== "admin") {
        return NextResponse.json({ error: "Only requester or admin can cancel" }, { status: 403 });
      }
      if (booking.status === "completed" || booking.status === "cancelled") {
        return NextResponse.json({ error: "Cannot cancel a completed/cancelled booking" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("vehicle_bookings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      logAudit({
        userId: ctx.userId, action: "UPDATE", tableName: "vehicle_bookings",
        recordId: id, newValue: { status: "cancelled" },
        description: `Cancelled booking #${id}`, ip: getClientIp(request.headers),
      });

      return NextResponse.json({ booking: data });
    }

    // General update (only requester can edit their pending booking)
    if (booking.requester_id !== ctx.userId && ctx.role !== "admin") {
      return NextResponse.json({ error: "Only requester or admin can edit" }, { status: 403 });
    }
    if (booking.status !== "pending") {
      return NextResponse.json({ error: "Only pending bookings can be edited" }, { status: 400 });
    }

    const cleaned: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const allowedFields = ["vehicle_id", "start_datetime", "end_datetime", "destination", "purpose", "passenger_count", "notes"];
    for (const [k, v] of Object.entries(updates)) {
      if (allowedFields.includes(k)) {
        cleaned[k] = v === "" ? null : v;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("vehicle_bookings")
      .update(cleaned)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    logAudit({
      userId: ctx.userId, action: "UPDATE", tableName: "vehicle_bookings",
      recordId: id, newValue: cleaned,
      description: `Updated booking #${id}`, ip: getClientIp(request.headers),
    });

    return NextResponse.json({ booking: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/vehicle-bookings — hard delete (admin only, for cleanup)
export async function DELETE(request: NextRequest) {
  const adminCtx = await requireManager(request);
  if ("error" in adminCtx) return NextResponse.json({ error: adminCtx.error }, { status: adminCtx.status });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("vehicle_bookings")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: adminCtx.userId, action: "DELETE", tableName: "vehicle_bookings",
    recordId: id, description: `Deleted booking #${id}`, ip: getClientIp(request.headers),
  });

  return NextResponse.json({ success: true });
}
