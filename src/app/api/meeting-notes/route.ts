import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext, getAccessibleProjectIds } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("project_id");
  const meetingType = req.nextUrl.searchParams.get("meeting_type");
  const departmentId = req.nextUrl.searchParams.get("department_id");
  const clientVisible = req.nextUrl.searchParams.get("client_visible");

  let q = supabaseAdmin
    .from("meeting_notes")
    .select("*, projects(id,name_th,name_en,project_code)")
    .order("meeting_date", { ascending: false });

  // Filter by meeting type
  if (meetingType && meetingType !== "all") {
    q = q.eq("meeting_type", meetingType);
  }

  // Filter by specific project
  if (projectId && projectId !== "all") {
    q = q.eq("project_id", projectId);
  }

  // Filter by department (array contains)
  if (departmentId) {
    q = q.contains("department_ids", [departmentId]);
  }

  // Client-visible filter (for portal)
  if (clientVisible === "true") {
    q = q.eq("client_visible", true);
  }

  // Access control: non-admin users see meetings based on their role
  const { data: userData } = await supabaseAdmin
    .from("app_users")
    .select("role")
    .eq("id", ctx.userId)
    .single();

  const isAdminOrManager = userData?.role === "admin" || userData?.role === "manager";

  if (!isAdminOrManager) {
    // Members see: company meetings + their department meetings + their project meetings
    const { data: memberData } = await supabaseAdmin
      .from("team_members")
      .select("id, department_id")
      .eq("user_id", ctx.userId)
      .single();

    const accessible = await getAccessibleProjectIds(ctx);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Filter client-side for complex OR logic
    const filtered = (data ?? []).filter((m: Record<string, unknown>) => {
      // Company meetings visible to all
      if (m.meeting_type === "company") return true;
      // Department meetings visible if user is in that department
      if (m.meeting_type === "department" && memberData?.department_id) {
        const deptIds = m.department_ids as string[] | null;
        if (deptIds && deptIds.length > 0) {
          return deptIds.includes(memberData.department_id);
        }
        return false;
      }
      // Project meetings visible if user has access to that project
      if (m.meeting_type === "project" || !m.meeting_type) {
        if (accessible === null) return true; // admin sees all
        return accessible.includes(m.project_id as string);
      }
      return false;
    });

    return NextResponse.json({ notes: filtered });
  }

  // Admin/manager sees all
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.title || !b.meeting_date) return NextResponse.json({ error: "title, meeting_date required" }, { status: 400 });

  const meetingType = b.meeting_type || "project";

  const { data, error } = await supabaseAdmin.from("meeting_notes").insert({
    project_id: meetingType === "project" ? (b.project_id || null) : null,
    title: b.title,
    meeting_date: b.meeting_date,
    attendees: b.attendees || [],
    agenda: b.agenda || null,
    notes: b.notes || null,
    action_items: b.action_items || [],
    created_by: ctx.userId,
    audio_url: b.audio_url || null,
    meeting_type: meetingType,
    department_ids: b.department_ids || [],
    client_visible: b.client_visible || false,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ note: data }, { status: 201 });
}
