"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { use } from "react";
import {
  CheckCircle2, Clock, AlertTriangle, XCircle, Send,
  Paperclip, Image as ImageIcon, Video, FileText, Loader2,
  ChevronDown, ChevronUp, Flag, Target, MessageSquare,
  BarChart3, Calendar, Shield, Plus, X, Eye
} from "lucide-react";
import TranslateButton from "@/components/TranslateButton";

/* ---------- types ---------- */
interface Project {
  id: string; project_code: string; name_th: string; name_en?: string;
  description?: string; status: string; priority: string;
  start_date?: string; end_date?: string; progress: number; client_name?: string;
}
interface Milestone { id: string; title: string; status: string; due_date?: string; completed_date?: string; }
interface Task { id: string; title: string; title_en?: string; title_jp?: string; description?: string; status: string; priority: string; due_date?: string; start_date?: string; source?: string; client_request_id?: string; }
interface ClientRequest {
  id: string; request_type: string; title: string; description?: string;
  status: string; priority: string; attachments?: Attachment[];
  response_to_client?: string; created_at: string; updated_at?: string; resolved_at?: string;
}
interface Attachment { url: string; name: string; type: string; size: number; }
interface Comment { id: string; sender_type: "client" | "team"; sender_name: string; message: string; attachments?: Attachment[]; created_at: string; }
interface TokenInfo { id: string; client_name?: string; client_email?: string; }
interface Permissions { view_progress: boolean; submit_requests: boolean; view_tasks: boolean; view_milestones: boolean; }

/* ---------- helpers ---------- */
const pickTaskTitle = (tk: Task, lang: string) => {
  if (lang === "en" && tk.title_en) return tk.title_en;
  if (lang === "jp" && tk.title_jp) return tk.title_jp;
  return tk.title;
};

/* ---------- i18n ---------- */
type PortalLang = "th" | "en" | "jp";
const PORTAL_LANG_KEY = "portal_lang";

