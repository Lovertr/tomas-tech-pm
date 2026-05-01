"use client";
import { useState, useEffect } from "react";

interface Activity {
  id: string; deal_id: string; type: string; subject: string;
  notes: string; created_at: string; email_subject?: string; email_to?: string;
  member_name?: string;
}

export default function EmailActivityPanel({ lang, dealId, customerId }: { lang: string; dealId?: string; customerId?: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email_to: "", email_subject: "", notes: "" });

  const t = {
    title: lang === "th" ? "อีเมลที่เกี่ยวข้อง" : lang === "jp" ? "関連メール" : "Email Activity",
    to: lang === "th" ? "ถึง" : "To",
    subject: lang === "th" ? "หัวข้อ" : lang === "jp" ? "件名" : "Subject",
    body: lang === "th" ? "เนื้อหา" : lang === "jp" ? "本文" : "Body",
    log: lang === "th" ? "บันทึกอีเมล" : lang === "jp" ? "メール記録" : "Log Email",
    save: lang === "th" ? "บันทึก" : lang === "jp" ? "保存" : "Save",
    noData: lang === "th" ? "ไม่มีอีเมล" : "No emails logged",
    from: lang === "th" ? "จาก" : "From",
  };

  useEffect(() => {
    let url = "/api/deal-activities?type=email";
    if (dealId) url += "&deal_id=" + dealId;
    fetch(url).then(r => r.json()).then(d => {
      let items = d.activities || [];
      if (customerId && !dealId) {
        // filter by customer through deals - show all email type activities
        items = items.filter((a: Activity) => a.type === "email" || a.type === "send_email");
      }
      setActivities(items);
    });
  }, [dealId, customerId]);

  const handleSave = async () => {
    if (!form.email_to) return;
    const body: Record<string, unknown> = {
      type: "send_email",
      subject: "Email: " + form.email_subject,
      notes: form.notes,
      email_subject: form.email_subject,
      email_to: form.email_to,
    };
    if (dealId) body.deal_id = dealId;
    await fetch("/api/deal-activities", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setShowForm(false);
    setForm({ email_to: "", email_subject: "", notes: "" });
    // reload
    const url = "/api/deal-activities?type=email" + (dealId ? "&deal_id=" + dealId : "");
    fetch(url).then(r => r.json()).then(d => setActivities(d.activities || []));
  };

  const emailActivities = activities.filter(a => a.type === "email" || a.type === "send_email" || a.email_subject);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{t.title}</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-[#003087] text-white rounded-lg text-xs hover:bg-[#002266]">{t.log}</button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
          <input value={form.email_to} onChange={e => setForm({ ...form, email_to: e.target.value })} placeholder={t.to} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
          <input value={form.email_subject} onChange={e => setForm({ ...form, email_subject: e.target.value })} placeholder={t.subject} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={t.body} rows={3} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
          <button onClick={handleSave} className="px-4 py-1.5 bg-green-600 text-white rounded text-sm">{t.save}</button>
        </div>
      )}

      <div className="space-y-2">
        {emailActivities.length === 0 && <div className="text-center text-gray-400 py-6 text-sm">{t.noData}</div>}
        {emailActivities.map(a => (
          <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-gray-800 text-sm">{a.email_subject || a.subject}</div>
                {a.email_to && <div className="text-xs text-gray-500">{t.to}: {a.email_to}</div>}
                {a.member_name && <div className="text-xs text-gray-400">{t.from}: {a.member_name}</div>}
              </div>
              <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
            {a.notes && <p className="text-sm text-gray-600 mt-1">{a.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
