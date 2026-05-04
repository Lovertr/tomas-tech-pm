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
    version: "1.8.1",
    date: "2026-05-04",
    title: {
      th: "จัดการ KPI พนักงาน + แก้ไข bug",
      en: "Employee KPI Management + Bug Fixes",
      jp: "従業員KPI管理 + バグ修正",
    },
    highlights: {
      th: [
        "เพิ่มแท็บ KPI ในหน้าโปรไฟล์พนักงาน — ผู้จัดการ/แอดมินตั้งค่า KPI ให้พนักงานได้",
        "แสดง Auto KPI (จากระบบ) + Manual KPI + ให้คะแนน + ลบ ได้ในหน้าเดียว",
        "เลือกงวด (เดือน) เพื่อดู KPI ย้อนหลังได้",
        "แก้ไข bug เว็บล่มจาก ProjectModal — เพิ่มการป้องกัน Array.isArray",
      ],
      en: [
        "Added KPI tab to employee profile — managers/admins can set KPIs for employees",
        "Shows Auto KPI (from system) + Manual KPI + scoring + delete in one view",
        "Select period (month) to view historical KPIs",
        "Fixed site crash from ProjectModal — added Array.isArray guard",
      ],
      jp: [
        "従業員プロフィールにKPIタブ追加 — マネージャー/管理者が従業員にKPI設定可能",
        "自動KPI + 手動KPI + 評価 + 削除を一画面で表示",
        "期間（月）を選択して過去のKPIを確認可能",
        "ProjectModalからのサイトクラッシュを修正 — Array.isArrayガード追加",
      ],
    },
  },
  {
    version: "1.8.0",
    date: "2026-05-04",
    title: {
      th: "โปรไฟล์ส่วนตัว + KPI รายบุคคล",
      en: "Personal Profile + Individual KPIs",
      jp: "個人プロフィール + 個人KPI",
    },
    highlights: {
      th: [
        "หน้าโปรไฟล์ส่วนตัว — แก้ไขข้อมูลชื่อ อีเมล เบอร์โทร ได้เอง",
        "เปลี่ยนรหัสผ่านด้วยตัวเอง (ยืนยันรหัสเดิม + ตั้งรหัสใหม่)",
        "สรุปภาระงาน: งานที่กำลังทำ งานที่เสร็จแล้ว ชั่วโมงเดือนนี้ โปรเจคที่ร่วม",
        "KPI อัตโนมัติจาก DB: งานเสร็จ อัตราสำเร็จ ชั่วโมงทำงาน ดีลปิด รายได้",
        "KPI กำหนดเอง: ผู้จัดการกำหนด KPI + น้ำหนัก สมาชิกอัปเดตค่าจริง ผู้จัดการให้คะแนน",
      ],
      en: [
        "Personal profile page — edit name, email, phone yourself",
        "Self-service password change (verify old + set new password)",
        "Work summary: tasks in progress, completed, hours this month, active projects",
        "Auto KPIs from DB: tasks completed, completion rate, hours logged, deals closed, revenue",
        "Manual KPIs: managers assign KPIs + weights, members update actuals, managers score",
      ],
      jp: [
        "個人プロフィールページ — 氏名・メール・電話番号を自分で編集",
        "セルフサービスパスワード変更（旧パスワード確認 + 新パスワード設定）",
        "作業サマリー：進行中タスク、完了タスク、今月の時間、参加プロジェクト",
        "自動KPI：タスク完了数、完了率、作業時間、成約数、売上",
        "手動KPI：マネージャーがKPI + 重みを設定、メンバーが実績更新、マネージャーが評価",
      ],
    },
  },
  {
    version: "1.7.0",
    date: "2026-05-03",
    title: {
      th: "Google Map ลูกค้า + ปรับปรุงฟอร์มดีล",
      en: "Customer Google Map + Deal Form Improvements",
      jp: "顧客Google Map + ディールフォーム改善",
    },
    highlights: {
      th: [
        "เพิ่มฟิลด์ Google Map URL ในข้อมูลลูกค้า พร้อมแผนที่ตัวอย่าง",
        "สมาชิก (Member) สร้างดีลจะตั้งเจ้าของเป็นตัวเองอัตโนมัติ",
        "แก้ไขปุ่มบันทึกดีลไม่ทำงาน + แสดง error alert เมื่อบันทึกไม่สำเร็จ",
        "แก้ปัญหา Turbopack crash กับอักขระหลายไบต์ (ญี่ปุ่น/ไทย)",
        "ฟอร์มโครงการ: เปลี่ยนช่องลูกค้าเป็น Dropdown ค้นหาได้ ดึงจากฐานข้อมูลลูกค้า",
      ],
      en: [
        "Added Google Map URL field to customer info with embedded map preview",
        "Members creating deals are automatically set as the owner",
        "Fixed deal save button not working + added error alerts on save failure",
        "Fixed Turbopack crash with multi-byte characters (Japanese/Thai)",
        "Project form: changed customer field to searchable dropdown from customers database",
      ],
      jp: [
        "顧客情報にGoogle Map URLフィールドを追加（埋め込み地図プレビュー付き）",
        "メンバーがディールを作成すると自動的にオーナーに設定",
        "ディール保存ボタンが動作しない問題を修正 + 保存失敗時のエラーアラートを追加",
        "マルチバイト文字（日本語/タイ語）でのTurbopackクラッシュを修正",
        "プロジェクトフォーム：顧客フィールドを検索可能なドロップダウンに変更",
      ],
    },
  },
  {
    version: "1.6.0",
    date: "2026-05-03",
    title: {
      th: "สิทธิ์ตามโปรเจค + แก้บั๊กสำคัญ",
      en: "Project-Based Permissions + Critical Bug Fixes",
      jp: "プロジェクトベースの権限 + 重要なバグ修正",
    },
    highlights: {
      th: [
        "ระบบสิทธิ์ตามโปรเจค — สมาชิกโปรเจคเท่านั้นที่สร้าง/แก้ไขงาน ความเสี่ยง ปัญหา ประชุมได้",
        "PM ของโปรเจค + Admin จัดการ Milestones, Sprints, Change Requests, Decisions ได้",
        "แก้บั๊กดีลและลูกค้าสร้างซ้ำ 2 รายการเมื่อกดบันทึก",
        "แก้ dropdown การพึ่งพาโครงการไม่แสดงชื่อโปรเจค",
      ],
      en: [
        "Project-based permissions — only project members can create/edit tasks, risks, issues, meetings",
        "Project PM + Admin can manage Milestones, Sprints, Change Requests, Decisions",
        "Fixed duplicate creation bug when saving deals or customers",
        "Fixed project dependency dropdown showing empty project names",
      ],
      jp: [
        "プロジェクトベースの権限 — メンバーのみタスク・リスク・課題・会議を作成/編集可能",
        "PM + 管理者がマイルストーン、スプリント、変更リクエスト、意思決定を管理",
        "商談・顧客の保存時に重複作成されるバグを修正",
        "プロジェクト依存関係のドロップダウンでプロジェクト名が表示されない問題を修正",
      ],
    },
  },
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
