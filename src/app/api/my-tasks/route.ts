import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: tm } = await supabaseAdmin.from("team_members").select("id").eq("user_id", ctx.userId).maybeSingle();
  if (!tm?.id) return NextResponse.json({ tasks: [] });

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*, projects(id,name_th,name_en,project_code)")
    .eq("assignee_id", tm.id)
    .neq("status", "done")
    .neq("status", "cancelled")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [] });
}
