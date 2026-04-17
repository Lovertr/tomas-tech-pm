"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit2, AlertCircle, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
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
}

export default function ProjectBudgetPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0 }: Props) {
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
    if (!confirm("ลบรายการนี้?")) return;
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
          <Stat label="งบประมาณรวม" value={fmtMoney(stats.totalPlanned)} color="#003087" />
          <Stat label="ใช้จริง" value={fmtMoney(stats.totalActual)} color="#F7941D" />
          <Stat
            label="คงเหลือ/เกิน"
            value={fmtMoney(stats.totalVariance)}
            color={isOverBudget ? "#EF4444" : "#22C55E"}
          />
        </div>
        {canManage && (
          <button
            onClick={() => setCreating(true)}
            className="ml-3 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} /> เพิ่มรายการงบประมาณ
          </button>
        )}
      </div>

      {loading && !filtered.length && <div className="text-center text-slate-400 py-12">Loading...</div>}
      {!loading && !filtered.length && (
        <div className="text-center py-16 bg-[#1E293B] border border-[#334155] rounded-2xl text-slate-400">
          <DollarSign size={40} className="mx-auto mb-3 text-slate-600" />
          ยังไม่มีข้อมูลงบประมาณ
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((budget) => {
          const variance = Number(budget.planned_amount ?? 0) - Number(budget.actual_amount ?? 0);
          const isOver = Number(budget.actual_amount ?? 0) > Number(budget.planned_amount ?? 0);
          const varPercent = Number(budget.planned_amount ?? 0) > 0 ? ((variance / Number(budget.planned_amount)) * 100).toFixed(0) : "0";

          return (
            <div key={budget.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isOver ? "#EF444425" : "#22C55E25" }}
                >
                  {isOver ? <TrendingDown size={18} className="text-red-400" /> : <TrendingUp size={18} className="text-green-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-white">{CATEGORY_LABELS[budget.category] || budget.category}</span>
                    {budget.projects && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">
                        {budget.projects.project_code}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    งบ {fmtMoney(budget.planned_amount)} · ใช้จริง {fmtMoney(budget.actual_amount)}
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
                  <div className="text-[10px] text-slate-400">{varPercent}%</div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => setEditingId(budget.id)}
                      className="p-1.5 text-slate-400 hover:text-white"
                      title="แก้ไข"
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
        />
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-3">
      <div className="text-base font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function CreateBudgetModal({
  projects,
  defaultProjectId,
  onClose,
  onSaved,
}: {
  projects: Project[];
  defaultProjectId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
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
      setErr("ต้องเลือกโครงการ");
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

  const inp = "w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1E293B] rounded-2xl border border-[#334155] w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">เพิ่มรายการงบประมาณ</h3>
        <Field label="โครงการ *">
          <select
            className={inp}
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
          >
            <option value="">— เลือก —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} — {p.name_th || p.name_en}
              </option>
            ))}
          </select>
        </Field>

        <Field label="หมวดหมู่ *">
          <select
            className={inp}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="งบประมาณที่วางแผน">
            <input
              type="number"
              className={inp}
              value={form.planned_amount}
              onChange={(e) => setForm({ ...form, planned_amount: Number(e.target.value) })}
              placeholder="0"
            />
          </Field>
          <Field label="ใช้จริง">
            <input
              type="number"
              className={inp}
              value={form.actual_amount}
              onChange={(e) => setForm({ ...form, actual_amount: Number(e.target.value) })}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="หมายเหตุ">
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
            ยกเลิก
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50"
          >
            {busy ? "กำลังสร้าง..." : "สร้าง"}
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
}: {
  budget: Budget;
  projects: Project[];
  onClose: () => void;
  onSaved: () => void;
}) {
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

  const inp = "w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-[#003087]";

  return (
    <div className="mt-3 pt-3 border-t border-[#334155] space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="งบประมาณที่วางแผน">
          <input
            type="number"
            className={inp}
            value={form.planned_amount}
            onChange={(e) => setForm({ ...form, planned_amount: Number(e.target.value) })}
          />
        </Field>
        <Field label="ใช้จริง">
          <input
            type="number"
            className={inp}
            value={form.actual_amount}
            onChange={(e) => setForm({ ...form, actual_amount: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="หมายเหตุ">
        <textarea
          rows={1}
          className={inp}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 text-slate-300 hover:text-white text-sm">
          ยกเลิก
        </button>
        <button
          onClick={submit}
          disabled={busy}
          className="px-3 py-1.5 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50"
        >
          {busy ? "บันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
