"use client";
import { useState, useEffect } from "react";

interface Review {
  id: string; member_id: string; reviewer_id: string; period: string;
  scores: Record<string, number>; overall_score: number;
  self_assessment: string; manager_review: string; status: string;
  member_name?: string; reviewer_name?: string;
  created_at: string;
}
interface Member { id: string; display_name: string; }

const CRITERIA = ["quality", "productivity", "teamwork", "communication", "initiative"];

export default function PerformanceReviewPanel({ lang, canManage }: { lang: string; canManage: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ member_id: "", period: new Date().getFullYear() + "-Q" + Math.ceil((new Date().getMonth() + 1) / 3), scores: {} as Record<string, number>, self_assessment: "", manager_review: "" });
  const [filter, setFilter] = useState<"all"|"draft"|"submitted"|"completed">("all");

  const t = {
    title: lang === "th" ? "ประเมินผลงาน" : lang === "jp" ? "業績評価" : "Performance Reviews",
    add: lang === "th" ? "สร้างรีวิว" : lang === "jp" ? "レビュー作成" : "Create Review",
    member: lang === "th" ? "พนักงาน" : lang === "jp" ? "メンバー" : "Member",
    period: lang === "th" ? "ช่วงเวลา" : lang === "jp" ? "期間" : "Period",
    score: lang === "th" ? "คะแนน" : lang === "jp" ? "スコア" : "Score",
    selfAssess: lang === "th" ? "ประเมินตนเอง" : lang === "jp" ? "自己評価" : "Self Assessment",
    mgrReview: lang === "th" ? "รีวิวผู้จัดการ" : lang === "jp" ? "マネージャーレビュー" : "Manager Review",
    save: lang === "th" ? "บันทึก" : lang === "jp" ? "保存" : "Save",
    submit: lang === "th" ? "ส่ง" : lang === "jp" ? "提出" : "Submit",
    complete: lang === "th" ? "เสร็จสิ้น" : lang === "jp" ? "完了" : "Complete",
    noData: lang === "th" ? "ไม่มีข้อมูล" : "No reviews yet",
    all: lang === "th" ? "ทั้งหมด" : "All",
    draft: lang === "th" ? "ร่าง" : "Draft",
    submitted: lang === "th" ? "ส่งแล้ว" : "Submitted",
    completed: lang === "th" ? "เสร็จสิ้น" : "Completed",
    quality: lang === "th" ? "คุณภาพงาน" : "Quality",
    productivity: lang === "th" ? "ผลผลิต" : "Productivity",
    teamwork: lang === "th" ? "การทำงานเป็นทีม" : "Teamwork",
    communication: lang === "th" ? "การสื่อสาร" : "Communication",
    initiative: lang === "th" ? "ความคิดริเริ่ม" : "Initiative",
  };

  const load = () => {
    fetch("/api/performance-reviews").then(r => r.json()).then(d => setReviews(d.reviews || []));
    fetch("/api/members").then(r => r.json()).then(d => setMembers(d.members || []));
  };
  useEffect(load, []);

  const handleSave = async (status: string) => {
    if (!form.member_id) return;
    const overall = CRITERIA.length > 0 ? Math.round(CRITERIA.reduce((s, c) => s + (form.scores[c] || 0), 0) / CRITERIA.length * 10) / 10 : 0;
    await fetch("/api/performance-reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, overall_score: overall, status }),
    });
    setShowForm(false);
    setForm({ member_id: "", period: form.period, scores: {}, self_assessment: "", manager_review: "" });
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch("/api/performance-reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const filtered = filter === "all" ? reviews : reviews.filter(r => r.status === filter);
  const statusColor: Record<string, string> = { draft: "bg-gray-100 text-gray-600", submitted: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800">{t.title}</h2>
        {canManage && <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-[#003087] text-white rounded-lg text-sm hover:bg-[#002266]">{t.add}</button>}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">{t.member}</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.display_name}</option>)}
            </select>
            <input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder={t.period} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {CRITERIA.map(c => (
              <div key={c}>
                <label className="text-xs text-gray-500 block mb-1">{t[c as keyof typeof t] || c}</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setForm({ ...form, scores: { ...form.scores, [c]: n } })}
                      className={"w-8 h-8 rounded text-sm font-medium transition " + ((form.scores[c] || 0) >= n ? "bg-[#F7941D] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <textarea value={form.self_assessment} onChange={e => setForm({ ...form, self_assessment: e.target.value })} placeholder={t.selfAssess} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <textarea value={form.manager_review} onChange={e => setForm({ ...form, manager_review: e.target.value })} placeholder={t.mgrReview} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={() => handleSave("draft")} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">{t.save} ({t.draft})</button>
            <button onClick={() => handleSave("submitted")} className="px-4 py-2 bg-[#003087] text-white rounded-lg text-sm">{t.submit}</button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(["all", "draft", "submitted", "completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={"px-3 py-1.5 rounded-lg text-sm font-medium transition " + (filter === f ? "bg-[#003087] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
            {t[f]} {f !== "all" && "(" + reviews.filter(r => r.status === f).length + ")"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-200">{t.noData}</div>}
        {filtered.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-200 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-semibold text-gray-800">{r.member_name || r.member_id}</span>
                <span className="text-sm text-gray-500 ml-2">{r.period}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (statusColor[r.status] || "")}>{r.status}</span>
                <span className="text-lg font-bold text-[#F7941D]">{r.overall_score || 0}/5</span>
              </div>
            </div>
            {r.scores && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(r.scores).map(([k, v]) => (
                  <span key={k} className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded">
                    {t[k as keyof typeof t] || k}: <strong>{String(v)}</strong>/5
                  </span>
                ))}
              </div>
            )}
            {r.self_assessment && <p className="text-sm text-gray-600"><strong>{t.selfAssess}:</strong> {r.self_assessment}</p>}
            {r.manager_review && <p className="text-sm text-gray-600"><strong>{t.mgrReview}:</strong> {r.manager_review}</p>}
            {canManage && r.status === "submitted" && (
              <button onClick={() => handleStatusChange(r.id, "completed")} className="px-3 py-1 bg-green-600 text-white rounded text-xs">{t.complete}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
