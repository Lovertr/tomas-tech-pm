import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

/**
 * POST /api/client-portal/upload
 * Upload file for client portal chat — supports both client (token) and team (auth) uploads
 * FormData: { file, token? }
 * - If token provided: client upload (public access via portal token)
 * - If no token: team upload (requires authentication)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get("token") as string | null;
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    let projectId: string;

    if (token) {
      // Client upload — validate token
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
      projectId = tokenData.project_id;
    } else {
      // Team upload — require auth
      const ctx = await getAuthContext(request);
      if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      // Use a general folder for team uploads
      const reqProjectId = formData.get("project_id") as string | null;
      projectId = reqProjectId || "team-uploads";
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    // Allowed types — images, videos, documents, archives
    const allowedTypes = [
      // Images
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp",
      // Videos
      "video/mp4", "video/quicktime", "video/webm", "video/avi", "video/x-msvideo",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain", "text/csv",
      // Archives
      "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `File type not allowed: ${file.type}` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "bin";
    const fileName = `client-portal/${projectId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

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
