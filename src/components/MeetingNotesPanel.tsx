"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit3, Calendar, Users, ListChecks, FileText, X, Check, Mic, Square, Upload, Loader2, Volume2, Building2, Globe, Briefcase, Eye } from "lucide-react";
import TranslateButton from "./TranslateButton";
import { supabase } from "@/lib/supabase";

interface ActionItem { text: string; assignee?: string; due?: string; done?: boolean; }
interface MeetingNote {
  id: string; project_id?: string | null; title: string; meeting_date: string;
  attendees?: string[] | null; agenda?: string | null; notes?: string | null;
  action_items?: ActionItem[] | null; created_by?: string | null; created_at?: string;
  audio_url?: string | null;
  meeting_type?: string; department_ids?: string[] | null; client_visible?: boolean;
  projects?: { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null } | null;
}
interface Project { id: string; project_code?: string | null; name_th?: string | null; name_en?: string | null; }
interface Department { id: string; code: string; name_th: string; name_en?: string | null; }

interface Props {
  projects: Project[];
  filterProjectId?: string;
  canManage?: boolean;
  refreshKey?: number;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Building2 }> = {
  project: { label: "โปรเจค", color: "#003087", bg: "bg-[#003087]/10", icon: Briefcase },
  department: { label: "แผนก", color: "#F7941D", bg: "bg-[#F7941D]/10", icon: Building2 },
  company: { label: "บริษัท", color: "#22C55E", bg: "bg-green-50", icon: Globe },
};

