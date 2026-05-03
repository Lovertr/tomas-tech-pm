"use client";
import { useState, useEffect } from "react";

interface Dep { id: string; project_id: string; depends_on_project_id: string; dependency_type: string; project_name?: string; depends_on_name?: string; }
interface Proj { id: string; name: string; status: string; }

export default function ProjectDependencyPanel({ lang }: { lang: string }) {
  const [deps, setDeps] = useState<Dep[]>([]);
  const [projects, setProjects] = useState<Proj[]>([]);
  const [form, setForm] = useState({ project_id: "", depends_on_project_id: "", dependency_type: "blocks" });
  const [showForm, setShowForm] = useState(false);

  const t = {
    title: lang === "th" ? "การพึ่งพาระหว่างโครงการ" : lang === "jp" ? "プロジェクト依存関係" : "Project Dependencies",
    add: lang === "th" ? "เพิ่ม" : lang === "jp" ? "追加" : "Add",
    project: lang === "th" ? "โครงการ" : lang === "jp" ? "プロジェクト" : "Project",
    dependsOn: lang === "th" ? "พึ่งพา" : lang === "jp" ? "依存先" : "Depends On",
    type: lang === "th" ? "ประเภท" : lang === "jp" ? "種類" : "Type",
    blocks: lang === "th" ? "บล็อก" : "Blocks",
    required: lang === "th" ? "ต้องการ" : "Required",
    related: lang === "th" ? "เกี่ยวข้อง" : "Related",
    remove: lang === "th" ? "ลบ" : lang === "jp" ? "削除" : "Remove",
    noData: lang === "th" ? "ไม่มีข้อมูล" : "No dependencies",
    save: lang === "th" ? "บันทึก" : lang === "jp" ? "保存" : "Save",
  };

  const load = () => {
    fetch("/api/project-dependencies").then(r => r.json()).then(d => setDeps(d.dependencies || []));
    fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects || []));
  };
  useEffect(load, []);

  const handleAdd = async () => {
    if (!form.project_id || !form.depends_on_project_id) return;
    await fetch("/api/project-dependencies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    setForm({ project_id: "", depends_on_project_id: "", dependency_type: "blocks" });
    load();
  };

  const handleRemove = async (id: string) => {
    await fetch("/api/project-dependencies?id=" + id, { method: "DELETE" });
    load();
  };

  const typeColor: Record<string, string> = { blocks: "bg-red-100 text-red-700", required: "bg-yellow-100 text-yellow-700", related: "bg-blue-100 text-blue-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">{t.title}</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-[#003087] text-white rounded-lg text-sm hover:bg-[#002266]">{t.add}</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">{t.project}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={form.depends_on_project_id} onChange={e => setForm({ ...form, depends_on_project_id: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">{t.dependsOn}</option>
            {projects.filter(p => p.id !== form.project_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={form.dependency_type} onChange={e => setForm({ ...form, dependency_type: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="blocks">{t.blocks}</option>
            <option value="required">{t.required}</option>
            <option value="related">{t.related}</option>
          </select>
          <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">{t.save}</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr><th className="px-4 py-3 text-left">{t.project}</th><th className="px-4 py-3 text-center">{t.type}</th><th className="px-4 py-3 text-left">{t.dependsOn}</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deps.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t.noData}</td></tr>}
            {deps.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{d.project_name || d.project_id}</td>
                <td className="px-4 py-3 text-center">
                  <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (typeColor[d.dependency_type] || "bg-gray-100 text-gray-600")}>{d.dependency_type}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{d.depends_on_name || d.depends_on_project_id}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleRemove(d.id)} className="text-red-500 hover:text-red-700 text-xs">{t.remove}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
