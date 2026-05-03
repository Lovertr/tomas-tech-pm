import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

// GET /api/skills — list all skills from catalog + optionally member skills
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = req.nextUrl.searchParams.get("member_id");

  const { data: catalog } = await supabaseAdmin
    .from("skill_catalog")
    .select("*")
    .order("category")
    .order("name");

  if (memberId) {
    const { data: memberSkills } = await supabaseAdmin
      .from("member_skills")
      .select("*, skill_catalog(name, category)")
      .eq("member_id", memberId);
    return NextResponse.json({ catalog: catalog ?? [], memberSkills: memberSkills ?? [] });
  }

  // Overview: all member skills grouped
  const { data: allSkills } = await supabaseAdmin
    .from("member_skills")
    .select("*, skill_catalog(name, category), team_members(first_name, last_name, nickname)");

  return NextResponse.json({ catalog: catalog ?? [], allSkills: allSkills ?? [] });
}

// POST /api/skills — add/update skill for a member, or add skill to catalog
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.mode === "add_to_catalog") {
    if (!["admin", "manager"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { data, error } = await supabaseAdmin.from("skill_catalog").insert({
      name: body.name, category: body.category || "other", description: body.description || null,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ skill: data }, { status: 201 });
  }

  // Default: assign skill to member
  if (!body.member_id || !body.skill_id) return NextResponse.json({ error: "member_id, skill_id required" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("member_skills").upsert({
    member_id: body.member_id, skill_id: body.skill_id,
    proficiency_level: body.proficiency_level || 1, notes: body.notes || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "member_id,skill_id" }).select("*, skill_catalog(name, category)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memberSkill: data }, { status: 201 });
}

// DELETE /api/skills?id=xxx — remove member skill or catalog entry
export async function DELETE(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  const type = req.nextUrl.searchParams.get("type") || "member_skill";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (type === "catalog") {
    if (!["admin", "manager"].includes(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await supabaseAdmin.from("skill_catalog").delete().eq("id", id);
  } else {
    await supabaseAdmin.from("member_skills").delete().eq("id", id);
  }
  return NextResponse.json({ ok: true });
}
