import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// POST /api/timelogs/[id]/reject  body: { reason?: string }  (admin/manager)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "manager"].includes(ctx.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let reason: string | null = null;
  try {
    const body = await request.json();
    reason = body?.reason || null;
  } catch { /* no body is OK */ }

  const { data, error } = await supabaseAdmin
    .from("time_logs")
    .update({
      status: "rejected",
      approved_by: ctx.userId,
      approved_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ timelog: data });
}
