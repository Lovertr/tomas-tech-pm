"use client";
import { useEffect, useState, useCallback } from "react";
import { X, Save, RotateCcw, Shield, Search } from "lucide-react";
import { PERM_LABEL_TH, PERM_COLOR } from "@/lib/permissions";

interface Module { key: string; label_th: string; label_en: string; category: string; sort: number; }
interface User { id: string; username: string; display_name: string; }

const CATEGORY_LABEL: Record<string, string> = {
  core: "หลัก", planning: "การวางแผน", tracking: "ติดตาม", finance: "การเงิน",
  crm: "CRM & การขาย", people: "ทีม/บุคลากร", admin: "ระบบ",
};
const CATEGORY_ORDER = ["core", "planning", "tracking", "people", "finance", "crm", "admin"];
const LEVELS = [0, 1, 2, 3, 4, 5] as const;

interface Props {
  user: User;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PermissionsModal({ user, open, onClose, onSaved }: Props) {
  const [modules, setModules] = useState<Module[]>([]);
  const [perms, setPerms] = useState<Record<string, number>>({});
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mr, pr] = await Promise.all([
        fetch("/api/permissions/modules"),
        fetch(`/api/users/${user.id}/permissions`),
      ]);
      if (mr.ok) { const d = await mr.json(); setModules(d.modules ?? []); }
      if (pr.ok) {
        const d = await pr.json();
        setPerms(d.permissions ?? {});
        setOverrides(d.overrides ?? {});
      }
      setDirty(false);
    } finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const setLevel = (key: string, lvl: number) => {
    setPerms(p => ({ ...p, [key]: lvl }));
    setDirty(true);
  };

  const setCategoryLevel = (cat: string, lvl: number) => {
    const next = { ...perms };
    modules.filter(m => m.category === cat).forEach(m => { next[m.key] = lvl; });
    setPerms(next); setDirty(true);
  };

  const setAllLevel = (lvl: number) => {
    const next: Record<string, number> = {};
    modules.forEach(m => { next[m.key] = lvl; });
    setPerms(next); setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/users/${user.id}/permissions`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: perms }),
      });
      if (r.ok) { setDirty(false); onSaved?.(); onClose(); }
    } finally { setSaving(false); }
  };

  const reset = async () => {
    if (!confirm("รีเซ็ตทั้งหมดให้ใช้ค่า default ของ Role?")) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/users/${user.id}/permissions`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      if (r.ok) { await load(); onSaved?.(); }
    } finally { setSaving(false); }
  };

  if (!open) return null;

  const filtered = filter
    ? modules.filter(m => m.label_th.toLowerCase().includes(filter.toLowerCase()) || m.key.toLowerCase().includes(filter.toLowerCase()))
    : modules;
  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    items: filtered.filter(m => m.category === cat),
  })).filter(g => g.items.length);

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center justify-between border-b border-[#334155] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003087] to-[#00AEEF] flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">จัดการสิทธิ์การใช้งาน</h3>
              <div className="text-xs text-slate-400">{user.display_name} <span className="text-slate-500">({user.username})</span></div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* toolbar */}
        <div className="px-5 py-3 border-b border-[#334155] flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="ค้นหาเมนู..."
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-9 pr-3 py-1.5 text-sm text-white" />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 mr-1">ตั้งทั้งหมด:</span>
            {LEVELS.map(l => (
              <button key={l} onClick={() => setAllLevel(l)}
                className="px-2 py-1 rounded text-[10px] font-medium hover:opacity-80"
                style={{ background: `${PERM_COLOR[l]}25`, color: PERM_COLOR[l], border: `1px solid ${PERM_COLOR[l]}50` }}>
                {PERM_LABEL_TH[l]}
              </button>
            ))}
          </div>
          <button onClick={reset} disabled={saving}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-[#334155] rounded-lg flex items-center gap-1 disabled:opacity-50">
            <RotateCcw size={12} /> ใช้ค่า Default
          </button>
        </div>

        {/* legend */}
        <div className="px-5 py-2 border-b border-[#334155] flex items-center gap-3 flex-wrap text-[10px]">
          <span className="text-slate-500">ระดับสิทธิ์:</span>
          {LEVELS.map(l => (
            <span key={l} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: PERM_COLOR[l] }} />
              <span className="text-slate-300">{l} = {PERM_LABEL_TH[l]}</span>
            </span>
          ))}
          <span className="text-slate-500 ml-auto">● = override (ค่า default ของ role ถูกแทนที่)</span>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && <div className="text-center text-slate-400 py-10">Loading...</div>}
          {!loading && grouped.map(g => (
            <div key={g.cat} className="bg-[#0F172A]/40 border border-[#334155] rounded-xl">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#334155]">
                <h4 className="text-sm font-semibold text-orange-400">{CATEGORY_LABEL[g.cat] || g.cat}</h4>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 mr-1">ตั้งหมวดนี้:</span>
                  {LEVELS.map(l => (
                    <button key={l} onClick={() => setCategoryLevel(g.cat, l)}
                      className="w-5 h-5 rounded text-[10px] font-bold hover:scale-110 transition"
                      title={PERM_LABEL_TH[l]}
                      style={{ background: `${PERM_COLOR[l]}30`, color: PERM_COLOR[l], border: `1px solid ${PERM_COLOR[l]}60` }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divide-y divide-[#1E293B]">
                {g.items.map(m => {
                  const cur = perms[m.key] ?? 0;
                  const isOverride = m.key in overrides;
                  return (
                    <div key={m.key} className="flex items-center gap-3 px-4 py-2 hover:bg-[#1E293B]/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white truncate">{m.label_th}</span>
                          {isOverride && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Override" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{m.key}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {LEVELS.map(l => (
                          <button key={l} onClick={() => setLevel(m.key, l)}
                            className={`px-2 py-1 rounded text-[10px] font-medium transition ${cur === l ? "ring-2 scale-105" : "opacity-50 hover:opacity-100"}`}
                            style={{
                              background: cur === l ? PERM_COLOR[l] : `${PERM_COLOR[l]}20`,
                              color: cur === l ? "#fff" : PERM_COLOR[l],
                              border: `1px solid ${PERM_COLOR[l]}${cur === l ? "" : "60"}`,
                            }}
                            title={PERM_LABEL_TH[l]}>
                            {PERM_LABEL_TH[l]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="border-t border-[#334155] px-5 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {dirty ? <span className="text-orange-400">● มีการเปลี่ยนแปลงที่ยังไม่บันทึก</span> : "ไม่มีการเปลี่ยนแปลง"}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-300 hover:text-white">ยกเลิก</button>
            <button onClick={save} disabled={saving || !dirty}
              className="px-4 py-2 bg-[#003087] hover:bg-[#0040B0] text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <Save size={14} /> {saving ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