const portalI18n: Record<PortalLang, Record<string, string>> = {
  th: {
    loading: "กำลังโหลดข้อมูลโปรเจค...",
    accessDenied: "ไม่สามารถเข้าถึงได้",
    hello: "สวัสดีคุณ",
    projectPlan: "แผนงานโครงการ (Gantt)",
    overview: "ภาพรวม",
    tasks: "งาน",
    requests: "คำร้อง",
    totalTasks: "งานทั้งหมด",
    inProgress: "กำลังทำ",
    completed: "เสร็จแล้ว",
    milestone: "Milestone",
    start: "เริ่ม",
    end: "สิ้นสุด",
    progress: "ความคืบหน้า",
    taskStatus: "สถานะงาน",
    milestoneTimeline: "เหตุการณ์สำคัญ",
    recentRequests: "คำร้องล่าสุด",
    submitRequest: "ส่งคำร้อง",
    noRequests: "ยังไม่มีคำร้อง",
    noRequestsDesc: "คุณสามารถส่งคำร้อง หรือแจ้งปัญหาได้ผ่านปุ่มด้านบน",
    attachments: "ไฟล์แนบ",
    teamReply: "ตอบกลับจากทีมงาน:",
    resolvedAt: "แก้ไขเสร็จเมื่อ:",
    communication: "การสื่อสาร",
    noMessages: "ยังไม่มีข้อความ — พิมพ์เพื่อเริ่มสนทนากับทีมงาน",
    typeMessage: "พิมพ์ข้อความ...",
    powered: "Powered by TOMAS TECH Project Management System",
    clientName: "ชื่อผู้ติดต่อ *",
    email: "อีเมล",
    phone: "โทรศัพท์",
    type: "ประเภท",
    priority: "ความสำคัญ",
    title: "หัวข้อ *",
    titlePlaceholder: "สรุปปัญหาหรือสิ่งที่ต้องการ",
    description: "รายละเอียด",
    descPlaceholder: "อธิบายเพิ่มเติม...",
    selectFile: "เลือกไฟล์",
    uploading: "กำลังอัปโหลด...",
    cancel: "ยกเลิก",
    send: "ส่งคำร้อง",
    attachLabel: "แนบไฟล์ (รูปภาพ / วีดีโอ / เอกสาร)",
    fileTooLarge: "ไฟล์ขนาดใหญ่เกินไป (สูงสุด 50MB)",
    uploadFailed: "อัปโหลดไม่สำเร็จ",
    receivedBy: "รับเรื่องจาก",
    receivedByPlaceholder: "ชื่อผู้รับเรื่อง",
    clientDepartment: "แผนกของลูกค้า",
    clientDepartmentPlaceholder: "เช่น ฝ่ายผลิต, IT, คลังสินค้า",
    submitFailed: "ไม่สามารถส่งข้อมูลได้",
    connectionError: "ไม่สามารถเชื่อมต่อได้",
    invalidLink: "ลิงก์ไม่ถูกต้องหรือหมดอายุ",
    uploadError: "เกิดข้อผิดพลาดในการอัปโหลด",
    genericError: "เกิดข้อผิดพลาด",
    due: "กำหนด",
    done: "เสร็จ",
    todayLine: "วันนี้",
    backlog: "รอดำเนินการ", todo: "รอเริ่ม", in_progress_status: "กำลังดำเนินการ",
    review: "รอตรวจสอบ", done_status: "เสร็จแล้ว", cancelled: "ยกเลิก",
    pending: "รอพิจารณา", accepted: "รับแล้ว", resolved: "แก้ไขแล้ว",
    request: "คำร้องขอ", issue: "รายงานปัญหา", feedback: "ข้อเสนอแนะ", change_request: "ขอเปลี่ยนแปลง",
    low: "ต่ำ", medium: "ปานกลาง", high: "สูง", critical: "วิกฤต",
    planning: "วางแผน", active: "กำลังดำเนินการ", on_hold: "ระงับชั่วคราว",
    proj_completed: "เสร็จสมบูรณ์", proj_cancelled: "ยกเลิก",
    fromClient: "จากลูกค้า",
    chatAttach: "แนบไฟล์",
    chatUploading: "กำลังอัปโหลด...",
    chatUploadFailed: "อัปโหลดไม่สำเร็จ",
    downloadFile: "ดาวน์โหลด",
    viewDay: "วัน", viewWeek: "สัปดาห์", viewMonth: "เดือน",
    clientPortal: "พอร์ทัลลูกค้า",
    submittedBy: "ส่งโดย:",
  },
  en: {
    loading: "Loading project data...",
    accessDenied: "Access Denied",
    hello: "Hello",
    projectPlan: "Project Plan (Gantt)",
    overview: "Overview",
    tasks: "Tasks",
    requests: "Requests",
    totalTasks: "Total Tasks",
    inProgress: "In Progress",
    completed: "Completed",
    milestone: "Milestone",
    start: "Start",
    end: "End",
    progress: "Progress",
    taskStatus: "Task Status",
    milestoneTimeline: "Milestones",
    recentRequests: "Recent Requests",
    submitRequest: "Submit Request",
    noRequests: "No requests yet",
    noRequestsDesc: "You can submit a request or report an issue using the button above",
    attachments: "Attachments",
    teamReply: "Reply from team:",
    resolvedAt: "Resolved at:",
    communication: "Communication",
    noMessages: "No messages yet — type to start a conversation with the team",
    typeMessage: "Type a message...",
    powered: "Powered by TOMAS TECH Project Management System",
    clientName: "Contact Name *",
    email: "Email",
    phone: "Phone",
    type: "Type",
    priority: "Priority",
    title: "Title *",
    titlePlaceholder: "Summarize the issue or request",
    description: "Description",
    descPlaceholder: "Provide more details...",
    selectFile: "Select File",
    uploading: "Uploading...",
    cancel: "Cancel",
    send: "Submit Request",
    attachLabel: "Attach Files (Images / Videos / Documents)",
    fileTooLarge: "File too large (max 50MB)",
    uploadFailed: "Upload failed",
    receivedBy: "Received By",
    receivedByPlaceholder: "Name of person who received",
    clientDepartment: "Customer Department",
    clientDepartmentPlaceholder: "e.g. Production, IT, Warehouse",
    submitFailed: "Unable to submit",
    connectionError: "Unable to connect",
    invalidLink: "Invalid or expired link",
    uploadError: "Upload error",
    genericError: "An error occurred",
    due: "Due",
    done: "Done",
    todayLine: "Today",
    backlog: "Backlog", todo: "To Do", in_progress_status: "In Progress",
    review: "In Review", done_status: "Done", cancelled: "Cancelled",
    pending: "Pending", accepted: "Accepted", resolved: "Resolved",
    request: "Request", issue: "Issue Report", feedback: "Feedback", change_request: "Change Request",
    low: "Low", medium: "Medium", high: "High", critical: "Critical",
    planning: "Planning", active: "Active", on_hold: "On Hold",
    proj_completed: "Completed", proj_cancelled: "Cancelled",
    fromClient: "From Client",
    chatAttach: "Attach File",
    chatUploading: "Uploading...",
    chatUploadFailed: "Upload failed",
    downloadFile: "Download",
    viewDay: "Day", viewWeek: "Week", viewMonth: "Month",
    clientPortal: "Client Portal",
    submittedBy: "Submitted by:",
  },
  jp: {
    loading: "プロジェクトデータを読み込み中...",
    accessDenied: "アクセスできません",
    hello: "こんにちは",
    projectPlan: "プロジェクト計画 (ガント)",
    overview: "概要",
    tasks: "タスク",
    requests: "リクエスト",
    totalTasks: "全タスク",
    inProgress: "進行中",
    completed: "完了",
    milestone: "マイルストーン",
    start: "開始",
    end: "終了",
    progress: "進捗",
    taskStatus: "タスク状況",
    milestoneTimeline: "マイルストーン",
    recentRequests: "最近のリクエスト",
    submitRequest: "リクエスト送信",
    noRequests: "リクエストはまだありません",
    noRequestsDesc: "上のボタンから問題報告やリクエストを送信できます",
    attachments: "添付ファイル",
    teamReply: "チームからの返信:",
    resolvedAt: "解決日:",
    communication: "コミュニケーション",
    noMessages: "メッセージはまだありません — チームとの会話を始めましょう",
    typeMessage: "メッセージを入力...",
    powered: "Powered by TOMAS TECH Project Management System",
    clientName: "連絡先名 *",
    email: "メール",
    phone: "電話",
    type: "種類",
    priority: "優先度",
    title: "件名 *",
    titlePlaceholder: "問題やリクエストの概要",
    description: "詳細",
    descPlaceholder: "詳しく説明してください...",
    selectFile: "ファイル選択",
    uploading: "アップロード中...",
    cancel: "キャンセル",
    send: "リクエスト送信",
    attachLabel: "ファイル添付（画像・動画・ドキュメント）",
    fileTooLarge: "ファイルが大きすぎます（最大50MB）",
    uploadFailed: "アップロードに失敗しました",
    receivedBy: "受付担当者",
    receivedByPlaceholder: "受付担当者名",
    clientDepartment: "お客様の部署",
    clientDepartmentPlaceholder: "例：製造部、IT、倉庫",
    submitFailed: "送信できませんでした",
    connectionError: "接続できません",
    invalidLink: "リンクが無効または期限切れです",
    uploadError: "アップロードエラー",
    genericError: "エラーが発生しました",
    due: "期限",
    done: "完了",
    todayLine: "今日",
    backlog: "バックログ", todo: "未着手", in_progress_status: "進行中",
    review: "レビュー中", done_status: "完了", cancelled: "キャンセル",
    pending: "審査中", accepted: "承認済", resolved: "解決済",
    request: "リクエスト", issue: "問題報告", feedback: "フィードバック", change_request: "変更リクエスト",
    low: "低", medium: "中", high: "高", critical: "緊急",
    planning: "計画中", active: "進行中", on_hold: "保留中",
    proj_completed: "完了", proj_cancelled: "キャンセル",
    fromClient: "お客様より",
    chatAttach: "ファイル添付",
    chatUploading: "アップロード中...",
    chatUploadFailed: "アップロード失敗",
    downloadFile: "ダウンロード",
    viewDay: "日", viewWeek: "週", viewMonth: "月",
    clientPortal: "クライアントポータル",
    submittedBy: "送信者:",
  },
};

