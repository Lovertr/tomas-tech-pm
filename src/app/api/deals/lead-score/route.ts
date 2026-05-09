import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: deals } = await supabaseAdmin.from("deals").select("id, value, stage, created_at, owner_id");
  if (!deals?.length) return NextResponse.json({ updated: 0 });

  const { data: activities } = await supabaseAdmin.from("deal_activities").select("deal_id");
  const actCount: Record<string, number> = {};
  for (const a of activities || []) { actCount[a.deal_id] = (actCount[a.deal_id] || 0) + 1; }

  const stageScore: Record<string, number> = {
    new_lead: 5, waiting_present: 10, contacted: 20, proposal_created: 30, proposal_submitted: 35,
    proposal_confirmed: 50, quotation: 60, negotiation: 70, waiting_po: 80,
    po_received: 95, payment_received: 100, cancelled: 0, refused: 0,
  };

  let updated = 0;
  for (const d of deals) {
    const vScore = Math.min(30, Math.round((Number(d.value || 0) / 1000000) * 10));
    const aScore = Math.min(20, (actCount[d.id] || 0) * 4);
    const sScore = Math.round((stageScore[d.stage] || 0) * 0.4);
    const daysSince = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 86400000);
    const freshness = daysSince < 7 ? 10 : daysSince < 30 ? 7 : daysSince < 90 ? 4 : 0;
    const score = Math.min(100, vScore + aScore + sScore + freshness);
    await supabaseAdmin.from("deals").update({ lead_score: score }).eq("id", d.id);
    updated++;
  }
  return NextResponse.json({ updated });
}
