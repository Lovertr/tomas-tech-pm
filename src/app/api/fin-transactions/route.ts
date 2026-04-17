import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = req.nextUrl.searchParams.get("project_id");
  const type = req.nextUrl.searchParams.get("type");
  let q = supabaseAdmin.from("transactions")
    .select("*, projects(id, project_code, name_th), recorder:app_users!recorded_by(id, email)")
    .order("transaction_date", { ascending: false }).limit(200);
  if (projectId && projectId !== "all") q = q.eq("project_id", projectId);
  if (type && type !== "all") q = q.eq("type", type);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transactions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.description?.trim() || !body.amount || !body.type || !body.category || !body.transaction_date)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("transactions")
    .insert({ ...body, recorded_by: ctx.userId }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transaction: data }, { status: 201 });
}
