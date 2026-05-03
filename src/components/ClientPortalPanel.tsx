"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Link2, Copy, Check, Trash2, Pause, Play, ExternalLink, Eye, Mail,
  MessageSquare, AlertTriangle, CheckCircle2, XCircle, Clock, UserPlus,
  ChevronDown, ChevronUp, ArrowRightCircle, X, FileText, Image as ImageIcon, Video,
  Loader2, Send, Paperclip
} from "lucide-react";
import TranslateButton from "./TranslateButton";

/* ---------- types ---------- */
interface TokenRow {
  id: string; project_id: string; token: string;
  client_name?: string | null; client_email?: string | null;
  expires_at?: string | null; active: boolean;
  last_accessed_at?: string | null; access_count?: number | null;
  created_at: string; description?: string | null;
  projects?: { id: string; project_code: string; name_th?: string; name_en?: string; name_jp?: string } | null;
}
interface ProjectLite { id: string; project_code: string; name_th?: string; name_en?: string; name_jp?: string }
interface TeamMemberLite { id: string; first_name_th: string; last_name_th: string; }
interface ClientRequest {
  id: string; project_id: string; token_id?: string;
  client_name: string; client_email?: string; client_phone?: string;
  request_type: string; title: string; description?: string;
  priority: string; status: string;
  attachments?: { url: string; name: string; type: string; size: number }[];
  assigned_to?: string; task_id?: string;
  internal_notes?: string; response_to_client?: string;
  resolved_at?: string; created_at: string; updated_at?: string;
  assigned_member?: { id: string; first_name_th: string; last_name_th: string } | null;
  linked_task?: { id: string; title: string; status: string } | null;
}

