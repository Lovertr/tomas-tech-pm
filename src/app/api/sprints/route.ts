import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, getAccessibleProjectIds } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.searchParams.get("project_id");
  let q = supabaseAdmin.from("sprints").select("*, projects(id,name_th,name_en,project_code)").order("start_date", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);

  const accessible = await getAccessibleProjectIds(ctx);
  if (accessible !== null) {
    if (accessible.length === 0) return NextResponse.json({ sprints: [] });
    q = q.in("project_id", accessible);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sprints: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager", "leader"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.project_id || !b.name || !b.start_date || !b.end_date) return NextResponse.json({ error: "required fields missing" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("sprints").insert({
    project_id: b.project_id, name: b.name, goal: b.goal || null,
    start_date: b.start_date, end_date: b.end_date, status: b.status || "planned",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sprint: data }, { status: 201 });
}
