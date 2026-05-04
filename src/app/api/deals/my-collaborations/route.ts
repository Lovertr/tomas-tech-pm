import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// GET — list deal IDs where current user is an accepted collaborator
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("deal_collaborators")
    .select("deal_id")
    .eq("user_id", ctx.userId)
    .eq("status", "accepted");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deal_ids: (data ?? []).map(d => d.deal_id) });
}