const LANG_LABELS: Record<PortalLang, string> = { th: "TH", en: "EN", jp: "JP" };

/* ---------- constants ---------- */
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  backlog: { label: "รอดำเนินการ", color: "#94A3B8", icon: Clock },
  todo: { label: "รอเริ่ม", color: "#6B7280", icon: Clock },
  in_progress: { label: "กำลังดำเนินการ", color: "#3B82F6", icon: Loader2 },
  review: { label: "รอตรวจสอบ", color: "#F59E0B", icon: Eye },
  done: { label: "เสร็จแล้ว", color: "#22C55E", icon: CheckCircle2 },
  cancelled: { label: "ยกเลิก", color: "#EF4444", icon: XCircle },
};

const REQUEST_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "รอพิจารณา", color: "#F59E0B", bg: "#FFFBEB" },
  accepted: { label: "รับแล้ว", color: "#3B82F6", bg: "#EFF6FF" },
  in_progress: { label: "กำลังดำเนินการ", color: "#8B5CF6", bg: "#F5F3FF" },
  resolved: { label: "แก้ไขแล้ว", color: "#22C55E", bg: "#F0FDF4" },
  cancelled: { label: "ยกเลิก", color: "#EF4444", bg: "#FEF2F2" },
};

const REQUEST_TYPES: Record<string, string> = {
  request: "คำร้องขอ",
  issue: "รายงานปัญหา",
  feedback: "ข้อเสนอแนะ",
  change_request: "ขอเปลี่ยนแปลง",
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "ต่ำ", color: "#94A3B8" },
  medium: { label: "ปานกลาง", color: "#F59E0B" },
  high: { label: "สูง", color: "#F97316" },
  critical: { label: "วิกฤต", color: "#EF4444" },
};

/* Helper: get localized label */
function getStatusLabel(status: string, t: Record<string, string>): string {
  const map: Record<string, string> = {
    backlog: t.backlog, todo: t.todo, in_progress: t.in_progress_status,
    review: t.review, done: t.done_status, cancelled: t.cancelled,
  };
  return map[status] || status;
}
function getRequestStatusLabel(status: string, t: Record<string, string>): string {
  const map: Record<string, string> = {
    pending: t.pending, accepted: t.accepted, in_progress: t.in_progress_status,
    resolved: t.resolved, cancelled: t.cancelled,
  };
  return map[status] || status;
}
function getRequestTypeLabel(type: string, t: Record<string, string>): string {
  const map: Record<string, string> = {
    request: t.request, issue: t.issue, feedback: t.feedback, change_request: t.change_request,
  };
  return map[type] || type;
}
function getPriorityLabel(priority: string, t: Record<string, string>): string {
  const map: Record<string, string> = { low: t.low, medium: t.medium, high: t.high, critical: t.critical };
  return map[priority] || priority;
}
function getProjectStatusLabel(status: string, t: Record<string, string>): string {
  const map: Record<string, string> = {
    planning: t.planning, active: t.active, on_hold: t.on_hold,
    completed: t.proj_completed, cancelled: t.proj_cancelled,
  };
  return map[status] || status;
}
function getLocale(lang: PortalLang): string {
  return lang === "th" ? "th-TH" : lang === "jp" ? "ja-JP" : "en-US";
}

