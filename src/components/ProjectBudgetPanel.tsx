"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit2, AlertCircle, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import type { Lang } from '@/lib/i18n';
import TranslateButton from "./TranslateButton";

interface Budget {
  id: string;
  project_id: string;
  category: string;
  planned_amount: number;
  actual_amount: number;
  notes?: string | null;
  projects?: { project_code?: string | null; name_th?: string | null; name_en?: string | null } | null;
}

interface Project {
  id: string;
  project_code?: string | null;
  name_th?: string | null;
  name_en?: string | null;
}

interface Member {
  id: string;
  first_name_th?: string | null;
  last_name_th?: string | null;
  first_name_en?: string | null;
  last_name_en?: string | null;
}

const CATEGORIES = ["labor", "material", "equipment", "subcontract", "overhead", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  labor: "ค่าแรงงาน",
  material: "วัสดุ",
  equipment: "อุปกรณ์",
  subcontract: "งานรับเหมา",
  overhead: "ค่าใช้สอย",
  other: "อื่นๆ",
};

const fmtMoney = (n?: number | null) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(Number(n ?? 0));

interface Props {
  projects: Project[];
  members: Member[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
  lang?: Lang;
}

const panelText = {
  "total_budget": { th: "งบประมาณรวม", en: "Total Budget", jp: "総予算" },
  "actual_spent": { th: "ใช้จริง", en: "Actual Spent", jp: "実績支出" },
  "remaining_over": { th: "คงเหลือ/เกิน", en: "Remaining/Over", jp: "残余/超過" },
  "add_budget_item": { th: "เพิ่มรายการงบประมาณ", en: "Add Budget Item", jp: "予算項目を追加" },
  "no_budget_data": { th: "ยังไม่มีข้อมูลงบประมาณ", en: "No budget data yet", jp: "予算データがまだありません" },
  "budget_label": { th: "งบ", en: "Budget", jp: "予算" },
  "actual_label": { th: "ใช้จริง", en: "Actual", jp: "実績" },
  "edit_modal_title": { th: "เพิ่มรายการงบประมาณ", en: "Add Budget Item", jp: "予算項目を追加" },
  "project_label": { th: "โครงการ", en: "Project", jp: "プロジェクト" },
  "select_placeholder": { th: "— เลือก —", en: "— Select —", jp: "— 選択 —" },
  "category_label": { th: "หมวดหมู่", en: "Category", jp: "カテゴリー" },
  "planned_budget": { th: "งบประมาณที่วางแผน", en: "Planned Budget", jp: "計画予算" },
  "actual_spent_label": { th: "ใช้จริง", en: "Actual Spent", jp: "実績支出" },
  "notes_label": { th: "หมายเหตุ", en: "Notes", jp: "注記" },
  "cancel_button": { th: "ยกเลิก", en: "Cancel", jp: "キャンセル" },
  "create_button": { th: "สร้าง", en: "Create", jp: "作成" },
  "creating": { th: "กำลังสร้าง...", en: "Creating...", jp: "作成中..." },
  "delete_confirm": { th: "ลบรายการนี้?", en: "Delete this item?", jp: "このアイテムを削除しますか?" },
  "edit_title": { th: "แก้ไข", en: "Edit", jp: "編集" },
  "save_button": { th: "บันทึก", en: "Save", jp: "保存" },
  "saving": { th: "บันทึก...", en: "Saving...", jp: "保存中..." },
  "must_select_project": { th: "ต้องเลือกโครงการ", en: "Must select a project", jp: "プロジェクトを選択してください" },
  "labor": { th: "ค่าแรงงาน", en: "Labor", jp: "人件費" },
  "material": { th: "วัสดุ", en: "Material", jp: "材料費" },
  "equipment": { th: "อุปกรณ์", en: "Equipment", jp: "機器" },
  "subcontract": { th: "งานรับเหมา", en: "Subcontract", jp: "外注" },
  "overhead": { th: "ค่าใช้สอย", en: "Overhead", jp: "間接費" },
  "other": { th: "อื่นๆ", en: "Other", jp: "その他" },
};

export default function ProjectBudgetPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0, lang = 'th' }: Props) {
  const L = (key: string) => panelText[key as keyof typeof panelText]?.[lang] ?? panelText[key as keyof typeof panelText]?.th ?? key;
  const [items, setItems] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterProjectId && filterProjectId !== "all" ? `/api/project-budgets?project_id=${filterProjectId}` : `/api/project-budgets`;
      const r = await fetch(url);
      if (r.ok) {
        const d = await r.json();
        setItems(d.budgets ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [filterProjectId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshKey]);

  const remove = async (id: string) => {
    if (!confirm(L('delete_confirm'))) return;
    await fetch(`/api/project-budgets/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const totalPlanned = items.reduce((sum, b) => sum + Number(b.planned_amount ?? 0), 0);
  const totalActual = items.reduce((sum, b) => sum + Number(b.actual_amount ?? 0), 0);
  const totalVariance = totalPlanned - totalActual;
  const stats = { totalPlanned, totalActual, totalVariance };
  const isOverBudget = totalActual > totalPlanned;

  const filtered = filterProjectId && filterProjectId !== "all" ? items : items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
          <Stat label={L('total_budget')} value={fmtMoney(stats.totalPlanned)} color="#003087" />
          <Stat label={L('actual_spent')} value={fmtMoney(stats.totalActual)} color="#F7941D" />
          <Stat
            label={L('remaining_over')}
            value={fmtMoney(stats.totalVariance)}
            color={isOverBudget ? "#EF4444" : "#22C55E"}
          />
        </div>
        {canManage && (
          <button
            onClick={() => setCreating(true)}
            className="ml-3 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} /> {L('add_budget_item')}
          </button>
        )}
      </div>

      {loading && !filtered.length && <div className="text-center text-gray-500 py-12">Loading...</div>}
      {!loading && !filtered.length && (
        <div className="text-center py-16 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl text-gray-500">
          <DollarSign size={40} className="mx-auto mb-3 text-slate-600" />
          {L('no_budget_data')}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((budget) => {
          const variance = Number(budget.planned_amount ?? 0) - Number(budget.actual_amount ?? 0);
          const isOver = Number(budget.actual_amount ?? 0) > Number(budget.planned_amount ?? 0);
          const varPercent = Number(budget.planned_amount ?? 0) > 0 ? ((variance / Number(budget.planned_amount)) * 100).toFixed(0) : "0";

          return (
            <div key={budget.id} className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isOver ? "#EF444425" : "#22C55E25" }}
                >
                  {isOver ? <TrendingDown size={18} className="text-red-400" /> : <TrendingUp size={18} className="text-green-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-white">{L(budget.category) || budget.category}</span>
                    {budget.projects && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/50 text-slate-300">
                        {budget.projects.project_code}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {L('budget_label')} {fmtMoney(budget.planned_amount)} · {L('actual_label')} {fmtMoney(budget.actual_amount)}
                    {budget.notes && (
                      <>
                        <br />
                        <span className="text-slate-500">{budget.notes}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold ${isOver ? "text-red-400" : "text-green-400"}`}>{isOver ? "-" : "+"}{fmtMoney(Math.abs(variance))}</div>
                  <div className="text-[10px] text-gray-500">{varPercent}%</div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => setEditingId(budget.id)}
                      className="p-1.5 text-gray-500 hover:text-white"
                      title={L('edit_title')}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => remove(budget.id)} className="p-1.5 text-red-400 hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {editingId === budget.id && (
                <EditBudgetForm
                  budget={budget}
                  projects={projects}
                  onClose={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    fetchAll();
                  }}
                  lang={lang}
                />
              )}
            </div>
          );
        })}
      </div>

      {creating && (
        <CreateBudgetModal
          projects={projects}
          defaultProjectId={filterProjectId !== "all" ? filterProjectId : undefined}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            fetchAll();
          }}
          lang={lang}
        />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-3">
      <div className="text-base font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function CreateBudgetModal({
  projects,
  defaultProjectId,
  onClose,
  onSaved,
  lang = 'th',
}: {
  projects: Project[];
  defaultProjectId?: string;
  onClose: () => void;
  onSaved: () => void;
  lang?: Lang;
}) {
  const L = (key: string) => panelText[key as keyof typeof panelText]?.[lang] ?? panelText[key as keyof typeof panelText]?.th ?? key;
  const [form, setForm] = useState({
    project_id: defaultProjectId ?? "",
    category: "labor",
    planned_amount: 0,
    actual_amount: 0,
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!form.project_id) {
      setErr(L('must_select_project'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/project-budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Failed");
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const inp = "w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">{L('edit_modal_title')}</h3>
        <Field label={L('project_label') + " *"}>
          <select
            className={inp}
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
          >
            <option value="">{L('select_placeholder')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} — {p.name_th || p.name_en}
              </option>
            ))}
          </select>
        </Field>

        <Field label={L('category_label') + " *"}>
          <select
            className={inp}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {L(cat)}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={L('planned_budget')}>
            <input
              type="number"
              className={inp}
              value={form.planned_amount}
              onChange={(e) => setForm({ ...form, planned_amount: Number(e.target.value) })}
              placeholder="0"
            />
          </Field>
          <Field label={L('actual_spent_label')}>
            <input
              type="number"
              className={inp}
              value={form.actual_amount}
              onChange={(e) => setForm({ ...form, actual_amount: Number(e.target.value) })}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label={L('notes_label')}>
          <textarea
            rows={2}
            className={inp}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>

        {err && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{err}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white text-sm">
            {L('cancel_button')}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50"
          >
            {busy ? L('creating') : L('create_button')}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditBudgetForm({
  budget,
  projects,
  onClose,
  onSaved,
  lang = 'th',
}: {
  budget: Budget;
  projects: Project[];
  onClose: () => void;
  onSaved: () => void;
  lang?: Lang;
}) {
  const L = (key: string) => panelText[key as keyof typeof panelText]?.[lang] ?? panelText[key as keyof typeof panelText]?.th ?? key;
  const [form, setForm] = useState({
    planned_amount: budget.planned_amount,
    actual_amount: budget.actual_amount,
    notes: budget.notes ?? "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/project-budgets/${budget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        onSaved();
      }
    } finally {
      setBusy(false);
    }
  };

  const inp = "w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]";

  return (
    <div className="mt-3 pt-3 border-t border-[#E2E8F0] space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label={L('planned_budget')}>
          <input
            type="number"
            className={inp}
            value={form.planned_amount}
            onChange={(e) => setForm({ ...form, planned_amount: Number(e.target.value) })}
          />
        </Field>
        <Field label={L('actual_spent_label')}>
          <input
            type="number"
            className={inp}
            value={form.actual_amount}
            onChange={(e) => setForm({ ...form, actual_amount: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label={L('notes_label')}>
        <textarea
          rows={1}
          className={inp}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 text-slate-300 hover:text-white text-sm">
          {L('cancel_button')}
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="px-3 py-1.5 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50"
        >
          {busy ? L('saving') : L('save_button')}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
