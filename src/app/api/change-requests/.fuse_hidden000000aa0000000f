import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, getAccessibleProjectIds } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.searchParams.get("project_id");
  let q = supabaseAdmin.from("change_requests").select("*, projects(id,name_th,name_en,project_code)").order("requested_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);

  const accessible = await getAccessibleProjectIds(ctx);
  if (accessible !== null) {
    if (accessible.length === 0) return NextResponse.json({ items: [] });
    q = q.in("project_id", accessible);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.project_id || !b.title) return NextResponse.json({ error: "project_id, title required" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("change_requests").insert({
    project_id: b.project_id, cr_code: b.cr_code || null, title: b.title, description: b.description || null,
    impact_scope: b.impact_scope || null, impact_schedule_days: b.impact_schedule_days || null,
    impact_budget: b.impact_budget || null, requested_by: b.requested_by || null, status: "pending",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-create a Decision Log entry for this CR
  try {
    const crCode = data.cr_code || data.id.slice(0, 8);
    await supabaseAdmin.from("decisions").insert({
      project_id: b.project_id,
      title: `[CR] ${b.title}`,
      context: `Change Request ${crCode}: ${b.description || b.title}\n\nผลกระทบ: ${b.impact_scope || '-'}\nกระทบวัน: ${b.impact_schedule_days || 0} วัน\nกระทบงบ: ${b.impact_budget || 0} บาท`,
      decision: null,
      rationale: null,
      decided_by: null,
      decided_at: null,
    });
  } catch (e) {
    console.error("Auto-create decision log failed:", e);
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
