"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Plus, Link2, Copy, Check, Trash2, Pause, Play, ExternalLink, Eye, Mail,
  MessageSquare, AlertTriangle, CheckCircle2, XCircle, Clock, UserPlus,
  ChevronDown, ChevronUp, ArrowRightCircle, X, FileText, Image as ImageIcon, Video
} from "lucide-react";

/* ---------- types ---------- */
interface TokenRow {
  id: string; project_id: string; token: string;
  client_name?: string | null; client_email?: string | null;
  expires_at?: string | null; active: boolean;
  last_accessed_at?: string | null; access_count?: number | null;
  created_at: string; description?: string | null;
}
interface ProjectLite { id: string; project_code: string; name_th?: string; name_en?: string }
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

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("th-TH") : "—");
const fmtDateTime = (d: string) => new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

const REQUEST_STATUS: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "รอพิจารณา", color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
  accepted: { label: "รับแล้ว", color: "#3B82F6", bg: "#EFF6FF", icon: CheckCircle2 },
  in_progress: { label: "กำลังดำเนินการ", color: "#8B5CF6", bg: "#F5F3FF", icon: Clock },
  resolved: { label: "แก้ไขแล้ว", color: "#22C55E", bg: "#F0FDF4", icon: CheckCircle2 },
  cancelled: { label: "ยกเลิก", color: "#EF4444", bg: "#FEF2F2", icon: XCircle },
};
const REQUEST_TYPES: Record<string, string> = { request: "คำร้องขอ", issue: "รายงานปัญหา", feedback: "ข้อเสนอแนะ", change_request: "ขอเปลี่ยนแปลง" };
const PRIORITY_COLORS: Record<string, string> = { low: "#94A3B8", medium: "#F59E0B", high: "#F97316", critical: "#EF4444" };

