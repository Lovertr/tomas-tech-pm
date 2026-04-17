"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Copy, FileStack, FolderPlus, Sparkles, ListChecks } from "lucide-react";

interface ProjectTemplate { id: string; name: string; description?: string | null; category?: string | null; template_data: { tasks?: unknown[]; milestones?: unknown[] }; created_at?: string; }
interface TaskTemplate { id: string; name: string; description?: string | null; tasks_data: unknown[]; created_at?: string; }
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }

interface Props { projects: Project[]; canManage?: boolean; refreshKey?: number; onProjectCreated?: () => void; }

export default function TemplatesPanel({ projects, canManage = true, refreshKey = 0, onProjectCreated }: Props) {
  const [tab, setTab] = useState<"project" | "task">("project");
  const [pTpls, setPTpls] = useState<ProjectTemplate[]>([]);
  const [tTpls, setTTpls] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveProjectModal, setSaveProjectModal] = useState(false);
  const [saveTasksModal, setSaveTasksModal] = useState(false);
  const [cloneTpl, setCloneTpl] = useState<ProjectTemplate | null>(null);
  const [applyTpl, setApplyTpl] = useState<TaskTemplate | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetch("/api/project-templates").then(r => r.ok ? r.json() : { templates: [] }),
        fetch("/api/task-templates").then(r => r.ok ? r.json() : { templates: [] }),
      ]);
      setPTpls(a.templates ?? []);
      setTTpls(b.templates ?? []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const removeP = async (id: string) => {
    if (!confirm("ลบ template นี้?")) return;
    await fetch(`/api/project-templates/${id}`, { method: "DELETE" });
    fetchAll();
  };
  const removeT = async (id: string) => {
    if (!confirm("ลบ template นี้?")) return;
    await fetch(`/api/task-templates/${id}`, { method: "DELETE" });
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex rounded-xl overflow-hidden border border-gray-300">
          {(["project", "task"] as const).map(k => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${tab === k ? "text-white" : "text-gray-600"}`}
              style={tab === k ? { background: "rgb(59, 130, 246)" } : { background: "#F3F4F6" }}>
              {k === "project" ? <><FileStack size={14} /> Project Templates</> : <><ListChecks size={14} /> Task Templates</>}
            </button>
          ))}
        </div>
        {canManage && (
          tab === "project"
            ? <button onClick={() => setSaveProjectModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> บันทึกจากโครงการ
              </button>
            : <button onClick={() => setSaveTasksModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium flex items-center gap-2">
                <Plus size={16} /> สร้าง Task Template
              </button>
        )}
      </div>

      {loading && <div className="text-center text-gray-600 py-12">Loading...</div>}

      {tab === "project" && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!pTpls.length && (
            <div className="col-span-full text-center py-16 bg-white border border-gray-300 rounded-2xl text-gray-600">
              <FileStack size={40} className="mx-auto mb-3 text-gray-600" />ยังไม่มี project template
            </div>
          )}
          {pTpls.map(t => (
            <div key={t.id} className="bg-white border border-gray-300 rounded-xl p-4 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><FileStack size={18} className="text-cyan-600" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{t.name}</div>
                  {t.category && <div className="text-[10px] inline-block mt-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">{t.category}</div>}
                </div>
              </div>
              {t.description && <div className="text-xs text-gray-600 mb-3 line-clamp-2">{t.description}</div>}
              <div className="text-xs text-gray-600 mb-3 flex gap-3">
                <span>{t.template_data?.tasks?.length ?? 0} tasks</span>
                <span>{t.template_data?.milestones?.length ?? 0} milestones</span>
              </div>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => setCloneTpl(t)} className="flex-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
                  <FolderPlus size={12} /> สร้างโครงการ
                </button>
                {canManage && (
                  <button onClick={() => removeP(t.id)} className="p-1.5 text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "task" && !loading && (
        <div className="space-y-2">
          {!tTpls.length && (
            <div className="text-center py-16 bg-white border border-gray-300 rounded-2xl text-gray-600">
              <ListChecks size={40} className="mx-auto mb-3 text-gray-600" />ยังไม่มี task template
            </div>
          )}
          {tTpls.map(t => (
            <div key={t.id} className="bg-white border border-gray-300 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><ListChecks size={18} className="text-purple-700" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{t.name}</div>
                {t.description && <div className="text-xs text-gray-600 mt-0.5">{t.description}</div>}
                <div className="text-xs text-gray-600 mt-1">{t.tasks_data?.length ?? 0} tasks</div>
              </div>
              <button onClick={() => setApplyTpl(t)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                <Copy size={12} /> ใช้กับโครงการ
              </button>
              {canManage && <button onClick={() => removeT(t.id)} className="p-1.5 text-red-600 hover:text-red-700"><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
      )}

      {saveProjectModal && (
        <SaveProjectModal projects={projects} onClose={() => setSaveProjectModal(false)} onSaved={() => { setSaveProjectModal(false); fetchAll(); }} />
      )}
      {saveTasksModal && (
        <SaveTasksModal projects={projects} onClose={() => setSaveTasksModal(false)} onSaved={() => { setSaveTasksModal(false); fetchAll(); }} />
      )}
      {cloneTpl && (
        <CloneProjectModal tpl={cloneTpl} onClose={() => setCloneTpl(null)} onSaved={() => { setCloneTpl(null); onProjectCreated?.(); }} />
      )}
      {applyTpl && (
        <ApplyTasksModal tpl={applyTpl} projects={projects} onClose={() => setApplyTpl(null)} onSaved={() => { setApplyTpl(null); onProjectCreated?.(); }} />
      )}
    </div>
  );
}

function ModalFrame({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-300 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs text-gray-700 mb-1">{label}</label>{children}</div>;
}
const inp = "w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm";

function SaveProjectModal({ projects, onClose, onSaved }: { projects: Project[]; onClose: () => void; onSaved: () => void }) {
  const [pid, setPid] = useState(""); const [name, setName] = useState(""); const [cat, setCat] = useState(""); const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    if (!pid || !name) { setErr("ต้องระบุโครงการต้นแบบและชื่อ"); return; }
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/project-templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "save_from_project", project_id: pid, name, category: cat || null, description: desc || null }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setBusy(false); }
  };
  return (
    <ModalFrame title="บันทึกโครงการเป็น Template" onClose={onClose}>
      <Field label="โครงการต้นแบบ *">
        <select className={inp} value={pid} onChange={e => setPid(e.target.value)}>
          <option value="">— เลือก —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
        </select>
      </Field>
      <Field label="ชื่อ Template *"><input className={inp} value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label="หมวดหมู่"><input className={inp} placeholder="เช่น MES, WMS, PLC" value={cat} onChange={e => setCat(e.target.value)} /></Field>
      <Field label="คำอธิบาย"><textarea rows={3} className={inp} value={desc} onChange={e => setDesc(e.target.value)} /></Field>
      {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm">ยกเลิก</button>
        <button onClick={submit} disabled={busy} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50">{busy ? "กำลังบันทึก..." : "บันทึก"}</button>
      </div>
    </ModalFrame>
  );
}

function CloneProjectModal({ tpl, onClose, onSaved }: { tpl: ProjectTemplate; onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState(""); const [nameTh, setNameTh] = useState(""); const [nameEn, setNameEn] = useState("");
  const [start, setStart] = useState<string>(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState<string>(""); const [budget, setBudget] = useState<string>("");
  const [copyAlloc, setCopyAlloc] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    if (!code || !nameTh) { setErr("ต้องระบุ project code และชื่อภาษาไทย"); return; }
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/project-templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "clone_to_project", template_id: tpl.id, project_code: code, name_th: nameTh,
          name_en: nameEn || null, start_date: start, end_date: end || null,
          budget_limit: budget ? Number(budget) : null, copy_allocations: copyAlloc,
        }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <ModalFrame title={`สร้างโครงการจาก ${tpl.name}`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Project Code *"><input className={inp} placeholder="PRJ-2026-001" value={code} onChange={e => setCode(e.target.value)} /></Field>
        <Field label="ชื่อภาษาอังกฤษ"><input className={inp} value={nameEn} onChange={e => setNameEn(e.target.value)} /></Field>
      </div>
      <Field label="ชื่อภาษาไทย *"><input className={inp} value={nameTh} onChange={e => setNameTh(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="วันเริ่ม"><input type="date" className={inp} value={start} onChange={e => setStart(e.target.value)} /></Field>
        <Field label="วันสิ้นสุด"><input type="date" className={inp} value={end} onChange={e => setEnd(e.target.value)} /></Field>
      </div>
      <Field label="งบประมาณ (THB)"><input type="number" className={inp} value={budget} onChange={e => setBudget(e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={copyAlloc} onChange={e => setCopyAlloc(e.target.checked)} /> คัดลอกการจัดสรรทีมด้วย
      </label>
      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 flex items-center gap-2">
        <Sparkles size={14} className="text-orange-600" />จะสร้าง {tpl.template_data?.tasks?.length ?? 0} tasks + {tpl.template_data?.milestones?.length ?? 0} milestones
      </div>
      {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm">ยกเลิก</button>
        <button onClick={submit} disabled={busy} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm disabled:opacity-50">{busy ? "กำลังสร้าง..." : "สร้างโครงการ"}</button>
      </div>
    </ModalFrame>
  );
}

function SaveTasksModal({ projects, onClose, onSaved }: { projects: Project[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [fromPid, setFromPid] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    if (!name) { setErr("ต้องระบุชื่อ"); return; }
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/task-templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: desc || null, from_project_id: fromPid || null }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <ModalFrame title="สร้าง Task Template" onClose={onClose}>
      <Field label="ชื่อ Template *"><input className={inp} value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label="คำอธิบาย"><textarea rows={3} className={inp} value={desc} onChange={e => setDesc(e.target.value)} /></Field>
      <Field label="คัดลอก task จากโครงการ (เลือกได้)">
        <select className={inp} value={fromPid} onChange={e => setFromPid(e.target.value)}>
          <option value="">— ไม่คัดลอก (template ว่าง) —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
        </select>
      </Field>
      {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm">ยกเลิก</button>
        <button onClick={submit} disabled={busy} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50">{busy ? "กำลังบันทึก..." : "บันทึก"}</button>
      </div>
    </ModalFrame>
  );
}

function ApplyTasksModal({ tpl, projects, onClose, onSaved }: { tpl: TaskTemplate; projects: Project[]; onClose: () => void; onSaved: () => void }) {
  const [pid, setPid] = useState(""); const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    if (!pid) { setErr("ต้องเลือกโครงการ"); return; }
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/task-templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "apply_to_project", template_id: tpl.id, project_id: pid, start_date: start }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <ModalFrame title={`ใช้ ${tpl.name} กับโครงการ`} onClose={onClose}>
      <Field label="โครงการปลายทาง *">
        <select className={inp} value={pid} onChange={e => setPid(e.target.value)}>
          <option value="">— เลือก —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
        </select>
      </Field>
      <Field label="วันเริ่มต้น"><input type="date" className={inp} value={start} onChange={e => setStart(e.target.value)} /></Field>
      <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">จะเพิ่ม {tpl.tasks_data?.length ?? 0} tasks (ห่างกันวันละ 3 วัน หากไม่มี due_date)</div>
      {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm">ยกเลิก</button>
        <button onClick={submit} disabled={busy} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50">{busy ? "กำลังเพิ่ม..." : "เพิ่ม Tasks"}</button>
      </div>
    </ModalFrame>
  );
}