const LOCALE_MAP: Record<string, string> = { th: "th-TH", en: "en-US", jp: "ja-JP" };
const pickName = (p: { name_th?: string; name_en?: string; name_jp?: string } | null | undefined, lang: string) => {
  if (!p) return "";
  if (lang === "en" && p.name_en) return p.name_en;
  if (lang === "jp" && p.name_jp) return p.name_jp;
  return p.name_th || p.name_en || "";
};
const fmtDate = (d?: string | null, lang = "th") => (d ? new Date(d).toLocaleDateString(LOCALE_MAP[lang] || "th-TH") : "—");
const fmtDateTime = (d: string, lang = "th") => new Date(d).toLocaleDateString(LOCALE_MAP[lang] || "th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

const REQUEST_STATUS_STYLES: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  pending: { color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
  accepted: { color: "#3B82F6", bg: "#EFF6FF", icon: CheckCircle2 },
  in_progress: { color: "#8B5CF6", bg: "#F5F3FF", icon: Clock },
  resolved: { color: "#22C55E", bg: "#F0FDF4", icon: CheckCircle2 },
  cancelled: { color: "#EF4444", bg: "#FEF2F2", icon: XCircle },
};
const REQUEST_STATUS_LABELS: Record<string, Record<string, string>> = {
  pending:     { th: "รอพิจารณา",       en: "Pending",       jp: "保留中" },
  accepted:    { th: "รับแล้ว",         en: "Accepted",      jp: "承認済み" },
  in_progress: { th: "กำลังดำเนินการ",   en: "In Progress",   jp: "進行中" },
  resolved:    { th: "แก้ไขแล้ว",       en: "Resolved",      jp: "解決済み" },
  cancelled:   { th: "ยกเลิก",         en: "Cancelled",     jp: "キャンセル" },
};
const REQUEST_TYPE_LABELS: Record<string, Record<string, string>> = {
  request:        { th: "คำร้องขอ",       en: "Request",         jp: "リクエスト" },
  issue:          { th: "รายงานปัญหา",    en: "Issue Report",    jp: "問題報告" },
  feedback:       { th: "ข้อเสนอแนะ",     en: "Feedback",        jp: "フィードバック" },
  change_request: { th: "ขอเปลี่ยนแปลง",  en: "Change Request",  jp: "変更依頼" },
};
const PRIORITY_COLORS: Record<string, string> = { low: "#94A3B8", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };
const PRIORITY_LABELS: Record<string, Record<string, string>> = {
  low:      { th: "ต่ำ",      en: "Low",      jp: "低" },
  medium:   { th: "ปานกลาง",  en: "Medium",   jp: "中" },
  high:     { th: "สูง",      en: "High",     jp: "高" },
  critical: { th: "วิกฤต",    en: "Critical", jp: "重大" },
};

/* ---------- translations ---------- */
const cpT: Record<string, Record<string, string>> = {
  th: {
    // KPI labels
    totalLinks: "ลิงก์ทั้งหมด",
    activeLinks: "ใช้งานอยู่",
    clientViews: "ลูกค้าเปิดดู",
    pendingRequests: "คำร้องรอดำเนินการ",
    // Tabs
    customerLinks: "ลิงก์ลูกค้า",
    customerRequests: "คำร้องจากลูกค้า",
    // Links loading/empty
    loading: "กำลังโหลด…",
    links: "ลิงก์",
    noLinksMsg: "ยังไม่มีลิงก์ลูกค้า — สร้างเพื่อแชร์ความคืบหน้าให้ลูกค้าดู",
    createLink: "สร้างลิงก์ลูกค้า",
    // Link status
    inactive: "หยุดใช้งาน",
    copyLink: "คัดลอกลิงก์",
    viewLink: "เปิดดู",
    toggleActivate: "เปิดใช้งาน",
    toggleDeactivate: "หยุดใช้งาน",
    delete: "ลบ",
    deleteLinkConfirm: "ลบลิงก์นี้? ลูกค้าจะเปิดดูไม่ได้อีก",
    views: "เปิดดู",
    times: "ครั้ง",
    lastOpened: "เปิดล่าสุด:",
    expires: "หมดอายุ:",
    // Requests empty
    noRequestsMsg: "ยังไม่มีคำร้องจากลูกค้า",
    // Request filter
    all: "ทั้งหมด",
    pending: "รอพิจารณา",
    accepted: "รับแล้ว",
    inProgress: "กำลังทำ",
    resolved: "เสร็จ",
    cancelled: "ยกเลิก",
    // Request card
    submittedBy: "แจ้งโดย:",
    attachments: "ไฟล์แนบ",
    responsible: "ผู้รับผิดชอบ:",
    linkedTask: "เชื่อมกับงาน:",
    // Request actions
    acceptAction: "รับ",
    rejectAction: "ปฏิเสธ",
    rejectMsg: "ขออภัย ไม่สามารถดำเนินการได้ในขณะนี้",
    assignAction: "มอบหมาย",
    resolvedAction: "แก้ไขแล้ว",
    convertToTask: "สร้างเป็นงาน",
    taskCreated: "สร้างงานแล้ว",
    responsePrompt: "ข้อความตอบกลับลูกค้า:",
    respondToClient: "ตอบกลับลูกค้า:",
    // Chat
    chatWithClient: "แชทกับลูกค้า",
    noMessages: "ยังไม่มีข้อความ",
    chatPlaceholder: "พิมพ์ข้อความตอบกลับลูกค้า...",
    chatAttach: "แนบไฟล์",
    chatUploading: "กำลังอัปโหลด...",
    chatUploadFailed: "อัปโหลดไม่สำเร็จ",
    // Convert modal
    convertModalTitle: "สร้างเป็นงานในโปรเจค",
    assignee: "ผู้รับผิดชอบ",
    notSpecified: "— ยังไม่ระบุ —",
    dueDate: "กำหนดเสร็จ",
    cancel: "ยกเลิก",
    createTask: "สร้างงาน",
    // Create link modal
    project: "โครงการ",
    selectProject: "— เลือกโครงการ —",
    clientName: "ชื่อลูกค้า / ผู้รับ",
    clientPlaceholder: "คุณ...",
    email: "อีเมล (ไม่บังคับ)",
    description: "คำอธิบาย",
    descriptionPlaceholder: "เช่น สำหรับทีม QC ลูกค้า",
    expiresIn: "หมดอายุใน (วัน)",
    exp30: "30 วัน",
    exp90: "90 วัน",
    exp180: "180 วัน",
    exp365: "1 ปี",
    noExpiry: "ไม่มีวันหมดอายุ",
    creating: "กำลังสร้าง...",
    createLinkBtn: "สร้างลิงก์",
    createError: "สร้างไม่สำเร็จ",
    projectRequired: "กรุณาเลือกโครงการ",
  },
  en: {
    // KPI labels
    totalLinks: "Total Links",
    activeLinks: "Active",
    clientViews: "Client Views",
    pendingRequests: "Pending Requests",
    // Tabs
    customerLinks: "Customer Links",
    customerRequests: "Customer Requests",
    // Links loading/empty
    loading: "Loading…",
    links: "Links",
    noLinksMsg: "No customer links yet — create one to share progress with clients",
    createLink: "Create Customer Link",
    // Link status
    inactive: "Inactive",
    copyLink: "Copy link",
    viewLink: "View",
    toggleActivate: "Activate",
    toggleDeactivate: "Deactivate",
    delete: "Delete",
    deleteLinkConfirm: "Delete this link? Clients won't be able to access it anymore",
    views: "Views",
    times: "times",
    lastOpened: "Last opened:",
    expires: "Expires:",
    // Requests empty
    noRequestsMsg: "No customer requests yet",
    // Request filter
    all: "All",
    pending: "Pending",
    accepted: "Accepted",
    inProgress: "In Progress",
    resolved: "Resolved",
    cancelled: "Cancelled",
    // Request card
    submittedBy: "Submitted by:",
    attachments: "Attachments",
    responsible: "Responsible:",
    linkedTask: "Linked to task:",
    // Request actions
    acceptAction: "Accept",
    rejectAction: "Reject",
    rejectMsg: "Sorry, unable to process at this moment",
    assignAction: "Assign",
    resolvedAction: "Resolved",
    convertToTask: "Create Task",
    taskCreated: "Task Created",
    responsePrompt: "Response message:",
    respondToClient: "Response to client:",
    // Chat
    chatWithClient: "Chat with Client",
    noMessages: "No messages yet",
    chatPlaceholder: "Type your response to the client...",
    chatAttach: "Attach File",
    chatUploading: "Uploading...",
    chatUploadFailed: "Upload failed",
    // Convert modal
    convertModalTitle: "Create Task in Project",
    assignee: "Assignee",
    notSpecified: "— Not specified —",
    dueDate: "Due Date",
    cancel: "Cancel",
    createTask: "Create Task",
    // Create link modal
    project: "Project",
    selectProject: "— Select a project —",
    clientName: "Client Name / Recipient",
    clientPlaceholder: "Mr./Ms...",
    email: "Email (optional)",
    description: "Description",
    descriptionPlaceholder: "E.g., For client QC team",
    expiresIn: "Expires in (days)",
    exp30: "30 days",
    exp90: "90 days",
    exp180: "180 days",
    exp365: "1 year",
    noExpiry: "No expiration",
    creating: "Creating...",
    createLinkBtn: "Create Link",
    createError: "Failed to create",
    projectRequired: "Please select a project",
  },
  jp: {
    // KPI labels
    totalLinks: "リンク合計",
    activeLinks: "アクティブ",
    clientViews: "クライアントビュー",
    pendingRequests: "保留中のリクエスト",
    // Tabs
    customerLinks: "顧客リンク",
    customerRequests: "顧客リクエスト",
    // Links loading/empty
    loading: "読み込み中…",
    links: "リンク",
    noLinksMsg: "顧客リンクはまだありません。作成してクライアントと進捗を共有してください",
    createLink: "顧客リンクを作成",
    // Link status
    inactive: "非アクティブ",
    copyLink: "リンクをコピー",
    viewLink: "表示",
    toggleActivate: "有効化",
    toggleDeactivate: "無効化",
    delete: "削除",
    deleteLinkConfirm: "このリンクを削除しますか？クライアントはアクセスできなくなります",
    views: "表示",
    times: "回",
    lastOpened: "最後に開いた:",
    expires: "有効期限:",
    // Requests empty
    noRequestsMsg: "顧客リクエストはまだありません",
    // Request filter
    all: "すべて",
    pending: "保留中",
    accepted: "受け入れ済み",
    inProgress: "進行中",
    resolved: "完了",
    cancelled: "キャンセル",
    // Request card
    submittedBy: "送信者:",
    attachments: "添付ファイル",
    responsible: "責任者:",
    linkedTask: "関連タスク:",
    // Request actions
    acceptAction: "承認",
    rejectAction: "却下",
    rejectMsg: "申し訳ありませんが、現在は処理できません",
    assignAction: "割り当て",
    resolvedAction: "完了",
    convertToTask: "タスクを作成",
    taskCreated: "タスク作成済み",
    responsePrompt: "応答メッセージ:",
    respondToClient: "クライアントへの応答:",
    // Chat
    chatWithClient: "クライアントとのチャット",
    noMessages: "メッセージはまだありません",
    chatPlaceholder: "クライアントへのメッセージを入力...",
    chatAttach: "ファイル添付",
    chatUploading: "アップロード中...",
    chatUploadFailed: "アップロード失敗",
    // Convert modal
    convertModalTitle: "プロジェクトでタスクを作成",
    assignee: "割り当て先",
    notSpecified: "— 未指定 —",
    dueDate: "期限",
    cancel: "キャンセル",
    createTask: "タスクを作成",
    // Create link modal
    project: "プロジェクト",
    selectProject: "— プロジェクトを選択 —",
    clientName: "クライアント名 / 受信者",
    clientPlaceholder: "様...",
    email: "メール (オプション)",
    description: "説明",
    descriptionPlaceholder: "例：顧客QCチーム向け",
    expiresIn: "有効期間 (日)",
    exp30: "30日",
    exp90: "90日",
    exp180: "180日",
    exp365: "1年",
    noExpiry: "有効期限なし",
    creating: "作成中...",
    createLinkBtn: "リンクを作成",
    createError: "作成に失敗しました",
    projectRequired: "プロジェクトを選択してください",
  },
};

/* ---------- main ---------- */
export default function ClientPortalPanel({ filterProjectId = "all", refreshKey = 0, lang = "th" }: { filterProjectId?: string; refreshKey?: number; lang?: string }) {
  const t = cpT[lang] || cpT.th;
  const [tab, setTab] = useState<"links" | "requests">("links");
  const [rows, setRows] = useState<TokenRow[]>([]);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [members, setMembers] = useState<TeamMemberLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const q = filterProjectId !== "all" ? `?project_id=${filterProjectId}` : "";
      const [tokensRes, projRes, membersRes] = await Promise.all([
        fetch(`/api/client-portal/token${q}`).then(r => r.ok ? r.json() : { tokens: [] }),
        fetch("/api/projects").then(r => r.ok ? r.json() : { projects: [] }),
        fetch("/api/members").then(r => r.ok ? r.json() : { members: [] }),
      ]);
      setRows(tokensRes.tokens ?? []);
      setProjects(projRes.projects ?? []);
      setMembers(membersRes.members ?? []);

      // Fetch requests — use project IDs from tokens if showing all
      const projectIds = filterProjectId !== "all"
        ? [filterProjectId]
        : [...new Set((tokensRes.tokens ?? []).map((t: TokenRow) => t.project_id))];

      const allRequests: ClientRequest[] = [];
      for (const pid of projectIds) {
        try {
          const rr = await fetch(`/api/client-portal/manage?project_id=${pid}`);
          if (rr.ok) { const d = await rr.json(); allRequests.push(...(d.requests ?? [])); }
        } catch { /* skip */ }
      }
      setRequests(allRequests);
    } finally { setLoading(false); }
  }, [filterProjectId]);

  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const linkFor = (token: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/portal/${token}` : `/portal/${token}`;

  const copyLink = async (row: TokenRow) => {
    await navigator.clipboard.writeText(linkFor(row.token));
    setCopiedId(row.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleActive = async (row: TokenRow) => {
    await fetch("/api/client-portal/token", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, active: !row.active }),
    });
    fetchAll();
  };

  const remove = async (row: TokenRow) => {
    if (!confirm(t.deleteLinkConfirm)) return;
    await fetch(`/api/client-portal/token?id=${row.id}`, { method: "DELETE" });
    fetchAll();
  };

  const stats = {
    total: rows.length,
    active: rows.filter(r => r.active).length,
    views: rows.reduce((s, r) => s + (r.access_count ?? 0), 0),
    pendingRequests: requests.filter(r => r.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label={t.totalLinks} value={stats.total} color="#00AEEF" />
        <KPI label={t.activeLinks} value={stats.active} color="#22C55E" />
        <KPI label={t.clientViews} value={stats.views} color="#F7941D" />
        <KPI label={t.pendingRequests} value={stats.pendingRequests} color={stats.pendingRequests > 0 ? "#EF4444" : "#94A3B8"} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab("links")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "links" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        >
          <Link2 size={14} />
          {t.customerLinks} ({rows.length})
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "requests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        >
          <MessageSquare size={14} />
          {t.customerRequests} ({requests.length})
          {stats.pendingRequests > 0 && (
            <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{stats.pendingRequests}</span>
          )}
        </button>
      </div>

      {/* Links Tab */}
      {tab === "links" && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-slate-600">{loading ? t.loading : `${rows.length} ${t.links}`}</div>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: "#003087" }}>
              <Plus size={14} /> {t.createLink}
            </button>
          </div>

          {!loading && !rows.length && (
            <div className="text-center py-16 bg-white border rounded-2xl text-slate-600">
              <Link2 size={40} className="mx-auto mb-3 text-gray-300" />
              {t.noLinksMsg}
            </div>
          )}

          <div className="space-y-3">
            {rows.map(r => (
              <div key={r.id} className="bg-white border rounded-2xl p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.projects && <span className="text-xs font-mono text-gray-500">{r.projects.project_code}</span>}
                      {r.projects && <span className="text-sm text-gray-900 font-medium">{pickName(r.projects, lang)}</span>}
                      {r.client_name && <span className="text-sm text-gray-700">→ {r.client_name}</span>}
                      {!r.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">{t.inactive}</span>}
                    </div>
                    {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                    {r.client_email && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Mail size={10} />{r.client_email}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2 truncate">
                      <Link2 size={10} className="inline mr-1" />
                      <code className="text-blue-600">{linkFor(r.token)}</code>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-2">
                      <span><Eye size={10} className="inline mr-1" />{t.views} {r.access_count ?? 0} {t.times}</span>
                      <span>{t.lastOpened} {fmtDate(r.last_accessed_at, lang)}</span>
                      {r.expires_at && <span className="text-orange-600">{t.expires} {fmtDate(r.expires_at, lang)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyLink(r)} title={t.copyLink}
                      className="p-2 rounded-lg bg-gray-50 border hover:border-blue-400">
                      {copiedId === r.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-600" />}
                    </button>
                    <a href={linkFor(r.token)} target="_blank" rel="noopener noreferrer" title={t.viewLink}
                      className="p-2 rounded-lg bg-gray-50 border hover:border-blue-400">
                      <ExternalLink size={14} className="text-gray-600" />
                    </a>
                    <button onClick={() => toggleActive(r)} title={r.active ? t.toggleDeactivate : t.toggleActivate}
                      className="p-2 rounded-lg bg-gray-50 border hover:border-orange-400">
                      {r.active ? <Pause size={14} className="text-gray-600" /> : <Play size={14} className="text-green-600" />}
                    </button>
                    <button onClick={() => remove(r)} title={t.delete}
                      className="p-2 rounded-lg bg-gray-50 border hover:border-red-400">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Requests Tab */}
      {tab === "requests" && (
        <RequestsManager requests={requests} members={members} onRefresh={fetchAll} lang={lang} />
      )}

      {showCreate && (
        <CreateModal
          projects={projects}
          defaultProjectId={filterProjectId !== "all" ? filterProjectId : ""}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAll(); }}
          lang={lang}
        />
      )}
    </div>
  );
}

/* ---------- Requests Manager ---------- */
function RequestsManager({ requests, members, onRefresh, lang = "th" }: { requests: ClientRequest[]; members: TeamMemberLite[]; onRefresh: () => void; lang?: string }) {
  const t = cpT[lang] || cpT.th;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  const handleAction = async (id: string, action: string, extra?: Record<string, unknown>) => {
    setActionLoading(id);
    try {
      await fetch("/api/client-portal/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  if (!requests.length) {
    return (
      <div className="text-center py-16 bg-white border rounded-2xl text-gray-500">
        <MessageSquare size={40} className="mx-auto mb-3 text-gray-300" />
        {t.noRequestsMsg}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: t.all },
          { key: "pending", label: t.pending },
          { key: "accepted", label: t.accepted },
          { key: "in_progress", label: t.inProgress },
          { key: "resolved", label: t.resolved },
          { key: "cancelled", label: t.cancelled },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f.key ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={filter === f.key ? { backgroundColor: "#003087" } : {}}
          >
            {f.label}
            {f.key !== "all" && ` (${requests.filter(r => r.status === f.key).length})`}
          </button>
        ))}
      </div>

      {/* Request Cards */}
      <div className="space-y-3">
        {filtered.map(cr => {
          const st = REQUEST_STATUS_STYLES[cr.status] || REQUEST_STATUS_STYLES.pending;
          const stLabel = REQUEST_STATUS_LABELS[cr.status]?.[lang] || REQUEST_STATUS_LABELS[cr.status]?.th || cr.status;
          const isExpanded = expandedId === cr.id;
          const isLoading = actionLoading === cr.id;

          return (
            <div key={cr.id} className="bg-white border rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : cr.id)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: st.color, backgroundColor: st.bg }}>{stLabel}</span>
                      <span className="text-xs text-gray-400">{REQUEST_TYPE_LABELS[cr.request_type]?.[lang] || REQUEST_TYPE_LABELS[cr.request_type]?.th || cr.request_type}</span>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[cr.priority] || "#94A3B8" }} title={PRIORITY_LABELS[cr.priority]?.[lang] || cr.priority} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{cr.title} <TranslateButton text={cr.title} compact /></p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{t.submittedBy} {cr.client_name}</span>
                      <span>{fmtDateTime(cr.created_at, lang)}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t pt-3 space-y-3">
                  {cr.description && (
                    <div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{cr.description}</p>
                      <TranslateButton text={cr.description} compact />
                    </div>
                  )}

                  {/* Contact info */}
                  <div className="flex gap-4 text-xs text-gray-500">
                    {cr.client_email && <span className="flex items-center gap-1"><Mail size={10} />{cr.client_email}</span>}
                    {cr.client_phone && <span>{cr.client_phone}</span>}
                  </div>

                  {/* Attachments */}
                  {cr.attachments && cr.attachments.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">{t.attachments} ({cr.attachments.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {cr.attachments.map((a, i) => (
                          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border text-sm text-gray-700 hover:bg-gray-100">
                            {a.type?.startsWith("image") ? <ImageIcon size={14} /> : a.type?.startsWith("video") ? <Video size={14} /> : <FileText size={14} />}
                            <span className="truncate max-w-[120px]">{a.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assignment info */}
                  {cr.assigned_member && (
                    <div className="text-xs text-gray-600">
                      {t.responsible} <span className="font-medium">{cr.assigned_member.first_name_th} {cr.assigned_member.last_name_th}</span>
                    </div>
                  )}
                  {cr.linked_task && (
                    <div className="text-xs text-blue-600">
                      <ArrowRightCircle size={10} className="inline mr-1" />
                      {t.linkedTask} {cr.linked_task.title} ({cr.linked_task.status})
                    </div>
                  )}

                  {/* Action buttons */}
                  {cr.status === "pending" && (
                    <div className="flex gap-2 flex-wrap pt-2 border-t">
                      <button
                        onClick={() => handleAction(cr.id, "accept")}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        <CheckCircle2 size={12} /> {t.acceptAction}
                      </button>
                      <button
                        onClick={() => handleAction(cr.id, "cancel", { response_to_client: t.rejectMsg })}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle size={12} /> {t.rejectAction}
                      </button>
                      <ConvertToTaskButton
                        requestId={cr.id}
                        members={members}
                        isLoading={isLoading}
                        onAction={handleAction}
                        lang={lang}
                      />
                    </div>
                  )}

                  {(cr.status === "accepted" || cr.status === "in_progress") && (
                    <div className="flex gap-2 flex-wrap pt-2 border-t">
                      <AssignDropdown
                        requestId={cr.id}
                        members={members}
                        currentAssignee={cr.assigned_to}
                        isLoading={isLoading}
                        onAction={handleAction}
                        lang={lang}
                      />
                      <ConvertToTaskButton
                        requestId={cr.id}
                        members={members}
                        isLoading={isLoading}
                        onAction={handleAction}
                        disabled={!!cr.task_id}
                        lang={lang}
                      />
                      <button
                        onClick={() => {
                          const resp = prompt(t.responsePrompt);
                          if (resp) handleAction(cr.id, "resolve", { response_to_client: resp });
                        }}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle2 size={12} /> {t.resolvedAction}
                      </button>
                    </div>
                  )}

                  {cr.response_to_client && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs font-medium text-blue-700 mb-1">{t.respondToClient}</p>
                      <p className="text-sm text-blue-900">{cr.response_to_client}</p>
                      <TranslateButton text={cr.response_to_client} compact />
                    </div>
                  )}

                  {/* Chat Thread */}
                  <ChatThread requestId={cr.id} lang={lang} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Chat Thread (Team side) ---------- */
interface ChatAttachment { url: string; name: string; type: string; size: number; }
interface Comment { id: string; sender_type: "client" | "team"; sender_name: string; message: string; attachments?: ChatAttachment[]; created_at: string; }

function ChatThread({ requestId, lang = "th" }: { requestId: string; lang?: string }) {
  const t = cpT[lang] || cpT.th;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/client-portal/comments?request_id=${requestId}`);
      if (r.ok) {
        const d = await r.json();
        setComments(d.comments || []);
      }
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) { alert("File too large (max 50MB)"); continue; }
      const fd = new FormData();
      fd.append("file", file);
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
          request_id: requestId,
          message: newMsg.trim() || (pendingFiles.length > 0 ? `📎 ${pendingFiles.map(f => f.name).join(", ")}` : ""),
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
    <div className="border-t pt-3">
      <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
        <MessageSquare size={14} style={{ color: "#003087" }} />
        {t.chatWithClient}
      </p>

      {loading && comments.length === 0 ? (
        <div className="flex justify-center py-3"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">{t.noMessages}</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mb-2">
          {comments.map(c => (
            <div key={c.id} className={`flex ${c.sender_type === "team" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  c.sender_type === "team"
                    ? "rounded-br-md text-white"
                    : "rounded-bl-md bg-gray-100 text-gray-900"
                }`}
                style={c.sender_type === "team" ? { backgroundColor: "#003087" } : {}}
              >
                <p className={`text-[10px] font-semibold mb-0.5 ${c.sender_type === "team" ? "text-blue-200" : "text-orange-600"}`}>
                  {c.sender_type === "client" ? `🧑 ${c.sender_name}` : c.sender_name}
                </p>
                <p className="text-sm whitespace-pre-wrap">{c.message}</p>
                <TranslateButton text={c.message} compact className={c.sender_type === "team" ? "[&_button]:text-blue-200 [&_button]:hover:text-white" : ""} />
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
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${c.sender_type === "team" ? "bg-white/20 text-white hover:bg-white/30" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
                        >
                          <FileText size={12} />
                          <span className="truncate max-w-[150px]">{a.name}</span>
                        </a>
                      )
                    ))}
                  </div>
                )}
                <p className={`text-[10px] mt-1 ${c.sender_type === "team" ? "text-blue-200" : "text-gray-400"}`}>
                  {new Date(c.created_at).toLocaleTimeString(LOCALE_MAP[lang] || "th-TH", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}
                  {new Date(c.created_at).toLocaleDateString(LOCALE_MAP[lang] || "th-TH", { day: "numeric", month: "short" })}
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
          placeholder={t.chatPlaceholder}
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
  );
}

