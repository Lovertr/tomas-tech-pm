"use client";
import { useState, useEffect } from "react";
import { X, Mail, Phone, Briefcase, BarChart3, Clock, User, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  memberId: string | null;
  lang?: string;
  onNavigateProject?: (projectId: string) => void;
}

interface MemberProfile {
  id: string;
  first_name_th: string | null;
  first_name_en: string | null;
  last_name_th: string | null;
  last_name_en: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  position_id: string | null;
  positions?: { name_th: string | null; name_en: string | null; color: string | null } | null;
  hourly_rate: number | null;
  skills: string[] | null;
}

interface Allocation {
  id: string;
  project_id: string;
  allocation_pct: number;
  role_in_project: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  projects: { name_th: string | null; name_en: string | null; project_code: string | null; status: string } | null;
}

interface TaskInfo {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string;
  project_name?: string;
}

const i18n: Record<string, Record<string, string>> = {
  profile: { th: "โปรไฟล์พนักงาน", en: "Employee Profile", jp: "従業員プロファイル" },
  personalInfo: { th: "ข้อมูลส่วนตัว", en: "Personal Info", jp: "個人情報" },
  myWork: { th: "งานของฉัน", en: "My Assignments", jp: "マイタスク" },
  position: { th: "ตำแหน่ง", en: "Position", jp: "役職" },
  department: { th: "แผนก", en: "Department", jp: "部署" },
  email: { th: "อีเมล", en: "Email", jp: "メール" },
  phone: { th: "โทรศัพท์", en: "Phone", jp: "電話" },
  skills: { th: "ทักษะ", en: "Skills", jp: "スキル" },
  workload: { th: "โหลดงาน", en: "Workload", jp: "作業負荷" },
  projects: { th: "โปรเจค", en: "Projects", jp: "プロジェクト" },
  tasks: { th: "งานที่รับผิดชอบ", en: "Assigned Tasks", jp: "担当タスク" },
  noData: { th: "ไม่มีข้อมูล", en: "No data", jp: "データなし" },
  role: { th: "บทบาท", en: "Role", jp: "役割" },
  allocation: { th: "สัดส่วน", en: "Allocation", jp: "配分" },
  active: { th: "กำลังดำเนินการ", en: "Active", jp: "進行中" },
};

