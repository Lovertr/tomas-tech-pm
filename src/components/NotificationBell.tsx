"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, CheckCheck, MessageSquare, Flag, AlertTriangle, ListTodo, Calendar, Info, X } from "lucide-react";

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
  task_assigned:    { icon: ListTodo,        color: "#00AEEF" },
  task_due:         { icon: AlertTriangle,   color: "#F7941D" },
  task_overdue:     { icon: AlertTriangle,   color: "#EF4444" },
  comment:          { icon: MessageSquare,   color: "#A855F7" },
  mention:          { icon: MessageSquare,   color: "#F7941D" },
  milestone:        { icon: Flag,            color: "#F7941D" },
  meeting:          { icon: Calendar,        color: "#A855F7" },
  approval:         { icon: CheckCheck,      color: "#22C55E" },
  info:             { icon: Info,            color: "#94A3B8" },
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

export default function NotificationBell({ onNavigate }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/notifications");
      if (r.ok) { const d = await r.json(); setItems(d.notifications ?? []); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Poll every 60s
  useEffect(() => {
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const unread = items.filter(n => !n.is_read);

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
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center bg-[#F7941D]">
            {unread.length > 99 ? "99+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div ref={panelRef}
            className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-2xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">การแจ้งเตือน</h3>
                {unread.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F7941D] text-white font-bold">
                    {unread.length} ใหม่
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread.length > 0 && (
                  <button onClick={markAllRead} className="text-xs text-cyan-600 hover:text-gray-700 flex items-center gap-1">
                    <CheckCheck size={12} /> อ่านทั้งหมด
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 text-gray-500 hover:text-gray-700">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[28rem] overflow-y-auto">
              {loading && !items.length && (
                <div className="text-center text-sm text-gray-500 py-8">Loading...</div>
              )}
              {!loading && items.length === 0 && (
                <div className="text-center text-sm text-gray-600 py-12">
                  <Bell size={28} className="mx-auto mb-2 text-gray-500" />
                  ยังไม่มีการแจ้งเตือน
                </div>
              )}
              {items.map(n => {
                const meta = TYPE_META[n.type ?? "info"] ?? TYPE_META.info;
                const Icon = meta.icon;
                return (
                  <button key={n.id} onClick={() => click(n)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors flex gap-3 ${
                      n.is_read ? "" : "bg-blue-50"
                    }`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${meta.color}10` }}>
                      <Icon size={14} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className={`flex-1 text-sm ${n.is_read ? "text-gray-500" : "text-gray-900 font-medium"} truncate`}>
                          {n.title}
                        </div>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />}
                      </div>
                      {n.message && (
                        <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</div>
                      )}
                      <div className="text-[10px] text-gray-500 mt-1">{fmtRelative(n.created_at)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
