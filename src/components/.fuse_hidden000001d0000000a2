"use client";
import { useEffect, useState } from "react";
import { Check, X, Clock, AlertCircle, RefreshCw } from "lucide-react";
import Modal, { fieldLabel, fieldInput, btnPrimary, btnGhost } from "./Modal";

interface TimeLog {
  id: string;
  project_id: string;
  task_id: string | null;
  team_member_id: string;
  log_date: string;
  hours: number;
  hourly_rate_at_log: number;
  description: string | null;
  is_billable: boolean;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  approved_at?: string | null;
  projects?: { name_th?: string | null; name_en?: string | null; project_code?: string | null } | null;
  team_members?: { first_name_th?: string | null; last_name_th?: string | null; first_name_en?: string | null; last_name_en?: string | null } | null;
  tasks?: { title?: string | null } | null;
}

interface Props { canApprove: boolean; }

const memberName = (m: TimeLog["team_members"]) => m
  ? ([m.first_name_en, m.last_name_en].filter(Boolean).join(" ") || [m.first_name_th, m.last_name_th].filter(Boolean).join(" ") || "-")
  : "-";
const projName = (p: TimeLog["projects"]) => p
  ? (p.project_code ? `[${p.project_code}] ${p.name_th || p.name_en || ""}` : (p.name_th || p.name_en || "-"))
  : "-";

export default function TimeLogApproval({ canApprove }: Props) {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [rows, setRows] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string | null; reason: string }>({ open: false, id: null, reason: "" });

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`/api/timelogs?status=${tab}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Load failed");
      setRows(j.timelogs || []);
    } catch (e) { setErr(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab]);

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      const r = await fetch(`/api/timelogs/${id}/approve`, { method: "POST" });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error || "Approve failed"); }
      setRows(rows.filter(r => r.id !== id));
    } catch (e) { alert(e instanceof Error ? e.message : "Approve failed"); }
    finally { setBusyId(null); }
  };

  const openReject = (id: string) => setRejectModal({ open: true, id, reason: "" });

  const submitReject = async () => {
    if (!rejectModal.id) return;
    setBusyId(rejectModal.id);
    try {
      const r = await fetch(`/api/timelogs/${rejectModal.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectModal.reason || null }),
      });
      if (!r.ok) { const j = await r.json(); throw new Error(j.error || "Reject failed"); }
      setRows(rows.filter(r => r.id !== rejectModal.id));
      setRejectModal({ open: false, id: null, reason: "" });
    } catch (e) { alert(e instanceof Error ? e.message : "Reject failed"); }
    finally { setBusyId(null); }
  };

  const totalHours = rows.reduce((s, r) => s + Number(r.hours), 0);
  const totalAmount = rows.reduce((s, r) => s + Number(r.hours) * Number(r.hourly_rate_at_log), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-900">
          <Clock size={20} className="text-[#00AEEF]" />
          <h2 className="text-lg font-semibold">TimeLog Approval</h2>
          <span className="text-xs text-gray-500">({rows.length} รายการ • {totalHours.toFixed(1)}h • ฿{totalAmount.toLocaleString()})</span>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-600 text-sm hover:bg-gray-50">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex gap-1 bg-white border border-gray-300 rounded-lg p-1 w-fit">
        {(["pending", "approved", "rejected"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${tab === t ? "text-white" : "text-gray-500 hover:text-gray-600"}`}
            style={tab === t ? { background: t === "pending" ? "#D97706" : t === "approved" ? "#16A34A" : "#DC2626" } : {}}>
            {t === "pending" ? "Pending" : t === "approved" ? "Approved" : "Rejected"}
          </button>
        ))}
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 flex items-center gap-2"><AlertCircle size={16} /> {err}</div>}

      <div className="bg-white border border-gray-300 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Member</th>
                <th className="text-left px-4 py-3 font-medium">Project</th>
                <th className="text-left px-4 py-3 font-medium">Task</th>
                <th className="text-right px-4 py-3 font-medium">Hours</th>
                <th className="text-right px-4 py-3 font-medium">Rate</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                {tab === "rejected" && <th className="text-left px-4 py-3 font-medium">Reason</th>}
                {canApprove && tab === "pending" && <th className="text-right px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canApprove ? 9 : 8} className="text-center py-12 text-gray-500">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={canApprove ? 9 : 8} className="text-center py-12 text-gray-500">
                  {tab === "pending" ? "🎉 ไม่มี timelog รออนุมัติ" : `ไม่มีรายการ ${tab}`}
                </td></tr>
              ) : rows.map(r => {
                const amount = Number(r.hours) * Number(r.hourly_rate_at_log);
                return (
                  <tr key={r.id} className="border-t border-gray-300 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.log_date}</td>
                    <td className="px-4 py-3 text-gray-900">{memberName(r.team_members)}</td>
                    <td className="px-4 py-3 text-gray-600">{projName(r.projects)}</td>
                    <td className="px-4 py-3 text-gray-500">{r.tasks?.title || "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">{Number(r.hours).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">฿{Number(r.hourly_rate_at_log).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-orange-600 font-medium">฿{amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={r.description ?? ""}>{r.description || "—"}</td>
                    {tab === "rejected" && <td className="px-4 py-3 text-red-600">{r.rejection_reason || "—"}</td>}
                    {canApprove && tab === "pending" && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button disabled={busyId === r.id}
                          onClick={() => approve(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 border border-green-200 text-green-700 text-xs hover:bg-green-100 disabled:opacity-50 mr-1">
                          <Check size={12} /> Approve
                        </button>
                        <button disabled={busyId === r.id}
                          onClick={() => openReject(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs hover:bg-red-100 disabled:opacity-50">
                          <X size={12} /> Reject
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

      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, id: null, reason: "" })} title="Reject TimeLog" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className={fieldLabel}>เหตุผล (optional)</label>
            <textarea rows={4} className={fieldInput}
              placeholder="เช่น ชั่วโมงไม่ตรงกับ task, รายละเอียดไม่ครบ..."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-300">
            <button className={btnGhost} onClick={() => setRejectModal({ open: false, id: null, reason: "" })}>ยกเลิก</button>
            <button className={btnPrimary} style={{ background: "#B91C1C" }} onClick={submitReject}
              disabled={busyId === rejectModal.id}>
              {busyId === rejectModal.id ? "กำลัง Reject..." : "Reject"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
