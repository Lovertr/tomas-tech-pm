"use client";
import { useEffect, useState } from "react";
import Modal, { fieldLabel, fieldInput, btnPrimary, btnGhost } from "../Modal";
import type { DBTask, DBProject, DBMember } from "@/lib/useData";

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: DBTask | null;
  projects: DBProject[];
  members: DBMember[];
  onSubmit: (payload: Partial<DBTask>) => Promise<void>;
  lang?: string;
}

const labels: Record<string, Record<string, string>> = {
  th: { taskName: "ชื่อ Task (ไทย) *", taskNameEn: "ชื่อ Task (อังกฤษ)", taskNameJp: "ชื่อ Task (ญี่ปุ่น)", project: "โครงการ *", selectProject: "-- เลือกโครงการ --", assignee: "ผู้รับผิดชอบ", noAssignee: "-- ไม่ระบุ --", description: "รายละเอียด", status: "สถานะ", priority: "ความสำคัญ", dueDate: "Due date", estHours: "ชั่วโมงประมาณ", editTask: "แก้ไข Task", addTask: "เพิ่ม Task ใหม่", required: "Title และ Project จำเป็น" },
  en: { taskName: "Task Name (Thai) *", taskNameEn: "Task Name (English)", taskNameJp: "Task Name (Japanese)", project: "Project *", selectProject: "-- Select Project --", assignee: "Assignee", noAssignee: "-- None --", description: "Description", status: "Status", priority: "Priority", dueDate: "Due date", estHours: "Est. Hours", editTask: "Edit Task", addTask: "New Task", required: "Title and Project are required" },
  jp: { taskName: "タスク名（タイ語） *", taskNameEn: "タスク名（英語）", taskNameJp: "タスク名（日本語）", project: "プロジェクト *", selectProject: "-- 選択 --", assignee: "担当者", noAssignee: "-- 未指定 --", description: "説明", status: "ステータス", priority: "優先度", dueDate: "期限", estHours: "見積時間", editTask: "タスク編集", addTask: "新規タスク", required: "タイトルとプロジェクトは必須です" },
};

const STATUS = ["backlog", "todo", "in_progress", "review", "done"];
const PRIORITY = ["low", "medium", "high", "urgent"];

export default function TaskModal({ open, onClose, initial, projects, members, onSubmit, lang = "th" }: Props) {
  const lb = labels[lang] || labels.th;
  const [form, setForm] = useState<Partial<DBTask>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial ?? { status: "todo", priority: "medium" });
      setErr(null);
      setAiHint(null);
    }
  }, [open, initial]);

  const set = <K extends keyof DBTask>(k: K, v: DBTask[K] | string | number | null) =>
    setForm((f) => ({ ...f, [k]: v as DBTask[K] }));

  const submit = async () => {
    if (!form.title || !form.project_id) {
      setErr(lb.required);
      return;
    }
    setSaving(true); setErr(null);
    try { await onSubmit(form); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? lb.editTask : lb.addTask} maxWidth="max-w-xl">
      <div className="space-y-4">
        <div>
          <label className={fieldLabel}>{lb.taskName}</label>
          <input className={fieldInput} value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={fieldLabel}>{lb.taskNameEn}</label>
            <input className={fieldInput} value={(form as Record<string, unknown>).title_en as string ?? ""} onChange={(e) => setForm(f => ({ ...f, title_en: e.target.value || null } as Partial<DBTask>))} placeholder="English title" />
          </div>
          <div>
            <label className={fieldLabel}>{lb.taskNameJp}</label>
            <input className={fieldInput} value={(form as Record<string, unknown>).title_jp as string ?? ""} onChange={(e) => setForm(f => ({ ...f, title_jp: e.target.value || null } as Partial<DBTask>))} placeholder="日本語タイトル" />
          </div>
        </div>
        <div>
          <label className={fieldLabel}>{lb.project}</label>
          <select className={fieldInput} value={form.project_id ?? ""} onChange={(e) => set("project_id", e.target.value)}>
            <option value="">{lb.selectProject}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name_th || p.name_en}</option>)}
          </select>
        </div>
        <div>
          <label className={fieldLabel}>{lb.assignee}</label>
          <select className={fieldInput} value={form.assignee_id ?? ""} onChange={(e) => set("assignee_id", e.target.value || null)}>
            <option value="">{lb.noAssignee}</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {[m.first_name_th, m.last_name_th].filter(Boolean).join(" ") || [m.first_name_en, m.last_name_en].filter(Boolean).join(" ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={fieldLabel}>{lb.description}</label>
          <textarea className={fieldInput} rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>{lb.status}</label>
            <select className={fieldInput} value={form.status ?? "todo"} onChange={(e) => set("status", e.target.value)}>
              {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={fieldLabel}>{lb.priority}</label>
            <select className={fieldInput} value={form.priority ?? "medium"} onChange={(e) => set("priority", e.target.value)}>
              {PRIORITY.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={fieldLabel}>Due date</label>
            <input type="date" className={fieldInput} value={form.due_date ?? ""} onChange={(e) => set("due_date", e.target.value || null)} />
          </div>
          <div>
            <label className={fieldLabel}>{lb.estHours}</label>
            <div className="flex gap-2">
              <input type="number" className={fieldInput} value={form.estimated_hours ?? ""} onChange={(e) => set("estimated_hours", e.target.value ? Number(e.target.value) : null)} />
              <button
                type="button"
                title="AI suggest"
                disabled={!form.title || aiBusy}
                onClick={async () => {
                  setAiBusy(true); setErr(null);
                  try {
                    const r = await fetch("/api/ai/estimate-task", {
                      method: "POST", headers: { "content-type": "application/json" },
                      body: JSON.stringify({ title: form.title, description: form.description, project_id: form.project_id }),
                    });
                    const j = await r.json();
                    if (!r.ok) throw new Error(j.error || "AI failed");
                    set("estimated_hours", j.estimated_hours);
                    setAiHint(`AI: ${j.estimated_hours}h (${j.confidence}) — ${j.reasoning}`);
                  } catch (e) { setErr(e instanceof Error ? e.message : "AI failed"); }
                  finally { setAiBusy(false); }
                }}
                className="px-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium disabled:opacity-40 whitespace-nowrap"
              >
                {aiBusy ? "..." : "✨ AI"}
              </button>
            </div>
            {aiHint && <div className="text-xs text-purple-700 mt-1">{aiHint}</div>}
          </div>
        </div>

        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className={btnGhost}>ยกเลิก</button>
          <button onClick={submit} disabled={saving} className={btnPrimary}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
        </div>
      </div>
    </Modal>
  );
}
