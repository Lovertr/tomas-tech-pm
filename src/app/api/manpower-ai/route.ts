import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthContext } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Fetch all active members
    const { data: members } = await supabaseAdmin
      .from("team_members")
      .select("id, first_name_th, first_name_en, last_name_th, last_name_en, department, skills, weekly_capacity_hours, position_id, positions(name_th, name_en)")
      .eq("is_active", true);

    // Fetch all active allocations
    const { data: allocations } = await supabaseAdmin
      .from("project_members")
      .select("id, project_id, team_member_id, allocation_pct, role_in_project, is_active, projects(name_th, name_en, project_code, status)")
      .eq("is_active", true);

    // Fetch active projects
    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("id, name_th, name_en, project_code, status, tags")
      .eq("is_archived", false)
      .in("status", ["planning", "active"]);

    // Fetch pending/active tasks counts per member
    const { data: taskCounts } = await supabaseAdmin
      .from("tasks")
      .select("assignee_id, status")
      .in("status", ["todo", "in_progress", "review"]);

    const tasksByMember = new Map<string, number>();
    (taskCounts ?? []).forEach(t => {
      if (t.assignee_id) tasksByMember.set(t.assignee_id, (tasksByMember.get(t.assignee_id) ?? 0) + 1);
    });

    // Build member allocation map
    const memberAllocMap = new Map<string, { total: number; projects: string[]; roles: string[] }>();
    (allocations ?? []).forEach(a => {
      const existing = memberAllocMap.get(a.team_member_id) ?? { total: 0, projects: [], roles: [] };
      existing.total += a.allocation_pct;
      const pName = (a.projects as unknown as Record<string, string> | null)?.name_th || (a.projects as unknown as Record<string, string> | null)?.name_en || "";
      if (pName) existing.projects.push(pName);
      if (a.role_in_project) existing.roles.push(a.role_in_project);
      memberAllocMap.set(a.team_member_id, existing);
    });

    // Project member counts
    const projectMemberCount = new Map<string, number>();
    (allocations ?? []).forEach(a => {
      projectMemberCount.set(a.project_id, (projectMemberCount.get(a.project_id) ?? 0) + 1);
    });

    // Analyze
    const overloaded: { name: string; allocation: number; projects: string[] }[] = [];
    const underutilized: { name: string; allocation: number; skills: string[] }[] = [];

    const memberNames = new Map<string, string>();
    (members ?? []).forEach(m => {
      const name = [m.first_name_th, m.last_name_th].filter(Boolean).join(" ")
        || [m.first_name_en, m.last_name_en].filter(Boolean).join(" ") || m.id.slice(0, 6);
      memberNames.set(m.id, name);

      const alloc = memberAllocMap.get(m.id);
      const totalPct = alloc?.total ?? 0;

      if (totalPct > 100) {
        overloaded.push({ name, allocation: totalPct, projects: alloc?.projects ?? [] });
      } else if (totalPct < 50) {
        underutilized.push({ name, allocation: totalPct, skills: (m.skills as string[]) ?? [] });
      }
    });

    // Sort
    overloaded.sort((a, b) => b.allocation - a.allocation);
    underutilized.sort((a, b) => a.allocation - b.allocation);

    // Project gaps - projects with few members
    const projectGaps = (projects ?? [])
      .filter(p => p.status === "active" || p.status === "planning")
      .map(p => {
        const count = projectMemberCount.get(p.id) ?? 0;
        const neededRoles: string[] = [];
        // Heuristic: active projects with < 2 members likely need more
        if (count < 2) neededRoles.push("developer", "tester");
        else if (count < 3) neededRoles.push("tester");
        return {
          project: p.project_code ? `[${p.project_code}] ${p.name_th || p.name_en}` : (p.name_th || p.name_en || ""),
          needed_roles: neededRoles,
          current_members: count,
        };
      })
      .filter(p => p.needed_roles.length > 0);

    // Generate recommendations
    const recommendations: { action: string; reason: string; priority: "high" | "medium" | "low" }[] = [];

    // Recommend moving overloaded members' work
    overloaded.forEach(m => {
      recommendations.push({
        action: `ลดโหลดงานของ ${m.name} (${m.allocation}%)`,
        reason: `${m.name} มีโหลดงานเกิน 100% อยู่ใน ${m.projects.length} โปรเจค: ${m.projects.join(", ")} - ควรกระจายงานหรือลด allocation`,
        priority: m.allocation > 150 ? "high" : "medium",
      });
    });

    // Recommend assigning underutilized to gaps
    underutilized.forEach(m => {
      if (projectGaps.length > 0) {
        const gap = projectGaps[0];
        const matchingSkills = m.skills.filter(s =>
          gap.needed_roles.some(r => s.toLowerCase().includes(r.toLowerCase()))
        );
        recommendations.push({
          action: `จัดสรร ${m.name} (${m.allocation}%) เข้าโปรเจค ${gap.project}`,
          reason: m.allocation === 0
            ? `${m.name} ยังไม่ได้รับมอบหมายงาน${matchingSkills.length > 0 ? ` มีทักษะ: ${matchingSkills.join(", ")}` : ""}`
            : `${m.name} มีโหลดงานต่ำ สามารถรับงานเพิ่มได้`,
          priority: m.allocation === 0 ? "high" : "low",
        });
      }
    });

    // High task count without allocation
    (members ?? []).forEach(m => {
      const taskCount = tasksByMember.get(m.id) ?? 0;
      const alloc = memberAllocMap.get(m.id)?.total ?? 0;
      if (taskCount > 5 && alloc < 50) {
        const name = memberNames.get(m.id) || m.id.slice(0, 6);
        recommendations.push({
          action: `ตรวจสอบ ${name}: มี ${taskCount} งาน แต่ allocation เพียง ${alloc}%`,
          reason: "จำนวนงานไม่สอดคล้องกับ allocation อาจต้องปรับ allocation ให้ตรงกับความเป็นจริง",
          priority: "medium",
        });
      }
    });

    // Sort recommendations by priority
    const prioOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => prioOrder[a.priority] - prioOrder[b.priority]);

    // Build summary
    const totalMembers = members?.length ?? 0;
    const avgAlloc = totalMembers > 0
      ? Math.round([...(members ?? [])].reduce((s, m) => s + (memberAllocMap.get(m.id)?.total ?? 0), 0) / totalMembers)
      : 0;
    const activeProjects = projects?.filter(p => p.status === "active").length ?? 0;

    const summary = [
      `ภาพรวม Manpower: พนักงาน ${totalMembers} คน, โปรเจคที่กำลังดำเนินการ ${activeProjects} โปรเจค`,
      `Allocation เฉลี่ย: ${avgAlloc}%`,
      overloaded.length > 0 ? `พนักงานเกินโหลด: ${overloaded.length} คน (ต้องการดูแลเร่งด่วน)` : "ไม่มีพนักงานเกินโหลด",
      underutilized.length > 0 ? `พนักงานยังว่าง: ${underutilized.length} คน (สามารถรับงานเพิ่มได้)` : "ทุกคนมีงานเพียงพอ",
      projectGaps.length > 0 ? `โปรเจคที่ขาดคน: ${projectGaps.length} โปรเจค` : "",
      recommendations.length > 0 ? `\nมี ${recommendations.length} คำแนะนำสำหรับการปรับปรุง` : "",
    ].filter(Boolean).join("\n");

    return NextResponse.json({
      analysis: {
        summary,
        overloaded,
        underutilized,
        recommendations,
        projectGaps,
      },
    });
  } catch (err) {
    console.error("Manpower AI analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
