import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  body.updated_at = new Date().toISOString();

  // Get old deal data to check if stage is changing to po_received
  const { data: oldDeal } = await supabaseAdmin.from("deals").select("*, customers(id, company_name)").eq("id", id).single();

  const { data, error } = await supabaseAdmin.from("deals").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-create project when deal stage changes to po_received
  if (body.stage === "po_received" && oldDeal && oldDeal.stage !== "po_received") {
    try {
      const clientName = (oldDeal.customers as any)?.company_name || "";
      const dealTitle = oldDeal.title || data.title || "New Project";
      const dealValue = Number(oldDeal.value || data.value || 0);
      const now = new Date().toISOString().slice(0, 10);

      // Check if a project already exists for this deal (avoid duplicates)
      const { data: existingProject } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("description", `auto:deal:${id}`)
        .maybeSingle();

      if (!existingProject) {
        // Generate project code
        const year = new Date().getFullYear();
        const { count } = await supabaseAdmin.from("projects").select("id", { count: "exact", head: true });
        const seq = String((count ?? 0) + 1).padStart(3, "0");
        const projectCode = `PRJ-${year}-${seq}`;

        await supabaseAdmin.from("projects").insert({
          project_code: projectCode,
          name_th: dealTitle,
          name_en: dealTitle,
          description: `auto:deal:${id}`,
          client_name: clientName,
          status: "planning",
          priority: "medium",
          budget_limit: dealValue,
          start_date: now,
          estimated_hours: 0,
          progress: 0,
        });
      }
    } catch (e) {
      console.error("Auto-create project failed:", e);
      // Don't fail the deal update if project creation fails
    }
  }

  return NextResponse.json({ deal: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { error } = await supabaseAdmin.from("deals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