export default function MeetingNotesPanel({ projects, filterProjectId = "all", canManage = true, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<MeetingNote | null>(null);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<Department[]>([]);

  const fetchDepts = useCallback(async () => {
    try {
      const r = await fetch("/api/departments");
      if (r.ok) { const d = await r.json(); setDepartments(d.departments ?? []); }
    } catch { /* ignore */ }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/meeting-notes?";
      if (filterProjectId && filterProjectId !== "all") url += `project_id=${filterProjectId}&`;
      if (typeFilter !== "all") url += `meeting_type=${typeFilter}&`;
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setItems(d.notes ?? d.meetings ?? []); }
    } finally { setLoading(false); }
  }, [filterProjectId, typeFilter]);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);
  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const remove = async (id: string) => {
    if (!confirm("ลบ meeting note นี้?")) return;
    await fetch(`/api/meeting-notes/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = items.filter(n => new Date(n.meeting_date) >= today);
  const past = items.filter(n => new Date(n.meeting_date) < today);

  const getDeptNames = (ids: string[] | null | undefined) => {
    if (!ids || ids.length === 0) return "";
    return ids.map(id => departments.find(d => d.id === id)?.name_th || "").filter(Boolean).join(", ");
  };

  const TypeBadge = ({ type, deptIds, clientVisible }: { type?: string; deptIds?: string[] | null; clientVisible?: boolean }) => {
    const t = type || "project";
    const cfg = TYPE_CONFIG[t] || TYPE_CONFIG.project;
    const Icon = cfg.icon;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} flex items-center gap-0.5`} style={{ color: cfg.color }}>
          <Icon size={10} /> {cfg.label}
        </span>
        {t === "department" && deptIds && deptIds.length > 0 && (
          <span className="text-[10px] text-gray-500 truncate max-w-[150px]">{getDeptNames(deptIds)}</span>
        )}
        {clientVisible && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-0.5">
            <Eye size={10} /> ลูกค้าเห็น
          </span>
        )}
      </div>
    );
  };

  const Card = (n: MeetingNote) => {
    const d = new Date(n.meeting_date);
    const isOpen = expanded === n.id;
    const ai = n.action_items ?? [];
    const aiDone = ai.filter(a => a.done).length;
    return (
      <div key={n.id} className="bg-white border border-gray-300 rounded-xl overflow-hidden">
        <div className="p-4 flex items-start gap-3 cursor-pointer hover:bg-gray-100"
          onClick={() => setExpanded(isOpen ? null : n.id)}>
          <div className="w-12 h-12 rounded-lg bg-[#003087]/20 border border-[#003087]/40 flex flex-col items-center justify-center shrink-0">
            <div className="text-[10px] text-[#00AEEF] uppercase">{d.toLocaleDateString("th-TH", { month: "short" })}</div>
            <div className="text-lg font-bold text-gray-900 leading-none">{d.getDate()}</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <TypeBadge type={n.meeting_type} deptIds={n.department_ids} clientVisible={n.client_visible} />
              {n.projects?.project_code && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">
                  {n.projects.project_code}
                </span>
              )}
              <span className="text-xs text-gray-600">
                {d.toLocaleDateString("th-TH", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="text-sm font-semibold text-gray-900 truncate">{n.title}</div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
              {n.attendees && n.attendees.length > 0 && (
                <span className="flex items-center gap-1"><Users size={11} /> {n.attendees.length}</span>
              )}
              {ai.length > 0 && (
                <span className="flex items-center gap-1"><ListChecks size={11} /> {aiDone}/{ai.length}</span>
              )}
              {n.notes && <span className="flex items-center gap-1"><FileText size={11} /> notes</span>}
              {n.audio_url && <span className="flex items-center gap-1 text-purple-700"><Volume2 size={11} /> audio</span>}
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button onClick={() => setEditing(n)} className="p-1.5 text-gray-600 hover:text-gray-900"><Edit3 size={14} /></button>
              <button onClick={() => remove(n.id)} className="p-1.5 text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
            </div>
          )}
        </div>
        {isOpen && (
          <div className="px-4 pb-4 border-t border-gray-300 pt-3 space-y-3">
            {n.audio_url && (
              <Section title="บันทึกเสียง" icon={Volume2}>
                <audio controls className="w-full" src={n.audio_url}>
                  Your browser does not support audio.
                </audio>
              </Section>
            )}
            {n.attendees && n.attendees.length > 0 && (
              <Section title="ผู้เข้าร่วม" icon={Users}>
                <div className="flex flex-wrap gap-1.5">
                  {n.attendees.map((a, i) => (
                    <span key={i} className="text-xs bg-[#F1F5F9] border border-gray-300 rounded-full px-2 py-0.5 text-gray-700">{a}</span>
                  ))}
                </div>
              </Section>
            )}
            {n.agenda && <Section title="Agenda" icon={FileText}><div className="text-sm text-gray-800 whitespace-pre-wrap">{n.agenda}</div><TranslateButton text={n.agenda} /></Section>}
            {n.notes && <Section title="บันทึกการประชุม" icon={FileText}><div className="text-sm text-gray-800 whitespace-pre-wrap">{n.notes}</div><TranslateButton text={n.notes} /></Section>}
            {ai.length > 0 && (
              <Section title="Action Items" icon={ListChecks}>
                <div className="space-y-1">
                  {ai.map((it, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${it.done ? "bg-[#22C55E] border-[#22C55E]" : "border-slate-500"}`}>
                        {it.done && <Check size={10} className="text-white" />}
                      </span>
                      <div className="flex-1">
                        <span className={it.done ? "line-through text-gray-600" : "text-gray-700"}>{it.text}</span>
                        {it.assignee && <span className="ml-2 text-xs text-[#00AEEF]">@{it.assignee}</span>}
                        {it.due && <span className="ml-2 text-xs text-orange-600">{it.due}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-3 gap-2 md:gap-3 flex-1">
          <Stat label="ทั้งหมด" value={items.length} color="#003087" />
          <Stat label="กำลังจะมา" value={upcoming.length} color="#F7941D" />
          <Stat label="ผ่านมาแล้ว" value={past.length} color="#94A3B8" />
        </div>
        {canManage && (
          <button onClick={() => setCreating(true)} className="px-3 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-xl text-xs md:text-sm font-medium flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <Plus size={14} /> เพิ่ม Meeting
          </button>
        )}
      </div>

      {/* Type filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {[
          { key: "all", label: "ทั้งหมด" },
          { key: "project", label: "โปรเจค", icon: Briefcase },
          { key: "department", label: "แผนก", icon: Building2 },
          { key: "company", label: "บริษัท", icon: Globe },
        ].map(tab => {
          const active = typeFilter === tab.key;
          const TabIcon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setTypeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${active ? "bg-[#003087] text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"}`}>
              {TabIcon && <TabIcon size={12} />} {tab.label}
            </button>
          );
        })}
      </div>

      {loading && !items.length && <div className="text-center text-gray-600 py-12">Loading...</div>}
      {!loading && !items.length && (
        <div className="text-center py-16 bg-white border border-gray-300 rounded-2xl text-gray-600">
          <Calendar size={40} className="mx-auto mb-3 text-gray-500" />
          ยังไม่มี meeting note
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-4 rounded-full bg-[#F7941D]" />
            <h3 className="text-sm font-semibold text-gray-900">กำลังจะมา</h3>
            <span className="text-xs text-gray-600">({upcoming.length})</span>
          </div>
          <div className="space-y-2">{upcoming.map(Card)}</div>
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-4 rounded-full bg-slate-500" />
            <h3 className="text-sm font-semibold text-gray-900">ผ่านมาแล้ว</h3>
            <span className="text-xs text-gray-600">({past.length})</span>
          </div>
          <div className="space-y-2">{past.map(Card)}</div>
        </div>
      )}

      {(creating || editing) && (
        <MeetingModal
          initial={editing}
          projects={projects}
          departments={departments}
          defaultProjectId={filterProjectId !== "all" ? filterProjectId : undefined}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); fetchAll(); }}
        />
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        <Icon size={12} /> {title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-2 md:p-3">
      <div className="text-xl md:text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] md:text-xs text-gray-600 mt-0.5">{label}</div>
    </div>
  );
}

function MeetingModal({ initial, projects, departments, defaultProjectId, onClose, onSaved }: {
  initial: MeetingNote | null; projects: Project[]; departments: Department[]; defaultProjectId?: string;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<MeetingNote>>(
    initial ?? {
      project_id: defaultProjectId,
      meeting_date: new Date().toISOString().slice(0, 10),
      attendees: [], action_items: [],
      meeting_type: "project",
      department_ids: [],
      client_visible: false,
    }
  );
  const [attendeeInput, setAttendeeInput] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [aiRaw, setAiRaw] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioSegments, setAudioSegments] = useState<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(initial?.audio_url ?? null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);

  const timerRef = { current: null as NodeJS.Timeout | null };
  const wakeLockRef = { current: null as WakeLockSentinel | null };
  const noSleepAudioRef = { current: null as HTMLAudioElement | null };
  const SEGMENT_DURATION = 180;
  const DIRECT_UPLOAD_LIMIT = 3.5 * 1024 * 1024;

  // --- Wake Lock + NoSleep helpers to keep recording alive ---
  const acquireWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => { wakeLockRef.current = null; });
      }
    } catch { /* wake lock not available or denied */ }
  };
  const releaseWakeLock = () => {
    if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
  };
  const startNoSleepAudio = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001; // inaudible
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      // Store for cleanup
      (noSleepAudioRef as { current: unknown }).current = { stop: () => { oscillator.stop(); ctx.close(); } };
    } catch { /* fallback: no-op */ }
  };
  const stopNoSleepAudio = () => {
    const ref = noSleepAudioRef.current as unknown as { stop?: () => void } | null;
    if (ref?.stop) ref.stop();
    noSleepAudioRef.current = null;
  };

  const meetingType = form.meeting_type || "project";

  const toggleDept = (deptId: string) => {
    const current = form.department_ids ?? [];
    const next = current.includes(deptId) ? current.filter(id => id !== deptId) : [...current, deptId];
    setForm({ ...form, department_ids: next });
  };

  const selectAllDepts = () => {
    setForm({ ...form, department_ids: departments.map(d => d.id) });
  };

  const clearDepts = () => {
    setForm({ ...form, department_ids: [] });
  };

  const startRecording = async () => {
    try {
      // Prevent screen sleep + keep browser alive in background
      await acquireWakeLock();
      startNoSleepAudio();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const segments: Blob[] = [];
      let currentChunks: Blob[] = [];

      const createRecorder = () => {
        const rec = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
        currentChunks = [];
        rec.ondataavailable = (e) => { if (e.data.size > 0) currentChunks.push(e.data); };
        rec.onstop = () => {
          if (currentChunks.length > 0) {
            segments.push(new Blob(currentChunks, { type: "audio/webm" }));
          }
        };
        return rec;
      };

      let recorder = createRecorder();
      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      setAudioBlob(null);
      setAudioSegments([]);
      setAudioPreviewUrl(null);

      // Use start timestamp for accurate elapsed time (resilient to timer throttling)
      const startedAt = Date.now();
      let lastSegmentSplit = 0;
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setRecordingTime(elapsed);
        if (elapsed > 0 && elapsed - lastSegmentSplit >= SEGMENT_DURATION && recorder.state === "recording") {
          lastSegmentSplit = elapsed;
          recorder.stop();
          recorder = createRecorder();
          recorder.start(1000);
          setMediaRecorder(recorder);
        }
      }, 1000);
      timerRef.current = interval;

      // Re-acquire wake lock if released (e.g. after visibility change)
      const handleVisChange = async () => {
        if (document.visibilityState === "visible" && !wakeLockRef.current) {
          await acquireWakeLock();
        }
      };
      document.addEventListener("visibilitychange", handleVisChange);

      (window as unknown as Record<string, unknown>).__stopRecordingCleanup = () => {
        if (recorder.state !== "inactive") recorder.stop();
        stream.getTracks().forEach(t => t.stop());
        clearInterval(interval);
        releaseWakeLock();
        stopNoSleepAudio();
        document.removeEventListener("visibilitychange", handleVisChange);
        setTimeout(() => {
          const allSegments = [...segments];
          if (allSegments.length > 0) {
            const combined = new Blob(allSegments, { type: "audio/webm" });
            setAudioBlob(combined);
            setAudioSegments(allSegments);
            setAudioPreviewUrl(URL.createObjectURL(combined));
          }
        }, 200);
      };
    } catch {
      setErr("ไม่สามารถเข้าถึงไมโครโฟนได้ — กรุณาอนุญาตการใช้งานไมโครโฟน");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const cleanup = (window as unknown as Record<string, unknown>).__stopRecordingCleanup as (() => void) | undefined;
    if (cleanup) { cleanup(); delete (window as unknown as Record<string, unknown>).__stopRecordingCleanup; }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setErr("กรุณาเลือกไฟล์เสียง (mp3, wav, m4a, webm)"); return; }
    if (file.size > 200 * 1024 * 1024) { setErr("ไฟล์เสียงใหญ่เกิน 200MB"); return; }
    setUploadedFile(file);
    setAudioBlob(null);
    setAudioSegments([]);
    setAudioPreviewUrl(URL.createObjectURL(file));
  };

  const safeFetchJson = async (url: string, opts: RequestInit) => {
    const r = await fetch(url, opts);
    const text = await r.text();
    let j: Record<string, unknown>;
    try { j = JSON.parse(text); } catch {
      if (r.status === 413 || text.includes("Request Entity Too Large") || text.includes("FUNCTION_PAYLOAD_TOO_LARGE") || text.includes("BODY_LIMIT")) {
        throw new Error("ไฟล์เสียงใหญ่เกินไป — กรุณาอัดเสียงให้สั้นลง (แนะนำไม่เกิน 3 นาทีต่อครั้ง)");
      }
      throw new Error(`Server error (${r.status}) — ไม่สามารถถอดเสียงได้ กรุณาลองใหม่`);
    }
    if (r.status === 422 && j.hallucinated) {
      throw new Error((j.error as string) || "ตรวจพบว่า AI อาจถอดเสียงผิดพลาด — กรุณาลองใหม่");
    }
    if (!r.ok) throw new Error((j.error as string) || "Transcription failed");
    return j;
  };

  const transcribeSmallBlob = async (blob: Blob, label?: string): Promise<string> => {
    if (label) setTranscribeProgress(label);
    const fd = new FormData();
    fd.append("audio", blob, "recording.webm");
    fd.append("lang", "th");
    const j = await safeFetchJson("/api/ai/transcribe-audio", { method: "POST", body: fd });
    return (j.transcript as string) || "";
  };

  const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB per chunk (under Supabase free 50MB limit)

  const transcribeViaChunks = async (source: Blob | File): Promise<string> => {
    const ext = source instanceof File ? (source.name.split(".").pop() || "webm") : "webm";
    const mime = source.type || "audio/webm";
    const totalChunks = Math.ceil(source.size / CHUNK_SIZE);
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const chunkUrls: string[] = [];

    // Upload chunks
    for (let i = 0; i < totalChunks; i++) {
      setTranscribeProgress(`กำลังอัพโหลดส่วนที่ ${i + 1}/${totalChunks}...`);
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, source.size);
      const chunk = source.slice(start, end);
      const chunkPath = `chunks/${sessionId}/${i}.${ext}`;
      const { error: chunkErr } = await supabase.storage
        .from("meeting-audio")
        .upload(chunkPath, chunk, { contentType: mime, upsert: false });
      if (chunkErr) throw new Error(`อัพโหลด chunk ${i + 1} ไม่สำเร็จ: ${chunkErr.message}`);
      const { data: urlData } = supabase.storage.from("meeting-audio").getPublicUrl(chunkPath);
      chunkUrls.push(urlData.publicUrl);
    }

    // Transcribe assembled chunks
    setTranscribeProgress("กำลังถอดเสียง (อาจใช้เวลา 2-3 นาที)...");
    const j = await safeFetchJson("/api/ai/transcribe-audio-chunks", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chunkUrls, mimeType: mime, lang: "th" }),
    });

    // Clean up chunks (best effort)
    for (let i = 0; i < totalChunks; i++) {
      supabase.storage.from("meeting-audio").remove([`chunks/${sessionId}/${i}.${ext}`]).catch(() => {});
    }

    return (j.transcript as string) || "";
  };

  const transcribeLargeFile = async (source: Blob | File): Promise<string> => {
    setTranscribeProgress("กำลังอัพโหลดไฟล์เสียง...");
    const ext = source instanceof File ? (source.name.split(".").pop() || "webm") : "webm";
    const filename = `meetings/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("meeting-audio")
      .upload(filename, source, { contentType: source.type || "audio/webm", upsert: false });

    // If upload fails due to size limit, fall back to chunked upload
    if (uploadErr) {
      const errMsg = uploadErr.message || "";
      if (errMsg.includes("exceeded") || errMsg.includes("size") || errMsg.includes("too large")) {
        console.log("Supabase upload exceeded size limit, falling back to chunked upload...");
        return transcribeViaChunks(source);
      }
      throw new Error("อัพโหลดไฟล์เสียงไม่สำเร็จ: " + errMsg);
    }

    const { data: urlData } = supabase.storage.from("meeting-audio").getPublicUrl(filename);
    const storageUrl = urlData.publicUrl;
    if (!storageUrl) throw new Error("ไม่สามารถสร้าง URL สำหรับไฟล์เสียงได้");
    setTranscribeProgress("กำลังถอดเสียง (อาจใช้เวลา 1-2 นาที)...");
    const j = await safeFetchJson("/api/ai/transcribe-audio-url", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: storageUrl, lang: "th" }),
    });
    return (j.transcript as string) || "";
  };

  const transcribeAudio = async () => {
    const source = audioBlob || uploadedFile;
    if (!source) return;
    setTranscribing(true); setErr(null); setTranscribeProgress(null);
    try {
      let fullTranscript = "";
      if (audioSegments.length > 1) {
        const transcripts: string[] = [];
        for (let i = 0; i < audioSegments.length; i++) {
          const seg = audioSegments[i];
          if (seg.size <= DIRECT_UPLOAD_LIMIT) {
            transcripts.push(await transcribeSmallBlob(seg, `กำลังถอดเสียงส่วนที่ ${i + 1}/${audioSegments.length}...`));
          } else {
            setTranscribeProgress(`กำลังถอดเสียงส่วนที่ ${i + 1}/${audioSegments.length} (ไฟล์ใหญ่)...`);
            transcripts.push(await transcribeLargeFile(seg));
          }
        }
        fullTranscript = transcripts.filter(Boolean).join("\n\n---\n\n");
      } else if (source.size <= DIRECT_UPLOAD_LIMIT) {
        fullTranscript = await transcribeSmallBlob(source, "กำลังถอดเสียง...");
      } else {
        fullTranscript = await transcribeLargeFile(source);
      }
      setTranscribeProgress(null);
      if (!fullTranscript) throw new Error("AI ไม่สามารถถอดเสียงได้ — อาจเป็นเพราะไฟล์เสียงไม่ชัด");
      setAiRaw(fullTranscript);
      setForm(f => ({
        ...f,
        notes: ((f.notes ?? "") + (f.notes ? "\n\n" : "") + "📝 [Transcript]\n" + fullTranscript).trim(),
      }));
    } catch (e) { setErr(e instanceof Error ? e.message : "Transcription failed"); }
    finally { setTranscribing(false); setTranscribeProgress(null); }
  };

  const uploadAudioToStorage = async (): Promise<string | null> => {
    const source = audioBlob || uploadedFile;
    if (!source) return audioUrl;
    setUploading(true);
    try {
      // Upload directly to Supabase Storage (bypasses Vercel 4.5MB body limit)
      const ext = source instanceof File ? (source.name.split(".").pop() || "webm") : "webm";
      const filename = `meetings/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const mime = source.type || "audio/webm";

      const { error: upErr } = await supabase.storage
        .from("meeting-audio")
        .upload(filename, source, { contentType: mime, upsert: false });

      if (upErr) {
        const errMsg = upErr.message || "";
        if (errMsg.includes("exceeded") || errMsg.includes("size") || errMsg.includes("too large")) {
          // File too large for single upload — try chunked
          const CHUNK_SZ = 20 * 1024 * 1024;
          const totalChunks = Math.ceil(source.size / CHUNK_SZ);
          const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SZ;
            const end = Math.min(start + CHUNK_SZ, source.size);
            const chunk = source.slice(start, end);
            const chunkPath = `chunks/${sessionId}/${i}.${ext}`;
            const { error: chunkErr } = await supabase.storage
              .from("meeting-audio")
              .upload(chunkPath, chunk, { contentType: mime, upsert: false });
            if (chunkErr) throw new Error(`อัพโหลด chunk ${i + 1} ไม่สำเร็จ: ${chunkErr.message}`);
          }
          // For chunked uploads, we can't easily get a single URL
          // Save as "chunked" and note it in the UI
          setErr("ไฟล์เสียงใหญ่เกินไปสำหรับจัดเก็บเป็นไฟล์เดียว — บันทึกประชุมจะถูกบันทึกโดยไม่มีลิงก์เสียงแนบ");
          return audioUrl;
        }
        throw new Error("อัพโหลดไฟล์เสียงไม่สำเร็จ: " + errMsg);
      }

      const { data: urlData } = supabase.storage.from("meeting-audio").getPublicUrl(filename);
      const url = urlData.publicUrl;
      setAudioUrl(url);
      return url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setErr(`อัพโหลดไฟล์เสียงไม่สำเร็จ: ${msg}`);
      return audioUrl;
    } finally { setUploading(false); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const runAiExtract = async () => {
    if (!aiRaw.trim()) return;
    setAiBusy(true); setErr(null); setAiSummary(null);
    try {
      const r = await fetch("/api/ai/extract-meeting", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ raw_text: aiRaw }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "AI failed");
      const newActions = (j.action_items ?? []).map((a: { text: string; owner?: string | null; due_date?: string | null }) => ({
        text: a.text, assignee: a.owner ?? undefined, due: a.due_date ?? undefined, done: false,
      }));
      const decisionsBlock = (j.decisions ?? []).length ? `\n\n[Decisions]\n- ${(j.decisions ?? []).join("\n- ")}` : "";
      const risksBlock = (j.risks ?? []).length ? `\n\n[Risks]\n- ${(j.risks ?? []).join("\n- ")}` : "";
      const crBlock = (j.change_requests ?? []).length ? `\n\n[Change Requests]\n- ${(j.change_requests ?? []).join("\n- ")}` : "";
      setForm(f => ({
        ...f,
        notes: ((f.notes ?? "") + (f.notes ? "\n\n" : "") + aiRaw + decisionsBlock + risksBlock + crBlock).trim(),
        action_items: [...(f.action_items ?? []), ...newActions],
      }));
      setAiSummary(j.summary || "Extracted");
      setAiRaw("");
    } catch (e) { setErr(e instanceof Error ? e.message : "AI failed"); }
    finally { setAiBusy(false); }
  };

  const addAttendee = () => {
    const v = attendeeInput.trim(); if (!v) return;
    setForm({ ...form, attendees: [...(form.attendees ?? []), v] });
    setAttendeeInput("");
  };
  const removeAttendee = (i: number) =>
    setForm({ ...form, attendees: (form.attendees ?? []).filter((_, idx) => idx !== i) });

  const addAction = () => {
    const v = aiInput.trim(); if (!v) return;
    setForm({ ...form, action_items: [...(form.action_items ?? []), { text: v, done: false }] });
    setAiInput("");
  };
  const toggleAction = (i: number) =>
    setForm({ ...form, action_items: (form.action_items ?? []).map((a, idx) => idx === i ? { ...a, done: !a.done } : a) });
  const removeAction = (i: number) =>
    setForm({ ...form, action_items: (form.action_items ?? []).filter((_, idx) => idx !== i) });

  const submit = async () => {
    if (!form.title || !form.meeting_date) { setErr("ต้องระบุชื่อและวันที่"); return; }
    if (meetingType === "project" && !form.project_id) { setErr("กรุณาเลือกโครงการสำหรับการประชุมโปรเจค"); return; }
    if (meetingType === "department" && (!form.department_ids || form.department_ids.length === 0)) { setErr("กรุณาเลือกแผนกอย่างน้อย 1 แผนก"); return; }
    setSaving(true); setErr(null);
    try {
      let finalAudioUrl = audioUrl;
      if (audioBlob || uploadedFile) {
        finalAudioUrl = await uploadAudioToStorage();
      }
      const payload = {
        ...form,
        audio_url: finalAudioUrl,
        meeting_type: meetingType,
        project_id: meetingType === "project" ? form.project_id : null,
        department_ids: meetingType === "department" ? (form.department_ids ?? []) : [],
        client_visible: meetingType === "project" ? (form.client_visible ?? false) : false,
      };
      const url = initial ? `/api/meeting-notes/${initial.id}` : `/api/meeting-notes`;
      const r = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Save failed"); }
      onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-300 w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900">{initial ? "แก้ไข Meeting" : "เพิ่ม Meeting Note"}</h3>

        {/* Meeting Type Selector */}
        <div>
          <label className="block text-xs text-gray-600 mb-1.5">ประเภทการประชุม</label>
          <div className="grid grid-cols-3 gap-2">
            {(["project", "department", "company"] as const).map(t => {
              const cfg = TYPE_CONFIG[t];
              const Icon = cfg.icon;
              const active = meetingType === t;
              return (
                <button key={t} type="button"
                  onClick={() => setForm({ ...form, meeting_type: t })}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${active ? "border-[#003087] bg-[#003087]/5 text-[#003087] ring-1 ring-[#003087]/30" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}>
                  <Icon size={16} /> {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Project selector — only when type=project */}
        {meetingType === "project" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">โครงการ *</label>
              <select className="w-full bg-[#F1F5F9] border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                value={form.project_id ?? ""} onChange={e => setForm({ ...form, project_id: e.target.value || null })}>
                <option value="">— เลือกโครงการ —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                <input type="checkbox" className="w-4 h-4 accent-[#003087] rounded"
                  checked={form.client_visible ?? false}
                  onChange={e => setForm({ ...form, client_visible: e.target.checked })} />
                <span className="text-sm text-gray-700 flex items-center gap-1"><Eye size={14} className="text-blue-600" /> ลูกค้าเห็นสรุป</span>
              </label>
            </div>
          </div>
        )}

        {/* Department multi-select — only when type=department */}
        {meetingType === "department" && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-600">เลือกแผนก *</label>
              <div className="flex gap-2">
                <button type="button" onClick={selectAllDepts} className="text-[10px] text-[#003087] hover:underline">เลือกทั้งหมด</button>
                <button type="button" onClick={clearDepts} className="text-[10px] text-gray-500 hover:underline">ล้าง</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto bg-[#F1F5F9] border border-gray-300 rounded-lg p-2">
              {departments.map(dept => {
                const selected = (form.department_ids ?? []).includes(dept.id);
                return (
                  <button key={dept.id} type="button" onClick={() => toggleDept(dept.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${selected ? "bg-[#F7941D]/15 border border-[#F7941D]/40 text-[#F7941D]" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-[#F7941D] border-[#F7941D]" : "border-gray-400"}`}>
                      {selected && <Check size={8} className="text-white" />}
                    </div>
                    <span className="truncate">{dept.code} - {dept.name_th}</span>
                  </button>
                );
              })}
              {departments.length === 0 && <div className="col-span-full text-xs text-gray-500 text-center py-2">ไม่มีแผนก</div>}
            </div>
            {(form.department_ids ?? []).length > 0 && (
              <div className="text-xs text-gray-500 mt-1">เลือก {(form.department_ids ?? []).length} แผนก</div>
            )}
          </div>
        )}

        {/* Company meeting — no extra selector needed */}
        {meetingType === "company" && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 flex items-center gap-2">
            <Globe size={16} /> การประชุมนี้จะเห็นได้ทั้งบริษัท
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">วันที่ *</label>
          <input type="date" className="w-full bg-[#F1F5F9] border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.meeting_date ?? ""} onChange={e => setForm({ ...form, meeting_date: e.target.value })} />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">หัวข้อประชุม *</label>
          <input className="w-full bg-[#F1F5F9] border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.title ?? ""} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">ผู้เข้าร่วม</label>
          <div className="flex gap-2">
            <input className="flex-1 bg-[#F1F5F9] border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
              placeholder="ชื่อผู้เข้าร่วม"
              value={attendeeInput}
              onChange={e => setAttendeeInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAttendee(); } }} />
            <button type="button" onClick={addAttendee} className="px-3 py-2 bg-[#003087] text-white rounded-lg text-sm">เพิ่ม</button>
          </div>
          {form.attendees && form.attendees.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.attendees.map((a, i) => (
                <span key={i} className="text-xs bg-[#F1F5F9] border border-gray-300 rounded-full pl-2 pr-1 py-0.5 text-gray-700 flex items-center gap-1">
                  {a} <button onClick={() => removeAttendee(i)} className="text-red-600"><X size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Agenda</label>
          <textarea rows={2} className="w-full bg-[#F1F5F9] border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.agenda ?? ""} onChange={e => setForm({ ...form, agenda: e.target.value })} />
        </div>

        {/* Audio Recording & Upload Section */}
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-3">
          <label className="block text-xs font-semibold text-blue-700">🎙 บันทึกเสียงประชุม — อัดเสียงหรืออัปโหลดไฟล์เสียง แล้วให้ AI ถอดข้อความ</label>
          <div className="flex items-center gap-2 flex-wrap">
            {!isRecording ? (
              <button type="button" onClick={startRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 border border-red-200 text-red-600 hover:bg-red-200 text-xs font-medium">
                <Mic size={14} /> เริ่มอัดเสียง
              </button>
            ) : (
              <button type="button" onClick={stopRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium animate-pulse">
                <Square size={14} /> หยุด ({formatTime(recordingTime)})
              </button>
            )}
            <span className="text-gray-600 text-xs">หรือ</span>
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200/50 border border-gray-300 text-gray-700 hover:bg-slate-200 text-xs font-medium cursor-pointer">
              <Upload size={14} /> อัปโหลดไฟล์เสียง
              <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          {audioPreviewUrl && (
            <div className="space-y-2">
              <audio controls className="w-full h-8" src={audioPreviewUrl} />
              <div className="flex items-center gap-2">
                <button type="button" onClick={transcribeAudio} disabled={transcribing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium disabled:opacity-40">
                  {transcribing ? <><Loader2 size={14} className="animate-spin" /> {transcribeProgress || "กำลังถอดเสียง..."}</> : <>✨ AI ถอดเสียง</>}
                </button>
                <button type="button" onClick={() => { setAudioBlob(null); setUploadedFile(null); setAudioSegments([]); setAudioPreviewUrl(null); }}
                  className="text-xs text-gray-600 hover:text-red-600">ลบเสียง</button>
              </div>
              {audioSegments.length > 1 && (
                <div className="text-xs text-blue-600">บันทึก {audioSegments.length} ส่วน (แบ่งอัตโนมัติทุก 3 นาที)</div>
              )}
            </div>
          )}
          {audioUrl && !audioPreviewUrl && (
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <Volume2 size={12} /> มีไฟล์เสียงแนบอยู่แล้ว
              <audio controls className="h-7 flex-1" src={audioUrl} />
            </div>
          )}
        </div>

        <div className="border border-purple-200 bg-purple-50 rounded-lg p-3 space-y-2">
          <label className="block text-xs font-semibold text-purple-700">✨ AI Extract — วาง raw notes แล้วให้ AI แยก action items / decisions / risks</label>
          <textarea rows={3} className="w-full bg-[#F1F5F9] border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-xs"
            placeholder="วางบันทึกประชุมดิบที่นี่..."
            value={aiRaw} onChange={e => setAiRaw(e.target.value)} />
          <div className="flex items-center justify-between">
            {aiSummary && <span className="text-xs text-purple-700">📋 {aiSummary}</span>}
            <button type="button" disabled={!aiRaw.trim() || aiBusy} onClick={runAiExtract}
              className="ml-auto px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-medium disabled:opacity-40">
              {aiBusy ? "กำลังวิเคราะห์..." : "✨ Extract"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">บันทึกการประชุม</label>
          <textarea rows={4} className="w-full bg-[#F1F5F9] border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
            value={form.notes ?? ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Action Items</label>
          <div className="flex gap-2">
            <input className="flex-1 bg-[#F1F5F9] border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
              placeholder="งานที่ต้องทำ"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addAction(); } }} />
            <button type="button" onClick={addAction} className="px-3 py-2 bg-[#003087] text-white rounded-lg text-sm">เพิ่ม</button>
          </div>
          {form.action_items && form.action_items.length > 0 && (
            <div className="space-y-1 mt-2">
              {form.action_items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-[#F1F5F9] border border-gray-300 rounded-lg px-2 py-1.5">
                  <button type="button" onClick={() => toggleAction(i)}
                    className={`w-4 h-4 rounded border flex items-center justify-center ${it.done ? "bg-[#22C55E] border-[#22C55E]" : "border-slate-500"}`}>
                    {it.done && <Check size={10} className="text-white" />}
                  </button>
                  <span className={`flex-1 ${it.done ? "line-through text-gray-600" : "text-gray-700"}`}>{it.text}</span>
                  <button type="button" onClick={() => removeAction(i)} className="text-red-600"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-900 text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
