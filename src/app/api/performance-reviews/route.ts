import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const memberId = req.nextUrl.searchParams.get("member_id");

  let query = supabaseAdmin.from("performance_reviews")
    .select("*, team_members(first_name, last_name, nickname), reviewer:app_users!performance_reviews_reviewer_id_fkey(display_name)")
    .order("created_at", { ascending: false });
  if (memberId) query = query.eq("member_id", memberId);

  const { data } = await query;
  return NextResponse.json({ reviews: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();

  if (body.id) {
    const { id, ...update } = body;
    update.updated_at = new Date().toISOString();
    if (update.status === "completed") update.completed_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin.from("performance_reviews").update(update).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ review: data });
  }

  const { data, error } = await supabaseAdmin.from("performance_reviews").insert({
    member_id: body.member_id, reviewer_id: ctx.userId, period: body.period || new Date().getFullYear() + "-H1",
    scores: body.scores || {}, self_assessment: body.self_assessment || null,
    manager_review: body.manager_review || null, goals: body.goals || null, status: body.status || "draft",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data }, { status: 201 });
}
