import { NextRequest, NextResponse } from "next/server";
import { logAudit, getClientIp } from "@/lib/auditLog";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";
import { notify, getAdminManagerIds } from "@/lib/notify";

const STAGE_LABELS: Record<string, string> = {
  new_lead: "ลีดใหม่", waiting_present: "รอนำเสนอ", contacted: "ติดต่อแล้ว",
  proposal_created: "สร้าง Proposal", proposal_submitted: "เสนอ Proposal",
  proposal_confirmed: "คอนเฟิร์ม Proposal",
  quotation: "เสนอราคา", negotiation: "เจรจาต่อรอง", waiting_po: "รอ PO",
  po_received: "ได้รับ PO", payment_received: "ได้รับยอดชำระแล้ว",
  cancelled: "ยกเลิก", refused: "ปฏิเสธ",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  body.updated_at = new Date().toISOString();

  const { data: oldDeal } = await supabaseAdmin.from("deals").select("*, customers(id, company_name)").eq("id", id).single();

  // Ownership check: member can only edit own deals or deals they collaborate on
  if (ctx.role === "member" && oldDeal) {
    const isOwner = oldDeal.owner_id === ctx.userId;
    const { data: collab } = await supabaseAdmin.from("deal_collaborators").select("id").eq("deal_id", id).eq("user_id", ctx.userId).maybeSingle();
    if (!isOwner && !collab) return NextResponse.json({ error: "Forbidden: you can only edit your own deals" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin.from("deals").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    if (body.stage && oldDeal && oldDeal.stage !== body.stage) {
      const stageLabel = STAGE_LABELS[body.stage] || body.stage;
      await notify(data.owner_id, "สถานะดีลเปลี่ยน", data.title + " เปลี่ยนเป็น " + stageLabel, "deal_stage_changed");

      if ((body.stage === "po_received" || body.stage === "payment_received") && oldDeal.stage !== body.stage) {
        const adminManagerIds = await getAdminManagerIds();
        const value = data.value || oldDeal.value || 0;
        const formattedValue = new Intl.NumberFormat("th-TH").format(Number(value));
        const isPayment = body.stage === "payment_received";
        for (const userId of adminManagerIds) {
          await notify(userId, isPayment ? "ได้รับยอดชำระแล้ว!" : "ดีลปิดสำเร็จ!", data.title + " - THB " + formattedValue, isPayment ? "deal_payment" : "deal_won");
        }
      }
    }
  } catch (notifyErr) {
    console.error("Deal update notification error:", notifyErr);
  }

  // Auto-create project when deal stage changes to po_received or payment_received
  if ((body.stage === "po_received" || body.stage === "payment_received") && oldDeal && !["po_received", "payment_received"].includes(oldDeal.stage)) {
    try {
      const clientName = (oldDeal.customers as any)?.company_name || "";
      const dealTitle = oldDeal.title || data.title || "New Project";
      const dealValue = Number(oldDeal.value || data.value || 0);
      const now = new Date().toISOString().slice(0, 10);
      const { data: existingProject } = await supabaseAdmin.from("projects").select("id").eq("description", "auto:deal:" + id).maybeSingle();
      if (!existingProject) {
        const year = new Date().getFullYear();
        const { count } = await supabaseAdmin.from("projects").select("id", { count: "exact", head: true });
        const seq = String((count ?? 0) + 1).padStart(3, "0");
        const projectCode = "PRJ-" + year + "-" + seq;
        await supabaseAdmin.from("projects").insert({
          project_code: projectCode, name_th: dealTitle, name_en: dealTitle,
          description: "auto:deal:" + id, client_name: clientName, status: "planning",
          priority: "medium", budget_limit: dealValue, start_date: now, estimated_hours: 0, progress: 0,
        });
      }
    } catch (e) {
      console.error("Auto-create project failed:", e);
    }
  }

  logAudit({ userId: ctx.userId, action: "UPDATE", tableName: "deals", recordId: id, newValue: body, description: "Updated deal " + id, ip: getClientIp(req.headers) });

  return NextResponse.json({ deal: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Ownership check: member can only delete own deals
  if (ctx.role === "member") {
    const { data: deal } = await supabaseAdmin.from("deals").select("owner_id").eq("id", id).single();
    if (!deal || deal.owner_id !== ctx.userId) return NextResponse.json({ error: "Forbidden: you can only delete your own deals" }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from("deals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({ userId: ctx.userId, action: "DELETE", tableName: "deals", recordId: id, description: "Deleted deal " + id, ip: getClientIp(req.headers) });

  return NextResponse.json({ ok: true });
}
