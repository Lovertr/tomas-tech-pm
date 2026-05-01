"use client";
import { useEffect, useState, useCallback } from "react";
import { Star, Plus, Trash2, Search, BarChart3, Users, Sparkles } from "lucide-react";

type Lang = "th" | "en" | "jp";
interface Skill { id: string; name: string; category: string; description?: string; }
interface MemberSkill { id: string; member_id: string; skill_id: string; proficiency_level: number; notes?: string; skill_catalog?: { name: string; category: string }; team_members?: { first_name: string; last_name: string; nickname?: string }; }

const T: Record<string, Record<Lang, string>> = {
  title: { th: "ทักษะพนักงาน", en: "Skill Matrix", jp: "スキルマトリックス" },
  catalog: { th: "รายการทักษะ", en: "Skill Catalog", jp: "スキルカタログ" },
  overview: { th: "ภาพรวม", en: "Overview", jp: "概要" },
  addSkill: { th: "เพิ่มทักษะ", en: "Add Skill", jp: "スキル追加" },
  name: { th: "ชื่อทักษะ", en: "Skill Name", jp: "スキル名" },
  category: { th: "หมวดหมู่", en: "Category", jp: "カテゴリ" },
  level: { th: "ระดับ", en: "Level", jp: "レベル" },
  search: { th: "ค้นหาทักษะ...", en: "Search skills...", jp: "スキル検索..." },
  noData: { th: "ยังไม่มีข้อมูลทักษะ", en: "No skill data yet", jp: "スキルデータなし" },
  people: { th: "คน", en: "people", jp: "人" },
  avgLevel: { th: "เฉลี่ย", en: "Avg", jp: "平均" },
};

const CATS: Record<string, { label: string; color: string }> = {
  frontend: { label: "Frontend", color: "bg-blue-100 text-blue-700" },
  backend: { label: "Backend", color: "bg-green-100 text-green-700" },
  data: { label: "Data", color: "bg-purple-100 text-purple-700" },
  devops: { label: "DevOps", color: "bg-orange-100 text-orange-700" },
  mobile: { label: "Mobile", color: "bg-pink-100 text-pink-700" },
  design: { label: "Design", color: "bg-teal-100 text-teal-700" },
  industrial: { label: "Industrial", color: "bg-amber-100 text-amber-700" },
  management: { label: "Management", color: "bg-indigo-100 text-indigo-700" },
  "soft-skill": { label: "Soft Skill", color: "bg-gray-100 text-gray-700" },
  other: { label: "Other", color: "bg-slate-100 text-slate-700" },
};

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={16} className={i <= value ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
          style={onChange ? { cursor: "pointer" } : undefined}
          onClick={() => onChange?.(i)} />
      ))}
    </div>
  );
}

export default function SkillMatrixPanel({ lang = "th", canManage = false }: { lang?: Lang; canManage?: boolean }) {
  const L = (k: string) => T[k]?.[lang] || T[k]?.en || k;
  const [catalog, setCatalog] = useState<Skill[]>([]);
  const [allSkills, setAllSkills] = useState<MemberSkill[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("other");
  const [filterCat, setFilterCat] = useState("all");

  const fetch_ = useCallback(async () => {
    const r = await fetch("/api/skills");
    if (r.ok) { const d = await r.json(); setCatalog(d.catalog || []); setAllSkills(d.allSkills || []); }
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);

  const addToCatalog = async () => {
    if (!newName.trim()) return;
    await fetch("/api/skills", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "add_to_catalog", name: newName.trim(), category: newCat }) });
    setNewName(""); setShowAdd(false); fetch_();
  };

  const removeCatalog = async (id: string) => {
    if (!confirm("ลบทักษะนี้?")) return;
    await fetch("/api/skills?id=" + id + "&type=catalog", { method: "DELETE" }); fetch_();
  };

  // Group skills by skill for overview
  const skillGroups: Record<string, { skill: Skill; members: MemberSkill[] }> = {};
  for (const ms of allSkills) {
    const sn = ms.skill_catalog?.name || ms.skill_id;
    if (!skillGroups[sn]) skillGroups[sn] = { skill: catalog.find(c => c.name === sn) || { id: ms.skill_id, name: sn, category: ms.skill_catalog?.category || "other" }, members: [] };
    skillGroups[sn].members.push(ms);
  }

  const filtered = Object.values(skillGroups).filter(g => {
    if (filterCat !== "all" && g.skill.category !== filterCat) return false;
    if (search && !g.skill.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.members.length - a.members.length);

  const catCounts: Record<string, number> = {};
  for (const c of catalog) catCounts[c.category] = (catCounts[c.category] || 0) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Sparkles className="text-[#F7941D]" size={22} /> {L("title")}</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={L("search")}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm w-48 focus:ring-2 focus:ring-[#00AEEF] focus:border-[#00AEEF]" />
          </div>
          {canManage && <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-[#003087] hover:bg-[#002060] text-white rounded-xl text-sm flex items-center gap-1"><Plus size={16} /> {L("addSkill")}</button>}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterCat("all")} className={"px-3 py-1 rounded-full text-xs font-medium border " + (filterCat === "all" ? "bg-[#003087] text-white border-[#003087]" : "bg-white text-gray-600 border-gray-300")}>
          All ({catalog.length})
        </button>
        {Object.entries(CATS).map(([k, v]) => catCounts[k] ? (
          <button key={k} onClick={() => setFilterCat(k)} className={"px-3 py-1 rounded-full text-xs font-medium border " + (filterCat === k ? "bg-[#003087] text-white border-[#003087]" : v.color + " border-transparent")}>
            {v.label} ({catCounts[k]})
          </button>
        ) : null)}
      </div>

      {/* Overview grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(g => {
          const avg = g.members.reduce((s, m) => s + m.proficiency_level, 0) / g.members.length;
          const cat = CATS[g.skill.category] || CATS.other;
          return (
            <div key={g.skill.name} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800">{g.skill.name}</h3>
                  <span className={"inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 " + cat.color}>{cat.label}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-gray-500"><Users size={14} /> {g.members.length} {L("people")}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{L("avgLevel")}: {avg.toFixed(1)}</div>
                </div>
              </div>
              <Stars value={Math.round(avg)} />
              <div className="mt-2 flex flex-wrap gap-1">
                {g.members.slice(0, 5).map(m => (
                  <span key={m.id} className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                    {m.team_members?.nickname || m.team_members?.first_name || "?"}
                    <span className="ml-1 text-yellow-600">★{m.proficiency_level}</span>
                  </span>
                ))}
                {g.members.length > 5 && <span className="px-2 py-0.5 text-[10px] text-gray-400">+{g.members.length - 5}</span>}
              </div>
              {canManage && (
                <button onClick={() => removeCatalog(g.skill.id)} className="mt-2 text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><Trash2 size={12} /> ลบ</button>
              )}
            </div>
          );
        })}
      </div>

      {!filtered.length && <div className="text-center py-12 text-gray-400"><BarChart3 size={40} className="mx-auto mb-2" />{L("noData")}</div>}

      {/* Add skill modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{L("addSkill")}</h3>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={L("name")}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 mb-3 text-sm" />
            <select value={newCat} onChange={e => setNewCat(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2 mb-4 text-sm">
              {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
              <button onClick={addToCatalog} className="px-4 py-2 bg-[#003087] text-white rounded-xl text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
