"use client";
import { useEffect, useState, use } from "react";
import { CheckCircle2, Clock, AlertCircle, FileText, Calendar, TrendingUp, Building2, DollarSign, Target } from "lucide-react";

interface PortalData {
  project: {
    id: string; project_code: string; name_th?: string; name_en?: string;
    description?: string; status: string; priority?: string;
    start_date?: string; end_date?: string; progress?: number;
    budget_limit?: number; client_name?: string;
  };
  tasks: { id: string; title: string; status: string; priority?: string; due_date?: string; completed_at?: string }[];
  milestones: { id: string; title: string; due_date?: string; status: string; description?: string }[];
  invoices: { id: string; invoice_number: string; issue_date: string; due_date: string; total: number; status: string; client_name?: string }[];
  task_stats: { total: number; done: number; in_progress: number; todo: number };
  finance: { billed: number; paid: number; outstanding: number };
  client: { name?: string; email?: string };
}

const fmtMoney = (n?: number | null) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(Number(n ?? 0));
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "—");

const STATUS_LBL: Record<string, string> = {
  planning: "วางแผน", in_progress: "กำลังดำเนินการ", on_hold: "พักไว้",
  completed: "เสร็จสิ้น", cancelled: "ยกเลิก", done: "เสร็จ", todo: "รอ",
  draft: "ร่าง", sent: "ส่งแล้ว", paid: "ชำระแล้ว", overdue: "เกินกำหนด",
  pending: "รอ",
};
const STATUS_COLOR: Record<string, string> = {
  planning: "#64748B", in_progress: "#00AEEF", on_hold: "#F7941D",
  completed: "#22C55E", done: "#22C55E", cancelled: "#EF4444",
  todo: "#64748B", draft: "#64748B", sent: "#00AEEF", paid: "#22C55E", overdue: "#EF4444",
  pending: "#64748B",
};

