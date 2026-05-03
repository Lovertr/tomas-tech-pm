"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Plus, Trash2, Play, Calendar } from "lucide-react";

type Lang = "th" | "en" | "jp";
interface RecurringTx { id: string; name: string; amount: number; category: string; type: string; frequency: string; next_due_date: string; is_active: boolean; notes?: string; last_generated_at?: string; }

const T: Record<string, Record<Lang, string>> = {
  title: { th: "ค่าใช้จ่ายประจำ", en: "Recurring Expenses", jp: "定期経費" },
  add: { th: "เพิ่มรายการ", en: "Add Item", jp: "追加" },
  generate: { th: "สร้างรายการที่ครบกำหนด", en: "Generate Due", jp: "期限分生成" },
  name: { th: "รายการ", en: "Name", jp: "名称" },
  amount: { th: "จำนวน", en: "Amount", jp: "金額" },
  frequency: { th: "ความถี่", en: "Frequency", jp: "頻度" },
  nextDue: { th: "ครบกำหนดถัดไป", en: "Next Due", jp: "次回期限" },
  monthly: { th: "รายเดือน", en: "Monthly", jp: "月次" },
  quarterly: { th: "รายไตรมาส", en: "Quarterly", jp: "四半期" },
  yearly: { th: "รายปี", en: "Yearly", jp: "年次" },
  noData: { th: "ยังไม่มีรายการ", en: "No items yet", jp: "項目なし" },
};

export default function RecurringExpensesPanel({ lang = "th", canManage = false }: { lang?: Lang; canManage?: boolean }) {
  const L = (k: string) => T[k]?.[lang] || T[k]?.en || k;
  const [items, setItems] = useState<RecurringTx[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", category: "operating", type: "expense", frequency: "monthly", next_due_date: "", notes: "" });
  const [msg, setMsg] = useState("");

  const fetchData = useCallback(async () => {
    const r = await fetch("/api/recurring-transactions"); if (r.ok) { const d = await r.json(); setItems(d.items || []); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const submit = async () => {
    if (!form.name || !form.amount || !form.next_due_date) return;
    await fetch("/api/recurring-transactions", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) });
    setShowForm(false); setForm({ name: "", amount: "", category: "operating", type: "expense", frequency: "monthly", next_due_date: "", notes: "" }); fetchData();
  };

  const generate = async () => {
    const r = await fetch("/api/recurring-transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate" }) });
    if (r.ok) { const d = await r.json(); setMsg("Generated " + d.generated + " transactions"); fetchData(); setTimeout(() => setMsg(""), 3000); }
  };

  const remove = async (id: string) => {
    if (!confirm("ลบ?")) return;
    await fetch("/api/recurring-transactions?id=" + id, { method: "DELETE" }); fetchData();
  };

  const dueSoon = items.filter(i => i.is_active && new Date(i.next_due_date) <= new Date(Date.now() + 7 * 86400000));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><RefreshCw className="text-[#F7941D]" size={22} /> {L("title")}</h2>
        <div className="flex gap-2">
          {canManage && <button onClick={generate} className="px-3 py-2 bg-green-600 text-white rounded-xl text-sm flex items-center gap-1"><Play size={14} /> {L("generate")}</button>}
          {canManage && <button onClick={() => setShowForm(true)} className="px-3 py-2 bg-[#003087] text-white rounded-xl text-sm flex items-center gap-1"><Plus size={16} /> {L("add")}</button>}
        </div>
      </div>
      {msg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm">{msg}</div>}

      {dueSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="text-sm font-medium text-amber-800 mb-1">⚠️ ครบกำหนดภายใน 7 วัน ({dueSoon.length} รายการ)</div>
          {dueSoon.map(i => <div key={i.id} className="text-xs text-amber-700">{i.name} — ฿{Number(i.amount).toLocaleString()} ({i.next_due_date})</div>)}
        </div>
      )}

      <div className="space-y-3">
        {items.map(i => (
          <div key={i.id} className={"bg-white border rounded-xl p-4 flex items-center justify-between " + (i.is_active ? "border-gray-200" : "border-gray-100 opacity-50")}>
            <div>
              <div className="font-medium text-gray-800">{i.name}</div>
              <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                <span className={i.type === "income" ? "text-green-600" : "text-red-600"}>฿{Number(i.amount).toLocaleString()}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px]">{L(i.frequency)}</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> {i.next_due_date}</span>
              </div>
              {i.notes && <div className="text-xs text-gray-400 mt-1">{i.notes}</div>}
            </div>
            {canManage && <button onClick={() => remove(i.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>}
          </div>
        ))}
        {!items.length && <div className="text-center py-12 text-gray-400"><RefreshCw size={40} className="mx-auto mb-2" />{L("noData")}</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{L("add")}</h3>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={L("name")} className="w-full border border-gray-300 rounded-xl px-3 py-2 mb-3 text-sm" />
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder={L("amount")} className="w-full border border-gray-300 rounded-xl px-3 py-2 mb-3 text-sm" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border border-gray-300 rounded-xl px-3 py-2 text-sm">
                <option value="expense">Expense</option><option value="income">Income</option>
              </select>
              <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="border border-gray-300 rounded-xl px-3 py-2 text-sm">
                <option value="monthly">{L("monthly")}</option><option value="quarterly">{L("quarterly")}</option><option value="yearly">{L("yearly")}</option>
              </select>
            </div>
            <input type="date" value={form.next_due_date} onChange={e => setForm({ ...form, next_due_date: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2 mb-3 text-sm" />
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes" rows={2} className="w-full border border-gray-300 rounded-xl px-3 py-2 mb-4 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
              <button onClick={submit} className="px-4 py-2 bg-[#003087] text-white rounded-xl text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
