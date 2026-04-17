import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dealId = req.nextUrl.searchParams.get("deal_id");
  const customerId = req.nextUrl.searchParams.get("customer_id");
  const performedById = req.nextUrl.searchParams.get("performed_by_id");
  const ownerId = req.nextUrl.searchParams.get("owner_id");

  let q = supabaseAdmin.from("deal_activities")
    .select("*, performer:app_users!performed_by(id, email, display_name), deals(id, title, owner_id), customers(id, company_name)")
    .order("activity_date", { ascending: false }).limit(100);

  if (dealId) q = q.eq("deal_id", dealId);
  if (customerId) q = q.eq("customer_id", customerId);
  if (performedById) q = q.eq("performed_by", performedById);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filter by owner_id if provided (filter deals owned by that user)
  let filteredActivities = data ?? [];
  if (ownerId) {
    filteredActivities = filteredActivities.filter((activity: any) =>
      activity.deals?.owner_id === ownerId
    );
  }

  return NextResponse.json({ activities: filteredActivities });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.subject?.trim() || !body.activity_type) return NextResponse.json({ error: "subject and activity_type required" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("deal_activities")
    .insert({ ...body, performed_by: body.performed_by || ctx.userId }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ activity: data }, { status: 201 });
}
