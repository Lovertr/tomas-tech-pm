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
    version: "1.7.0",
    date: "2026-05-03",
    title: {
      th: "Google Map ลูกค้า + แก้ดีลสำหรับพนักงาน",
      en: "Customer Google Map + Deal Form Fix for Members",
      jp: "顧客Google Map + メンバー向けディールフォーム修正",
    },
    highlights: {
      th: [
        "เพิ่มช่อง Google Map ในฟอร์มลูกค้า — ใส่ลิงก์แสดงแผนที่ขนาดเล็กพร้อมลิงก์เปิดแผนที่",
        "สร้างดีล: พนักงานจะเป็นเจ้าของดีลอัตโนมัติ (ไม่ต้องเลือก)",
        "แก้บั๊กกดบันทึกดีลไม่ได้ — เพิ่มแจ้งเตือนเมื่อเกิดข้อผิดพลาด",
        "Admin/Manager เลือกเจ้าของดีลได้ตามปกติ",
      ],
      en: [
        "Added Google Map field in customer form — paste link to show mini map + open map link",
        "Create deal: members are auto-assigned as deal owner (no selection needed)",
        "Fixed deal save button not working — added error feedback on failure",
        "Admin/Manager can select deal owner as before",
      ],
      jp: [
        "顧客フォームにGoogle Mapフィールドを追加 — リンクでミニマップ表示 + 地図を開くリンク",
        "ディール作成: メンバーは自動的にオーナーに設定（選択不要）",
        "ディール保存ボタンが動作しない問題を修正 — エラーフィードバック追加",
        "管理者/マネージャーは従来通りオーナーを選択可能",
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
        "Customer requests trigger 