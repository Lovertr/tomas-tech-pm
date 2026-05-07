import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status");
  let q = supabaseAdmin.from("customers").select("*, customer_contacts(id, first_name, last_name)").order("company_name", { ascending: true });
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Map contact_count from the joined customer_contacts
  const customers = (data ?? []).map((c: any) => ({
    ...c,
    contact_count: Array.isArray(c.customer_contacts) ? c.customer_contacts.length : 0,
    contact_names: Array.isArray(c.customer_contacts)
      ? c.customer_contacts.map((ct: any) => `${ct.first_name || ''} ${ct.last_name || ''}`.trim()).filter(Boolean)
      : [],
    customer_contacts: undefined, // remove raw join data
  }));
  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.company_name?.trim()) return NextResponse.json({ error: "company_name required" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("customers")
    .insert({ ...body, created_by: ctx.userId }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customer: data }, { status: 201 });
}