/* ---------- main ---------- */
export default function ClientPortalPanel({ filterProjectId = "all", refreshKey = 0 }: { filterProjectId?: string; refreshKey?: number }) {
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

      // Fetch requests for all projects or specific project
      if (filterProjectId !== "all") {
        const reqRes = await fetch(`/api/client-portal/manage?project_id=${filterProjectId}`);
        if (reqRes.ok) { const d = await reqRes.json(); setRequests(d.requests ?? []); }
      } else {
        // Fetch for all projects
        const allProjects = projRes.projects ?? [];
        const allRequests: ClientRequest[] = [];
        for (const p of allProjects.slice(0, 20)) {
          const rr = await fetch(`/api/client-portal/manage?project_id=${p.id}`);
          if (rr.ok) { const d = await rr.json(); allRequests.push(...(d.requests ?? [])); }
        }
        setRequests(allRequests);
      }
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
    if (!confirm("ลบลิงก์นี้? ลูกค้าจะเปิดดูไม่ได้อีก")) return;
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
        <KPI label="ลิงก์ทั้งหมด" value={stats.total} color="#00AEEF" />
        <KPI label="ใช้งานอยู่" value={stats.active} color="#22C55E" />
        <KPI label="ลูกค้าเปิดดู" value={stats.views} color="#F7941D" />
        <KPI label="คำร้องรอดำเนินการ" value={stats.pendingRequests} color={stats.pendingRequests > 0 ? "#EF4444" : "#94A3B8"} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab("links")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "links" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        >
          <Link2 size={14} />
          ลิงก์ลูกค้า ({rows.length})
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "requests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
        >
          <MessageSquare size={14} />
          คำร้องจากลูกค้า ({requests.length})
          {stats.pendingRequests > 0 && (
            <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{stats.pendingRequests}</span>
          )}
        </button>
      </div>

      {/* Links Tab */}
      {tab === "links" && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-slate-600">{loading ? "กำลังโหลด…" : `${rows.length} ลิงก์`}</div>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: "#003087" }}>
              <Plus size={14} /> สร้างลิงก์ลูกค้า
            </button>
          </div>

          {!loading && !rows.length && (
            <div className="text-center py-16 bg-white border rounded-2xl text-slate-600">
              <Link2 size={40} className="mx-auto mb-3 text-gray-300" />
              ยังไม่มีลิงก์ลูกค้า — สร้างเพื่อแชร์ความคืบหน้าให้ลูกค้าดู
            </div>
          )}

          <div className="space-y-3">
            {rows.map(r => (
              <div key={r.id} className="bg-white border rounded-2xl p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.client_name && <span className="text-base text-gray-900 font-medium">{r.client_name}</span>}
                      {!r.active && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">หยุดใช้งาน</span>}
                      {r.description && <span className="text-xs text-gray-500">— {r.description}</span>}
                    </div>
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
                      <span><Eye size={10} className="inline mr-1" />เปิดดู {r.access_count ?? 0} ครั้ง</span>
                      <span>เปิดล่าสุด: {fmtDate(r.last_accessed_at)}</span>
                      {r.expires_at && <span className="text-orange-600">หมดอายุ: {fmtDate(r.expires_at)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyLink(r)} title="คัดลอกลิงก์"
                      className="p-2 rounded-lg bg-gray-50 border hover:border-blue-400">
                      {copiedId === r.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-600" />}
                    </button>
                    <a href={linkFor(r.token)} target="_blank" rel="noopener noreferrer" title="เปิดดู"
                      className="p-2 rounded-lg bg-gray-50 border hover:border-blue-400">
                      <ExternalLink size={14} className="text-gray-600" />
                    </a>
                    <button onClick={() => toggleActive(r)} title={r.active ? "หยุดใช้งาน" : "เปิดใช้งาน"}
                      className="p-2 rounded-lg bg-gray-50 border hover:border-orange-400">
                      {r.active ? <Pause size={14} className="text-gray-600" /> : <Play size={14} className="text-green-600" />}
                    </button>
                    <button onClick={() => remove(r)} title="ลบ"
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
        <RequestsManager requests={requests} members={members} onRefresh={fetchAll} />
      )}

      {showCreate && (
        <CreateModal
          projects={projects}
          defaultProjectId={filterProjectId !== "all" ? filterProjectId : ""}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAll(); }}
        />
      )}
    </div>
  );
}

/* ---------- Requests Manager ---------- */
function RequestsManager({ requests, members, onRefresh }: { requests: ClientRequest[]; members: TeamMemberLite[]; onRefresh: () => void }) {
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
        ยังไม่มีคำร้องจากลูกค้า
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "ทั้งหมด" },
          { key: "pending", label: "รอพิจารณา" },
          { key: "accepted", label: "รับแล้ว" },
          { key: "in_progress", label: "กำลังทำ" },
          { key: "resolved", label: "เสร็จ" },
          { key: "cancelled", label: "ยกเลิก" },
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
          const st = REQUEST_STATUS[cr.status] || REQUEST_STATUS.pending;
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
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                      <span className="text-xs text-gray-400">{REQUEST_TYPES[cr.request_type]}</span>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[cr.priority] || "#94A3B8" }} title={cr.priority} />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{cr.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>แจ้งโดย: {cr.client_name}</span>
                      <span>{fmtDateTime(cr.created_at)}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t pt-3 space-y-3">
                  {cr.description && <p className="text-sm text-gray-700 whitespace-pre-wrap">{cr.description}</p>}

                  {/* Contact info */}
                  <div className="flex gap-4 text-xs text-gray-500">
                    {cr.client_email && <span className="flex items-center gap-1"><Mail size={10} />{cr.client_email}</span>}
                    {cr.client_phone && <span>{cr.client_phone}</span>}
                  </div>

                  {/* Attachments */}
                  {cr.attachments && cr.attachments.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">ไฟล์แนบ ({cr.attachments.length})</p>
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
                      ผู้รับผิดชอบ: <span className="font-medium">{cr.assigned_member.first_name_th} {cr.assigned_member.last_name_th}</span>
                    </div>
                  )}
                  {cr.linked_task && (
                    <div className="text-xs text-blue-600">
                      <ArrowRightCircle size={10} className="inline mr-1" />
                      เชื่อมกับงาน: {cr.linked_task.title} ({cr.linked_task.status})
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
                        <CheckCircle2 size={12} /> รับ
                      </button>
                      <button
                        onClick={() => handleAction(cr.id, "cancel", { response_to_client: "ขออภัย ไม่สามารถดำเนินการได้ในขณะนี้" })}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle size={12} /> ปฏิเสธ
                      </button>
                      <ConvertToTaskButton
                        requestId={cr.id}
                        members={members}
                        isLoading={isLoading}
                        onAction={handleAction}
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
                      />
                      <ConvertToTaskButton
                        requestId={cr.id}
                        members={members}
                        isLoading={isLoading}
                        onAction={handleAction}
                        disabled={!!cr.task_id}
                      />
                      <button
                        onClick={() => {
                          const resp = prompt("ข้อความตอบกลับลูกค้า:");
                          if (resp) handleAction(cr.id, "resolve", { response_to_client: resp });
                        }}
                        disabled={isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle2 size={12} /> แก้ไขแล้ว
                      </button>
                    </div>
                  )}

                  {cr.response_to_client && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs font-medium text-blue-700 mb-1">ตอบกลับลูกค้า:</p>
                      <p className="text-sm text-blue-900">{cr.response_to_client}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Assign Dropdown ---------- */
function AssignDropdown({ requestId, members, currentAssignee, isLoading, onAction }: {
  requestId: string; members: TeamMemberLite[]; currentAssignee?: string; isLoading: boolean;
  onAction: (id: string, action: string, extra?: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        <UserPlus size={12} /> มอบหมาย
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
function ConvertToTaskButton({ requestId, members, isLoading, onAction, disabled }: {
  requestId: string; members: TeamMemberLite[]; isLoading: boolean;
  onAction: (id: string, action: string, extra?: Record<string, unknown>) => void;
  disabled?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  if (disabled) {
    return (
      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-green-600 bg-green-50">
        <CheckCircle2 size={12} /> สร้างงานแล้ว
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
        <ArrowRightCircle size={12} /> สร้างเป็นงาน
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">สร้างเป็นงานในโปรเจค</h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">ผู้รับผิดชอบ</label>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">— ยังไม่ระบุ —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.first_name_th} {m.last_name_th}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">กำหนดเสร็จ</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg text-sm text-gray-700">ยกเลิก</button>
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
                สร้างงาน
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Create Token Modal ---------- */
function CreateModal({ projects, defaultProjectId, onClose, onCreated }: { projects: ProjectLite[]; defaultProjectId: string; onClose: () => void; onCreated: () => void }) {
  const [pid, setPid] = useState(defaultProjectId);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [expiresDays, setExpiresDays] = useState("90");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!pid) return alert("กรุณาเลือกโครงการ");
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
    if (!r.ok) { alert("สร้างไม่สำเร็จ"); return; }
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Link2 size={18} /> สร้างลิงก์ลูกค้า</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">โครงการ *</label>
            <select value={pid} onChange={e => setPid(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">— เลือกโครงการ —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">ชื่อลูกค้า / ผู้รับ</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="คุณ..."
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">อีเมล (ไม่บังคับ)</label>
            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">คำอธิบาย</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="เช่น สำหรับทีม QC ลูกค้า"
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">หมดอายุใน (วัน)</label>
            <select value={expiresDays} onChange={e => setExpiresDays(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="30">30 วัน</option>
              <option value="90">90 วัน</option>
              <option value="180">180 วัน</option>
              <option value="365">1 ปี</option>
              <option value="">ไม่มีวันหมดอายุ</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border text-gray-700 text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50" style={{ background: "#003087" }}>
            {saving ? "กำลังสร้าง..." : "สร้างลิงก์"}
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
