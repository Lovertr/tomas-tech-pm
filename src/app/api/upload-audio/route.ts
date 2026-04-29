import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export const maxDuration = 60; // allow longer for large uploads

// POST /api/upload-audio — upload audio to Supabase Storage, return public URL
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    const meetingNoteId = formData.get("meeting_note_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "audio file required" }, { status: 400 });
    }

    // Generate a unique filename
    const ext = file.name?.split(".").pop() || "webm";
    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const path = `meetings/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("meeting-audio")
      .upload(path, buffer, {
        contentType: file.type || "audio/webm",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("meeting-audio")
      .getPublicUrl(path);

    const publicUrl = urlData.publicUrl;

    // If meeting_note_id provided, update the record
    if (meetingNoteId) {
      await supabaseAdmin
        .from("meeting_notes")
        .update({ audio_url: publicUrl })
        .eq("id", meetingNoteId);
    }

    return NextResponse.json({ url: publicUrl, path });
  } catch (err) {
    console.error("upload-audio error", err);
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
