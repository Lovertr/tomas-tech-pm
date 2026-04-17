import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

const BUCKET = "task-attachments";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(_req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from("task_attachments")
    .select("*, uploader:app_users!uploaded_by(id, email)")
    .eq("task_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate signed URLs for each
  const items = await Promise.all((data ?? []).map(async (a) => {
    const { data: signed } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(a.file_path, 3600);
    return { ...a, url: signed?.signedUrl ?? null };
  }));
  return NextResponse.json({ attachments: items });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: taskId } = await params;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 25MB" }, { status: 413 });

  // Look up task to grab project_id
  const { data: task } = await supabaseAdmin.from("tasks").select("project_id").eq("id", taskId).single();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const safeName = file.name.replace(/[^\w.\-]/g, "_");
  const path = `${taskId}/${Date.now()}_${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from("task_attachments")
    .insert({
      task_id: taskId,
      project_id: task.project_id,
      uploaded_by: ctx.userId,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      mime_type: file.type || null,
    })
    .select()
    .single();
  if (error) {
    await supabaseAdmin.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from("activity_logs").insert({
    task_id: taskId, actor_id: ctx.userId, action: "uploaded_file",
    entity_type: "task", entity_id: taskId, details: { file_name: file.name, size: file.size },
  });

  return NextResponse.json({ attachment: data }, { status: 201 });
}
