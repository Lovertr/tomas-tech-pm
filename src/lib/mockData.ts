export const mockPositions = [
  { id: "p1", name_th: "ผู้จัดการโครงการ", name_en: "Project Manager", name_jp: "プロジェクトマネージャー", rate: 850, color: "#003087" },
  { id: "p2", name_th: "วิศวกร PLC", name_en: "PLC Engineer", name_jp: "PLCエンジニア", rate: 750, color: "#0066CC" },
  { id: "p3", name_th: "นักพัฒนา MES", name_en: "MES Developer", name_jp: "MES開発者", rate: 700, color: "#00AEEF" },
  { id: "p4", name_th: "นักพัฒนาซอฟต์แวร์", name_en: "Software Developer", name_jp: "ソフトウェア開発者", rate: 650, color: "#6366F1" },
  { id: "p5", name_th: "นักออกแบบ UI/UX", name_en: "UI/UX Designer", name_jp: "UI/UXデザイナー", rate: 550, color: "#F7941D" },
  { id: "p6", name_th: "ผู้ทดสอบ QA", name_en: "QA Tester", name_jp: "QAテスター", rate: 500, color: "#EF4444" },
  { id: "p7", name_th: "วิศวกร DevOps", name_en: "DevOps Engineer", name_jp: "DevOpsエンジニア", rate: 750, color: "#10B981" },
  { id: "p8", name_th: "ที่ปรึกษาด้านเทคนิค", name_en: "Technical Consultant", name_jp: "技術コンサルタント", rate: 900, color: "#DC2626" },
];

export const mockMembers = [
  { id: "m1", name_th: "สมชาย ทานาก้า", name_en: "Somchai Tanaka", name_jp: "田中ソムチャイ", position_id: "p1", rate: 850, avatar: "ST", dept: "Management" },
  { id: "m2", name_th: "ยูกิ ซาโต้", name_en: "Yuki Sato", name_jp: "佐藤ユキ", position_id: "p2", rate: 750, avatar: "YS", dept: "Engineering" },
  { id: "m3", name_th: "อนันต์ วิลสัน", name_en: "Anant Wilson", name_jp: "ウィルソンアナンタ", position_id: "p3", rate: 700, avatar: "AW", dept: "Engineering" },
  { id: "m4", name_th: "มินา คิมูระ", name_en: "Mina Kimura", name_jp: "木村ミナ", position_id: "p4", rate: 650, avatar: "MK", dept: "Development" },
  { id: "m5", name_th: "ณัฐ ซูซูกิ", name_en: "Nat Suzuki", name_jp: "鈴木ナット", position_id: "p5", rate: 550, avatar: "NS", dept: "Design" },
  { id: "m6", name_th: "พิมพ์ ทาเคชิ", name_en: "Pim Takeshi", name_jp: "竹下ピム", position_id: "p6", rate: 500, avatar: "PT", dept: "QA" },
  { id: "m7", name_th: "ธนา ยามาดะ", name_en: "Tana Yamada", name_jp: "山田タナ", position_id: "p7", rate: 750, avatar: "TY", dept: "DevOps" },
  { id: "m8", name_th: "ฮิโรชิ นากามูระ", name_en: "Hiroshi Nakamura", name_jp: "中村ヒロシ", position_id: "p8", rate: 900, avatar: "HN", dept: "Consulting" },
];

export const mockProjects = [
  { id: "pr1", code: "TT-2024-001", name_th: "ระบบ WMS สำหรับ Mitsubishi", name_en: "WMS System for Mitsubishi", name_jp: "三菱向けWMSシステム", status: "in_progress", priority: "high", client: "Mitsubishi Materials", startDate: "2024-01-15", endDate: "2024-06-30", budget: 850000, progress: 65, members: ["m1", "m3", "m4", "m5"] },
  { id: "pr2", code: "TT-2024-002", name_th: "MES โรงงาน NANKAI", name_en: "NANKAI Factory MES", name_jp: "南海工場MES", status: "in_progress", priority: "urgent", client: "NANKAI Industries", startDate: "2024-02-01", endDate: "2024-08-31", budget: 1200000, progress: 40, members: ["m1", "m2", "m3", "m6"] },
  { id: "pr3", code: "TT-2024-003", name_th: "PLC Automation IBC", name_en: "IBC PLC Automation", name_jp: "IBC PLCオートメーション", status: "planning", priority: "medium", client: "IBC Corporation", startDate: "2024-04-01", endDate: "2024-09-30", budget: 600000, progress: 10, members: ["m2", "m7"] },
  { id: "pr4", code: "TT-2024-004", name_th: "PEGASUS Stock Management", name_en: "PEGASUS Stock Management", name_jp: "PEGASUSストック管理", status: "completed", priority: "medium", client: "Thai Summit Group", startDate: "2023-09-01", endDate: "2024-02-28", budget: 450000, progress: 100, members: ["m3", "m4"] },
  { id: "pr5", code: "TT-2024-005", name_th: "ASPROVA Production Planning", name_en: "ASPROVA Production Planning", name_jp: "ASPROVA生産計画", status: "on_hold", priority: "low", client: "Siam Cement Group", startDate: "2024-03-01", endDate: "2024-12-31", budget: 980000, progress: 20, members: ["m1", "m8"] },
];

