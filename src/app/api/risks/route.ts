import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, getAccessibleProjectIds } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.searchParams.get("project_id");
  let q = supabaseAdmin.from("risks").select("*, projects(id,name_th,name_en,project_code), team_members!owner_id(id,first_name_th,last_name_th,first_name_en,last_name_en)").order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);

  const accessible = await getAccessibleProjectIds(ctx);
  if (accessible !== null) {
    if (accessible.length === 0) return NextResponse.json({ risks: [] });
    q = q.in("project_id", accessible);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ risks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager", "leader"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.project_id || !b.title) return NextResponse.json({ error: "project_id, title required" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("risks").insert({
    project_id: b.project_id, title: b.title, description: b.description || null,
    probability: b.probability || "medium", impact: b.impact || "medium",
    mitigation: b.mitigation || null, owner_id: b.owner_id || null, status: b.status || "identified",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ risk: data }, { status: 201 });
}
