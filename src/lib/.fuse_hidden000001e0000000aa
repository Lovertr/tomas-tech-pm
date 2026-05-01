// ── Help Center Content — 3 languages (TH / EN / JP) ──
// Each section maps to a sidebar group / feature area.
// Keep this file updated whenever features change.

export interface HelpArticle {
  id: string;
  title: { th: string; en: string; jp: string };
  content: { th: string; en: string; jp: string };
  tags: string[];
}

export interface HelpSection {
  id: string;
  title: { th: string; en: string; jp: string };
  icon: string; // lucide icon name
  articles: HelpArticle[];
}

export const HELP_SECTIONS: HelpSection[] = [
  // ═══════════════════════════════════════════════════════
  // 1. GETTING STARTED / เริ่มต้นใช้งาน
  // ═══════════════════════════════════════════════════════
  {
    id: "getting_started",
    title: { th: "เริ่มต้นใช้งาน", en: "Getting Started", jp: "はじめに" },
    icon: "Rocket",
    articles: [
      {
        id: "login",
        title: { th: "การเข้าสู่ระบบ", en: "Logging In", jp: "ログイン" },
        content: {
          th: `เปิดเว็บแอป แล้วกรอก Username และ Password ที่ได้รับจากผู้ดูแลระบบ จากนั้นกดปุ่ม "เข้าสู่ระบบ"\n\nหากลืมรหัสผ่าน ให้ติดต่อผู้ดูแลระบบ (Admin) เพื่อรีเซ็ตรหัสผ่านให้\n\nหลังเข้าสู่ระบบ คุณจะเห็น Dashboard สรุปภาพรวมโครงการ งาน และข้อมูลสำคัญ`,
          en: `Open the web app and enter the Username and Password provided by your administrator. Click "Login" to proceed.\n\nIf you forgot your password, contact your Admin to reset it.\n\nAfter login, you'll see the Dashboard with an overview of projects, tasks, and key information.`,
          jp: `ウェブアプリを開き、管理者から提供されたユーザー名とパスワードを入力してください。「ログイン」をクリックして進みます。\n\nパスワードを忘れた場合は、管理者に連絡してリセットしてもらいましょう。\n\nログイン後、プロジェクト、タスク、重要な情報の概要を示すダッシュボードが表示されます。`,
        },
        tags: ["login", "password", "เข้าสู่ระบบ", "รหัสผ่าน", "ログイン"],
      },
      {
        id: "sidebar_navigation",
        title: { th: "เมนูด้านข้าง (Sidebar)", en: "Sidebar Navigation", jp: "サイドバーナビゲーション" },
        content: {
          th: `เมนูด้านซ้ายแบ่งเป็นหมวดหมู่:\n• ภาพรวม — Dashboard, งานของฉัน\n• การวางแผน — โครงการ, งาน, Gantt, Milestones, ปฏิทิน, Sprint, ประชุม\n• ติดตาม & ควบคุม — ความเสี่ยง, ปัญหา, Change Request, บันทึกตัดสินใจ, พอร์ทัลลูกค้า\n• ทีม & เวลา — ทีมงาน, จัดสรรทีม, Workload, บันทึกเวลา, อนุมัติ, Manpower\n• การเงิน — งบโครงการ, รายรับ-จ่าย, ใบเสนอราคา, ใบแจ้งหนี้\n• CRM & การขาย — ลูกค้า, ดีล, กิจกรรมขาย, รายงานการขาย\n• ระบบ — แผนก, จัดการผู้ใช้, ตั้งค่า\n\nเมนูจะแสดงเฉพาะหน้าที่คุณมีสิทธิ์เข้าถึง สามารถยุบ/ขยาย sidebar ด้วยปุ่มลูกศรด้านล่าง`,
          en: `The left menu is organized into categories:\n• Overview — Dashboard, My Tasks\n• Planning — Projects, Tasks, Gantt, Milestones, Calendar, Sprint, Meetings\n• Tracking — Risks, Issues, Change Requests, Decisions, Client Portal\n• Team — Team Members, Allocation, Workload, Time Log, Approval, Manpower\n• Finance — Budget, Transactions, Quotations, Invoices\n• CRM & Sales — Customers, Deals, Activities, Sales Report\n• System — Departments, User Management, Settings\n\nOnly pages you have permission to access are shown. Collapse/expand the sidebar using the arrow button at the bottom.`,
          jp: `左メニューはカテゴリ別に整理されています：\n• 概要 — ダッシュボード、マイタスク\n• 計画 — プロジェクト、タスク、ガントチャート、マイルストーン、カレンダー、スプリント、会議\n• 追跡 — リスク、課題、変更リクエスト、意思決定ログ、クライアントポータル\n• チーム — メンバー、割り当て、ワークロード、タイムログ、承認、人員配置\n• 財務 — 予算、取引、見積書、請求書\n• CRM・営業 — 顧客、商談、営業活動、営業レポート\n• システム — 部門、ユーザー管理、設定\n\nアクセス権のあるページのみ表示されます。下部の矢印ボタンでサイドバーを折りたたみ/展開できます。`,
        },
        tags: ["sidebar", "menu", "navigation", "เมนู", "ナビゲーション"],
      },
      {
        id: "language_switch",
        title: { th: "เปลี่ยนภาษา", en: "Change Language", jp: "言語を変更する" },
        content: {
          th: `ระบบรองรับ 3 ภาษา: ไทย, English, 日本語\n\nวิธีเปลี่ยนภาษา:\n1. คลิกที่ปุ่มภาษา (TH/EN/JP) ที่มุมขวาบนของหน้าจอ\n2. เลือกภาษาที่ต้องการ\n3. ระบบจะเปลี่ยนภาษาทันที\n\nภาษาจะถูกจดจำไว้สำหรับครั้งต่อไปที่เข้าใช้งาน`,
          en: `The system supports 3 languages: Thai, English, Japanese.\n\nTo change language:\n1. Click the language button (TH/EN/JP) at the top-right corner\n2. Select your preferred language\n3. The interface updates immediately\n\nYour language preference is remembered for future sessions.`,
          jp: `システムは3つの言語をサポートしています：タイ語、英語、日本語\n\n言語の変更方法：\n1. 右上隅の言語ボタン（TH/EN/JP）をクリック\n2. 希望の言語を選択\n3. インターフェースが即座に更新されます\n\n言語設定は次回以降も記憶されます。`,
        },
        tags: ["language", "ภาษา", "言語", "i18n"],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 2. DASHBOARD / แดชบอร์ด
  // ═══════════════════════════════════════════════════════
  {
    id: "dashboard",
    title: { th: "แดชบอร์ด", en: "Dashboard", jp: "ダッシュボード" },
    icon: "LayoutDashboard",
    articles: [
      {
        id: "dashboard_overview",
        title: { th: "ภาพรวม Dashboard", en: "Dashboard Overview", jp: "ダッシュボード概要" },
        content: {
          th: `Dashboard แสดงข้อมูลสรุปรวมของทั้งระบบ:\n\n• การ์ดสรุป — จำนวนโครงการ, งานทั้งหมด, สมาชิกทีม, รายได้\n• กราฟงาน — สถานะงานตาม (To Do, In Progress, Done)\n• กราฟรายได้ — แนวโน้มรายรับ-รายจ่ายรายเดือน\n• AI Standup — สรุปรายวันอัตโนมัติ สิ่งที่ทำเมื่อวาน/จะทำวันนี้\n• งานเร่งด่วน — งานที่ใกล้ครบกำหนดหรือเลยกำหนด\n\nข้อมูลจะอัปเดตแบบ real-time ทุกครั้งที่เปิดหน้า`,
          en: `The Dashboard shows a summary of the entire system:\n\n• Summary cards — Project count, total tasks, team members, revenue\n• Task chart — Status breakdown (To Do, In Progress, Done)\n• Revenue chart — Monthly income/expense trends\n• AI Standup — Auto-generated daily summary of yesterday/today\n• Urgent tasks — Tasks approaching or past their deadline\n\nData updates in real-time every time you open the page.`,
          jp: `ダッシュボードはシステム全体のサマリーを表示します：\n\n• サマリーカード — プロジェクト数、総タスク数、チームメンバー、売上\n• タスクチャート — ステータス内訳（To Do、進行中、完了）\n• 売上チャート — 月次の収入/支出トレンド\n• AIスタンドアップ — 昨日/今日の自動生成デイリーサマリー\n• 緊急タスク — 期限が近い、または過ぎたタスク\n\nページを開くたびにリアルタイムで更新されます。`,
        },
        tags: ["dashboard", "overview", "ภาพรวม", "ダッシュボード"],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 3. PROJECTS / โครงการ
  // ═══════════════════════════════════════════════════════
  {
    id: "projects",
    title: { th: "โครงการ", en: "Projects", jp: "プロジェクト" },
    icon: "FolderKanban",
    articles: [
      {
        id: "project_list",
        title: { th: "รายการโครงการ", en: "Project List", jp: "プロジェクト一覧" },
        content: {
          th: `หน้าโครงการแสดงรายการโครงการทั้งหมดในรูปแบบการ์ด แต่ละการ์ดแสดง:\n• ชื่อโครงการ + รหัสโครงการ\n• สถานะ (Planning, In Progress, Completed, On Hold, Cancelled)\n• % ความคืบหน้า\n• ลูกค้าที่เกี่ยวข้อง\n• จำนวนสมาชิกในทีม\n\nสามารถกรองตามสถานะ ค้นหาตามชื่อ และเรียงลำดับได้`,
          en: `The Projects page shows all projects as cards. Each card displays:\n• Project name + code\n• Status (Planning, In Progress, Completed, On Hold, Cancelled)\n• Progress percentage\n• Associated customer\n• Team member count\n\nYou can filter by status, search by name, and sort results.`,
          jp: `プロジェクトページはすべてのプロジェクトをカードで表示します。各カードには以下が表示されます：\n• プロジェクト名 + コード\n• ステータス（計画中、進行中、完了、保留、キャンセル）\n• 進捗率\n• 関連顧客\n• チームメンバー数\n\nステータスでフィルタリング、名前で検索、結果の並べ替えが可能です。`,
        },
        tags: ["project", "โครงการ", "プロジェクト", "create", "status"],
      },
      {
        id: "project_create",
        title: { th: "สร้างโครงการใหม่", en: "Create a Project", jp: "新規プロジェクト作成" },
        content: {
          th: `คลิกปุ่ม "เพิ่มโครงการ" แล้วกรอกข้อมูล:\n• ชื่อโครงการ (TH/EN/JP) — ต้องกรอกอย่างน้อย 1 ภาษา\n• รหัสโครงการ (เช่น PRJ-001)\n• ลูกค้า — เลือกจากรายชื่อลูกค้าในระบบ\n• วันที่เริ่ม/สิ้นสุด\n• งบประมาณ\n• คำอธิบาย\n\nเมื่อ Deal ในระบบ CRM ได้รับ PO ระบบจะสร้างโครงการให้อัตโนมัติ`,
          en: `Click "Add Project" and fill in:\n• Project name (TH/EN/JP) — at least 1 language required\n• Project code (e.g. PRJ-001)\n• Customer — select from existing customers\n• Start/End dates\n• Budget\n• Description\n\nWhen a Deal in CRM receives a PO, a project is automatically created.`,
          jp: `「プロジェクト追加」をクリックして入力：\n• プロジェクト名（タイ語/英語/日本語）— 少なくとも1言語必須\n• プロジェクトコード（例：PRJ-001）\n• 顧客 — 既存顧客から選択\n• 開始日/終了日\n• 予算\n• 説明\n\nCRMの商談がPOを受け取ると、プロジェクトが自動的に作成されます。`,
        },
        tags: ["create project", "สร้างโครงการ", "プロジェクト作成"],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 4. TASKS / งาน
  // ═══════════════════════════════════════════════════════
  {
    id: "tasks",
    title: { th: "งาน (Tasks)", en: "Tasks", jp: "タスク" },
    icon: "ListTodo",
    articles: [
      {
        id: "kanban_board",
        title: { th: "บอร์ด Kanban", en: "Kanban Board", jp: "カンバンボード" },
        content: {
          th: `หน้างานแสดงบอร์ด Kanban แบ่ง 3 สดมภ์:\n• To Do — งานที่ยังไม่เริ่ม\n• In Progress — งานที่กำลังทำ\n• Done — งานที่เสร็จแล้ว\n\nสามารถลากงานระหว่างสดมภ์ได้ หรือคลิกที่งานเพื่อดู/แก้ไขรายละเอียด\n\nกรองงานได้ตาม: โครงการ, ผู้รับผิดชอบ, ลำดับความสำคัญ\n\nงานรองรับชื่อ 3 ภาษา (TH/EN/JP) แสดงตามภาษาที่เลือกในระบบ`,
          en: `The Tasks page shows a Kanban board with 3 columns:\n• To Do — Not started\n• In Progress — Currently working on\n• Done — Completed\n\nDrag tasks between columns or click to view/edit details.\n\nFilter by: project, assignee, priority.\n\nTasks support 3-language names (TH/EN/JP), displayed based on your language setting.`,
          jp: `タスクページは3列のカンバンボードを表示します：\n• To Do — 未着手\n• 進行中 — 作業中\n• 完了 — 完了済み\n\n列間でタスクをドラッグ、またはクリックして詳細を表示/編集できます。\n\nフィルター：プロジェクト、担当者、優先度\n\nタスクは3言語の名前（タイ語/英語/日本語）をサポートし、言語設定に基づいて表示されます。`,
        },
        tags: ["kanban", "task", "drag", "งาน", "タスク"],
      },
      {
        id: "task_create",
        title: { th: "สร้างงาน", en: "Create a Task", jp: "タスク作成" },
        content: {
          th: `คลิก "เพิ่มงาน" แล้วกรอก:\n• ชื่องาน (TH/EN/JP)\n• โครงการที่เกี่ยวข้อง\n• ผู้รับผิดชอบ\n• ลำดับความสำคัญ (Low / Medium / High / Critical)\n• วันครบกำหนด\n• คำอธิบาย\n\nงานใหม่จะเริ่มในสดมภ์ "To Do" อัตโนมัติ`,
          en: `Click "Add Task" and fill in:\n• Task name (TH/EN/JP)\n• Related project\n• Assignee\n• Priority (Low / Medium / High / Critical)\n• Due date\n• Description\n\nNew tasks start in the "To Do" column automatically.`,
          jp: `「タスク追加」をクリックして入力：\n• タスク名（タイ語/英語/日本語）\n• 関連プロジェクト\n• 担当者\n• 優先度（低 / 中 / 高 / 緊急）\n• 期限\n• 説明\n\n新しいタスクは自動的に「To Do」列に追加されます。`,
        },
        tags: ["create task", "สร้างงาน", "タスク作成"],
      },
      {
        id: "my_tasks",
        title: { th: "งานของฉัน", en: "My Tasks", jp: "マイタスク" },
        content: {
          th: `"งานของฉัน" แสดงเฉพาะงานที่ assign ให้คุณ แบ่งตามสถานะ พร้อมแถบ progress\n\nสามารถเปลี่ยนสถานะงานได้โดยตรงจากหน้านี้ โดยไม่ต้องเข้าไปที่ Kanban Board\n\nงานที่เลยกำหนดจะแสดงเป็นสีแดง งานใกล้ครบกำหนด (3 วัน) แสดงสีส้ม`,
          en: `"My Tasks" shows only tasks assigned to you, grouped by status with a progress bar.\n\nYou can change task status directly from this page without going to the Kanban Board.\n\nOverdue tasks appear in red. Tasks due within 3 days appear in orange.`,
          jp: `「マイタスク」は自分に割り当てられたタスクのみをステータス別に表示し、進捗バーも表示されます。\n\nカンバンボードに行かずに、このページから直接タスクのステータスを変更できます。\n\n期限超過のタスクは赤色、3日以内に期限のタスクはオレンジ色で表示されます。`,
        },
        tags: ["my tasks", "งานของฉัน", "マイタスク"],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 5. TEAM / ทีมงาน
  // ═══════════════════════════════════════════════════════
  {
    id: "team",
    title: { th: "ทีมงาน", en: "Team", jp: "チーム" },
    icon: "Users",
    articles: [
      {
        id: "team_list",
        title: { th: "รายชื่อทีมงาน", en: "Team Members", jp: "チームメンバー" },
        content: {
          th: `หน้าทีมงานแสดงสมาชิกทั้งหมดในรูปแบบการ์ด แต่ละการ์ดแสดง:\n• ชื่อ-นามสกุล\n• ตำแหน่ง + แผนก\n• อีเมล / เบอร์โทร\n• % Workload ปัจจุบัน\n\nสามารถกรองตามแผนกได้ด้วย dropdown ด้านบน\n\nการเพิ่มสมาชิกใหม่ ให้ไปที่ "จัดการผู้ใช้" ในเมนูระบบ เพราะระบบจะสร้างบัญชีผู้ใช้และข้อมูลสมาชิกพร้อมกัน`,
          en: `The Team page displays all members as cards showing:\n• Full name\n• Position + Department\n• Email / Phone\n• Current workload percentage\n\nFilter by department using the dropdown at the top.\n\nTo add a new member, go to "User Management" in the System menu — the system creates both user account and member profile together.`,
          jp: `チームページはすべてのメンバーをカードで表示します：\n• 氏名\n• 職位 + 部門\n• メール / 電話\n• 現在のワークロード率\n\n上部のドロップダウンで部門別にフィルタリングできます。\n\n新しいメンバーを追加するには、システムメニューの「ユーザー管理」に移動してください — ユーザーアカウントとメンバープロフィールが同時に作成されます。`,
        },
        tags: ["team", "member", "ทีมงาน", "สมาชิก", "チーム", "メンバー"],
      },
      {
        id: "allocation",
        title: { th: "จัดสรรทีม", en: "Team Allocation", jp: "チーム割り当て" },
        content: {
          th: `หน้าจัดสรรทีมใช้กำหนดว่าสมาชิกแต่ละคนทำงานในโครงการไหน กี่ %\n\nกรอกข้อมูล:\n• เลือกโครงการ + สมาชิก\n• Allocation % (0-100)\n• Role in Project (PM, Developer, Tester, ฯลฯ)\n• วันที่เริ่ม/สิ้นสุด\n\nระบบจะคำนวณ Workload รวมอัตโนมัติ หากเกิน 100% จะแสดงเตือน`,
          en: `The Allocation page assigns team members to projects with a percentage.\n\nFill in:\n• Select project + member\n• Allocation % (0-100)\n• Role in Project (PM, Developer, Tester, etc.)\n• Start/End dates\n\nThe system auto-calculates total workload. Warnings appear if it exceeds 100%.`,
          jp: `割り当てページはチームメンバーをプロジェクトにパーセンテージで割り当てます。\n\n入力項目：\n• プロジェクト + メンバーを選択\n• 割り当て率（0-100%）\n• プロジェクト内の役割（PM、開発者、テスターなど）\n• 開始日/終了日\n\nシステムが合計ワークロードを自動計算します。100%を超えると警告が表示されます。`,
        },
        tags: ["allocation", "workload", "จัดสรร", "割り当て"],
      },
      {
        id: "timelog",
        title: { th: "บันทึกเวลา", en: "Time Logging", jp: "タイムログ" },
        content: {
          th: `บันทึกเวลาทำงานได้ 2 วิธี:\n\n1. Floating Timer — กดปุ่มนาฬิกาลอยที่มุมขวาล่าง เลือกโครงการแล้วเริ่มจับเวลา กดหยุดเมื่อเสร็จ ระบบจะบันทึกอัตโนมัติ\n\n2. กรอกเอง — ไปหน้า "บันทึกเวลา" คลิก "เพิ่ม" กรอกโครงการ, งาน, ชั่วโมง, วันที่\n\nข้อมูลบันทึกเวลาจะถูกนำไปคำนวณ Workload, ค่าใช้จ่ายโครงการ, และ AI Standup`,
          en: `Log work time in 2 ways:\n\n1. Floating Timer — Click the clock button at the bottom-right corner. Select a project and start the timer. Stop when done — it saves automatically.\n\n2. Manual entry — Go to "Time Log" page, click "Add", enter project, task, hours, and date.\n\nTime log data feeds into Workload calculations, project costs, and AI Standup summaries.`,
          jp: `作業時間を2つの方法で記録できます：\n\n1. フローティングタイマー — 右下隅の時計ボタンをクリック。プロジェクトを選択してタイマーを開始。完了したら停止 — 自動保存されます。\n\n2. 手動入力 — 「タイムログ」ページで「追加」をクリックし、プロジェクト、タスク、時間、日付を入力。\n\nタイムログデータはワークロード計算、プロジェクトコスト、AIスタンドアップに使用されます。`,
        },
        tags: ["time", "timer", "เวลา", "จับเวลา", "タイム"],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 6. CRM & SALES
  // ═══════════════════════════════════════════════════════
  {
    id: "crm",
    title: { th: "CRM & การขาย", en: "CRM & Sales", jp: "CRM・営業" },
    icon: "Building2",
    articles: [
      {
        id: "customers",
        title: { th: "จัดการลูกค้า", en: "Customer Management", jp: "顧客管理" },
        content: {
          th: `หน้าลูกค้าแสดงรายชื่อบริษัทลูกค้าทั้งหมด คลิกที่ลูกค้าเพื่อดูรายละเอียด:\n\n• ข้อมูลทั่วไป — ชื่อบริษัท, ที่อยู่, เบอร์โทร, อีเมล\n• แท็บโครงการ — โครงการทั้งหมดของลูกค้านี้\n• แท็บดีล — ดีลทั้งหมดในระบบ\n• แท็บใบเสนอราคา — ใบเสนอราคาที่เคยส่ง\n• แท็บความคิดเห็น — บันทึกโน้ตเกี่ยวกับลูกค้า`,
          en: `The Customers page lists all customer companies. Click a customer for details:\n\n• General info — Company name, address, phone, email\n• Projects tab — All projects for this customer\n• Deals tab — All deals in the pipeline\n• Quotations tab — Quotations sent\n• Comments tab — Notes about the customer`,
          jp: `顧客ページはすべての顧客企業を一覧表示します。顧客をクリックして詳細を表示：\n\n• 基本情報 — 会社名、住所、電話、メール\n• プロジェクトタブ — この顧客のすべてのプロジェクト\n• 商談タブ — パイプライン内のすべての商談\n• 見積書タブ — 送付済みの見積書\n• コメントタブ — 顧客に関するメモ`,
        },
        tags: ["customer", "ลูกค้า", "顧客"],
      },
      {
        id: "deals_pipeline",
        title: { th: "ดีล Pipeline", en: "Deals Pipeline", jp: "商談パイプライン" },
        content: {
          th: `ระบบดีลแบ่งเป็นขั้นตอน (Stages):\n• ลีดใหม่ → ติดต่อแล้ว → นำเสนอแล้ว → เจรจาต่อรอง → ส่งใบเสนอราคา → ได้รับ PO → ได้รับยอดชำระแล้ว → ปิดไม่สำเร็จ\n\nเมื่อดีลได้ "ได้รับ PO" ระบบจะ:\n1. สร้างโครงการใหม่อัตโนมัติ\n2. เชื่อมโยงกับลูกค้าในแท็บโครงการ\n\nลากดีลระหว่าง Stage ได้เหมือน Kanban`,
          en: `The Deals system has pipeline stages:\n• New Lead → Contacted → Presented → Negotiating → Quotation Sent → PO Received → Payment Received → Closed Lost\n\nWhen a deal reaches "PO Received", the system:\n1. Auto-creates a new project\n2. Links it to the customer\n\nDrag deals between stages like a Kanban board.`,
          jp: `商談システムにはパイプラインステージがあります：\n• 新規リード → 連絡済み → 提案済み → 交渉中 → 見積送付 → PO受領 → 入金済み → 失注\n\n商談が「PO受領」に達すると、システムは：\n1. 新しいプロジェクトを自動作成\n2. 顧客にリンク\n\nカンバンボードのようにステージ間でドラッグできます。`,
        },
        tags: ["deal", "pipeline", "ดีล", "商談", "PO"],
      },
      {
        id: "quotations",
        title: { th: "ใบเสนอราคา", en: "Quotations", jp: "見積書" },
        content: {
          th: `สร้างใบเสนอราคาแบบมืออาชีพ พร้อมหัวกระดาษ TOMAS TECH:\n\n1. คลิก "สร้างใบเสนอราคา"\n2. เลือกลูกค้า + ดีล\n3. เพิ่มรายการสินค้า/บริการ พร้อมราคา จำนวน ส่วนลด\n4. ระบุเงื่อนไข, วันหมดอายุ, หมายเหตุ\n5. บันทึก → ส่งอนุมัติ → หัวหน้าอนุมัติ → ดาวน์โหลด PDF\n\nรองรับส่วนลดแบบ % หรือจำนวนเงิน ทั้งรายรายการและรวม\n\nดาวน์โหลดได้ทั้ง PDF และ Excel`,
          en: `Create professional quotations with TOMAS TECH letterhead:\n\n1. Click "Create Quotation"\n2. Select customer + deal\n3. Add line items with price, quantity, discount\n4. Set terms, expiry date, notes\n5. Save → Submit for approval → Manager approves → Download PDF\n\nSupports % or fixed amount discounts per item and overall.\n\nDownload as PDF or Excel.`,
          jp: `TOMAS TECHレターヘッド付きのプロフェッショナルな見積書を作成：\n\n1.「見積書作成」をクリック\n2. 顧客 + 商談を選択\n3. 品目を追加（価格、数量、割引）\n4. 条件、有効期限、備考を設定\n5. 保存 → 承認申請 → マネージャー承認 → PDFダウンロード\n\n品目別および全体の%割引または金額割引に対応。\n\nPDFまたはExcelでダウンロード可能。`,
        },
        tags: ["quotation", "ใบเสนอราคา", "見積書", "PDF"],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 7. FINANCE / การเงิน
  // ═══════════════════════════════════════════════════════
  {
    id: "finance",
    title: { th: "การเงิน", en: "Finance", jp: "財務" },
    icon: "Wallet",
    articles: [
      {
        id: "finance_overview",
        title: { th: "ภาพรวมการเงิน", en: "Finance Overview", jp: "財務概要" },
        content: {
          th: `ระบบการเงินประกอบด้วย:\n\n• งบโครงการ — กำหนดงบประมาณและติดตามการใช้จ่ายแต่ละโครงการ\n• รายรับ-รายจ่าย (Transactions) — บันทึกธุรกรรมทุกประเภท (Income, Expense, Transfer)\n• ใบเสนอราคา — จัดการใบเสนอราคาพร้อมระบบอนุมัติ\n• ใบแจ้งหนี้ — จัดการใบแจ้งหนี้และติดตามสถานะการชำระเงิน\n• ค่าใช้จ่าย — สรุปค่าใช้จ่ายตามโครงการ/แผนก\n• รายงานการเงิน — กราฟรายรับ-รายจ่ายรายเดือน, สรุปกำไร/ขาดทุน`,
          en: `The Finance system includes:\n\n• Project Budget — Set budgets and track spending per project\n• Transactions — Record all transaction types (Income, Expense, Transfer)\n• Quotations — Manage quotations with approval workflow\n• Invoices — Manage invoices and track payment status\n• Costs — Cost summary by project/department\n• Financial Reports — Monthly income/expense charts, profit/loss summary`,
          jp: `財務システムには以下が含まれます：\n\n• プロジェクト予算 — プロジェクトごとの予算設定と支出追跡\n• 取引 — すべての取引タイプの記録（収入、支出、振替）\n• 見積書 — 承認ワークフロー付きの見積書管理\n• 請求書 — 請求書の管理と支払状況の追跡\n• コスト — プロジェクト/部門別のコストサマリー\n• 財務レポート — 月次収入/支出チャート、損益サマリー`,
        },
        tags: ["finance", "budget", "transaction", "การเงิน", "งบ", "財務"],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 8. CLIENT PORTAL
  // ═══════════════════════════════════════════════════════
  {
    id: "client_portal",
    title: { th: "พอร์ทัลลูกค้า", en: "Client Portal", jp: "クライアントポータル" },
    icon: "Link2",
    articles: [
      {
        id: "portal_setup",
        title: { th: "ตั้งค่าพอร์ทัลลูกค้า", en: "Portal Setup", jp: "ポータル設定" },
        content: {
          th: `พอร์ทัลลูกค้าให้ลูกค้าเข้าดูความคืบหน้าโครงการได้โดยไม่ต้อง login:\n\n1. ไปที่หน้าโครงการ → แท็บ "พอร์ทัลลูกค้า"\n2. คลิก "สร้าง Token" — ระบบจะสร้างลิงก์เฉพาะ\n3. ส่งลิงก์ให้ลูกค้า\n\nลูกค้าจะเห็น:\n• ภาพรวมโครงการ + % ความคืบหน้า\n• Gantt Chart ของ tasks\n• ส่งคำร้องขอ (Request)\n• แชทกับทีมงาน + แนบไฟล์\n\nสามารถ Revoke token ได้ตลอดเวลาหากต้องการยกเลิกการเข้าถึง`,
          en: `The Client Portal lets customers view project progress without logging in:\n\n1. Go to project page → "Client Portal" tab\n2. Click "Generate Token" — creates a unique link\n3. Share the link with the customer\n\nCustomers see:\n• Project overview + progress %\n• Gantt Chart of tasks\n• Submit requests\n• Chat with team + attach files\n\nYou can revoke the token anytime to remove access.`,
          jp: `クライアントポータルは、顧客がログインせずにプロジェクトの進捗を確認できます：\n\n1. プロジェクトページ →「クライアントポータル」タブ\n2.「トークン生成」をクリック — 固有リンクが作成されます\n3. 顧客にリンクを共有\n\n顧客が確認できる内容：\n• プロジェクト概要 + 進捗率\n• タスクのガントチャート\n• リクエストの送信\n• チームとのチャット + ファイル添付\n\nいつでもトークンを取り消してアクセスを削除できます。`,
        },
        tags: ["portal", "client", "token", "พอร์ทัล", "ポータル"],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 9. ADMIN / ระบบ
  // ═══════════════════════════════════════════════════════
  {
    id: "admin",
    title: { th: "ระบบ & การตั้งค่า", en: "System & Settings", jp: "システム・設定" },
    icon: "Settings",
    articles: [
      {
        id: "user_management",
        title: { th: "จัดการผู้ใช้", en: "User Management", jp: "ユーザー管理" },
        content: {
          th: `ผู้ดูแลระบบ (Admin) สามารถจัดการผู้ใช้ได้ที่ ระบบ → จัดการผู้ใช้:\n\n• เพิ่มผู้ใช้ใหม่ — กรอก username, password, ชื่อ (3 ภาษา), อีเมล, เบอร์โทร, แผนก, ตำแหน่ง, สิทธิ์ (Role)\n• แก้ไขข้อมูล — คลิกที่ผู้ใช้เพื่อแก้ไข\n• ลบผู้ใช้ — ลบบัญชีออกจากระบบ\n\nRole ที่มี:\n• Admin — เข้าถึงทุกฟีเจอร์\n• Manager — จัดการโครงการ, ทีม, อนุมัติ\n• Leader — หัวหน้าทีม\n• Member — พนักงานทั่วไป\n• Viewer — ดูข้อมูลอย่างเดียว`,
          en: `Admins can manage users at System → User Management:\n\n• Add user — Enter username, password, name (3 languages), email, phone, department, position, role\n• Edit — Click a user to modify\n• Delete — Remove account from system\n\nAvailable roles:\n• Admin — Full access to all features\n• Manager — Manage projects, teams, approvals\n• Leader — Team leader\n• Member — Regular employee\n• Viewer — Read-only access`,
          jp: `管理者はシステム → ユーザー管理でユーザーを管理できます：\n\n• ユーザー追加 — ユーザー名、パスワード、名前（3言語）、メール、電話、部門、職位、権限を入力\n• 編集 — ユーザーをクリックして変更\n• 削除 — システムからアカウントを削除\n\n利用可能な権限：\n• Admin — すべての機能にフルアクセス\n• Manager — プロジェクト、チーム、承認の管理\n• Leader — チームリーダー\n• Member — 一般社員\n• Viewer — 閲覧のみ`,
        },
        tags: ["user", "admin", "role", "permission", "ผู้ใช้", "สิทธิ์", "ユーザー", "権限"],
      },
      {
        id: "departments",
        title: { th: "แผนก", en: "Departments", jp: "部門" },
        content: {
          th: `จัดการแผนกในองค์กร:\n\n• ดูรายชื่อแผนกทั้งหมดพร้อมจำนวนพนักงาน\n• คลิกเข้าแผนกเพื่อดูรายชื่อพนักงานในแผนก\n• ย้ายพนักงานระหว่างแผนกได้\n• ตั้งค่าสิทธิ์ระดับแผนก — กำหนดว่าแผนกนี้เข้าถึงฟีเจอร์ไหนได้บ้าง\n\nสิทธิ์จะทำงานแบบ 3 ชั้น: Override ส่วนตัว → สิทธิ์แผนก → ค่าเริ่มต้น Role`,
          en: `Manage departments in your organization:\n\n• View all departments with employee counts\n• Click a department to see its members\n• Transfer employees between departments\n• Set department-level permissions — control which features the department can access\n\nPermissions cascade in 3 tiers: Personal Override → Department Permission → Role Default`,
          jp: `組織の部門を管理：\n\n• 従業員数付きの全部門を表示\n• 部門をクリックしてメンバーを確認\n• 部門間で従業員を異動\n• 部門レベルの権限設定 — 部門がアクセスできる機能を制御\n\n権限は3段階：個人オーバーライド → 部門権限 → ロールデフォルト`,
        },
        tags: ["department", "แผนก", "部門", "permission"],
      },
      {
        id: "keyboard_shortcuts",
        title: { th: "Keyboard Shortcuts", en: "Keyboard Shortcuts", jp: "キーボードショートカット" },
        content: {
          th: `ใช้คีย์ลัดเพื่อทำงานเร็วขึ้น:\n\n• Ctrl+K — เปิด Command Palette (ค้นหาเมนูและคำสั่ง)\n• Ctrl+/ — แสดงรายการ Shortcuts ทั้งหมด\n\nCommand Palette ให้คุณค้นหาและเปิดหน้าต่างๆ ได้อย่างรวดเร็วโดยพิมพ์ชื่อ`,
          en: `Use keyboard shortcuts for faster navigation:\n\n• Ctrl+K — Open Command Palette (search menus and commands)\n• Ctrl+/ — Show all shortcuts\n\nThe Command Palette lets you quickly search and open any page by typing its name.`,
          jp: `キーボードショートカットで素早く操作：\n\n• Ctrl+K — コマンドパレットを開く（メニューとコマンドの検索）\n• Ctrl+/ — すべてのショートカットを表示\n\nコマンドパレットでは、名前を入力して任意のページを素早く検索して開くことができます。`,
        },
        tags: ["shortcut", "keyboard", "คีย์ลัด", "ショートカット"],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 10. PLANNING TOOLS
  // ═══════════════════════════════════════════════════════
  {
    id: "planning",
    title: { th: "เครื่องมือวางแผน", en: "Planning Tools", jp: "計画ツール" },
    icon: "CalendarDays",
    articles: [
      {
        id: "gantt_chart",
        title: { th: "Gantt Chart", en: "Gantt Chart", jp: "ガントチャート" },
        content: {
          th: `Gantt Chart แสดง timeline ของงานทั้งหมดในโครงการ:\n\n• แกนซ้ายแสดงรายชื่องาน\n• แกนบนแสดงเดือน/วัน\n• แถบสีแสดงระยะเวลาของแต่ละงาน\n• สีแสดงสถานะ: เขียว (Done), ฟ้า (In Progress), เทา (To Do)\n• วันหยุดสุดสัปดาห์แสดงเป็นแถบจาง\n\nเลือกโครงการจาก dropdown ด้านบนเพื่อดู Gantt ของโครงการนั้น`,
          en: `The Gantt Chart shows the timeline of all tasks in a project:\n\n• Left axis shows task names\n• Top axis shows months/days\n• Colored bars show task duration\n• Colors indicate status: Green (Done), Blue (In Progress), Gray (To Do)\n• Weekend days shown with light shading\n\nSelect a project from the dropdown to view its Gantt chart.`,
          jp: `ガントチャートはプロジェクト内のすべてのタスクのタイムラインを表示します：\n\n• 左軸にタスク名\n• 上軸に月/日\n• 色付きバーでタスク期間を表示\n• 色はステータスを示す：緑（完了）、青（進行中）、グレー（To Do）\n• 週末は薄いシェーディングで表示\n\nドロップダウンからプロジェクトを選択してガントチャートを表示します。`,
        },
        tags: ["gantt", "timeline", "chart", "แผนภูมิ", "ガント"],
      },
      {
        id: "sprint",
        title: { th: "Sprint", en: "Sprint Management", jp: "スプリント管理" },
        content: {
          th: `Sprint ใช้จัดการงานแบบ Agile ช่วง 1-4 สัปดาห์:\n\n• สร้าง Sprint ใหม่ — กำหนดชื่อ, วันเริ่ม, วันสิ้นสุด\n• เพิ่มงานเข้า Sprint\n• ติดตาม progress ของ Sprint\n• ปิด Sprint เมื่อเสร็จ — งานที่ยังไม่เสร็จจะย้ายไป Sprint ถัดไป`,
          en: `Sprints organize work in Agile cycles of 1-4 weeks:\n\n• Create Sprint — Set name, start date, end date\n• Add tasks to Sprint\n• Track Sprint progress\n• Close Sprint when done — incomplete tasks move to the next Sprint`,
          jp: `スプリントは1-4週間のアジャイルサイクルで作業を整理します：\n\n• スプリント作成 — 名前、開始日、終了日を設定\n• タスクをスプリントに追加\n• スプリントの進捗を追跡\n• 完了したらスプリントをクローズ — 未完了タスクは次のスプリントに移動`,
        },
        tags: ["sprint", "agile", "スプリント"],
      },
      {
        id: "meetings",
        title: { th: "บันทึกประชุม", en: "Meeting Notes", jp: "議事録" },
        content: {
          th: `บันทึกการประชุมพร้อม AI ถอดเสียง:\n\n1. สร้างบันทึกประชุมใหม่ — กรอกหัวข้อ, วันที่, ผู้เข้าร่วม\n2. อัดเสียง — กดปุ่มไมค์แล้วพูด AI (Gemini) จะถอดเสียงให้อัตโนมัติ\n3. หรือพิมพ์บันทึกเอง\n4. สรุปด้วย AI — กด "AI สรุป" เพื่อให้ AI สรุปหัวข้อสำคัญ, Action Items, ผู้รับผิดชอบ\n\nรองรับภาษาไทย, อังกฤษ, ญี่ปุ่น ในการถอดเสียง`,
          en: `Meeting Notes with AI transcription:\n\n1. Create a new meeting note — Enter topic, date, attendees\n2. Record audio — Click the mic button and speak. AI (Gemini) auto-transcribes.\n3. Or type notes manually.\n4. AI Summary — Click "AI Summary" for key topics, action items, and assignees.\n\nSupports Thai, English, and Japanese transcription.`,
          jp: `AI文字起こし付きの議事録：\n\n1. 新しい議事録を作成 — トピック、日付、参加者を入力\n2. 録音 — マイクボタンをクリックして話す。AI（Gemini）が自動文字起こし。\n3. またはメモを手動入力。\n4. AIサマリー — 「AIサマリー」をクリックして重要トピック、アクションアイテム、担当者を取得。\n\nタイ語、英語、日本語の文字起こしに対応。`,
        },
        tags: ["meeting", "transcribe", "ประชุม", "ถอดเสียง", "会議", "文字起こし"],
      },
    ],
  },
];

// ── Flatten all articles for search ──
export function getAllArticles(): (HelpArticle & { sectionId: string })[] {
  return HELP_SECTIONS.flatMap(s =>
    s.articles.map(a => ({ ...a, sectionId: s.id }))
  );
}

// ── Build plain-text context for AI Q&A (all content in one string per language) ──
export function buildHelpContext(lang: "th" | "en" | "jp"): string {
  return HELP_SECTIONS.map(s => {
    const sTitle = s.title[lang];
    const articles = s.articles.map(a =>
      `### ${a.title[lang]}\n${a.content[lang]}`
    ).join("\n\n");
    return `## ${sTitle}\n\n${articles}`;
  }).join("\n\n---\n\n");
}
