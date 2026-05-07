"use client";
import { useState, useEffect } from "react";

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  close_reason?: string;
  close_reason_category?: string;
  customer?: { company_name: string };
  created_at: string;
  updated_at: string;
}

export default function WinLossPanel({ lang }: { lang: string }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filter, setFilter] = useState<"all"|"won"|"lost">("all");
  const t = {
    title: lang === "th" ? "วิเคราะห์ Win/Loss" : lang === "jp" ? "Win/Loss分析" : "Win/Loss Analysis",
    won: lang === "th" ? "ชนะ" : lang === "jp" ? "受注" : "Won",
    lost: lang === "th" ? "แพ้" : lang === "jp" ? "失注" : "Lost",
    all: lang === "th" ? "ทั้งหมด" : lang === "jp" ? "すべて" : "All",
    winRate: lang === "th" ? "อัตราชนะ" : lang === "jp" ? "受注率" : "Win Rate",
    avgDeal: lang === "th" ? "มูลค่าเฉลี่ย" : lang === "jp" ? "平均取引額" : "Avg Deal",
    reason: lang === "th" ? "เหตุผล" : lang === "jp" ? "理由" : "Reason",
    noData: lang === "th" ? "ไม่มีข้อมูล" : lang === "jp" ? "データなし" : "No data",
    customer: lang === "th" ? "ลูกค้า" : lang === "jp" ? "顧客" : "Customer",
    value: lang === "th" ? "มูลค่า" : lang === "jp" ? "金額" : "Value",
    deal: lang === "th" ? "ดีล" : lang === "jp" ? "取引" : "Deal",
  };

  useEffect(() => {
    fetch("/api/deals").then(r => r.json()).then(d => setDeals(d.deals || []));
  }, []);

  const wonDeals = deals.filter(d => d.stage === "payment_received" || d.stage === "closed_won" || d.stage === "received_po");
  const lostDeals = deals.filter(d => d.stage === "closed_lost" || d.close_reason_category === "lost");
  const closedDeals = [...wonDeals, ...lostDeals];
  const winRate = closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;
  const avgWon = wonDeals.length > 0 ? wonDeals.reduce((s, d) => s + (d.value || 0), 0) / wonDeals.length : 0;
  const avgLost = lostDeals.length > 0 ? lostDeals.reduce((s, d) => s + (d.value || 0), 0) / lostDeals.length : 0;

  const lossReasons: Record<string, number> = {};
  lostDeals.forEach(d => {
    const r = d.close_reason_category || d.close_reason || "Unknown";
    lossReasons[r] = (lossReasons[r] || 0) + 1;
  });
  const sortedReasons = Object.entries(lossReasons).sort((a, b) => b[1] - a[1]);

  const displayed = filter === "won" ? wonDeals : filter === "lost" ? lostDeals : closedDeals;

  const fmt = (n: number | null | undefined) => "฿" + (n != null ? n.toLocaleString() : '0');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">{t.title}</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-[#003087]">{winRate}%</div>
          <div className="text-sm text-gray-500">{t.winRate}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{wonDeals.length}</div>
          <div className="text-sm text-gray-500">{t.won}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-red-500">{lostDeals.length}</div>
          <div className="text-sm text-gray-500">{t.lost}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-[#F7941D]">{fmt(avgWon)}</div>
          <div className="text-sm text-gray-500">{t.avgDeal} ({t.won})</div>
        </div>
      </div>

      {/* Loss Reasons */}
      {sortedReasons.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">{t.reason} ({t.lost})</h3>
          <div className="space-y-2">
            {sortedReasons.map(([reason, count]) => (
              <div key={reason} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{reason}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: Math.round((count / lostDeals.length) * 100) + "%" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter + Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex gap-2 p-4 border-b border-gray-100">
          {(["all", "won", "lost"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={"px-3 py-1.5 rounded-lg text-sm font-medium transition " + (filter === f ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
              {t[f]}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr><th className="px-4 py-3 text-left">{t.deal}</th><th className="px-4 py-3 text-left">{t.customer}</th><th className="px-4 py-3 text-right">{t.value}</th><th className="px-4 py-3 text-left">{t.reason}</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">{t.noData}</td></tr>}
              {displayed.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{d.title}</span>
                    <span className={"ml-2 text-xs px-2 py-0.5 rounded-full " + (wonDeals.includes(d) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                      {wonDeals.includes(d) ? t.won : t.lost}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.customer?.company_name || "-"}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">{fmt(d.value || 0)}</td>
                  <td className="px-4 py-3 text-gray-500">{d.close_reason || d.close_reason_category || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
