import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-server";
import { loadUserPermissions } from "@/lib/permissions-server";

// GET /api/permissions/me - effective permissions for current logged-in user
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const perms = await loadUserPermissions(ctx.userId);
  return NextResponse.json({ permissions: perms });
}
