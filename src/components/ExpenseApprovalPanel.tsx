"use client";
import { useState, useEffect } from "react";

interface Transaction {
  id: string; type: string; category: string; amount: number; description: string;
  status: string; date: string; currency: string; approval_status: string;
  approved_by?: string; approved_at?: string; created_by: string;
  creator_name?: string; approver_name?: string;
}

export default function ExpenseApprovalPanel({ lang, canApprove }: { lang: string; canApprove: boolean }) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"pending"|"approved"|"rejected"|"all">("pending");

  const t = {
    title: lang === "th" ? "อนุมัติค่าใช้จ่าย" : lang === "jp" ? "経費承認" : "Expense Approval",
    pending: lang === "th" ? "รออนุมัติ" : "Pending",
    approved: lang === "th" ? "อนุมัติแล้ว" : "Approved",
    rejected: lang === "th" ? "ปฏิเสธ" : "Rejected",
    all: lang === "th" ? "ทั้งหมด" : "All",
    approve: lang === "th" ? "อนุมัติ" : lang === "jp" ? "承認" : "Approve",
    reject: lang === "th" ? "ปฏิเสธ" : lang === "jp" ? "却下" : "Reject",
    noData: lang === "th" ? "ไม่มีรายการ" : "No items",
    amount: lang === "th" ? "จำนวน" : lang === "jp" ? "金額" : "Amount",
    by: lang === "th" ? "โดย" : "By",
    date: lang === "th" ? "วันที่" : lang === "jp" ? "日付" : "Date",
    category: lang === "th" ? "หมวด" : lang === "jp" ? "カテゴリ" : "Category",
  };

  const load = () => {
    fetch("/api/transactions").then(r => r.json()).then(d => {
      const expenses = (d.transactions || []).filter((tx: Transaction) => tx.type === "expense");
      setTxs(expenses);
    });
  };
  useEffect(load, []);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    await fetch("/api/transactions/" + id, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approval_status: action }),
    });
    load();
  };

  const filtered = filter === "all" ? txs : txs.filter(tx => (tx.approval_status || "pending") === filter);
  const fmt = (n: number, c?: string) => (c && c !== "THB" ? c + " " : "฿") + n.toLocaleString();
  const statusStyle: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">{t.title}</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{txs.filter(tx => (tx.approval_status || "pending") === "pending").length}</div>
          <div className="text-sm text-yellow-700">{t.pending}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{txs.filter(tx => tx.approval_status === "approved").length}</div>
          <div className="text-sm text-green-700">{t.approved}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{txs.filter(tx => tx.approval_status === "rejected").length}</div>
          <div className="text-sm text-red-700">{t.rejected}</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={"px-3 py-1.5 rounded-lg text-sm font-medium transition " + (filter === f ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
            {t[f]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-200">{t.noData}</div>}
        {filtered.map(tx => (
          <div key={tx.id} className="bg-white rounded-xl p-4 border border-gray-200 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">{tx.description || tx.category}</div>
              <div className="text-xs text-gray-500">{t.category}: {tx.category} &middot; {t.date}: {tx.date}</div>
              {tx.creator_name && <div className="text-xs text-gray-400">{t.by}: {tx.creator_name}</div>}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-gray-800">{fmt(tx.amount, tx.currency)}</div>
              <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (statusStyle[tx.approval_status || "pending"] || "")}>
                {tx.approval_status || "pending"}
              </span>
            </div>
            {canApprove && (tx.approval_status || "pending") === "pending" && (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleAction(tx.id, "approved")} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700">{t.approve}</button>
                <button onClick={() => handleAction(tx.id, "rejected")} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600">{t.reject}</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
