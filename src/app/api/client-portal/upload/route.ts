import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/client-portal/upload
 * Upload file for client request (public - validated by token)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get("token") as string;
    const file = formData.get("file") as File;

    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    // Validate token
    const { data: tokenData } = await supabaseAdmin
      .from("client_portal_tokens")
      .select("id, project_id, active, expires_at")
      .eq("token", token)
      .eq("active", true)
      .maybeSingle();

    if (!tokenData) return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 403 });
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    // Allowed types
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "video/mp4", "video/quicktime", "video/webm",
      "application/pdf",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "bin";
    const fileName = `client-portal/${tokenData.project_id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("attachments")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // Try creating bucket if it doesn't exist
      if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
        await supabaseAdmin.storage.createBucket("attachments", {
          public: true,
          fileSizeLimit: 52428800,
        });
        const { error: retryError } = await supabaseAdmin.storage
          .from("attachments")
          .upload(fileName, buffer, { contentType: file.type, upsert: false });

        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("attachments")
      .getPublicUrl(fileName);

    return NextResponse.json({
      attachment: {
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      },
    });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
