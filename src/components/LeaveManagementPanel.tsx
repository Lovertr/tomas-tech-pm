"use client";
import { useEffect, useState, useCallback } from "react";
import { CalendarDays, Check, X, Clock, Plus, Filter } from "lucide-react";

type Lang = "th" | "en" | "jp";
interface LeaveReq { id: string; member_id: string; type: string; start_date: string; end_date: string; days: number; reason?: string; status: string; approved_by?: string; rejection_reason?: string; created_at: string; team_members?: { first_name: string; last_name: string; nickname?: string; departments?: { name: string } }; }
interface Balance { id: string; member_id: string; year: number; annual_quota: number; sick_quota: number; personal_quota: number; used_annual: number; used_sick: number; used_personal: number; team_members?: { first_name: string; last_name: string; nickname?: string }; }

const T: Record<string, Record<Lang, string>> = {
  title: { th: "จัดการลางาน", en: "Leave Management", jp: "休暇管理" },
  request: { th: "ขอลา", en: "Request Leave", jp: "休暇申請" },
  pending: { th: "รออนุมัติ", en: "Pending", jp: "承認待ち" },
  approved: { th: "อนุมัติแล้ว", en: "Approved", jp: "承認済み" },
  rejected: { th: "ปฏิเสธ", en: "Rejected", jp: "却下" },
  annual: { th: "ลาพักร้อน", en: "Annual", jp: "有給" },
  sick: { th: "ลาป่วย", en: "Sick", jp: "病欠" },
  personal: { th: "ลากิจ", en: "Personal", jp: "私用" },
  wfh: { th: "WFH", en: "WFH", jp: "在宅" },
  other: { th: "อื่นๆ", en: "Other", jp: "その他" },
  balance: { th: "ยอดคงเหลือ", en: "Balance", jp: "残日数" },
  used: { th: "ใช้แล้ว", en: "Used", jp: "使用済み" },
  quota: { th: "โควตา", en: "Quota", jp: "割当" },
  from: { th: "จาก", en: "From", jp: "開始" },
  to: { th: "ถึง", en: "To", jp: "終了" },
  reason: { th: "เหตุผล", en: "Reason", jp: "理由" },
  days: { th: "วัน", en: "days", jp: "日" },
  all: { th: "ทั้งหมด", en: "All", jp: "全て" },
};

const TYPE_COLORS: Record<string, string> = {
  annual: "bg-blue-100 text-blue-700", sick: "bg-red-100 text-red-700", personal: "bg-purple-100 text-purple-700",
  wfh: "bg-green-100 text-green-700", other: "bg-gray-100 text-gray-600",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-500",
};

export default function LeaveManagementPanel({ lang = "th", role = "member" }: { lang?: Lang; role?: string }) {
  const L = (k: string) => T[k]?.[lang] || T[k]?.en || k;
  const [requests, setRequests] = useState<LeaveReq[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "annual", start_date: "", end_date: "", reason: "" });

  const fetchData = useCallback(async () => {
    const r = await fetch("/api/leave");
    if (r.ok) { const d = await r.json(); setRequests(d.requests || []); setBalances(d.balances || []); setMyMemberId(d.myMemberId); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const submit = async () => {
    if (!form.start_date || !form.end_date || !myMemberId) return;
    await fetch("/api/leave", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, member_id: myMemberId }) });
    setShowForm(false); setForm({ type: "annual", start_date: "", end_date: "", reason: "" }); fetchData();
  };

  const handleAction = async (id: string, action: string, rejReason?: string) => {
    await fetch("/api/leave", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id, rejection_reason: rejReason }) });
    fetchData();
  };

  const filtered = requests.filter(r => filter === "all" || r.status === filter);
  const myBalance = balances.find(b => b.member_id === myMemberId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><CalendarDays className="text-[#00AEEF]" size={22} /> {L("title")}</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-[#003087] text-white rounded-xl text-sm flex items-center gap-1"><Plus size={16} /> {L("request")}</button>
      </div>

      {/* Balance cards */}
      {myBalance && (
        <div className="grid grid-cols-3 gap-3">
          {[{ type: "annual", quota: myBalance.annual_quota, used: myBalance.used_annual },
            { type: "sick", quota: myBalance.sick_quota, used: myBalance.used_sick },
            { type: "personal", quota: myBalance.personal_quota, used: myBalance.used_personal }].map(b => (
            <div key={b.type} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">{L(b.type)}</div>
              <div className="text-2xl font-bold text-gray-800">{b.quota - b.used}</div>
              <div className="text-[10px] text-gray-400">{L("used")} {b.used}/{b.quota}</div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#00AEEF] rounded-full" style={{ width: Math.min(100, (b.used / b.quota) * 100) + "%" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "approved", "rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={"px-3 py-1.5 rounded-full text-xs font-medium border " + (filter === s ? "bg-[#003087] text-white border-[#003087]" : "bg-white text-gray-600 border-gray-300")}>
            {L(s)} {s !== "all" && <span className="ml-1 opacity-70">({requests.filter(r => r.status === s).length})</span>}
          </button>
        ))}
      </div>

      {/* Requests list */}
      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-gray-800">{r.team_members?.nickname || r.team_members?.first_name || "—"}</span>
                  <span className={"px-2 py-0.5 rounded-full text-[10px] font-medium " + (TYPE_COLORS[r.type] || TYPE_COLORS.other)}>{L(r.type)}</span>
                  <span className={"px-2 py-0.5 rounded-full text-[10px] font-medium " + (STATUS_COLORS[r.status] || "")}>{L(r.status)}</span>
                </div>
                <div className="text-sm text-gray-600">{r.start_date} → {r.end_date} ({r.days} {L("days")})</div>
                {r.reason && <div className="text-xs text-gray-400 mt-1">{r.reason}</div>}
                {r.rejection_reason && <div className="text-xs text-red-500 mt-1">❌ {r.rejection_reason}</div>}
              </div>
              {r.status === "pending" && ["admin", "manager"].includes(role) && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleAction(r.id, "approve")} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check size={16} /></button>
                  <button onClick={() => { const reason = prompt("เหตุผลที่ปฏิเสธ:"); if (reason !== null) handleAction(r.id, "reject", reason); }}
                    className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"><X size={16} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
        {!filtered.length && <div className="text-center py-12 text-gray-400"><Clock size={40} className="mx-auto mb-2" />ไม่มีรายการ</div>}
      </div>

      {/* Request form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">{L("request")}</h3>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2 mb-3 text-sm">
              {["annual", "sick", "personal", "wfh", "other"].map(t => <option key={t} value={t}>{L(t)}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="text-xs text-gray-500">{L("from")}</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-gray-500">{L("to")}</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" /></div>
            </div>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder={L("reason")} rows={3}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 mb-4 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
              <button onClick={submit} className="px-4 py-2 bg-[#003087] text-white rounded-xl text-sm">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