export default function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/client/${token}`)
      .then(async r => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || "ไม่สามารถเปิดลิงก์นี้ได้");
        }
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">กำลังโหลด…</div>;
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-white border border-gray-300 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-600" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">ลิงก์ไม่ถูกต้อง</h1>
          <p className="text-gray-500 text-sm">{error || "กรุณาตรวจสอบลิงก์อีกครั้ง หรือติดต่อผู้ดูแลโครงการ"}</p>
        </div>
      </div>
    );
  }

  const p = data.project;
  const completion = data.task_stats.total > 0 ? Math.round((data.task_stats.done / data.task_stats.total) * 100) : (p.progress ?? 0);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-300" style={{ background: "linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
                <Building2 size={14} /> TOMAS TECH CO., LTD.
              </div>
              <div className="text-[10px] font-mono text-gray-500">{p.project_code}</div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{p.name_th || p.name_en}</h1>
              {p.description && <p className="text-gray-600 text-sm mt-2 max-w-2xl">{p.description}</p>}
            </div>
            <div className="text-right">
              {data.client.name && (
                <div className="text-xs text-gray-500">สำหรับ</div>
              )}
              <div className="text-base font-medium text-gray-900">{data.client.name || p.client_name || "ลูกค้า"}</div>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                style={{ background: `${STATUS_COLOR[p.status] || "#64748B"}20`, color: STATUS_COLOR[p.status] || "#94A3B8" }}>
                ● {STATUS_LBL[p.status] || p.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Progress */}
        <div className="bg-white border border-gray-300 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-600"><TrendingUp size={16} /> ความคืบหน้าโครงการ</div>
            <div className="text-2xl font-bold" style={{ color: "#F7941D" }}>{completion}%</div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${completion}%`, background: "linear-gradient(90deg, #003087, #00AEEF, #F7941D)" }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-center">
            <Stat label="งานทั้งหมด" value={data.task_stats.total} color="#00AEEF" icon={FileText} />
            <Stat label="กำลังทำ" value={data.task_stats.in_progress} color="#F7941D" icon={Clock} />
            <Stat label="เสร็จแล้ว" value={data.task_stats.done} color="#22C55E" icon={CheckCircle2} />
            <Stat label="คงเหลือ" value={data.task_stats.todo} color="#94A3B8" icon={Target} />
          </div>
          {(p.start_date || p.end_date) && (
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500 border-t border-gray-300 pt-3">
              <span><Calendar size={12} className="inline mr-1" /> เริ่ม {fmtDate(p.start_date)}</span>
              <span>สิ้นสุด {fmtDate(p.end_date)}</span>
            </div>
          )}
        </div>

        {/* Tasks Detail */}
        <div className="bg-white border border-gray-300 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-600" /> รายละเอียดงาน</h2>
          {!data.tasks.length ? (
            <div className="text-center py-8 text-gray-500 text-sm">ยังไม่มีรายการงาน</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 border-b border-gray-300">
                  <tr>
                    <th className="text-left py-2 pr-2">สถานะ</th>
                    <th className="text-left py-2">ชื่องาน</th>
                    <th className="text-left py-2">ความสำคัญ</th>
                    <th className="text-left py-2">กำหนดเสร็จ</th>
                    <th className="text-left py-2">เสร็จเมื่อ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tasks
                    .sort((a, b) => {
                      const order: Record<string, number> = { in_progress: 0, todo: 1, backlog: 2, review: 3, done: 4 };
                      return (order[a.status] ?? 2) - (order[b.status] ?? 2);
                    })
                    .map(t => {
                      const overdue = t.due_date && !t.completed_at && new Date(t.due_date) < new Date();
                      return (
                        <tr key={t.id} className="border-b border-gray-300/50 hover:bg-gray-50/50">
                          <td className="py-2.5 pr-2">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                              style={{ background: `${STATUS_COLOR[t.status] || "#64748B"}20`, color: STATUS_COLOR[t.status] || "#94A3B8" }}>
                              {t.status === "done" && <CheckCircle2 size={10} />}
                              {t.status === "in_progress" && <Clock size={10} />}
                              {STATUS_LBL[t.status] || t.status}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className={t.status === "done" ? "text-gray-500 line-through" : "text-gray-900"}>{t.title}</span>
                          </td>
                          <td className="py-2.5">
                            <span className={`text-xs ${t.priority === "high" || t.priority === "urgent" ? "text-red-600" : t.priority === "medium" ? "text-yellow-600" : "text-gray-500"}`}>
                              {t.priority === "urgent" ? "เร่งด่วน" : t.priority === "high" ? "สูง" : t.priority === "medium" ? "ปานกลาง" : "ต่ำ"}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
                              {overdue && "⚠ "}{fmtDate(t.due_date)}
                            </span>
                          </td>
                          <td className="py-2.5 text-xs text-gray-500">
                            {t.completed_at ? fmtDate(t.completed_at) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="bg-white border border-gray-300 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Target size={16} className="text-orange-600" /> Milestones</h2>
          {!data.milestones.length ? (
            <div className="text-center py-8 text-gray-500 text-sm">ยังไม่มี Milestone</div>
          ) : (
            <div className="space-y-3">
              {data.milestones.map(m => (
                <div key={m.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-300">
                  <div className="mt-0.5">
                    {m.status === "completed" || m.status === "done"
                      ? <CheckCircle2 size={20} className="text-green-600" />
                      : <div className="w-5 h-5 rounded-full border-2 border-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="font-medium text-gray-900">{m.title}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${STATUS_COLOR[m.status] || "#64748B"}20`, color: STATUS_COLOR[m.status] || "#94A3B8" }}>
                        {STATUS_LBL[m.status] || m.status}
                      </span>
                    </div>
                    {m.description && <div className="text-sm text-gray-500 mt-1">{m.description}</div>}
                    {m.due_date && <div className="text-xs text-gray-600 mt-1"><Calendar size={10} className="inline mr-1" />{fmtDate(m.due_date)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Finance */}
        <div className="bg-white border border-gray-300 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><DollarSign size={16} className="text-green-600" /> สรุปการเงิน</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <FinKPI label="ยอดวางบิลทั้งหมด" value={fmtMoney(data.finance.billed)} color="#00AEEF" />
            <FinKPI label="ชำระแล้ว" value={fmtMoney(data.finance.paid)} color="#22C55E" />
            <FinKPI label="คงค้าง" value={fmtMoney(data.finance.outstanding)} color="#F7941D" />
          </div>
          {!data.invoices.length ? (
            <div className="text-center py-6 text-gray-500 text-sm">ยังไม่มีใบแจ้งหนี้</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500">
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2">เลขที่</th>
                    <th className="text-left py-2">วันที่ออก</th>
                    <th className="text-left py-2">กำหนดชำระ</th>
                    <th className="text-right py-2">จำนวนเงิน</th>
                    <th className="text-center py-2">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map(i => (
                    <tr key={i.id} className="border-b border-gray-300/50">
                      <td className="py-2 font-mono text-xs">{i.invoice_number}</td>
                      <td className="py-2 text-gray-600">{fmtDate(i.issue_date)}</td>
                      <td className="py-2 text-gray-600">{fmtDate(i.due_date)}</td>
                      <td className="py-2 text-right font-medium">{fmtMoney(i.total)}</td>
                      <td className="py-2 text-center">
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${STATUS_COLOR[i.status] || "#64748B"}20`, color: STATUS_COLOR[i.status] || "#94A3B8" }}>
                          {STATUS_LBL[i.status] || i.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-500 py-6 border-t border-gray-300">
          © {new Date().getFullYear()} TOMAS TECH CO., LTD. · ลิงก์นี้เป็นข้อมูลสรุปสำหรับลูกค้าเท่านั้น
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ComponentType<{ size?: number }> }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-300">
      <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1"><Icon size={12} /> {label}</div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
function FinKPI({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-300">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
