/**
 * Version history / changelog for the TOMAS TECH PM system.
 * Add new entries at the TOP of the array.
 * The banner will show the latest entry if the user hasn't dismissed it.
 */

export interface VersionEntry {
  version: string;          // e.g. "1.5.0"
  date: string;             // ISO date, e.g. "2026-05-03"
  title: Record<"th" | "en" | "jp", string>;
  highlights: Record<"th" | "en" | "jp", string[]>;
}

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "1.5.0",
    date: "2026-05-03",
    title: {
      th: "รองรับหลายภาษาเต็มรูปแบบ + Client Portal ปรับปรุงใหม่",
      en: "Full Multi-Language Support + Client Portal Improvements",
      jp: "多言語対応の完全サポート + クライアントポータル改善",
    },
    highlights: {
      th: [
        "งานและรายละเอียดเปลี่ยนภาษาได้ (TH/EN/JP) ทั้งในระบบและพอร์ทัลลูกค้า",
        "สร้างโครงการ — กรอกชื่อภาษาเดียว ระบบแปลให้อัตโนมัติ",
        "ปุ่มแปลภาษาอัตโนมัติสำหรับข้อความจากลูกค้า",
        "Gantt Chart ในพอร์ทัลลูกค้าแสดงตามภาษาที่เลือก",
      ],
      en: [
        "Tasks and descriptions switch languages (TH/EN/JP) across the system and client portal",
        "Create project — type one language, auto-translate to the others",
        "Auto-translate button for customer-generated messages",
        "Client Portal Gantt Chart follows selected language",
      ],
      jp: [
        "タスクと詳細が言語切替に対応（TH/EN/JP）— システム全体とクライアントポータル",
        "プロジェクト作成 — 1言語入力で他の言語に自動翻訳",
        "顧客メッセージの自動翻訳ボタン",
        "クライアントポータルのガントチャートが選択言語に連動",
      ],
    },
  },
  {
    version: "1.4.0",
    date: "2026-04-28",
    title: {
      th: "Client Portal + ระบบแชทลูกค้า",
      en: "Client Portal + Customer Chat System",
      jp: "クライアントポータル + 顧客チャットシステム",
    },
    highlights: {
      th: [
        "พอร์ทัลลูกค้า — ลูกค้าดูโปรเจคได้โดยไม่ต้องล็อกอิน",
        "ระบบแชทระหว่างลูกค้ากับทีมงาน พร้อมแนบไฟล์",
        "คำร้องจากลูกค้าแจ้งเตือนที่กระดิ่ง + สร้าง Task อัตโนมัติ",
        "สรุปการประชุมที่เปิดให้ลูกค้าเห็นใน Portal",
      ],
      en: [
        "Client Portal — customers view projects without login",
        "Chat system between customers and team with file attachments",
        "Customer requests trigger notifications + auto-create tasks",
        "Meeting notes visible to clients in Portal",
      ],
      jp: [
        "クライアントポータル — ログイン不要でプロジェクト閲覧",
        "顧客とチーム間のチャットシステム（ファイル添付対応）",
        "顧客リクエストが通知 + タスク自動作成をトリガー",
        "ポータルで顧客に公開可能な議事録",
      ],
    },
  },
  {
    version: "1.3.0",
    date: "2026-04-20",
    title: {
      th: "ระบบ CRM + การเงินขั้นสูง",
      en: "Advanced CRM + Finance System",
      jp: "高度なCRM + 財務システム",
    },
    highlights: {
      th: [
        "Pipeline ดีลแบบ drag-and-drop พร้อม Lead Scoring",
        "ใบเสนอราคาแบบมืออาชีพ + ระบบอนุมัติ + PDF",
        "ระบบรายรับ-รายจ่ายอัตโนมัติ + งบประมาณโครงการ",
        "รายงานการขายพร้อม AI วิเคราะห์",
      ],
      en: [
        "Drag-and-drop deal pipeline with Lead Scoring",
        "Professional quotations + approval workflow + PDF export",
        "Automated income/expense tracking + project budgets",
        "Sales reports with AI analysis",
      ],
      jp: [
        "ドラッグ&ドロップのディールパイプライン + リードスコアリング",
        "プロフェッショナルな見積書 + 承認ワークフロー + PDF出力",
        "自動収支管理 + プロジェクト予算",
        "AI分析付き営業レポート",
      ],
    },
  },
];

/** Returns the latest version string */
export const CURRENT_VERSION = VERSION_HISTORY[0]?.version ?? "1.0.0";
