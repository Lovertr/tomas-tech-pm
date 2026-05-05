import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { sendPushToUser, sendPushToUsers } from "@/lib/push";

// POST: Send push notification (admin/manager only)
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { user_id, user_ids, title, body: msgBody, url, tag, self_test } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const payload = {
      title,
      body: msgBody || "",
      url: url || "/",
      tag: tag || "tomas-pm",
    };

    // Allow any user to send a test push to themselves
    if (self_test) {
      const result = await sendPushToUser(ctx.userId, payload);
      return NextResponse.json({ success: true, ...result });
    }

    // Sending to others requires admin/manager
    if (!["admin", "manager"].includes(ctx.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user_ids?.length) {
      await sendPushToUsers(user_ids, payload);
      return NextResponse.json({ success: true, sent_to: user_ids.length });
    }

    if (user_id) {
      const result = await sendPushToUser(user_id, payload);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: "user_id or user_ids required" }, { status: 400 });
  } catch (err) {
    console.error("Push send error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
