import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, getAccessibleProjectIds } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.searchParams.get("project_id");
  let q = supabaseAdmin.from("decisions").select("*, projects(id,name_th,name_en,project_code)").order("decided_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);

  const accessible = await getAccessibleProjectIds(ctx);
  if (accessible !== null) {
    if (accessible.length === 0) return NextResponse.json({ decisions: [] });
    q = q.in("project_id", accessible);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ decisions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.title || !b.decision) return NextResponse.json({ error: "title, decision required" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("decisions").insert({
    project_id: b.project_id || null, title: b.title, context: b.context || null,
    decision: b.decision, rationale: b.rationale || null, decided_by: b.decided_by || null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ decision: data }, { status: 201 });
}
