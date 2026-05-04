import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// GET — list pending deal invitations for the current user
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("deal_collaborators")
    .select("id, deal_id, role, status, created_at, inviter:app_users!invited_by(id, display_name), deal:deals!deal_id(id, title, value, stage)")
    .eq("user_id", ctx.userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invitations: data ?? [] });
}
