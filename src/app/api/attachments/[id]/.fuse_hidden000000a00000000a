import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

const BUCKET = "task-attachments";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: a } = await supabaseAdmin.from("task_attachments").select("*").eq("id", id).single();
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only uploader, manager, or admin may delete
  if (a.uploaded_by !== ctx.userId && !["admin", "manager"].includes(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabaseAdmin.storage.from(BUCKET).remove([a.file_path]);
  const { error } = await supabaseAdmin.from("task_attachments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("activity_logs").insert({
    task_id: a.task_id, actor_id: ctx.userId, action: "deleted_file",
    entity_type: "task", entity_id: a.task_id, details: { file_name: a.file_name },
  });
  return NextResponse.json({ ok: true });
}
