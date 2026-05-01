import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If no row exists, create default
  if (!data) {
    const { data: created, error: createErr } = await supabaseAdmin
      .from("notification_preferences")
      .insert({ user_id: ctx.userId })
      .select()
      .single();
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
    return NextResponse.json({ preferences: created });
  }

  return NextResponse.json({ preferences: data });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed = [
    "notify_task_assigned", "notify_task_completed",
    "notify_deal_created", "notify_deal_stage_changed",
    "notify_deal_won", "notify_deal_payment",
    "notify_quotation_approval", "notify_quotation_approved", "notify_quotation_rejected",
    "notify_client_request",
  ];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) update[k] = Boolean(body[k]);
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }
  update.updated_at = new Date().toISOString();

  // Upsert: ensure row exists
  await supabaseAdmin
    .from("notification_preferences")
    .upsert({ user_id: ctx.userId }, { onConflict: "user_id" });

  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .update(update)
    .eq("user_id", ctx.userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preferences: data });
}
