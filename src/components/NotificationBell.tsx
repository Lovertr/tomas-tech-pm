"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, CheckCheck, MessageSquare, Flag, AlertTriangle, ListTodo, Calendar, Info, X, TrendingUp, DollarSign, Briefcase, FileText, XCircle, UserPlus, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { VERSION_HISTORY, CURRENT_VERSION } from "@/lib/version-history";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string | null;
  type?: string | null;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

interface Props {
  onNavigate?: (link: string) => void;
}

const TYPE_META: Record<string, { icon: typeof Bell; color: string }> = {
  task_assigned:       { icon: ListTodo,        color: "#00AEEF" },
  task_completed:      { icon: CheckCheck,      color: "#22C55E" },
  task_due:            { icon: AlertTriangle,   color: "#F7941D" },
  task_overdue:        { icon: AlertTriangle,   color: "#EF4444" },
  deal_stage_changed:  { icon: TrendingUp,      color: "#003087" },
  deal_won:            { icon: DollarSign,      color: "#22C55E" },
  deal_payment:        { icon: DollarSign,      color: "#059669" },
  deal_created:        { icon: Briefcase,       color: "#003087" },
  comment:             { icon: MessageSquare,   color: "#A855F7" },
  mention:             { icon: MessageSquare,   color: "#F7941D" },
  milestone:           { icon: Flag,            color: "#F7941D" },
  meeting:             { icon: Calendar,        color: "#A855F7" },
  quotation_approval:  { icon: FileText,        color: "#F7941D" },
  quotation_approved:  { icon: CheckCheck,      color: "#22C55E" },
  quotation_rejected:  { icon: XCircle,         color: "#EF4444" },
  project_enrollment:  { icon: UserPlus,        color: "#00AEEF" },
  approval:            { icon: CheckCheck,      color: "#22C55E" },
  info:                { icon: Info,            color: "#94A3B8" },
};

const fmtRelative = (iso: string) => {
  const d = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return "เมื่อสักครู่";
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีก่อน`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.ก่อน`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} วันก่อน`;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};

const VER_DISMISSED_KEY = "tt_dismissed_version";

export default function NotificationBell({ onNavigate }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [versionDismissed, setVersionDismissed] = useState(true);
  const [versionExpanded, setVersionExpanded] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/notifications");
      if (r.ok) { const d = await r.json(); setItems(d.notifications ?? []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Check version dismissal
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VER_DISMISSED_KEY);
      if (saved !== CURRENT_VERSION) setVersionDismissed(false);
    } catch {}
  }, []);

  // Poll every 60s
  useEffect(() => {
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const unread = items.filter(n => !n.is_read);
  const badgeCount = unread.length + (versionDismissed ? 0 : 1);

  const markRead = async (ids: string[]) => {
    if (!ids.length) return;
    setItems(items.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n));
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  };

  const markAllRead = async () => {
    setItems(items.map(n => ({ ...n, is_read: true })));
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
  };

  const click = (n: Notification) => {
    if (!n.is_read) markRead([n.id]);
    if (n.link) { onNavigate?.(n.link); setOpen(false); }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-xl bg-slate-100 relative text-gray-500 hover:text-gray-700">
        <Bell size={18} />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-gray-900 text-[10px] font-bold flex items-center justify-center bg-[#F7941D]">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div ref={panelRef} className="absolute right-0 top-10 z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">การแจ้งเตือน</h3>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {/* Version update notification — pinned at top */}
              {!versionDismissed && VERSION_HISTORY[0] && (() => {
                const v = VERSION_HISTORY[0];
                return (
                  <div className="border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
                          <Sparkles size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 px-1.5 py-0.5 rounded-full">NEW</span>
                            <span className="text-xs text-gray-500 font-mono">v{v.version}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">{v.title.th}</p>
                          {!versionExpanded ? (
                            <p className="text-xs text-gray-600 line-clamp-1">{v.highlights.th[0]}</p>
                          ) : (
                            <ul className="space-y-0.5 mt-1">
                              {v.highlights.th.map((h, i) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                  <span className="text-blue-500 mt-0.5">•</span><span>{h}</span>
                                         </li>
                              ))}
                            </ul>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <button onClick={(e) => { e.stopPropagation(); setVersionExpanded(!versionExpanded); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5">
                              {versionExpanded ? "ย่อ" : "ดูทั้งหมด"}
                              {versionExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setVersionDismissed(true); try { localStorage.setItem(VER_DISMISSED_KEY, CURRENT_VERSION); } catch {} }} className="text-xs text-gray-400 hover:text-gray-600">
                              ปิด
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {loading ? (
                <div className="p-4 text-center text-gray-500">กำลังโหลด...</div>
              ) : items.length === 0 && versionDismissed ? (
                <div className="p-4 text-center text-gray-500">ไม่มีการแจ้งเตือน</div>
              ) : items.length === 0 ? (
                null
              ) : (
                items.map((n) => {
                  const meta = TYPE_META[n.type || "info"];
                  const Icon = meta?.icon || Bell;
                  return (
                    <div
                      key={n.id}
                      onClick={() => click(n)}
                      className={`p-3 border-b cursor-pointer transition-colors ${
                        n.is_read ? "bg-white hover:bg-gray-50" : "bg-blue-50 hover:bg-blue-100"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="p-2 rounded flex-shrink-0" style={{ backgroundColor: meta?.color + "20" }}>
                          <Icon size={18} style={{ color: meta?.color || "#000" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{n.title}</p>
                          {n.message && <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>}
                          <p className="text-xs text-gray-500 mt-1">{fmtRelative(n.created_at)}</p>
                        </div>
                        {!n.is_read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: meta?.color }} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="p-3 border-t text-center">
                <button
                  onClick={markAllRead}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  ทำเครื่องหมายว่าอ่านทั้งหมด
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
