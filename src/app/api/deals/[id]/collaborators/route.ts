import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import { notify } from "@/lib/notify";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("deal_collaborators")
    .select("id, user_id, role, status, created_at, inviter:app_users!invited_by(id, display_name), user:app_users!user_id(id, display_name, email)")
    .eq("deal_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collaborators: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  if (!body.user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  // Only deal owner, collaborators, admin, or manager can invite
  if (ctx.role === "member") {
    const { data: deal } = await supabaseAdmin.from("deals").select("owner_id").eq("id", id).single();
    const { data: collab } = await supabaseAdmin.from("deal_collaborators").select("id").eq("deal_id", id).eq("user_id", ctx.userId).eq("status", "accepted").maybeSingle();
    if (deal?.owner_id !== ctx.userId && !collab) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("deal_collaborators")
    .insert({ deal_id: id, user_id: body.user_id, role: body.role || "collaborator", invited_by: ctx.userId, status: "pending" })
    .select("id, user_id, role, status, created_at, user:app_users!user_id(id, display_name, email)")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already a collaborator" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send notification to the invited user
  try {
    const { data: deal } = await supabaseAdmin.from("deals").select("title").eq("id", id).single();
    const dealTitle = deal?.title || "ดีล";
    await notify(
      body.user_id,
      "คุณถูกเชิญเข้าร่วมดีล",
      `${ctx.username} เชิญคุณเข้าร่วมดีล "${dealTitle}" — กรุณากดยอมรับหรือปฏิเสธ`,
      "deal_collaborator_invited",
      `/deals?invite_deal=${id}`
    );
  } catch (notifyErr) {
    console.error("Collaborator invite notification error:", notifyErr);
  }

  return NextResponse.json({ collaborator: data }, { status: 201 });
}

// PATCH — accept or reject collaborator invitation
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const newStatus = body.status as string;

  if (!newStatus || !["accepted", "rejected"].includes(newStatus)) {
    return NextResponse.json({ error: "status must be 'accepted' or 'rejected'" }, { status: 400 });
  }

  // User can only accept/reject their own invitation
  const { data: collab } = await supabaseAdmin
    .from("deal_collaborators")
    .select("id, status")
    .eq("deal_id", id)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (!collab) return NextResponse.json({ error: "No invitation found" }, { status: 404 });
  if (collab.status !== "pending") return NextResponse.json({ error: "Already responded" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("deal_collaborators")
    .update({ status: newStatus })
    .eq("id", collab.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify deal owner about the response
  try {
    const { data: deal } = await supabaseAdmin.from("deals").select("title, owner_id").eq("id", id).single();
    if (deal?.owner_id) {
      const action = newStatus === "accepted" ? "ยอมรับ" : "ปฏิเสธ";
      await notify(
        deal.owner_id,
        `ผู้ร่วมงาน${action}คำเชิญ`,
        `${ctx.username} ${action}คำเชิญเข้าร่วมดีล "${deal.title}"`,
        "deal_collaborator_responded"
      );
    }
  } catch (notifyErr) {
    console.error("Collaborator response notification error:", notifyErr);
  }

  return NextResponse.json({ ok: true, status: newStatus });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  // Only deal owner, admin, or manager can remove collaborators
  if (ctx.role === "member") {
    const { data: deal } = await supabaseAdmin.from("deals").select("owner_id").eq("id", id).single();
    if (deal?.owner_id !== ctx.userId && userId !== ctx.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabaseAdmin.from("deal_collaborators").delete().eq("deal_id", id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
