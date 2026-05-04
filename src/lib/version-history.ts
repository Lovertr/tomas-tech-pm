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
    version: "2.1.0",
    date: "2026-05-04",
    title: {
      th: "คลังความรู้ — ศูนย์รวมความรู้บริษัท + AI ถาม-ตอบ",
      en: "Knowledge Base — Company Knowledge Hub + AI Q&A",
      jp: "ナレッジベース — 社内知識ハブ + AI Q&A",
    },
    highlights: {
      th: [
        "เพิ่มหน้าคลังความรู้ — รวบรวมความรู้เกี่ยวกับงานและโปรเจค ระบบ IoT, WMS, MES, PLC, AGV/AMR ฯลฯ",
        "จัดหมวดหมู่ 8 ประเภท: IoT, AGV/AMR, WMS, MES, Production Control, PLC, PEGASUS/ASPROVA, ทั่วไป",
        "ค้นหาบทความ + กรองตามหมวดหมู่ + ปักหมุดบทความสำคัญ",
        "Admin/Manager สร้าง แก้ไข ลบบทความได้ — รองรับ 3 ภาษา (TH/EN/JP) + แท็ก",
        "AI ถาม-ตอบ ความรู้บริษัท — ค้นหาและตอบคำถามจากคลังความรู้โดยอัตโนมัติ",
        "แก้ bug Pipeline: Admin แก้ไข/ลบดีลของคนอื่นได้แล้ว",
      ],
      en: [
        "Added Knowledge Base page — centralized company knowledge for IoT, WMS, MES, PLC, AGV/AMR etc.",
        "8 categories: IoT, AGV/AMR, WMS, MES, Production Control, PLC, PEGASUS/ASPROVA, General",
        "Search articles + filter by category + pin important articles",
        "Admin/Manager can create, edit, delete articles — supports 3 languages (TH/EN/JP) + tags",
        "AI Knowledge Q&A — automatically searches and answers questions from the knowledge base",
        "Fixed Pipeline bug: Admin can now edit/delete other users' deals",
      ],
      jp: [
        "ナレッジベースページを追加 — IoT、WMS、MES、PLC、AGV/AMRなどの社内知識を集約",
        "8カテゴリ: IoT、AGV/AMR、WMS、MES、生産管理、PLC、PEGASUS/ASPROVA、一般",
        "記事検索 + カテゴリフィルター + 重要記事のピン留め",
        "管理者/マネージャーが記事の作成・編集・削除可能 — 3言語対応 + タグ",
        "AIナレッジQ&A — ナレッジベースから自動的に検索して回答",
        "パイプラインバグ修正: 管理者が他のユーザーのディールを編集/削除可能に",
      ],
    },
  },
  {
    version: "2.0.0",
    date: "2026-05-04",
    title: {
      th: "AI ผู้ช่วยขาย — ผู้ช่วยส่วนตัวสำหรับพนักงานขาย",
      en: "AI Sales Assistant — Personal AI for Sales Team",
      jp: "AI営業アシスタント — 営業チーム向けパーソナルAI",
    },
    highlights: {
      th: [
        "เพิ่มหน้า AI ผู้ช่วยขาย — Dashboard วิเคราะห์ภาพรวมดีล + แชทกับ AI",
        "6 การ์ดสรุป: ดีลทั้งหมด, มูลค่า Pipeline, ดีลค้าง, ดีลร้อน, ปิดเดือนนี้, มูลค่าปิด",
        "AI วิเคราะห์ดีลสำคัญ — จัดลำดับความเสี่ยง สูง/กลาง/ต่ำ พร้อมคำแนะนำ",
        "แชทกับ AI: ถามเรื่องดีล ลูกค้า กลยุทธ์การขาย ร่างอีเมล เตรียมนัดลูกค้า",
        "6 คำถามด่วน: วิเคราะห์ดีล, ดีลค้าง, จัดลำดับ, ร่างอีเมล, เตรียมนัด, พยากรณ์ยอด",
        "ลิงก์ LINE Bot สร้าง Proposal อัตโนมัติสำหรับนำเสนอลูกค้า",
        "รองรับ 3 ภาษา: ไทย, อังกฤษ, ญี่ปุ่น",
      ],
      en: [
        "Added AI Sales Assistant page — Deal analytics dashboard + AI chat",
        "6 summary cards: total deals, pipeline value, stuck deals, hot deals, closed this month, closed value",
        "AI analyzes priority deals — risk levels high/medium/low with recommendations",
        "Chat with AI: ask about deals, customers, sales strategy, draft emails, prepare meetings",
        "6 quick actions: analyze deals, stuck deals, prioritize, draft email, prep meeting, forecast",
        "LINE Bot link for auto-generating customer proposals",
        "Full i18n support: Thai, English, Japanese",
      ],
      jp: [
        "AI営業アシスタントページ追加 — ディール分析ダッシュボード + AIチャット",
        "6つのサマリーカード: 全ディール、パイプライン値、停滞ディール、ホットディール、今月成約、成約額",
        "AIが優先ディールを分析 — リスクレベル高/中/低と推奨事項",
        "AIとチャット: ディール、顧客、営業戦略、メール下書き、会議準備について質問",
        "6つのクイックアクション: ディール分析、停滞、優先順位、メール、会議準備、予測",
        "LINE Botリンクで顧客提案書を自動生成",
        "3言語対応: タイ語、英語、日本語",
      ],
    },
  },
  {
    version: "1.9.1",
    date: "2026-05-04",
    title: {
      th: "ปกป้องข้อมูลส่วนตัว: KPI + เบอร์โทร",
      en: "Privacy Protection: KPI + Phone Number",
      jp: "プライバシー保護: KPI + 電話番号",
    },
    highlights: {
      th: [
        "ซ่อนแท็บ KPI จากพนักงานทั่วไปที่ดูโปรไฟล์คนอื่น — เห็นได้เฉพาะตัวเอง/หัวหน้า/แอดมิน",
        "ซ่อนเบอร์โทรศัพท์จากพนักงานทั่วไปที่ดูคนอื่น",
        "จำกัดสิทธิ์: เพิ่ม/ลบ KPI + ให้คะแนนได้เฉพาะหัวหน้า/แอดมิน",
        "พนักงานอัปเดตค่าจริง (Actual) ได้เฉพาะ KPI ของตัวเอง",
        "แก้บั๊ก dropdown ลูกค้าในฟอร์มโปรเจค (ProjectModal)",
      ],
      en: [
        "Hide KPI tab from regular members viewing other profiles — visible only to self/manager/admin",
        "Hide phone number from regular members viewing others",
        "Restricted: add/delete KPI + manager scoring only for manager/admin",
        "Members can only update Actual values for their own KPIs",
        "Fixed customer dropdown bug in ProjectModal",
      ],
      jp: [
        "一般メンバーが他人のプロフィールを閲覧時にKPIタブを非表示 — 本人/マネージャー/管理者のみ表示",
        "一般メンバーが他人の電話番号を非表示",
        "制限: KPIの追加/削除 + マネージャー評価はマネージャー/管理者のみ",
        "メンバーは自分のKPIの実績値のみ更新可能",
        "ProjectModalの顧客ドロップダウンバグを修正",
      ],
    },
  },
  {
    version: "1.9.0",
    date: "2026-05-04",
    title: {
      th: "ปรับปรุง Pipeline การขาย: สิทธิ์ + ชวนเพื่อน + Comment",
      en: "Sales Pipeline: Permissions + Collaborators + Comments",
      jp: "営業パイプライン: 権限 + コラボレーター + コメント",
    },
    highlights: {
      th: [
        "สิทธิ์แก้ไข/ลบดีล — พนักงานแก้ไขได้เฉพาะดีลของตัวเอง + ดีลที่ร่วมงาน",
        "ระบบชวนเพื่อน (Collaborators) — เชิญเพื่อนร่วมงานดีลเดียวกัน 2+ คน",
        "ระบบ Comment — ผู้จัดการ/แอดมินแนะนำและติดตามดีลผ่านความคิดเห็น",
        "หน้ารายละเอียดดีล — ดูข้อมูลดีล ผู้ร่วมงาน ความคิดเห็น ในหน้าเดียว",
        "ปุ่มแปลภาษาในความคิดเห็นและชื่อดีล",
      ],
      en: [
        "Deal edit/delete permissions — members can only modify their own deals or collaborated deals",
        "Collaborator system — invite teammates to work on deals together",
        "Comment system — managers/admins advise and track deals through comments with history",
        "Deal detail view — see deal info, collaborators, and comments in one view",
        "Translate button on comments and deal titles",
      ],
      jp: [
        "ディール編集/削除権限 — メンバーは自分のディールまたはコラボディールのみ編集可能",
        "コラボレーターシステム — チームメイトをディールに招待して共同作業",
        "コメントシステム — マネージャー/管理者がコメントでディールをアドバイス・追跡",
        "ディール詳細ビュー — ディール情報、コラボレーター、コメントを一画面で確認",
        "コメントとディール名に翻訳ボタン",
      ],
    },
  },
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
