"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import TranslateButton from "./TranslateButton";

interface Transaction {
  id: string;
  project_id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  reference_no?: string | null;
  description?: string | null;
  transaction_date: string;
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

const INCOME_CATEGORIES = ["service_fee", "hardware_sale", "software_license", "other"];
const EXPENSE_CATEGORIES = ["labor", "material", "travel", "utility", "other"];

const CATEGORY_LABELS: Record<string, string> = {
  service_fee: "ค่าบริการ",
  hardware_sale: "ขายฮาร์ดแวร์",
  software_license: "ใบอนุญาตซอฟต์แวร์",
  labor: "ค่าแรงงาน",
  material: "วัสดุ",
  travel: "ค่าเดินทาง",
  utility: "ค่าสาธารณูปโภค",
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

export default function TransactionsPanel({ projects, members, filterProjectId = "all", canManage = true, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterProjectId && filterProjectId !== "all" ? `/api/fin-transactions?project_id=${filterProjectId}` : `/api/fin-transactions`;
      const r = await fetch(url);
      if (r.ok) {
        const d = await r.json();
        setItems(d.transactions ?? []);
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
    await fetch(`/api/fin-transactions/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const filtered = items.filter((t) => (filterType === "all" ? true : t.type === filterType));

  const totalIncome = items.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
  const totalExpense = items.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
  const stats = { totalIncome, totalExpense, net: totalIncome - totalExpense };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
          <Stat label="รายได้รวม" value={fmtMoney(stats.totalIncome)} color="#22C55E" />
          <Stat label="ค่าใช้จ่ายรวม" value={fmtMoney(stats.totalExpense)} color="#EF4444" />
          <Stat label="สุทธิ" value={fmtMoney(stats.net)} color={stats.net >= 0 ? "#00AEEF" : "#F7941D"} />
        </div>
        {canManage && (
          <button
            onClick={() => setCreating(true)}
            className="ml-3 px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} /> บันทึกธุรกรรม
          </button>
        )}
      </div>

      <div className="flex rounded-xl overflow-hidden border border-[#334155] w-fit flex-wrap">
        {(["all", "income", "expense"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-4 py-1.5 text-xs font-medium ${filterType === f ? "text-white" : "text-slate-400"}`}
            style={filterType === f ? { background: "#003087" } : { background: "#0F172A" }}
          >
            {f === "all" ? "ทั้งหมด" : f === "income" ? "รายได้" : "ค่าใช้จ่าย"}
          </button>
        ))}
      </div>

      {loading && !filtered.length && <div className="text-center text-slate-400 py-12">Loading...</div>}
      {!loading && !filtered.length && (
        <div className="text-center py-16 bg-[#1E293B] border border-[#334155] rounded-2xl text-slate-400">
          <ArrowUpRight size={40} className="mx-auto mb-3 text-slate-600" />
          ยังไม่มีธุรกรรม
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((txn) => {
          const isIncome = txn.type === "income";
          return (
            <div key={txn.id} className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isIncome ? "#22C55E25" : "#EF444425" }}
                >
                  {isIncome ? (
                    <ArrowDownLeft size={18} className="text-green-400" />
                  ) : (
                    <ArrowUpRight size={18} className="text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-white">{CATEGORY_LABELS[txn.category] || txn.category}</span>
                    {txn.projects && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">
                        {txn.projects.project_code}
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: isIncome ? "#22C55E40" : "#EF444440" }}>
                      {isIncome ? "รายได้" : "ค่าใช้จ่าย"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(txn.transaction_date).toLocaleDateString("th-TH")}
                    {txn.reference_no && <span> · เลขที่: {txn.reference_no}</span>}
                    {txn.description && (
                      <>
                        <br />
                        <span className="text-slate-500">{txn.description}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold ${isIncome ? "text-green-400" : "text-red-400"}`}>
                    {isIncome ? "+" : "-"}
                    {fmtMoney(txn.amount)}
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 ml-3">
                    <button onClick={() => setEditingId(txn.id)} className="p-1.5 text-slate-400 hover:text-white" title="แก้ไข">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => remove(txn.id)} className="p-1.5 text-red-400 hover:text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {editingId === txn.id && (
                <EditTransactionForm
                  transaction={txn}
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
        <CreateTransactionModal
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

function CreateTransactionModal({
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
    type: "income" as "income" | "expense",
    category: "service_fee",
    amount: 0,
    reference_no: "",
    description: "",
    transaction_date: new Date().toISOString().slice(0, 10),
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const submit = async () => {
    if (!form.project_id) {
      setErr("ต้องเลือกโครงการ");
      return;
    }
    if (!form.amount || form.amount <= 0) {
      setErr("กรุณาป้อนจำนวนเงิน");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/fin-transactions", {
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
        <h3 className="text-lg font-semibold text-white">บันทึกธุรกรรม</h3>

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

        <div className="grid grid-cols-2 gap-3">
          <Field label="ประเภท *">
            <select
              className={inp}
              value={form.type}
              onChange={(e) => {
                const newType = e.target.value as "income" | "expense";
                setForm({
                  ...form,
                  type: newType,
                  category: newType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
                });
              }}
            >
              <option value="income">รายได้</option>
              <option value="expense">ค่าใช้จ่าย</option>
            </select>
          </Field>
          <Field label="หมวดหมู่ *">
            <select
              className={inp}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="จำนวนเงิน *">
          <input
            type="number"
            className={inp}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            placeholder="0"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="วันที่ธุรกรรม">
            <input
              type="date"
              className={inp}
              value={form.transaction_date}
              onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
            />
          </Field>
          <Field label="เลขที่อ้างอิง">
            <input
              type="text"
              className={inp}
              value={form.reference_no}
              onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
              placeholder="INV-001"
            />
          </Field>
        </div>

        <Field label="รายละเอียด">
          <textarea
            rows={2}
            className={inp}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            {busy ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTransactionForm({
  transaction,
  projects,
  onClose,
  onSaved,
}: {
  transaction: Transaction;
  projects: Project[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    amount: transaction.amount,
    reference_no: transaction.reference_no ?? "",
    description: transaction.description ?? "",
    transaction_date: transaction.transaction_date,
  });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/fin-transactions/${transaction.id}`, {
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
        <Field label="จำนวนเงิน">
          <input
            type="number"
            className={inp}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
        </Field>
        <Field label="วันที่">
          <input
            type="date"
            className={inp}
            value={form.transaction_date}
            onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
          />
        </Field>
      </div>
      <Field label="เลขที่อ้างอิง">
        <input
          type="text"
          className={inp}
          value={form.reference_no}
          onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
        />
      </Field>
      <Field label="รายละเอียด">
        <textarea
          rows={1}
          className={inp}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
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