export const mockTasks = [
  { id: "t1", project_id: "pr1", title: "Database Schema Design", status: "done", priority: "high", assignee: "m4", dueDate: "2024-02-15", hours: 24 },
  { id: "t2", project_id: "pr1", title: "API Development", status: "in_progress", priority: "high", assignee: "m4", dueDate: "2024-03-30", hours: 80 },
  { id: "t3", project_id: "pr1", title: "Barcode Scanner Integration", status: "in_progress", priority: "urgent", assignee: "m3", dueDate: "2024-04-15", hours: 40 },
  { id: "t4", project_id: "pr1", title: "UI Design", status: "review", priority: "medium", assignee: "m5", dueDate: "2024-03-20", hours: 32 },
  { id: "t5", project_id: "pr1", title: "User Testing", status: "todo", priority: "medium", assignee: "m5", dueDate: "2024-05-15", hours: 16 },
  { id: "t6", project_id: "pr2", title: "PLC Communication Protocol", status: "in_progress", priority: "urgent", assignee: "m2", dueDate: "2024-04-30", hours: 60 },
  { id: "t7", project_id: "pr2", title: "MES Dashboard", status: "todo", priority: "high", assignee: "m3", dueDate: "2024-05-31", hours: 48 },
  { id: "t8", project_id: "pr2", title: "Data Collection Module", status: "backlog", priority: "medium", assignee: "m3", dueDate: "2024-06-30", hours: 36 },
  { id: "t9", project_id: "pr2", title: "QA Testing Phase 1", status: "todo", priority: "high", assignee: "m6", dueDate: "2024-06-15", hours: 24 },
  { id: "t10", project_id: "pr3", title: "PLC Program Design", status: "backlog", priority: "high", assignee: "m2", dueDate: "2024-05-15", hours: 80 },
  { id: "t11", project_id: "pr3", title: "Infrastructure Setup", status: "todo", priority: "medium", assignee: "m7", dueDate: "2024-04-30", hours: 20 },
];

export const mockTimeLogs = [
  { id: "tl1", project_id: "pr1", task_id: "t1", member_id: "m4", date: "2024-03-01", hours: 8, rate: 650, status: "approved" },
  { id: "tl2", project_id: "pr1", task_id: "t2", member_id: "m4", date: "2024-03-02", hours: 7, rate: 650, status: "approved" },
  { id: "tl3", project_id: "pr1", task_id: "t3", member_id: "m3", date: "2024-03-02", hours: 8, rate: 700, status: "approved" },
  { id: "tl4", project_id: "pr1", task_id: "t4", member_id: "m5", date: "2024-03-03", hours: 6, rate: 550, status: "pending" },
  { id: "tl5", project_id: "pr2", task_id: "t6", member_id: "m2", date: "2024-03-01", hours: 8, rate: 750, status: "approved" },
  { id: "tl6", project_id: "pr2", task_id: "t6", member_id: "m2", date: "2024-03-04", hours: 8, rate: 750, status: "approved" },
  { id: "tl7", project_id: "pr2", task_id: "t7", member_id: "m3", date: "2024-03-05", hours: 6, rate: 700, status: "approved" },
  { id: "tl8", project_id: "pr1", task_id: "t2", member_id: "m4", date: "2024-03-06", hours: 8, rate: 650, status: "approved" },
  { id: "tl9", project_id: "pr2", task_id: "t9", member_id: "m6", date: "2024-03-07", hours: 4, rate: 500, status: "pending" },
  { id: "tl10", project_id: "pr1", task_id: "t1", member_id: "m1", date: "2024-03-01", hours: 3, rate: 850, status: "approved" },
];

export const monthlyCostData = [
  { month: "Oct", cost: 125000 }, { month: "Nov", cost: 198000 },
  { month: "Dec", cost: 165000 }, { month: "Jan", cost: 210000 },
  { month: "Feb", cost: 245000 }, { month: "Mar", cost: 189000 },
];
