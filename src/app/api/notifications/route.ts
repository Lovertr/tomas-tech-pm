import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabaseAdmin.from("notifications").select("*").eq("user_id", ctx.userId).order("created_at", { ascending: false }).limit(50);
  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body.mark_all_read) {
    await supabaseAdmin.from("notifications").update({ is_read: true }).eq("user_id", ctx.userId);
    return NextResponse.json({ success: true });
  }
  if (body.ids?.length) {
    await supabaseAdmin.from("notifications").update({ is_read: true }).in("id", body.ids).eq("user_id", ctx.userId);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "bad request" }, { status: 400 });
}
