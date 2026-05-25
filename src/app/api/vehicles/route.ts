import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, requireAdmin } from "@/lib/auth-server";
import { logAudit, getClientIp } from "@/lib/auditLog";

// GET /api/vehicles — list all active company vehicles (all authenticated users)
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const showAll = request.nextUrl.searchParams.get("all") === "true" && ctx.role === "admin";

  let query = supabaseAdmin
    .from("company_vehicles")
    .select("*")
    .order("license_plate", { ascending: true });

  if (!showAll) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ vehicles: data ?? [] });
}

// POST /api/vehicles — create a vehicle (admin only)
export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const body = await request.json();
    const {
      license_plate, brand, model, color, vehicle_type, seat_count,
      image_url, mandatory_insurance_expiry, voluntary_insurance_expiry,
      voluntary_insurance_company, voluntary_insurance_type,
      current_mileage, registration_date, notes,
    } = body;

    if (!license_plate || !brand || !model) {
      return NextResponse.json({ error: "license_plate, brand, model are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("company_vehicles")
      .insert({
        license_plate: license_plate.trim(),
        brand, model,
        color: color || null,
        vehicle_type: vehicle_type || "sedan",
        seat_count: seat_count ?? 5,
        image_url: image_url || null,
        mandatory_insurance_expiry: mandatory_insurance_expiry || null,
        voluntary_insurance_expiry: voluntary_insurance_expiry || null,
        voluntary_insurance_company: voluntary_insurance_company || null,
        voluntary_insurance_type: voluntary_insurance_type || null,
        current_mileage: current_mileage ?? 0,
        registration_date: registration_date || null,
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "ทะเบียนรถซ้ำ" }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logAudit({ userId: ctx.userId, action: "INSERT", tableName: "company_vehicles", recordId: data.id, newValue: { license_plate, brand, model }, description: `Added vehicle: ${license_plate}`, ip: getClientIp(request.headers) });

    return NextResponse.json({ vehicle: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/vehicles — update a vehicle (admin only)
export async function PUT(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Clean up empty strings to null
    const cleaned: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(updates)) {
      cleaned[k] = v === "" ? null : v;
    }

    const { data, error } = await supabaseAdmin
      .from("company_vehicles")
      .update(cleaned)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    logAudit({ userId: ctx.userId, action: "UPDATE", tableName: "company_vehicles", recordId: id, newValue: cleaned, description: `Updated vehicle: ${data.license_plate}`, ip: getClientIp(request.headers) });

    return NextResponse.json({ vehicle: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/vehicles — soft-delete a vehicle (admin only)
export async function DELETE(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("company_vehicles")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({ userId: ctx.userId, action: "DELETE", tableName: "company_vehicles", recordId: id, description: `Deactivated vehicle`, ip: getClientIp(request.headers) });

  return NextResponse.json({ success: true });
}
