"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Filter, X } from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  table_name: string;
  record_id: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
  app_users?: { username: string; first_name: string | null; last_name: string | null } | null;
}

interface Props {
  lang?: "th" | "en" | "jp";
}

const T = {
  th: {
    title: "บันทึกการใช้งาน (Audit Log)",
    search: "ค้นหา...",
    filterUser: "กรองผู้ใช้",
    filterTable: "กรองตาราง",
    filterAction: "กรองการกระทำ",
    dateFrom: "จากวันที่",
    dateTo: "ถึงวันที่",
    user: "ผู้ใช้",
    action: "การกระทำ",
    table: "ตาราง",
    recordId: "Record ID",
    description: "รายละเอียด",
    ip: "IP",
    time: "เวลา",
    noData: "ไม่พบข้อมูล",
    loading: "กำลังโหลด...",
    page: "หน้า",
    of: "จาก",
    total: "ทั้งหมด",
    records: "รายการ",
    detail: "รายละเอียดเพิ่มเติม",
    oldValue: "ค่าเดิม",
    newValue: "ค่าใหม่",
    close: "ปิด",
    clearFilters: "ล้างตัวกรอง",
    allUsers: "ผู้ใช้ทั้งหมด",
    allTables: "ตารางทั้งหมด",
    allActions: "การกระทำทั้งหมด",
    INSERT: "สร้าง",
    UPDATE: "แก้ไข",
    DELETE: "ลบ",
  },
  en: {
    title: "Audit Log",
    search: "Search...",
    filterUser: "Filter by user",
    filterTable: "Filter by table",
    filterAction: "Filter by action",
    dateFrom: "From date",
    dateTo: "To date",
    user: "User",
    action: "Action",
    table: "Table",
    recordId: "Record ID",
    description: "Description",
    ip: "IP",
    time: "Time",
    noData: "No data found",
    loading: "Loading...",
    page: "Page",
    of: "of",
    total: "Total",
    records: "records",
    detail: "Details",
    oldValue: "Old value",
    newValue: "New value",
    close: "Close",
    clearFilters: "Clear filters",
    allUsers: "All users",
    allTables: "All tables",
    allActions: "All actions",
    INSERT: "Create",
    UPDATE: "Update",
    DELETE: "Delete",
  },
  jp: {
    title: "監査ログ",
    search: "検索...",
    filterUser: "ユーザーで絞込",
    filterTable: "テーブルで絞込",
    filterAction: "アクションで絞込",
    dateFrom: "開始日",
    dateTo: "終了日",
    user: "ユーザー",
    action: "アクション",
    table: "テーブル",
    recordId: "Record ID",
    description: "説明",
    ip: "IP",
    time: "時間",
    noData: "データがありません",
    loading: "読み込み中...",
    page: "ページ",
    of: "/",
    total: "合計",
    records: "件",
    detail: "詳細",
    oldValue: "旧値",
    newValue: "新値",
    close: "閉じる",
    clearFilters: "フィルターをクリア",
    allUsers: "全ユーザー",
    allTables: "全テーブル",
    allActions: "全アクション",
    INSERT: "作成",
    UPDATE: "更新",
    DELETE: "削除",
  },
};

const TABLE_LABELS: Record<string, string> = {
  tasks: "Tasks",
  projects: "Projects",
  deals: "Deals",
  quotations: "Quotations",
  transactions: "Transactions",
  app_users: "Users",
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
};

export default function AuditLogPanel({ lang = "th" }: Props) {
  const t = T[lang];
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 30;

  // Filters
  const [search, setSearch] = useState("");
  const [tableName, setTableName] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Detail modal
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (tableName) params.set("table_name", tableName);
      if (action) params.set("action", action);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/audit-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setLogs(json.logs ?? []);
      setTotalPages(json.totalPages ?? 1);
      setTotal(json.total ?? 0);
    } catch (err) {
      console.error("Audit log fetch error:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, tableName, action, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, tableName, action, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch(""); setTableName(""); setAction(""); setDateFrom(""); setDateTo("");
  };

  const hasFilters = search || tableName || action || dateFrom || dateTo;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(lang === "th" ? "th-TH" : lang === "jp" ? "ja-JP" : "en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const getUserName = (log: AuditLog) => {
    const u = log.app_users;
    if (!u) return log.user_id.slice(0, 8) + "...";
    if (u.first_name || u.last_name) return `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
    return u.username;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${showFilters ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            <Filter size={14} /> {showFilters ? t.close : t.filterTable}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition">
              <X size={14} /> {t.clearFilters}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] outline-none"
            />
          </div>
          <select
            value={tableName} onChange={e => setTableName(e.target.value)}
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] outline-none"
          >
            <option value="">{t.allTables}</option>
            {Object.entries(TABLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select
            value={action} onChange={e => setAction(e.target.value)}
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] outline-none"
          >
            <option value="">{t.allActions}</option>
            <option value="INSERT">{t.INSERT}</option>
            <option value="UPDATE">{t.UPDATE}</option>
            <option value="DELETE">{t.DELETE}</option>
          </select>
          <input
            type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] outline-none"
            placeholder={t.dateFrom}
          />
          <input
            type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] outline-none"
            placeholder={t.dateTo}
          />
        </div>
      )}

      {/* Stats bar */}
      <div className="text-sm text-gray-500">
        {t.total} {total.toLocaleString()} {t.records}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.time}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.user}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.action}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.table}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.description}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t.ip}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">{t.loading}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">{t.noData}</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] transition">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatTime(log.created_at)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{getUserName(log)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600"}`}>
                      {t[log.action as keyof typeof t] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{TABLE_LABELS[log.table_name] || log.table_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[300px] truncate">{log.description || "-"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ip_address || "-"}</td>
                  <td className="px-4 py-3">
                    {(log.old_value || log.new_value) && (
                      <button onClick={() => setDetail(log)} className="p-1 rounded hover:bg-gray-100 transition text-gray-400 hover:text-[#003087]">
                        <Eye size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            <span className="text-sm text-gray-500">
              {t.page} {page} {t.of} {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-[#E2E8F0] disabled:opacity-30 hover:bg-white transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-[#E2E8F0] disabled:opacity-30 hover:bg-white transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-lg font-bold text-gray-800">{t.detail}</h3>
              <button onClick={() => setDetail(null)} className="p-1 rounded-lg hover:bg-gray-100 transition text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">{t.time}:</span> <span className="text-gray-700 font-medium">{formatTime(detail.created_at)}</span></div>
                <div><span className="text-gray-400">{t.user}:</span> <span className="text-gray-700 font-medium">{getUserName(detail)}</span></div>
                <div><span className="text-gray-400">{t.action}:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLORS[detail.action]}`}>{t[detail.action as keyof typeof t]}</span></div>
                <div><span className="text-gray-400">{t.table}:</span> <span className="text-gray-700 font-medium">{TABLE_LABELS[detail.table_name] || detail.table_name}</span></div>
                <div className="col-span-2"><span className="text-gray-400">{t.recordId}:</span> <span className="text-gray-700 font-mono text-xs">{detail.record_id}</span></div>
                {detail.description && <div className="col-span-2"><span className="text-gray-400">{t.description}:</span> <span className="text-gray-700">{detail.description}</span></div>}
              </div>

              {detail.old_value && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">{t.oldValue}</h4>
                  <pre className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-red-800 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(detail.old_value, null, 2)}
                  </pre>
                </div>
              )}

              {detail.new_value && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">{t.newValue}</h4>
                  <pre className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-800 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(detail.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
