import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, getAccessibleProjectIds } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.searchParams.get("project_id");
  let q = supabaseAdmin.from("issues").select("*, projects(id,name_th,name_en,project_code)").order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);

  const accessible = await getAccessibleProjectIds(ctx);
  if (accessible !== null) {
    if (accessible.length === 0) return NextResponse.json({ issues: [] });
    q = q.in("project_id", accessible);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ issues: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.project_id || !b.title) return NextResponse.json({ error: "project_id, title required" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("issues").insert({
    project_id: b.project_id, title: b.title, description: b.description || null,
    severity: b.severity || "medium", status: b.status || "open",
    reported_by: b.reported_by || null, assigned_to: b.assigned_to || null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ issue: data }, { status: 201 });
}
