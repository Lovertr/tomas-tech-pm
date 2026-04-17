"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Link2, Copy, Check, Trash2, Pause, Play, ExternalLink, Eye, Mail } from "lucide-react";

interface TokenRow {
  id: string; project_id: string; token: string;
  client_name?: string | null; client_email?: string | null;
  expires_at?: string | null; active: boolean;
  last_accessed_at?: string | null; access_count?: number | null;
  created_at: string;
  projects?: { id: string; project_code: string; name_th?: string; name_en?: string };
}
interface ProjectLite { id: string; project_code: string; name_th?: string; name_en?: string }

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("th-TH") : "—");

export default function ClientPortalPanel({ filterProjectId = "all", refreshKey = 0 }: { filterProjectId?: string; refreshKey?: number }) {
  const [rows, setRows] = useState<TokenRow[]>([]);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filterProjectId !== "all") q.set("project_id", filterProjectId);
      const [a, b] = await Promise.all([
        fetch(`/api/client-portal?${q}`).then(r => r.ok ? r.json() : { rows: [] }),
        fetch("/api/projects").then(r => r.ok ? r.json() : { projects: [] }),
      ]);
      setRows(a.rows ?? []);
      setProjects(b.projects ?? []);
    } finally { setLoading(false); }
  }, [filterProjectId]);
  useEffect(() => { fetchAll(); }, [fetchAll, refreshKey]);

  const linkFor = (token: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/client/${token}` : `/client/${token}`;

  const copyLink = async (row: TokenRow) => {
    await navigator.clipboard.writeText(linkFor(row.token));
    setCopiedId(row.id);
    setTimeout(() => setCopiedId(null), 1500);
  };
  const toggleActive = async (row: TokenRow) => {
    await fetch(`/api/client-portal/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !row.active }) });
    fetchAll();
  };
  const remove = async (row: TokenRow) => {
    if (!confirm("ลบลิงก์นี้? ลูกค้าจะเปิดดูไม่ได้อีก")) return;
    await fetch(`/api/client-portal/${row.id}`, { method: "DELETE" });
    fetchAll();
  };

  const stats = {
    total: rows.length,
    active: rows.filter(r => r.active).length,
    views: rows.reduce((s, r) => s + (r.access_count ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPI label="ลิงก์ทั้งหมด" value={stats.total} color="#00AEEF" />
        <KPI label="ใช้งานอยู่" value={stats.active} color="#22C55E" />
        <KPI label="ครั้งที่ลูกค้าเปิดดู" value={stats.views} color="#F7941D" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-slate-400">{loading ? "กำลังโหลด…" : `${rows.length} ลิงก์`}</div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: "#003087" }}>
          <Plus size={14} /> สร้างลิงก์ลูกค้า
        </button>
      </div>

      {!loading && !rows.length && (
        <div className="text-center py-16 bg-[#1E293B] border border-[#334155] rounded-2xl text-slate-400">
          <Link2 size={40} className="mx-auto mb-3 text-slate-600" />
          ยังไม่มีลิงก์ลูกค้า — สร้างเพื่อแชร์ความคืบหน้าให้ลูกค้าดู
        </div>
      )}

      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.id} className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-400">{r.projects?.project_code}</span>
                  <span className="text-base text-white font-medium">{r.projects?.name_th || r.projects?.name_en}</span>
                  {!r.active && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">หยุดใช้งาน</span>}
                </div>
                {(r.client_name || r.client_email) && (
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    {r.client_name && <span>{r.client_name}</span>}
                    {r.client_email && <span className="flex items-center gap-1"><Mail size={10} />{r.client_email}</span>}
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-2 truncate">
                  <Link2 size={10} className="inline mr-1" />
                  <code className="text-cyan-300">{linkFor(r.token)}</code>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
                  <span><Eye size={10} className="inline mr-1" />เปิดดู {r.access_count ?? 0} ครั้ง</span>
                  <span>เปิดล่าสุด: {fmtDate(r.last_accessed_at)}</span>
                  {r.expires_at && <span className="text-orange-400">หมดอายุ: {fmtDate(r.expires_at)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copyLink(r)} title="คัดลอกลิงก์"
                  className="p-2 rounded-lg bg-[#0F172A] border border-[#334155] hover:border-cyan-500">
                  {copiedId === r.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-slate-300" />}
                </button>
                <a href={linkFor(r.token)} target="_blank" rel="noopener noreferrer" title="เปิดดู"
                  className="p-2 rounded-lg bg-[#0F172A] border border-[#334155] hover:border-cyan-500">
                  <ExternalLink size={14} className="text-slate-300" />
                </a>
                <button onClick={() => toggleActive(r)} title={r.active ? "หยุดใช้งาน" : "เปิดใช้งาน"}
                  className="p-2 rounded-lg bg-[#0F172A] border border-[#334155] hover:border-orange-500">
                  {r.active ? <Pause size={14} className="text-slate-300" /> : <Play size={14} className="text-green-400" />}
                </button>
                <button onClick={() => remove(r)} title="ลบ"
                  className="p-2 rounded-lg bg-[#0F172A] border border-[#334155] hover:border-red-500">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreate && <CreateModal projects={projects} defaultProjectId={filterProjectId !== "all" ? filterProjectId : ""} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchAll(); }} />}
    </div>
  );
}

function CreateModal({ projects, defaultProjectId, onClose, onCreated }: { projects: ProjectLite[]; defaultProjectId: string; onClose: () => void; onCreated: () => void }) {
  const [pid, setPid] = useState(defaultProjectId);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!pid) return alert("กรุณาเลือกโครงการ");
    setSaving(true);
    const r = await fetch("/api/client-portal", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: pid,
        client_name: clientName || null,
        client_email: clientEmail || null,
        expires_at: expires ? new Date(expires).toISOString() : null,
      }),
    });
    setSaving(false);
    if (!r.ok) { alert("สร้างไม่สำเร็จ"); return; }
    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E293B] rounded-2xl border border-[#334155] w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Link2 size={18} /> สร้างลิงก์ลูกค้า</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">โครงการ *</label>
            <select value={pid} onChange={e => setPid(e.target.value)} className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white">
              <option value="">— เลือกโครงการ —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name_th || p.name_en}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">ชื่อลูกค้า / ผู้รับ</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="คุณ..."
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">อีเมล (ไม่บังคับ)</label>
            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">หมดอายุ (ไม่บังคับ)</label>
            <input type="date" value={expires} onChange={e => setExpires(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl bg-[#0F172A] border border-[#334155] text-slate-300 text-sm">ยกเลิก</button>
          <button onClick={submit} disabled={saving} className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50" style={{ background: "#F7941D" }}>
            {saving ? "กำลังสร้าง..." : "สร้างลิงก์"}
          </button>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-3">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
