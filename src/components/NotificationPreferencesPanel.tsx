"use client";
import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, CheckCircle, Loader2 } from "lucide-react";

type Lang = "th" | "en" | "jp";

const T: Record<string, Record<Lang, string>> = {
  title: { th: "ตั้งค่าการแจ้งเตือน", en: "Notification Preferences", jp: "通知設定" },
  subtitle: { th: "เลือกประเภทการแจ้งเตือนที่ต้องการรับ", en: "Choose which notifications you want to receive", jp: "受け取りたい通知を選択してください" },
  saved: { th: "บันทึกแล้ว", en: "Saved", jp: "保存済み" },
  saving: { th: "กำลังบันทึก...", en: "Saving...", jp: "保存中..." },
  // Categories
  cat_tasks: { th: "งาน (Tasks)", en: "Tasks", jp: "タスク" },
  cat_deals: { th: "ดีล (Deals)", en: "Deals", jp: "ディール" },
  cat_quotations: { th: "ใบเสนอราคา", en: "Quotations", jp: "見積書" },
  cat_other: { th: "อื่นๆ", en: "Others", jp: "その他" },
  // Notification types
  task_assigned: { th: "ได้รับมอบหมายงานใหม่", en: "New task assigned to me", jp: "新しいタスクが割り当てられた" },
  task_completed: { th: "งานเสร็จสิ้น", en: "Task completed", jp: "タスク完了" },
  deal_created: { th: "ดีลใหม่ถูกสร้าง", en: "New deal created", jp: "新しいディール作成" },
  deal_stage_changed: { th: "สถานะดีลเปลี่ยน", en: "Deal stage changed", jp: "ディールステージ変更" },
  deal_won: { th: "ดีลปิดสำเร็จ / ได้รับ PO", en: "Deal won / PO received", jp: "ディール成約・PO受領" },
  deal_payment: { th: "ได้รับยอดชำระ", en: "Payment received", jp: "入金確認" },
  quotation_approval: { th: "ใบเสนอราคาใหม่รออนุมัติ", en: "New quotation pending approval", jp: "新しい見積書承認待ち" },
  quotation_approved: { th: "ใบเสนอราคาได้รับอนุมัติ", en: "Quotation approved", jp: "見積書承認済み" },
  quotation_rejected: { th: "ใบเสนอราคาถูกปฏิเสธ", en: "Quotation rejected", jp: "見積書却下" },
  client_request: { th: "คำร้องจากลูกค้า (Client Portal)", en: "Client portal request", jp: "クライアントポータルリクエスト" },
  enable_all: { th: "เปิดทั้งหมด", en: "Enable all", jp: "すべてオン" },
  disable_all: { th: "ปิดทั้งหมด", en: "Disable all", jp: "すべてオフ" },
};

interface Prefs {
  notify_task_assigned: boolean;
  notify_task_completed: boolean;
  notify_deal_created: boolean;
  notify_deal_stage_changed: boolean;
  notify_deal_won: boolean;
  notify_deal_payment: boolean;
  notify_quotation_approval: boolean;
  notify_quotation_approved: boolean;
  notify_quotation_rejected: boolean;
  notify_client_request: boolean;
}

const DEFAULT_PREFS: Prefs = {
  notify_task_assigned: true, notify_task_completed: true,
  notify_deal_created: true, notify_deal_stage_changed: true,
  notify_deal_won: true, notify_deal_payment: true,
  notify_quotation_approval: true, notify_quotation_approved: true, notify_quotation_rejected: true,
  notify_client_request: true,
};

const CATEGORIES = [
  {
    key: "cat_tasks",
    items: [
      { field: "notify_task_assigned" as keyof Prefs, label: "task_assigned" },
      { field: "notify_task_completed" as keyof Prefs, label: "task_completed" },
    ],
  },
  {
    key: "cat_deals",
    items: [
      { field: "notify_deal_created" as keyof Prefs, label: "deal_created" },
      { field: "notify_deal_stage_changed" as keyof Prefs, label: "deal_stage_changed" },
      { field: "notify_deal_won" as keyof Prefs, label: "deal_won" },
      { field: "notify_deal_payment" as keyof Prefs, label: "deal_payment" },
    ],
  },
  {
    key: "cat_quotations",
    items: [
      { field: "notify_quotation_approval" as keyof Prefs, label: "quotation_approval" },
      { field: "notify_quotation_approved" as keyof Prefs, label: "quotation_approved" },
      { field: "notify_quotation_rejected" as keyof Prefs, label: "quotation_rejected" },
    ],
  },
  {
    key: "cat_other",
    items: [
      { field: "notify_client_request" as keyof Prefs, label: "client_request" },
    ],
  },
];

export default function NotificationPreferencesPanel({ lang = "th" }: { lang?: Lang }) {
  const L = (k: string) => T[k]?.[lang] || T[k]?.en || k;
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/notification-preferences")
      .then(r => r.json())
      .then(d => { if (d.preferences) setPrefs(d.preferences); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback(async (field: keyof Prefs) => {
    const newVal = !prefs[field];
    setPrefs(p => ({ ...p, [field]: newVal }));
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newVal }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }, [prefs]);

  const setAll = useCallback(async (val: boolean) => {
    const update: Record<string, boolean> = {};
    for (const cat of CATEGORIES) {
      for (const item of cat.items) {
        update[item.field] = val;
      }
    }
    setPrefs(p => ({ ...p, ...update }));
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#003087]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Bell className="w-6 h-6 text-[#003087]" />
        <h2 className="text-lg font-bold text-gray-900">{L("title")}</h2>
        {saving && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />{L("saving")}</span>}
        {saved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{L("saved")}</span>}
      </div>
      <p className="text-sm text-gray-500 mb-4">{L("subtitle")}</p>

      {/* Bulk actions */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setAll(true)}
          className="text-xs px-3 py-1.5 rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition">
          {L("enable_all")}
        </button>
        <button onClick={() => setAll(false)}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition">
          {L("disable_all")}
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-5">
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <span className="text-sm font-semibold text-gray-700">{L(cat.key)}</span>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {cat.items.map(item => (
                <label key={item.field} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#F8FAFC] transition">
                  <div className="flex items-center gap-2.5">
                    {prefs[item.field]
                      ? <Bell className="w-4 h-4 text-[#003087]" />
                      : <BellOff className="w-4 h-4 text-gray-300" />}
                    <span className={prefs[item.field] ? "text-sm text-gray-800" : "text-sm text-gray-400"}>{L(item.label)}</span>
                  </div>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={prefs[item.field]} onChange={() => toggle(item.field)} />
                    <div className={`w-10 h-5.5 rounded-full transition-colors ${prefs[item.field] ? "bg-[#003087]" : "bg-gray-200"}`}
                      style={{ width: 40, height: 22 }}>
                      <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${prefs[item.field] ? "translate-x-5" : "translate-x-0.5"}`}
                        style={{ width: 18, height: 18, top: 2, transform: prefs[item.field] ? "translateX(20px)" : "translateX(2px)" }} />
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
