"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import AllocationModal, { AllocationFormValue } from "./modals/AllocationModal";

interface Project { id: string; name_th?: string | null; name_en?: string | null; project_code?: string | null; }
interface Member { id: string; first_name_en?: string | null; last_name_en?: string | null; first_name_th?: string | null; last_name_th?: string | null; weekly_capacity_hours?: number | null; }

interface Allocation {
  id: string;
  project_id: string;
  team_member_id: string;
  allocation_pct: number;
  role_in_project: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
  projects?: Project;
  team_members?: Member;
}

interface Props {
  projects: Project[];
  members: Member[];
  canEdit: boolean;
}

export default function AllocationManager({ projects, members, canEdit }: Props) {
  const [rows, setRows] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Allocation | null>(null);
  const [filterProject, setFilterProject] = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);

  const fetchData = async () => {
    setLoading(true); setErr(null);
    try {
      const params = new URLSearchParams();
      if (filterProject) params.set("project_id", filterProject);
      if (filterMember) params.set("member_id", filterMember);
      if (activeOnly) params.set("active_only", "1");
      const r = await fetch(`/api/allocations?${params.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Load failed");
      setRows(j.allocations || []);
    } catch (e) { setErr(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filterProject, filterMember, activeOnly]);

  const save = async (v: AllocationFormValue) => {
    const url = v.id ? `/api/allocations/${v.id}` : "/api/allocations";
    const method = v.id ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Save failed");
    fetchData();
  };

  const del = async (id: string) => {
    if (!confirm("ลบ allocation นี้?")) return;
    const r = await fetch(`/api/allocations/${id}`, { method: "DELETE" });
    if (!r.ok) { const j = await r.json(); alert(j.error || "Delete failed"); return; }
    fetchData();
  };

  const memberLabel = (m?: Member | null) => m ? (
    [m.first_name_en, m.last_name_en].filter(Boolean).join(" ") ||
    [m.first_name_th, m.last_name_th].filter(Boolean).join(" ") || m.id.slice(0, 6)
  ) : "-";
  const projectLabel = (p?: Project | null) => p ? (p.project_code ? `[${p.project_code}] ${p.name_th || p.name_en || ""}` : (p.name_th || p.name_en || p.id.slice(0, 6))) : "-";

  const memberTotals = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => { if (r.is_active) m.set(r.team_member_id, (m.get(r.team_member_id) ?? 0) + Number(r.allocation_pct)); });
    return m;
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 text-gray-900">
          <Users size={20} className="text-[#00AEEF]" />
          <h2 className="text-lg font-semibold">Project Member Allocation</h2>
          <span className="text-xs text-gray-500">({rows.length} รายการ)</span>
        </div>
        {canEdit && (
          <button
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F7941D] hover:bg-[#FFA630] text-white text-sm font-medium rounded-lg"
            onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={16} /> เพิ่ม Allocation
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 bg-white border border-gray-300 rounded-lg p-3">
        <select className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900"
          value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="">ทุก Project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{projectLabel(p)}</option>)}
        </select>
        <select className="bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900"
          value={filterMember} onChange={e => setFilterMember(e.target.value)}>
          <option value="">ทุก Member</option>
          {members.map(m => <option key={m.id} value={m.id}>{memberLabel(m)}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />
          Active only
        </label>
      </div>

      {err && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{err}</div>}

      <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Project</th>
                <th className="text-left px-4 py-3 font-medium">Member</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-right px-4 py-3 font-medium">Alloc %</th>
                <th className="text-right px-4 py-3 font-medium">Member Total %</th>
                <th className="text-left px-4 py-3 font-medium">Start</th>
                <th className="text-left px-4 py-3 font-medium">End</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                {canEdit && <th className="text-right px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canEdit ? 9 : 8} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={canEdit ? 9 : 8} className="text-center py-8 text-gray-500">ยังไม่มี allocation</td></tr>
              ) : rows.map(r => {
                const total = memberTotals.get(r.team_member_id) ?? 0;
                const over = total > 100;
                return (
                  <tr key={r.id} className="border-t border-gray-300 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-900">{projectLabel(r.projects)}</td>
                    <td className="px-4 py-3 text-gray-900">{memberLabel(r.team_members)}</td>
                    <td className="px-4 py-3 text-gray-600">{r.role_in_project || "-"}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">{Number(r.allocation_pct)}%</td>
                    <td className={`px-4 py-3 text-right font-medium ${over ? "text-red-600" : "text-gray-600"}`}>
                      {total}%{over && " ⚠"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.start_date}</td>
                    <td className="px-4 py-3 text-gray-600">{r.end_date || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${r.is_active ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-gray-500"}`}>
                        {r.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button className="p-1.5 text-gray-500 hover:text-[#00AEEF]" onClick={() => { setEditing(r); setModalOpen(true); }}>
                          <Pencil size={14} />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:text-red-600" onClick={() => del(r.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AllocationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={save}
        initial={editing ? {
          id: editing.id, project_id: editing.project_id, team_member_id: editing.team_member_id,
          allocation_pct: Number(editing.allocation_pct), role_in_project: editing.role_in_project,
          start_date: editing.start_date, end_date: editing.end_date, notes: editing.notes, is_active: editing.is_active,
        } : null}
        projects={projects}
        members={members}
      />
    </div>
  );
}
