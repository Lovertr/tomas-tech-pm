import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

const BUCKET = "business-cards";

// POST — upload business card image for a contact
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: customerId, contactId } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
    }
    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    // Ensure bucket exists (create if not)
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets?.find((b) => b.name === BUCKET)) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${customerId}/${contactId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // Update contact record
    const { error: updateError } = await supabaseAdmin
      .from("customer_contacts")
      .update({ business_card_url: publicUrl })
      .eq("id", contactId)
      .eq("customer_id", customerId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("business-card upload error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE — remove business card image
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: customerId, contactId } = await params;

  try {
    // Get current URL to find file path
    const { data: contact } = await supabaseAdmin
      .from("customer_contacts")
      .select("business_card_url")
      .eq("id", contactId)
      .eq("customer_id", customerId)
      .single();

    if (contact?.business_card_url) {
      // Extract path from URL
      const urlParts = contact.business_card_url.split(`/${BUCKET}/`);
      if (urlParts[1]) {
        await supabaseAdmin.storage.from(BUCKET).remove([urlParts[1]]);
      }
    }

    const { error } = await supabaseAdmin
      .from("customer_contacts")
      .update({ business_card_url: null })
      .eq("id", contactId)
      .eq("customer_id", customerId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("business-card delete error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
