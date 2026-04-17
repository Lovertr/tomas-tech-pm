import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.searchParams.get("project_id");
  let q = supabaseAdmin
    .from("client_portal_tokens")
    .select("*, projects:project_id(id,project_code,name_th,name_en)")
    .order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx || !["admin", "manager"].includes(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const token = randomBytes(24).toString("base64url");
  const { data, error } = await supabaseAdmin
    .from("client_portal_tokens")
    .insert({
      project_id: body.project_id,
      token,
      client_name: body.client_name ?? null,
      client_email: body.client_email ?? null,
      expires_at: body.expires_at ?? null,
      active: true,
      created_by: ctx.userId,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
