"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Flag, ListTodo, Zap, Link2, Unlink, RefreshCw, ExternalLink, Loader2 } from "lucide-react";

interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }
interface Task { id: string; title: string; status: string; priority: string; due_date?: string | null; project_id: string; }
interface Milestone { id: string; title: string; due_date: string; status: string; project_id: string; }
interface Meeting { id: string; title: string; meeting_date: string; project_id: string; }
interface SalesActivity { id: string; subject: string; activity_type: string; activity_date: string; customer_name?: string; }
interface GoogleEvent { id: string; title: string; description?: string; location?: string; start_time: string; end_time?: string; all_day: boolean; html_link?: string; status: string; }

const PRIO_DOT: Record<string, string> = { urgent: "bg-red-600", high: "bg-orange-600", medium: "bg-blue-600", low: "bg-slate-600" };

interface Props {
  projects: Project[];
  filterProjectId?: string;
  onTaskClick?: (id: string) => void;
  refreshKey?: number;
}

export default function CalendarView({ projects, filterProjectId = "all", onTaskClick, refreshKey = 0 }: Props) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [salesActivities, setSalesActivities] = useState<SalesActivity[]>([]);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  // Google Calendar state
  const [gcalConnected, setGcalConnected] = useState(false);
  const [gcalLoading, setGcalLoading] = useState(false);
  const [gcalSyncing, setGcalSyncing] = useState(false);
  const [gcalChecked, setGcalChecked] = useState(false);

  // Check Google Calendar connection status
  useEffect(() => {
    fetch('/api/google-calendar/status')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setGcalConnected(data.connected);
        setGcalChecked(true);
      })
      .catch(() => setGcalChecked(true));
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const proj = filterProjectId !== "all" ? `?project_id=${filterProjectId}` : "";
      const [t, m, mt, da] = await Promise.all([
        fetch(`/api/tasks${proj}`).then(r => r.ok ? r.json() : { tasks: [] }),
        fetch(`/api/milestones${proj}`).then(r => r.ok ? r.json() : { milestones: [] }),
        fetch(`/api/meeting-notes${proj}`).then(r => r.ok ? r.json() : { meetings: [] }),
        fetch('/api/deal-activities').then(r => r.ok ? r.json() : { activities: [] }),
      ]);
      setTasks(t.tasks ?? []);
      setMilestones(m.milestones ?? []);
      setMeetings(mt.meetings ?? mt.notes ?? []);
      setSalesActivities((da.activities ?? []).map((a: Record<string, unknown>) => ({
        id: a.id,
        subject: a.subject ?? '',
        activity_type: a.activity_type ?? '',
        activity_date: a.activity_date ?? '',
        customer_name: (a.customers as { company_name?: string })?.company_name ?? '',
      })));
    } finally { setLoading(false); }
  }, [filterProjectId]);

  // Fetch Google Calendar events for current month range
  const fetchGoogleEvents = useCallback(async () => {
    if (!gcalConnected) return;
    try {
      const startOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const endOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0); // +1 month buffer
      const start = startOfMonth.toISOString();
      const end = endOfMonth.toISOString();
      const res = await fetch(`/api/google-calendar/events?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setGoogleEvents(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch Google events:', err);
    }
  }, [gcalConnected, cursor]);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);
  useEffect(() => { fetchGoogleEvents(); }, [fetchGoogleEvents, refreshKey]);

  // Connect to Google Calendar
  const handleConnect = async () => {
    setGcalLoading(true);
    try {
      const res = await fetch('/api/google-calendar/auth');
      if (res.ok) {
        const { authUrl } = await res.json();
        window.location.href = authUrl;
      }
    } catch (err) {
      console.error('Google auth error:', err);
    } finally {
      setGcalLoading(false);
    }
  };

  // Disconnect Google Calendar
  const handleDisconnect = async () => {
    if (!confirm('ยกเลิกการเชื่อมต่อ Google Calendar?')) return;
    setGcalLoading(true);
    try {
      const res = await fetch('/api/google-calendar/disconnect', { method: 'POST' });
      if (res.ok) {
        setGcalConnected(false);
        setGoogleEvents([]);
      }
    } finally {
      setGcalLoading(false);
    }
  };

  // Manual sync
  const handleSync = async () => {
    setGcalSyncing(true);
    try {
      await fetch('/api/google-calendar/sync', { method: 'POST' });
      await fetchGoogleEvents();
    } finally {
      setGcalSyncing(false);
    }
  };

  // Check URL params for connection status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gcal') === 'connected') {
      setGcalConnected(true);
      // Auto-sync after connecting
      setTimeout(async () => {
        setGcalSyncing(true);
        try {
          await fetch('/api/google-calendar/sync', { method: 'POST' });
          await fetchGoogleEvents();
        } finally {
          setGcalSyncing(false);
        }
      }, 500);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('gcal');
      url.searchParams.delete('page');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startDay = first.getDay();
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: { date: Date | null }[] = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: null });
    for (let d = 1; d <= last; d++) cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), d) });
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [cursor]);

  const projMap = new Map(projects.map(p => [p.id, p]));
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, { tasks: Task[]; milestones: Milestone[]; meetings: Meeting[]; activities: SalesActivity[]; google: GoogleEvent[] }>();
    const key = (d: string) => d.slice(0, 10);
    const ensure = (k: string) => { if (!m.has(k)) m.set(k, { tasks: [], milestones: [], meetings: [], activities: [], google: [] }); };
    tasks.forEach(t => { if (!t.due_date) return; const k = key(t.due_date); ensure(k); m.get(k)!.tasks.push(t); });
    milestones.forEach(ms => { const k = key(ms.due_date); ensure(k); m.get(k)!.milestones.push(ms); });
    meetings.forEach(mt => { const k = key(mt.meeting_date); ensure(k); m.get(k)!.meetings.push(mt); });
    salesActivities.forEach(sa => { if (!sa.activity_date) return; const k = key(sa.activity_date); ensure(k); m.get(k)!.activities.push(sa); });
    // Google events — convert start_time to local date key
    googleEvents.forEach(ge => {
      if (!ge.start_time) return;
      const localDate = ge.all_day ? ge.start_time.slice(0, 10) : new Date(ge.start_time).toLocaleDateString('sv-SE'); // YYYY-MM-DD
      ensure(localDate);
      m.get(localDate)!.google.push(ge);
    });
    return m;
  }, [tasks, milestones, meetings, salesActivities, googleEvents]);

  const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const monthLabel = cursor.toLocaleDateString("th-TH", { year: "numeric", month: "long" });

  const selectedDay = selected ? eventsByDay.get(selected) : null;

  const formatTime = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };
  return (
    <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-3 border-b border-gray-300 gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-1.5 text-gray-500 hover:text-gray-900"><ChevronLeft size={18} /></button>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 min-w-32 sm:min-w-40 text-center">{monthLabel}</h2>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-1.5 text-gray-500 hover:text-gray-900"><ChevronRight size={18} /></button>
          <button onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }} className="ml-1 sm:ml-2 px-2 sm:px-3 py-1 text-xs bg-gray-50 text-gray-600 hover:text-gray-900 rounded-lg border border-gray-300">วันนี้</button>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600" /> Task</span>
          <span className="flex items-center gap-1"><Flag size={11} className="text-orange-600" /> Mil</span>
          <span className="flex items-center gap-1"><CalIcon size={11} className="text-purple-600" /> Meet</span>
          <span className="flex items-center gap-1"><Zap size={11} className="text-green-600" /> Sales</span>
          {gcalConnected && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Google</span>}
        </div>
      </div>

      {/* Google Calendar connection bar */}
      {gcalChecked && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-300 text-xs">
          {gcalConnected ? (
            <>
              <span className="flex items-center gap-1.5 text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Google Calendar เชื่อมต่อแล้ว
              </span>
              <div className="flex items-center gap-2">
                <button onClick={handleSync} disabled={gcalSyncing}
                  className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50">
                  <RefreshCw size={12} className={gcalSyncing ? 'animate-spin' : ''} />
                  {gcalSyncing ? 'กำลัง Sync...' : 'Sync'}
                </button>
                <button onClick={handleDisconnect} disabled={gcalLoading}
                  className="flex items-center gap-1 px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50">
                  <Unlink size={12} />
                  ยกเลิก
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-gray-500">เชื่อมต่อ Google Calendar เพื่อดูนัดหมายส่วนตัว</span>
              <button onClick={handleConnect} disabled={gcalLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors disabled:opacity-50">
                {gcalLoading ? <Loader2 size={14} className="animate-spin" /> : (
                  <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                )}
                เชื่อมต่อ Google Calendar
              </button>
            </>
          )}
        </div>
      )}

      {/* Weekday headers */}
      <div className="hidden sm:grid grid-cols-7 text-center text-xs font-medium text-gray-500 border-b border-gray-300">
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map(d => (
          <div key={d} className="py-1.5">{d}</div>
        ))}
      </div>

      {/* Desktop grid */}
      <div className="hidden sm:grid grid-cols-7 border-b border-gray-300">
        {grid.map((cell, i) => {
          if (!cell.date) return <div key={i} className="min-h-[80px] bg-gray-50/50 border-r border-b border-gray-200" />;
          const dk = dayKey(cell.date);
          const isToday = cell.date.getTime() === today.getTime();
          const ev = eventsByDay.get(dk);
          return (
            <div key={i} onClick={() => setSelected(dk === selected ? null : dk)}
              className={`min-h-[80px] p-1 border-r border-b border-gray-200 cursor-pointer transition-colors hover:bg-blue-50/50 ${dk === selected ? 'bg-blue-50 ring-1 ring-blue-300' : ''}`}>
              <div className={`text-xs font-medium mb-0.5 ${isToday ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
                {cell.date.getDate()}
              </div>
              <div className="space-y-0.5">
                {ev?.tasks.slice(0, 2).map(t => (
                  <div key={t.id} className="flex items-center gap-0.5 truncate" onClick={e => { e.stopPropagation(); onTaskClick?.(t.id); }}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIO_DOT[t.priority] || "bg-slate-400"}`} />
                    <span className="text-[10px] text-gray-700 truncate">{t.title}</span>
                  </div>
                ))}
                {ev?.milestones.slice(0, 1).map(ms => (
                  <div key={ms.id} className="flex items-center gap-0.5 truncate">
                    <Flag size={9} className="text-orange-600 flex-shrink-0" />
                    <span className="text-[10px] text-orange-700 truncate">{ms.title}</span>
                  </div>
                ))}
                {ev?.meetings.slice(0, 1).map(mt => (
                  <div key={mt.id} className="flex items-center gap-0.5 truncate">
                    <CalIcon size={9} className="text-purple-600 flex-shrink-0" />
                    <span className="text-[10px] text-purple-700 truncate">{mt.title}</span>
                  </div>
                ))}
                {ev?.activities.slice(0, 1).map(sa => (
                  <div key={sa.id} className="flex items-center gap-0.5 truncate">
                    <Zap size={9} className="text-green-600 flex-shrink-0" />
                    <span className="text-[10px] text-green-700 truncate">{sa.subject}</span>
                  </div>
                ))}
                {ev?.google.slice(0, 2).map(ge => (
                  <div key={ge.id} className="flex items-center gap-0.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                    <span className="text-[10px] text-rose-700 truncate">{!ge.all_day && formatTime(ge.start_time)} {ge.title}</span>
                  </div>
                ))}
                {ev && (ev.tasks.length + ev.milestones.length + ev.meetings.length + ev.activities.length + ev.google.length) > 4 && (
                  <div className="text-[9px] text-gray-400">+{ev.tasks.length + ev.milestones.length + ev.meetings.length + ev.activities.length + ev.google.length - 4} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile list */}
      <div className="sm:hidden divide-y divide-gray-200">
        {grid.filter(c => c.date !== null).map((cell, i) => {
          const d = cell.date!;
          const dk = dayKey(d);
          const isToday = d.getTime() === today.getTime();
          const ev = eventsByDay.get(dk);
          const total = ev ? ev.tasks.length + ev.milestones.length + ev.meetings.length + ev.activities.length + ev.google.length : 0;
          return (
            <div key={i} onClick={() => setSelected(dk === selected ? null : dk)}
              className={`flex items-center px-3 py-2 gap-2 cursor-pointer ${dk === selected ? 'bg-blue-50' : ''} ${isToday ? 'bg-yellow-50/50' : ''}`}>
              <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                {d.getDate()}
              </div>
              <div className="text-xs text-gray-500 w-8">{["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"][d.getDay()]}</div>
              <div className="flex items-center gap-1 flex-1">
                {ev?.tasks.length ? <span className="w-2 h-2 rounded-full bg-blue-600" /> : null}
                {ev?.milestones.length ? <Flag size={10} className="text-orange-600" /> : null}
                {ev?.meetings.length ? <CalIcon size={10} className="text-purple-600" /> : null}
                {ev?.activities.length ? <Zap size={10} className="text-green-600" /> : null}
                {ev?.google.length ? <span className="w-2 h-2 rounded-full bg-rose-500" /> : null}
                {total > 0 && <span className="text-[10px] text-gray-400 ml-1">{total}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selected && selectedDay && (
        <div className="border-t border-gray-300 px-3 sm:px-4 py-3 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {new Date(selected + 'T00:00:00').toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
          {selectedDay.tasks.map(t => (
            <div key={t.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded" onClick={() => onTaskClick?.(t.id)}>
              <span className={`w-2 h-2 rounded-full ${PRIO_DOT[t.priority] || "bg-slate-400"}`} />
              <span className="text-gray-800">{t.title}</span>
              <span className="text-xs text-gray-400 ml-auto">{projMap.get(t.project_id)?.project_code || ''}</span>
            </div>
          ))}
          {selectedDay.milestones.map(ms => (
            <div key={ms.id} className="flex items-center gap-2 text-sm p-1">
              <Flag size={12} className="text-orange-600" />
              <span className="text-orange-800">{ms.title}</span>
              <span className="text-xs text-gray-400 ml-auto">{projMap.get(ms.project_id)?.project_code || ''}</span>
            </div>
          ))}
          {selectedDay.meetings.map(mt => (
            <div key={mt.id} className="flex items-center gap-2 text-sm p-1">
              <CalIcon size={12} className="text-purple-600" />
              <span className="text-purple-800">{mt.title}</span>
              <span className="text-xs text-gray-400 ml-auto">{projMap.get(mt.project_id)?.project_code || ''}</span>
            </div>
          ))}
          {selectedDay.activities.map(sa => (
            <div key={sa.id} className="flex items-center gap-2 text-sm p-1">
              <Zap size={12} className="text-green-600" />
              <span className="text-green-800">{sa.subject}</span>
              {sa.customer_name && <span className="text-xs text-gray-400 ml-auto">{sa.customer_name}</span>}
            </div>
          ))}
          {selectedDay.google.map(ge => (
            <div key={ge.id} className="flex items-start gap-2 text-sm p-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-rose-800 font-medium">{ge.title}</div>
                {!ge.all_day && (
                  <div className="text-xs text-gray-500">
                    {formatTime(ge.start_time)}{ge.end_time ? ` – ${formatTime(ge.end_time)}` : ''}
                  </div>
                )}
                {ge.location && <div className="text-xs text-gray-500 truncate">{ge.location}</div>}
              </div>
              {ge.html_link && (
                <a href={ge.html_link} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-rose-600 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