/* ---------- component ---------- */
export default function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [permissions, setPermissions] = useState<Permissions>({
    view_progress: true, submit_requests: true, view_tasks: true, view_milestones: true
  });
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "requests">("overview");
  const [showForm, setShowForm] = useState(false);
  const [lang, setLang] = useState<PortalLang>("th");

  // Load saved language preference
  useEffect(() => {
    try {
      const saved = globalThis.localStorage?.getItem(PORTAL_LANG_KEY);
      if (saved && (saved === "th" || saved === "en" || saved === "jp")) setLang(saved);
    } catch { /* ignore */ }
  }, []);
  const changeLang = (l: PortalLang) => {
    setLang(l);
    try { globalThis.localStorage?.setItem(PORTAL_LANG_KEY, l); } catch { /* ignore */ }
  };
  const t = portalI18n[lang];
  const loc = getLocale(lang);

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch(`/api/client-portal?token=${token}`);
      if (!r.ok) {
        const d = await r.json();
        setError(d.error || "Invalid or expired link");
        return;
      }
      const d = await r.json();
      setProject(d.project);
      setMilestones(d.milestones || []);
      setTasks(d.tasks || []);
      setClientRequests(d.clientRequests || []);
      setPermissions(d.permissions);
      setTokenInfo(d.tokenInfo);
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-3" size={32} color="#003087" />
        <p className="text-gray-600">{t.loading}</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
        <Shield size={48} className="mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t.accessDenied}</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );

  if (!project) return null;

  const projectStatusColors: Record<string, string> = {
    planning: "#6B7280", active: "#3B82F6", on_hold: "#F59E0B", completed: "#22C55E", cancelled: "#EF4444",
  };
  const ps = { label: getProjectStatusLabel(project.status, t), color: projectStatusColors[project.status] || "#6B7280" };

  // Task stats
  const tasksDone = tasks.filter(t => t.status === "done").length;
  const tasksInProgress = tasks.filter(t => t.status === "in_progress").length;
  const milestonesDone = milestones.filter(m => m.status === "completed").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: "#003087" }}>
                TT
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">TOMAS TECH — {t.clientPortal}</p>
                <h1 className="text-lg font-bold text-gray-900">{lang === "en" && project.name_en ? project.name_en : project.name_th}</h1>
              </div>
            </div>
            {/* Language Selector */}
            <div className="flex gap-1">
              {(["th", "en", "jp"] as PortalLang[]).map(l => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${lang === l ? "text-white shadow" : "text-gray-500 hover:bg-gray-100"}`}
                  style={lang === l ? { backgroundColor: "#003087" } : {}}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
          {tokenInfo?.client_name && (
            <p className="text-sm text-gray-500 ml-[52px]">{t.hello} {tokenInfo.client_name}</p>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Card */}
        {permissions.view_progress && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-gray-500">{project.project_code}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: ps.color }}>{ps.label}</span>
                </div>
                {project.description && <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>}
              </div>
              <div className="text-right text-sm text-gray-500">
                {project.start_date && <p>{t.start}: {new Date(project.start_date).toLocaleDateString(loc, { day: "numeric", month: "short", year: "2-digit" })}</p>}
                {project.end_date && <p>{t.end}: {new Date(project.end_date).toLocaleDateString(loc, { day: "numeric", month: "short", year: "2-digit" })}</p>}
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 font-medium">{t.progress}</span>
                <span className="font-bold" style={{ color: "#003087" }}>{project.progress ?? 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${project.progress ?? 0}%`, backgroundColor: "#003087" }} />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <StatCard icon={Target} label={t.totalTasks} value={tasks.length} color="#003087" />
              <StatCard icon={Loader2} label={t.inProgress} value={tasksInProgress} color="#3B82F6" />
              <StatCard icon={CheckCircle2} label={t.completed} value={tasksDone} color="#22C55E" />
              <StatCard icon={Flag} label={t.milestone} value={`${milestonesDone}/${milestones.length}`} color="#F7941D" />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border p-1">
          {[
            { key: "overview" as const, label: t.overview, icon: BarChart3 },
            ...(permissions.view_tasks ? [{ key: "tasks" as const, label: `${t.tasks} (${tasks.length})`, icon: Target }] : []),
            ...(permissions.submit_requests ? [{ key: "requests" as const, label: `${t.requests} (${clientRequests.length})`, icon: MessageSquare }] : []),
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? "text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
              style={activeTab === tab.key ? { backgroundColor: "#003087" } : {}}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Task Status Summary */}
            {permissions.view_tasks && tasks.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target size={18} style={{ color: "#003087" }} />
                  {t.taskStatus}
                </h3>
                {(() => {
                  const statusGroups: Record<string, number> = {};
                  for (const tk of tasks) { statusGroups[tk.status] = (statusGroups[tk.status] || 0) + 1; }
                  const total = tasks.length;
                  const statusOrder = ["done", "in_progress", "review", "todo", "backlog", "cancelled"];
                  const statusColors: Record<string, string> = { done: "#22C55E", in_progress: "#3B82F6", review: "#F59E0B", todo: "#6B7280", backlog: "#94A3B8", cancelled: "#EF4444" };
                  return (
                    <>
                      {/* Stacked bar */}
                      <div className="flex rounded-full h-4 overflow-hidden mb-3">
                        {statusOrder.filter(s => statusGroups[s]).map(s => (
                          <div key={s} style={{ width: `${(statusGroups[s] / total) * 100}%`, backgroundColor: statusColors[s] }} title={`${getStatusLabel(s, t)}: ${statusGroups[s]}`} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {statusOrder.filter(s => statusGroups[s]).map(s => (
                          <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[s] }} />
                            {getStatusLabel(s, t)} <span className="font-semibold text-gray-900">{statusGroups[s]}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Gantt Chart */}
            {permissions.view_tasks && <GanttChart tasks={tasks} milestones={milestones} project={project} lang={lang} />}

            {/* Milestones timeline */}
            {permissions.view_milestones && milestones.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Flag size={18} style={{ color: "#F7941D" }} />
                  {t.milestoneTimeline}
                </h3>
                <div className="space-y-3">
                  {milestones.map((m, i) => {
                    const isDone = m.status === "completed";
                    return (
                      <div key={m.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isDone ? "bg-green-500 border-green-500" : "bg-white border-gray-300"}`}>
                            {isDone && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                          {i < milestones.length - 1 && <div className={`w-0.5 h-6 ${isDone ? "bg-green-300" : "bg-gray-200"}`} />}
                        </div>
                        <div className="flex-1 -mt-0.5">
                          <p className={`text-sm font-medium ${isDone ? "text-green-700 line-through" : "text-gray-900"}`}>{m.title}</p>
                          {m.due_date && (
                            <p className="text-xs text-gray-500">
                              {isDone ? t.done : t.due}: {new Date(m.due_date).toLocaleDateString(loc, { day: "numeric", month: "short" })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent client requests */}
            {permissions.submit_requests && clientRequests.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare size={18} style={{ color: "#003087" }} />
                  {t.recentRequests}
                </h3>
                <div className="space-y-2">
                  {clientRequests.slice(0, 5).map(cr => {
                    const st = REQUEST_STATUS[cr.status] || REQUEST_STATUS.pending;
                    return (
                      <div key={cr.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {cr.title} <TranslateButton text={cr.title} compact />
                          </p>
                          <p className="text-xs text-gray-500">{new Date(cr.created_at).toLocaleDateString(loc)}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: st.color, backgroundColor: st.bg }}>{getRequestStatusLabel(cr.status, t)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "tasks" && permissions.view_tasks && (
          <TasksList tasks={tasks} lang={lang} />
        )}

        {activeTab === "requests" && permissions.submit_requests && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">{t.requests}</h3>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: "#F7941D" }}
              >
                <Plus size={16} />
                {t.submitRequest}
              </button>
            </div>

            {clientRequests.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <MessageSquare size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">{t.noRequests}</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 text-sm font-medium hover:underline"
                  style={{ color: "#003087" }}
                >
                  {t.submitRequest}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {clientRequests.map(cr => (
                  <RequestCard key={cr.id} request={cr} token={token} lang={lang} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit Request Form Modal */}
        {showForm && (
          <SubmitRequestForm
            token={token}
            clientName={tokenInfo?.client_name || ""}
            clientEmail={tokenInfo?.client_email || ""}
            lang={lang}
            onClose={() => setShowForm(false)}
            onSubmitted={() => { setShowForm(false); fetchData(); }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-8">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
          {t.powered}
        </div>
      </footer>

      {/* FAB for mobile */}
      {permissions.submit_requests && !showForm && (
        <button
          onClick={() => { setActiveTab("requests"); setShowForm(true); }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white sm:hidden z-30"
          style={{ backgroundColor: "#F7941D" }}
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}

/* ---------- Sub Components ---------- */

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <Icon size={20} className="mx-auto mb-1" style={{ color }} />
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function TasksList({ tasks, lang }: { tasks: Task[]; lang: PortalLang }) {
  const tr = portalI18n[lang];
  const loc = getLocale(lang);
  const [expandedStatus, setExpandedStatus] = useState<string[]>(["in_progress", "todo", "backlog"]);
  const toggle = (s: string) => setExpandedStatus(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const groups: Record<string, Task[]> = {};
  for (const tk of tasks) {
    const s = tk.status || "backlog";
    if (!groups[s]) groups[s] = [];
    groups[s].push(tk);
  }

  const order = ["in_progress", "review", "todo", "backlog", "done", "cancelled"];
  const sorted = order.filter(s => groups[s]?.length);

  return (
    <div className="space-y-3">
      {sorted.map(status => {
        const config = STATUS_CONFIG[status] || { label: status, color: "#6B7280", icon: Clock };
        const expanded = expandedStatus.includes(status);
        return (
          <div key={status} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <button
              onClick={() => toggle(status)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                <span className="font-medium text-gray-900">{getStatusLabel(status, tr)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{groups[status].length}</span>
              </div>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expanded && (
              <div className="border-t divide-y">
                {groups[status].map(tk => {
                  const pri = PRIORITY_CONFIG[tk.priority] || PRIORITY_CONFIG.medium;
                  const isClient = tk.source === "client_portal";
                  return (
                    <div key={tk.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-1.5 mt-1 rounded-full flex-shrink-0" style={{ backgroundColor: pri.color, minHeight: "1.5rem" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{pickTaskTitle(tk, lang)}</p>
                        {tk.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tk.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {tk.due_date && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar size={10} />
                              {new Date(tk.due_date).toLocaleDateString(loc, { day: "numeric", month: "short" })}
                            </span>
                          )}
                          {isClient && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 font-medium">{tr.fromClient}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RequestCard({ request: cr, token, lang }: { request: ClientRequest; token: string; lang: PortalLang }) {
  const t = portalI18n[lang];
  const loc = getLocale(lang);
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const st = REQUEST_STATUS[cr.status] || REQUEST_STATUS.pending;

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const r = await fetch(`/api/client-portal/comments?request_id=${cr.id}&token=${token}`);
      if (r.ok) {
        const d = await r.json();
        setComments(d.comments || []);
      }
    } finally {
      setLoadingComments(false);
    }
  }, [cr.id, token]);

  useEffect(() => {
    if (expanded) fetchComments();
  }, [expanded, fetchComments]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) { alert(t.fileTooLarge); continue; }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("token", token);
      try {
        const r = await fetch("/api/client-portal/upload", { method: "POST", body: fd });
        if (r.ok) {
          const d = await r.json();
          setPendingFiles(prev => [...prev, d.attachment]);
        } else { alert(t.chatUploadFailed); }
      } catch { alert(t.chatUploadFailed); }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if ((!newMsg.trim() && pendingFiles.length === 0) || sending) return;
    setSending(true);
    try {
      const r = await fetch("/api/client-portal/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: cr.id,
          message: newMsg.trim() || (pendingFiles.length > 0 ? `📎 ${pendingFiles.map(f => f.name).join(", ")}` : ""),
          token,
          attachments: pendingFiles.length > 0 ? pendingFiles : undefined,
        }),
      });
      if (r.ok) {
        setNewMsg("");
        setPendingFiles([]);
        fetchComments();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left hover:bg-gray-50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: st.color, backgroundColor: st.bg }}>{getRequestStatusLabel(cr.status, t)}</span>
              <span className="text-xs text-gray-400">{getRequestTypeLabel(cr.request_type, t)}</span>
              {comments.length > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-gray-400">
                  <MessageSquare size={10} /> {comments.length}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-900">
              {cr.title} <TranslateButton text={cr.title} compact />
            </p>
            <p className="text-xs text-gray-500 mt-1">{new Date(cr.created_at).toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t pt-3 space-y-3">
          {cr.description && (
            <div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{cr.description}</p>
              <TranslateButton text={cr.description} compact />
            </div>
          )}

          {cr.attachments && cr.attachments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">{t.attachments} ({cr.attachments.length})</p>
              <div className="flex flex-wrap gap-2">
                {cr.attachments.map((a, i) => (
                  <a
                    key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {a.type?.startsWith("image") ? <ImageIcon size={14} /> : a.type?.startsWith("video") ? <Video size={14} /> : <FileText size={14} />}
                    <span className="truncate max-w-[120px]">{a.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {cr.response_to_client && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-1">{t.teamReply}</p>
              <p className="text-sm text-blue-900">{cr.response_to_client}</p>
              <TranslateButton text={cr.response_to_client} compact />
            </div>
          )}

          {cr.resolved_at && (
            <p className="text-xs text-green-600">
              {t.resolvedAt} {new Date(cr.resolved_at).toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}

          {/* Chat / Comments Section */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <MessageSquare size={14} style={{ color: "#003087" }} />
              {t.communication}
            </p>

            {loadingComments ? (
              <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">{t.noMessages}</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-2">
                {comments.map(c => (
                  <div key={c.id} className={`flex ${c.sender_type === "client" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                        c.sender_type === "client"
                          ? "rounded-br-md text-white"
                          : "rounded-bl-md bg-gray-100 text-gray-900"
                      }`}
                      style={c.sender_type === "client" ? { backgroundColor: "#003087" } : {}}
                    >
                      {c.sender_type === "team" && (
                        <p className="text-[10px] font-semibold text-blue-700 mb-0.5">{c.sender_name}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{c.message}</p>
                      <TranslateButton text={c.message} compact className={c.sender_type === "client" ? "[&_button]:text-blue-200 [&_button]:hover:text-white" : ""} />
                      {/* Attachment previews */}
                      {c.attachments && c.attachments.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {c.attachments.map((a, i) => (
                            a.type?.startsWith("image") ? (
                              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={a.url} alt={a.name} className="max-w-full max-h-48 rounded-lg border border-white/20" />
                              </a>
                            ) : a.type?.startsWith("video") ? (
                              <video key={i} src={a.url} controls className="max-w-full max-h-48 rounded-lg" />
                            ) : (
                              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${c.sender_type === "client" ? "bg-white/20 text-white hover:bg-white/30" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
                              >
                                <FileText size={12} />
                                <span className="truncate max-w-[150px]">{a.name}</span>
                              </a>
                            )
                          ))}
                        </div>
                      )}
                      <p className={`text-[10px] mt-1 ${c.sender_type === "client" ? "text-blue-200" : "text-gray-400"}`}>
                        {new Date(c.created_at).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })}
                        {" · "}
                        {new Date(c.created_at).toLocaleDateString(loc, { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Pending attachments preview */}
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-2 bg-gray-50 rounded-lg border">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    {f.type?.startsWith("image") ? (
                      <img src={f.url} alt={f.name} className="w-16 h-16 object-cover rounded-lg border" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border bg-white flex flex-col items-center justify-center p-1">
                        {f.type?.startsWith("video") ? <Video size={16} className="text-purple-500" /> : <FileText size={16} className="text-blue-500" />}
                        <span className="text-[8px] text-gray-500 truncate w-full text-center mt-1">{f.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Message input with attach button */}
            <div className="flex gap-2 mt-2 items-end">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 shrink-0 disabled:opacity-40"
                title={t.chatAttach}
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
              </button>
              <input
                type="text"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={t.typeMessage}
                className="flex-1 px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={handleSend}
                disabled={(!newMsg.trim() && pendingFiles.length === 0) || sending}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0"
                style={{ backgroundColor: "#003087" }}
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GanttChart({ tasks, milestones, project, lang }: { tasks: Task[]; milestones: Milestone[]; project: Project; lang: PortalLang }) {
  const gt = portalI18n[lang];
  const loc = getLocale(lang);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");

  const datedTasks = tasks.filter(t => t.start_date || t.due_date);
  if (datedTasks.length === 0 && milestones.length === 0) return null;

  const allDates: number[] = [];
  if (project.start_date) allDates.push(new Date(project.start_date).getTime());
  if (project.end_date) allDates.push(new Date(project.end_date).getTime());
  for (const t of datedTasks) {
    if (t.start_date) allDates.push(new Date(t.start_date).getTime());
    if (t.due_date) allDates.push(new Date(t.due_date).getTime());
  }
  for (const m of milestones) {
    if (m.due_date) allDates.push(new Date(m.due_date).getTime());
  }
  if (allDates.length < 2) return null;

  let rawMin = Math.min(...allDates);
  let rawMax = Math.max(...allDates);
  const DAY_MS = 86400000;
  const minRangeDays = viewMode === "day" ? 14 : viewMode === "week" ? 42 : 90;
  if (rawMax - rawMin < minRangeDays * DAY_MS) {
    const mid = (rawMin + rawMax) / 2;
    rawMin = mid - (minRangeDays * DAY_MS) / 2;
    rawMax = mid + (minRangeDays * DAY_MS) / 2;
  }
  const pad = (rawMax - rawMin) * 0.05;
  const minDate = rawMin - pad;
  const maxDate = rawMax + pad;
  const rangeMs = maxDate - minDate || 1;
  const today = Date.now();
  const todayPct = Math.max(0, Math.min(100, ((today - minDate) / rangeMs) * 100));

  type GL = { left: number; label: string; isMajor?: boolean };
  const headerLabels: { label: string; left: number }[] = [];
  const gridLines: GL[] = [];

  if (viewMode === "day") {
    const sm = new Date(minDate); sm.setDate(1); sm.setHours(0,0,0,0);
    const em = new Date(maxDate); em.setMonth(em.getMonth()+1);
    const mc = new Date(sm);
    while (mc <= em) {
      const pct = ((mc.getTime()-minDate)/rangeMs)*100;
      if (pct >= -5 && pct <= 105) headerLabels.push({ label: mc.toLocaleDateString(loc, { month: "short", year: "2-digit" }), left: Math.max(0, pct) });
      mc.setMonth(mc.getMonth()+1);
    }
    const dc = new Date(minDate); dc.setHours(0,0,0,0);
    while (dc.getTime() <= maxDate) {
      const pct = ((dc.getTime()-minDate)/rangeMs)*100;
      if (pct >= 0 && pct <= 100) gridLines.push({ left: pct, label: String(dc.getDate()), isMajor: dc.getDay() === 1 });
      dc.setDate(dc.getDate()+1);
    }
  } else if (viewMode === "week") {
    const sm = new Date(minDate); sm.setDate(1); sm.setHours(0,0,0,0);
    const em = new Date(maxDate); em.setMonth(em.getMonth()+1);
    const mc = new Date(sm);
    while (mc <= em) {
      const pct = ((mc.getTime()-minDate)/rangeMs)*100;
      if (pct >= -5 && pct <= 105) headerLabels.push({ label: mc.toLocaleDateString(loc, { month: "short", year: "2-digit" }), left: Math.max(0, pct) });
      mc.setMonth(mc.getMonth()+1);
    }
    const wc = new Date(minDate); wc.setHours(0,0,0,0);
    while (wc.getDay() !== 1) wc.setDate(wc.getDate()+1);
    while (wc.getTime() <= maxDate) {
      const pct = ((wc.getTime()-minDate)/rangeMs)*100;
      if (pct >= 0 && pct <= 100) gridLines.push({ left: pct, label: String(wc.getDate()) });
      wc.setDate(wc.getDate()+7);
    }
  } else {
    const sy = new Date(minDate); sy.setMonth(0,1); sy.setHours(0,0,0,0);
    const ey = new Date(maxDate);
    const yc = new Date(sy);
    while (yc.getFullYear() <= ey.getFullYear()) {
      const pct = ((yc.getTime()-minDate)/rangeMs)*100;
      if (pct >= -5 && pct <= 105) headerLabels.push({ label: String(yc.getFullYear()), left: Math.max(0, pct) });
      yc.setFullYear(yc.getFullYear()+1);
    }
    const mc2 = new Date(minDate); mc2.setDate(1); mc2.setHours(0,0,0,0);
    while (mc2.getTime() <= maxDate) {
      const pct = ((mc2.getTime()-minDate)/rangeMs)*100;
      if (pct >= 0 && pct <= 100) gridLines.push({ left: pct, label: mc2.toLocaleDateString(loc, { month: "short" }) });
      mc2.setMonth(mc2.getMonth()+1);
    }
  }

  const statusColors: Record<string, string> = { done: "#22C55E", in_progress: "#3B82F6", review: "#F59E0B", todo: "#94A3B8", backlog: "#D1D5DB", cancelled: "#FCA5A5" };
  const viewBtns: { key: "day"|"week"|"month"; label: string }[] = [
    { key: "day", label: gt.viewDay || "Day" },
    { key: "week", label: gt.viewWeek || "Week" },
    { key: "month", label: gt.viewMonth || "Month" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 size={18} style={{ color: "#003087" }} />
          {gt.projectPlan}
        </h3>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {viewBtns.map(b => (
            <button key={b.key} onClick={() => setViewMode(b.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === b.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >{b.label}</button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto px-4 pb-4 pt-2">
        <div style={{ minWidth: 600 }}>
          <div className="flex">
            <div className="w-[120px] sm:w-[160px] flex-shrink-0" />
            <div className="flex-1 relative">
              <div className="relative h-6 border-b border-gray-200">
                {headerLabels.map((m, i) => (
                  <span key={i} className="absolute text-[11px] text-gray-600 font-semibold whitespace-nowrap" style={{ left: `${m.left}%`, top: 2 }}>{m.label}</span>
                ))}
              </div>
              <div className="relative h-5 border-b border-gray-100">
                {gridLines.map((w, i) => (
                  <span key={i} className={`absolute text-[9px] ${w.isMajor ? "text-gray-600 font-semibold" : "text-gray-400"}`} style={{ left: `${w.left}%`, top: 2 }}>{w.label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            {gridLines.map((w, i) => (
              <div key={i} className={`absolute top-0 bottom-0 ${w.isMajor ? "border-l border-gray-200" : "border-l border-gray-100"}`} style={{ left: `calc(0px + ${w.left}%)`, height: "100%", marginLeft: "calc(120px + 0.5rem)" }} />
            ))}

            <div className="space-y-0.5 pt-1">
              {datedTasks.map((t, idx) => {
                const s = t.start_date ? new Date(t.start_date).getTime() : (t.due_date ? new Date(t.due_date).getTime() - 7 * DAY_MS : minDate);
                const e = t.due_date ? new Date(t.due_date).getTime() : s + 14 * DAY_MS;
                const left = Math.max(0, ((s - minDate) / rangeMs) * 100);
                const width = Math.max(3, Math.min(100 - left, ((e - s) / rangeMs) * 100));
                const color = statusColors[t.status] || "#94A3B8";
                const dateLabel = `${t.start_date ? new Date(t.start_date).toLocaleDateString(loc, { day: "numeric", month: "short" }) : "?"} → ${t.due_date ? new Date(t.due_date).toLocaleDateString(loc, { day: "numeric", month: "short" }) : "?"}`;
                return (
                  <div key={t.id} className={`flex items-center gap-2 h-8 ${idx % 2 === 0 ? "" : "bg-gray-50/50"} rounded`}>
                    <div className="w-[120px] sm:w-[160px] flex-shrink-0 truncate text-xs text-gray-700 pr-2 text-right font-medium">{pickTaskTitle(t, lang)}</div>
                    <div className="flex-1 relative h-6 rounded">
                      <div className="absolute inset-0 bg-gray-100/60 rounded" />
                      <div className="absolute h-full rounded transition-all shadow-sm" style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color, opacity: t.status === "done" ? 0.75 : 0.9 }} title={`${pickTaskTitle(t, lang)}: ${dateLabel}`} />
                      {width > 12 && (
                        <span className="absolute text-[9px] text-white font-medium pointer-events-none" style={{ left: `${left + 0.5}%`, top: 5, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{dateLabel}</span>
                      )}
                      {todayPct > 0 && todayPct < 100 && (
                        <div className="absolute top-0 h-full w-0.5 bg-red-400 z-10" style={{ left: `${todayPct}%` }} />
                      )}
                    </div>
                  </div>
                );
              })}

              {milestones.filter(m => m.due_date).map(m => {
                const mDate = new Date(m.due_date!).getTime();
                const left = ((mDate - minDate) / rangeMs) * 100;
                const done = m.status === "completed";
                return (
                  <div key={m.id} className="flex items-center gap-2 h-8">
                    <div className="w-[120px] sm:w-[160px] flex-shrink-0 truncate text-xs text-gray-600 pr-2 text-right flex items-center justify-end gap-1 italic">
                      <Flag size={10} style={{ color: "#F7941D" }} />
                      {m.title}
                    </div>
                    <div className="flex-1 relative h-6">
                      <div className="absolute w-3.5 h-3.5 rotate-45 top-1.5 shadow-sm" style={{ left: `${left}%`, transform: `translateX(-50%) rotate(45deg)`, backgroundColor: done ? "#22C55E" : "#F7941D" }} title={`${m.title}: ${new Date(m.due_date!).toLocaleDateString(loc)}`} />
                      {todayPct > 0 && todayPct < 100 && (
                        <div className="absolute top-0 h-full w-0.5 bg-red-400 z-10" style={{ left: `${todayPct}%` }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 border-t bg-gray-50/50 rounded-b-xl">
        {[
          { label: gt.in_progress_status, color: "#3B82F6" },
          { label: gt.review, color: "#F59E0B" },
          { label: gt.done_status, color: "#22C55E" },
          { label: gt.todo, color: "#94A3B8" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <div className="w-3 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <div className="w-2.5 h-2.5 rotate-45" style={{ backgroundColor: "#F7941D" }} />
          {gt.milestone}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <div className="w-4 h-0.5 bg-red-400 rounded" />
          {gt.todayLine}
        </div>
      </div>
    </div>
  );
}

function SubmitRequestForm({
  token, clientName, clientEmail, lang, onClose, onSubmitted,
}: {
  token: string; clientName: string; clientEmail: string; lang: PortalLang;
  onClose: () => void; onSubmitted: () => void;
}) {
  const t = portalI18n[lang];
  const [form, setForm] = useState({
    client_name: clientName,
    client_email: clientEmail,
    client_phone: "",
    received_by: "",
    client_department: "",
    request_type: "request",
    title: "",
    description: "",
    priority: "medium",
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setUploadError("");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 50 * 1024 * 1024) { setUploadError(t.fileTooLarge); continue; }
      const fd = new FormData();
      fd.append("token", token);
      fd.append("file", file);
      try {
        const r = await fetch("/api/client-portal/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (r.ok && d.attachment) {
          setAttachments(prev => [...prev, d.attachment]);
        } else {
          setUploadError(d.error || t.uploadFailed);
        }
      } catch {
        setUploadError(t.uploadError);
      }
    }
    setUploading(false);
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    if (!form.client_name.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/client-portal/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, token, attachments }),
      });
      if (r.ok) {
        onSubmitted();
      } else {
        const d = await r.json();
        alert(d.error || t.genericError);
      }
    } catch {
      alert(t.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full sm:w-[500px] sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">{t.submitRequest}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.clientName}</label>
            <input
              type="text" value={form.client_name}
              onChange={e => setForm({ ...form, client_name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
              placeholder={t.clientName.replace(" *", "")}
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
              <input
                type="email" value={form.client_email}
                onChange={e => setForm({ ...form, client_email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
              <input
                type="tel" value={form.client_phone}
                onChange={e => setForm({ ...form, client_phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
            </div>
          </div>

          {/* Received By + Client Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.receivedBy}</label>
              <input
                type="text" value={form.received_by}
                onChange={e => setForm({ ...form, received_by: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
                placeholder={t.receivedByPlaceholder}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.clientDepartment}</label>
              <input
                type="text" value={form.client_department}
                onChange={e => setForm({ ...form, client_department: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
                placeholder={t.clientDepartmentPlaceholder}
              />
            </div>
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.type}</label>
              <select
                value={form.request_type}
                onChange={e => setForm({ ...form, request_type: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
              >
                {Object.keys(REQUEST_TYPES).map(k => <option key={k} value={k}>{getRequestTypeLabel(k, t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.priority}</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
              >
                {Object.keys(PRIORITY_CONFIG).map(k => <option key={k} value={k}>{getPriorityLabel(k, t)}</option>)}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.title}</label>
            <input
              type="text" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
              placeholder={t.titlePlaceholder}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none resize-none"
              placeholder={t.descPlaceholder}
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.attachLabel}</label>
            <input
              ref={fileRef} type="file" multiple
              accept="image/*,video/*,application/pdf,.doc,.docx"
              onChange={e => e.target.files && handleUpload(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed text-sm text-gray-600 hover:bg-gray-50 w-full justify-center"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
              {uploading ? t.uploading : t.selectFile}
            </button>
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border text-sm">
                    {a.type?.startsWith("image") ? <ImageIcon size={14} className="text-blue-500" /> : a.type?.startsWith("video") ? <Video size={14} className="text-purple-500" /> : <FileText size={14} className="text-gray-500" />}
                    <span className="truncate max-w-[100px]">{a.name}</span>
                    <button onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            {t.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.title.trim() || !form.client_name.trim()}
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: "#003087" }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {t.send}
          </button>
        </div>
      </div>
    </div>
  );
}
