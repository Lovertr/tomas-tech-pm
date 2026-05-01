import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

const ONBOARDING_TASKS = [
  { title: "ตั้งค่าบัญชีผู้ใช้งาน", title_en: "Set up user account", title_jp: "アカウント設定", priority: "high" },
  { title: "อ่านคู่มือการใช้งานระบบ", title_en: "Read system user guide", title_jp: "システムガイドを読む", priority: "medium" },
  { title: "ตั้งค่าแจ้งเตือน", title_en: "Configure notifications", title_jp: "通知設定", priority: "medium" },
  { title: "แนะนำตัวกับทีม", title_en: "Introduce yourself to the team", title_jp: "チームに自己紹介", priority: "low" },
  { title: "ทำความรู้จักกับเครื่องมือที่ใช้", title_en: "Familiarize with tools", title_jp: "ツールに慣れる", priority: "medium" },
  { title: "ตรวจสอบสิทธิ์การเข้าถึง", title_en: "Verify access permissions", title_jp: "アクセス権限の確認", priority: "high" },
];

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { member_id } = body;
  if (!member_id) return NextResponse.json({ error: "member_id required" }, { status: 400 });

  const { data: member } = await supabaseAdmin.from("team_members").select("id, user_id, full_name").eq("id", member_id).single();
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const now = new Date();
  const tasks = ONBOARDING_TASKS.map((t, i) => ({
    title: t.title,
    title_en: t.title_en,
    title_jp: t.title_jp,
    status: "todo",
    priority: t.priority,
    assigned_to: member_id,
    created_by: ctx.userId,
    start_date: now.toISOString().slice(0, 10),
    due_date: new Date(now.getTime() + (7 + i * 2) * 86400000).toISOString().slice(0, 10),
    source: "onboarding",
  }));

  const { data, error } = await supabaseAdmin.from("tasks").insert(tasks).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: data, count: data?.length || 0 }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const memberId = req.nextUrl.searchParams.get("member_id");
  if (!memberId) return NextResponse.json({ error: "member_id required" }, { status: 400 });

  const { data: tasks } = await supabaseAdmin.from("tasks")
    .select("id, title, title_en, title_jp, status, priority, due_date")
    .eq("assigned_to", memberId)
    .eq("source", "onboarding")
    .order("due_date");

  const total = tasks?.length || 0;
  const done = tasks?.filter(t => t.status === "done").length || 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return NextResponse.json({ tasks: tasks || [], total, done, progress });
}