export default function MemberProfileModal({ open, onClose, memberId, lang = "th", onNavigateProject }: Props) {
  const L = (k: string) => i18n[k]?.[lang] ?? i18n[k]?.en ?? k;
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"info" | "work">("info");

  useEffect(() => {
    if (!open || !memberId) return;
    setTab("info");
    fetchProfile();
  }, [open, memberId]);

  const fetchProfile = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${memberId}/profile`);
      if (res.ok) {
        const json = await res.json();
        setMember(json.member);
        setAllocations(json.allocations ?? []);
        setTasks(json.tasks ?? []);
      }
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const name = member
    ? (lang === "th"
      ? [member.first_name_th, member.last_name_th].filter(Boolean).join(" ")
      : [member.first_name_en, member.last_name_en].filter(Boolean).join(" "))
    || [member.first_name_en, member.last_name_en].filter(Boolean).join(" ")
    : "";

  const posName = member?.positions
    ? (lang === "th" ? member.positions.name_th : member.positions.name_en) || member.positions.name_en || ""
    : "";

  const totalAlloc = allocations.filter(a => a.is_active).reduce((s, a) => s + a.allocation_pct, 0);
  const allocColor = totalAlloc > 100 ? "#EF4444" : totalAlloc > 80 ? "#F7941D" : "#10B981";

  const initials = name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "??";

  const statusColors: Record<string, string> = {
    todo: "#94A3B8", in_progress: "#6366F1", review: "#F59E0B", done: "#10B981",
    planning: "#94A3B8", active: "#003087", on_hold: "#F59E0B", completed: "#10B981",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[#E2E8F0]" style={{ background: "linear-gradient(135deg, #003087 0%, #00AEEF 100%)" }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white"><X size={20} /></button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-white text-xl font-bold">{initials}</div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{name || "..."}</h2>
              <p className="text-white/80 text-sm">{posName}</p>
              {member?.department && <p className="text-white/60 text-xs mt-0.5">{member.department}</p>}
            </div>
          </div>
          {/* Workload badge */}
          <div className="absolute bottom-4 right-6 bg-white/20 rounded-lg px-3 py-1.5 text-white text-sm">
            {L("workload")}: <span className="font-bold" style={{ color: totalAlloc > 100 ? "#FCA5A5" : "#A7F3D0" }}>{totalAlloc}%</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E2E8F0]">
          {(["info", "work"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium ${tab === t ? "text-[#003087] border-b-2 border-[#003087]" : "text-gray-500"}`}>
              {t === "info" ? L("personalInfo") : L("myWork")}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 200px)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">Loading...</div>
          ) : tab === "info" ? (
            <div className="p-6 space-y-4">
              {/* Info rows */}
              {[
                { icon: Briefcase, label: L("position"), value: posName },
                { icon: User, label: L("department"), value: member?.department || "-" },
                { icon: Mail, label: L("email"), value: member?.email || "-" },
                { icon: Phone, label: L("phone"), value: member?.phone || "-" },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="w-9 h-9 rounded-lg bg-[#003087]/10 flex items-center justify-center">
                    <row.icon size={16} className="text-[#003087]" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">{row.label}</div>
                    <div className="text-sm font-medium text-gray-800">{row.value}</div>
                  </div>
                </div>
              ))}

              {/* Skills */}
              {member?.skills && member.skills.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50">
                  <div className="text-xs text-gray-500 mb-2">{L("skills")}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#003087]/10 text-[#003087]">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Workload summary */}
              <div className="p-4 rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{L("workload")}</span>
                  <span className="text-sm font-bold" style={{ color: allocColor }}>{totalAlloc}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(totalAlloc, 100)}%`, background: allocColor }} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{allocations.filter(a => a.is_active).length} {L("projects")} {L("active")}</div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* Active Allocations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#003087]" /> {L("projects")} ({allocations.filter(a => a.is_active).length})
                </h3>
                {allocations.filter(a => a.is_active).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">{L("noData")}</p>
                ) : (
                  <div className="space-y-2">
                    {allocations.filter(a => a.is_active).map(alloc => {
                      const pName = alloc.projects
                        ? (alloc.projects.project_code ? `[${alloc.projects.project_code}] ` : "") +
                          (lang === "th" ? alloc.projects.name_th || alloc.projects.name_en : alloc.projects.name_en || alloc.projects.name_th) || ""
                        : alloc.project_id.slice(0, 8);
                      return (
                        <div key={alloc.id}
                          className="p-3 rounded-xl border border-[#E2E8F0] hover:border-[#003087]/30 cursor-pointer transition-colors"
                          onClick={() => onNavigateProject?.(alloc.project_id)}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{pName}</div>
                              <div className="flex items-center gap-3 mt-1">
                                {alloc.role_in_project && (
                                  <span className="text-xs text-gray-500">{L("role")}: {alloc.role_in_project}</span>
                                )}
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                  background: `${statusColors[alloc.projects?.status || "active"] || "#94A3B8"}20`,
                                  color: statusColors[alloc.projects?.status || "active"] || "#94A3B8",
                                }}>{alloc.projects?.status || "active"}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-sm font-bold" style={{ color: alloc.allocation_pct > 50 ? "#003087" : "#94A3B8" }}>
                                  {alloc.allocation_pct}%
                                </div>
                              </div>
                              <ChevronRight size={14} className="text-gray-300" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-[#F7941D]" /> {L("tasks")} ({tasks.length})
                </h3>
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">{L("noData")}</p>
                ) : (
                  <div className="space-y-1.5">
                    {tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50">
                        <div className="w-2 h-2 rounded-full" style={{ background: statusColors[task.status] || "#94A3B8" }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-800 truncate">{task.title}</div>
                          {task.project_name && <div className="text-xs text-gray-400">{task.project_name}</div>}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: `${statusColors[task.status] || "#94A3B8"}20`,
                          color: statusColors[task.status] || "#94A3B8",
                        }}>{task.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