/* ---------- Assign Dropdown ---------- */
function AssignDropdown({ requestId, members, currentAssignee, isLoading, onAction, lang = "th" }: {
  requestId: string; members: TeamMemberLite[]; currentAssignee?: string; isLoading: boolean;
  onAction: (id: string, action: string, extra?: Record<string, unknown>) => void;
  lang?: string;
}) {
  const t = cpT[lang] || cpT.th;
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        <UserPlus size={12} /> {t.assignAction}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-8 z-40 bg-white rounded-lg shadow-xl border w-56 max-h-48 overflow-y-auto">
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => { onAction(requestId, "assign", { assigned_to: m.id }); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${m.id === currentAssignee ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}
              >
                {m.first_name_th} {m.last_name_th}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Convert to Task Button ---------- */
function ConvertToTaskButton({ requestId, members, isLoading, onAction, disabled, lang = "th" }: {
  requestId: string; members: TeamMemberLite[]; isLoading: boolean;
  onAction: (id: string, action: string, extra?: Record<string, unknown>) => void;
  disabled?: boolean;
  lang?: string;
}) {
  const t = cpT[lang] || cpT.th;
  const [showModal, setShowModal] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  if (disabled) {
    return (
      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-green-600 bg-green-50">
        <CheckCircle2 size={12} /> {t.taskCreated}
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: "#F7941D" }}
      >
        <ArrowRightCircle size={12} /> {t.convertToTask}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{t.convertModalTitle}</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">{t.assignee}</label>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">{t.notSpecified}</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.first_name_th} {m.last_name_th}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">{t.dueDate}</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg text-sm text-gray-700">{t.cancel}</button>
              <button
                onClick={() => {
                  onAction(requestId, "convert_to_task", {
                    assignee_id: assigneeId || undefined,
                    due_date: dueDate || undefined,
                  });
                  setShowModal(false);
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "#003087" }}
              >
                {t.createTask}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


/* ---------- Create Token Modal ---------- */
function CreateModal({ projects, defaultProjectId, onClose, onCreated, lang = "th" }: { projects: ProjectLite[]; defaultProjectId: string; onClose: () => void; onCreated: () => void; lang?: string }) {
  const t = cpT[lang] || cpT.th;
  const [pid, setPid] = useState(defaultProjectId);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [expiresDays, setExpiresDays] = useState("90");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!pid) return alert(t.projectRequired);
    setSaving(true);
    const r = await fetch("/api/client-portal/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: pid,
        client_name: clientName || null,
        client_email: clientEmail || null,
        description: description || null,
        expires_days: expiresDays ? parseInt(expiresDays) : null,
      }),
    });
    setSaving(false);
    if (!r.ok) { alert(t.createError); return; }
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Link2 size={18} /> {t.createLink}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">{t.project} *</label>
            <select value={pid} onChange={e => setPid(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">{t.selectProject}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {pickName(p, lang)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">{t.clientName}</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder={t.clientPlaceholder}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">{t.email}</label>
            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">{t.description}</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder={t.descriptionPlaceholder}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">{t.expiresIn}</label>
            <select value={expiresDays} onChange={e => setExpiresDays(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="30">{t.exp30}</option>
              <option value="90">{t.exp90}</option>
              <option value="180">{t.exp180}</option>
              <option value="365">{t.exp365}</option>
              <option value="">{t.noExpiry}</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border text-gray-700 text-sm">{t.cancel}</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50" style={{ background: "#003087" }}>
            {saving ? t.creating : t.createLinkBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- KPI ---------- */
function KPI({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border rounded-xl p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
