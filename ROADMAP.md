# TOMAS TECH PM — แผนพัฒนาระบบ (Development Roadmap)

> สร้าง: 2026-05-01
> อ้างอิงจากการตรวจสอบระบบครอบคลุม 6 มิติ

---

## สรุปภาพรวม

ระบบปัจจุบันครอบคลุมฟีเจอร์หลักครบถ้วน: Project Management, CRM, Finance, People/HR, Tracking & Control, Client Portal แผนด้านล่างคือสิ่งที่แนะนำเพิ่มเติม จัดเป็น 4 Phase ตาม priority และ dependency

| Phase | ระยะเวลา | เป้าหมาย |
|---|---|---|
| Phase 1 | สัปดาห์ 1-2 | แก้จุดอ่อนด้านระบบ + Data Integrity |
| Phase 2 | สัปดาห์ 3-4 | เพิ่ม value ด้านโปรเจค + บุคลากร |
| Phase 3 | สัปดาห์ 5-6 | ยกระดับ CRM + การเงิน |
| Phase 4 | สัปดาห์ 7+ | ฟีเจอร์ขั้นสูง + Technical Foundation |

---

## Phase 1 — ระบบพื้นฐาน & Data Integrity (สัปดาห์ 1-2)

### 1.1 Audit Log / Activity Trail
- **มิติ**: ระบบ (System)
- **Priority**: สูงมาก
- **Effort**: M (2-3 วัน)
- **Impact**: สูง — ปัจจุบันไม่มีบันทึกว่าใครแก้อะไร
- **รายละเอียด**:
  - [ ] สร้างตาราง `audit_logs` (user_id, action, table_name, record_id, old_value, new_value, created_at)
  - [ ] สร้าง helper function `logAudit()` ที่ API routes เรียกเมื่อ INSERT/UPDATE/DELETE
  - [ ] หน้า UI สำหรับ admin ดู audit log (filter ตาม user, table, วันที่)
  - [ ] เพิ่ม audit log ใน API routes สำคัญ: users, members, projects, tasks, deals, quotations, transactions

### 1.2 Department Head (หัวหน้าแผนก)
- **มิติ**: แผนก (Department)
- **Priority**: สูง
- **Effort**: S (1 วัน)
- **Impact**: สูง — ใช้สำหรับ auto-route approval ในอนาคต
- **รายละเอียด**:
  - [ ] เพิ่ม column `head_member_id` (FK → team_members) ในตาราง `departments`
  - [ ] อัปเดต Department Management UI ให้เลือกหัวหน้าแผนกได้
  - [ ] อัปเดต API `/api/departments` ให้รองรับ head_member_id
  - [ ] แสดงชื่อหัวหน้าแผนกในหน้าจัดการแผนก

### 1.3 Notification Preferences
- **มิติ**: ระบบ (System)
- **Priority**: ปานกลาง
- **Effort**: M (2 วัน)
- **Impact**: ปานกลาง — user เลือกรับ notification ประเภทไหน
- **รายละเอียด**:
  - [ ] สร้างตาราง `notification_preferences` (user_id, notification_type, enabled)
  - [ ] หน้า Settings ให้ user toggle notification แต่ละประเภท
  - [ ] อัปเดต notification API ให้เช็ค preferences ก่อนสร้าง notification

### 1.4 Project Health Score
- **มิติ**: โปรเจค (Project Management)
- **Priority**: ปานกลาง
- **Effort**: M (2 วัน)
- **Impact**: สูง — ช่วยผู้บริหารดูภาพรวมทุกโปรเจคเร็ว
- **รายละเอียด**:
  - [ ] สร้าง function คำนวณ health score จาก: task completion %, budget usage %, risk severity, overdue tasks count
  - [ ] แสดง badge 🟢🟡🔴 ในหน้า Dashboard + Project List
  - [ ] เพิ่ม health score ใน API `/api/projects`
  - [ ] สร้าง tooltip แสดง breakdown ของคะแนน

---

## Phase 2 — โปรเจค & บุคลากร (สัปดาห์ 3-4)

### 2.1 Project Templates UI
- **มิติ**: โปรเจค (Project Management)
- **Priority**: สูง
- **Effort**: M (2 วัน)
- **Impact**: สูง — ลดเวลาสร้างโปรเจคใหม่
- **รายละเอียด**:
  - [ ] เพิ่มปุ่ม "สร้างจาก Template" ในหน้าสร้างโปรเจค
  - [ ] แสดงรายการ templates ให้เลือก
  - [ ] เมื่อเลือก template → auto-populate tasks, milestones, risks จาก template
  - [ ] เพิ่ม UI จัดการ templates (สร้าง/แก้ไข/ลบ)

### 2.2 Skill Matrix (ทักษะพนักงาน)
- **มิติ**: บุคลากร (People/HR)
- **Priority**: สูง
- **Effort**: M (2-3 วัน)
- **Impact**: สูง — AI แนะนำจัดสรรคนได้แม่นกว่าดูแค่ตำแหน่ง
- **รายละเอียด**:
  - [ ] สร้างตาราง `member_skills` (member_id, skill_name, proficiency_level 1-5)
  - [ ] สร้างตาราง `skill_catalog` (name, category: frontend/backend/mobile/devops/data/design/management/soft-skill)
  - [ ] เพิ่มแท็บ "ทักษะ" ใน Member Profile Modal
  - [ ] เพิ่ม/ลบ skill + ระดับความชำนาญ (1-5 ดาว)
  - [ ] อัปเดต Manpower AI ให้ใช้ skill data ในการแนะนำจัดสรรคน
  - [ ] หน้า Skill Overview: ดูว่าบริษัทมี skill อะไรบ้าง ขาดอะไร

### 2.3 Leave / Availability Management
- **มิติ**: บุคลากร (People/HR)
- **Priority**: ปานกลาง
- **Effort**: L (3-4 วัน)
- **Impact**: สูง — กระทบ capacity planning โดยตรง
- **รายละเอียด**:
  - [ ] สร้างตาราง `leave_requests` (member_id, type: annual/sick/personal/wfh, start_date, end_date, status: pending/approved/rejected, approved_by)
  - [ ] สร้างตาราง `leave_balances` (member_id, year, annual_quota, sick_quota, used_annual, used_sick)
  - [ ] หน้า "ลางาน" ให้พนักงานส่งคำขอลา
  - [ ] หัวหน้าแผนก approve/reject ผ่านระบบ
  - [ ] แสดงวันลาใน Calendar view
  - [ ] อัปเดต Workload/Allocation ให้หัก capacity วันที่ลา

### 2.4 Role-Based Project Access
- **มิติ**: โปรเจค (Project Management)
- **Priority**: ปานกลาง
- **Effort**: M (2 วัน)
- **Impact**: ปานกลาง — ป้องกัน data leak ภายในโปรเจค
- **รายละเอียด**:
  - [ ] ใช้ `role_in_project` control สิทธิ์ภายในโปรเจค
  - [ ] developer ดู budget/costs ไม่ได้
  - [ ] PM เท่านั้นที่ approve CR, manage milestones
  - [ ] QA เห็นแค่ issues + test-related tasks
  - [ ] สร้าง helper `getProjectPermission(userId, projectId, module)`

### 2.5 Onboarding Checklist
- **มิติ**: บุคลากร (People/HR)
- **Priority**: ต่ำ
- **Effort**: S (1 วัน)
- **Impact**: ปานกลาง — ช่วย HR ไม่ลืมขั้นตอน
- **รายละเอียด**:
  - [ ] สร้าง onboarding task template
  - [ ] เมื่อสร้าง user ใหม่ → auto-create task list: เตรียมอุปกรณ์, ตั้งค่า accounts, อบรมระบบ, แนะนำทีม
  - [ ] แสดงเป็น checklist ในหน้า user profile
  - [ ] ส่ง notification ให้ HR + หัวหน้าแผนก

---

## Phase 3 — CRM & การเงิน (สัปดาห์ 5-6)

### 3.1 Invoice → Transaction Auto-Link
- **มิติ**: การเงิน (Finance)
- **Priority**: สูง
- **Effort**: M (2 วัน)
- **Impact**: สูง — ลดการกรอกซ้ำ + ป้องกันข้อมูลไม่ตรง
- **รายละเอียด**:
  - [ ] เมื่อสร้าง invoice → auto-create transaction (type: income, status: pending)
  - [ ] เมื่อ mark invoice as paid → update transaction status: completed
  - [ ] เพิ่ม link invoice_id ใน transactions table
  - [ ] แสดง linked transaction ในหน้า invoice detail

### 3.2 Quotation Versioning
- **มิติ**: CRM (Sales)
- **Priority**: สูง
- **Effort**: M (2 วัน)
- **Impact**: สูง — ลูกค้ามักขอแก้ใบเสนอราคาหลายรอบ
- **รายละเอียด**:
  - [ ] เพิ่ม column `version` (int, default 1) + `parent_quotation_id` (FK → quotations)
  - [ ] เมื่อ "แก้ไข" ใบเสนอราคาที่ approved แล้ว → สร้าง version ใหม่ (copy + increment version)
  - [ ] แสดง version history ในหน้า quotation detail
  - [ ] เปรียบเทียบ diff ระหว่าง version (มูลค่ารวม, items ที่เปลี่ยน)

### 3.3 Win/Loss Analysis
- **มิติ**: CRM (Sales)
- **Priority**: ปานกลาง
- **Effort**: S (1-2 วัน)
- **Impact**: สูง — เรียนรู้จากทั้ง success และ failure
- **รายละเอียด**:
  - [ ] เพิ่ม fields ใน deals: `close_reason` (text), `close_reason_category` (enum: price/competitor/timing/requirements/budget/other)
  - [ ] บังคับกรอก reason เมื่อย้ายไป closed_won หรือ closed_lost
  - [ ] เพิ่มหน้า Win/Loss Analysis: สัดส่วน win rate, เหตุผลที่แพ้มากสุด, trend over time
  - [ ] AI วิเคราะห์ pattern ของ deal ที่ชนะ vs แพ้

### 3.4 Recurring Expenses
- **มิติ**: การเงิน (Finance)
- **Priority**: ปานกลาง
- **Effort**: M (2 วัน)
- **Impact**: ปานกลาง — ลดงานซ้ำทุกเดือน
- **รายละเอียด**:
  - [ ] สร้างตาราง `recurring_transactions` (name, amount, category, frequency: monthly/quarterly/yearly, next_due_date)
  - [ ] Cron job หรือ manual trigger: สร้าง transaction จาก template เมื่อถึงกำหนด
  - [ ] UI จัดการ recurring expenses (เช่น ค่า server, ค่า license, ค่าเช่าสำนักงาน)
  - [ ] แสดงใน dashboard: ค่าใช้จ่ายประจำที่กำลังจะถึงกำหนด

### 3.5 Lead Scoring
- **มิติ**: CRM (Sales)
- **Priority**: ต่ำ
- **Effort**: M (2 วัน)
- **Impact**: ปานกลาง — ช่วย sales focus ลูกค้าที่มีโอกาสสูง
- **รายละเอียด**:
  - [ ] เพิ่ม column `lead_score` (int 0-100) ในตาราง deals
  - [ ] คำนวณจาก: มูลค่า deal, จำนวน activities, response time, company size, stage ปัจจุบัน
  - [ ] แสดง score badge ใน Pipeline card
  - [ ] เรียงลำดับ deals ตาม score ใน list view
  - [ ] AI แนะนำ: "deal นี้ score สูง ควร focus"

---

## Phase 4 — Technical Foundation & ฟีเจอร์ขั้นสูง (สัปดาห์ 7+)

### 4.1 Multi-Currency Support
- **มิติ**: การเงิน (Finance)
- **Priority**: ปานกลาง (สำคัญถ้ามีลูกค้าญี่ปุ่น)
- **Effort**: L (3-4 วัน)
- **Impact**: สูง — TOMAS TECH มีลูกค้าญี่ปุ่น
- **รายละเอียด**:
  - [ ] เพิ่ม `currency` (enum: THB/JPY/USD) + `exchange_rate` ในตาราง transactions, quotations, invoices
  - [ ] แสดงราคาในสกุลเงินต้นทาง + แปลงเป็น THB ด้วย exchange rate
  - [ ] หน้า Settings: ตั้งค่า default exchange rates
  - [ ] รายงานการเงิน: สรุปยอดเป็น THB (base currency)

### 4.2 API Rate Limiting
- **มิติ**: ระบบ (System)
- **Priority**: ปานกลาง
- **Effort**: S (1 วัน)
- **Impact**: ปานกลาง — ป้องกัน abuse
- **รายละเอียด**:
  - [ ] ใช้ middleware ที่ API routes สำหรับ rate limit
  - [ ] จำกัด: 100 req/min per user สำหรับ read, 30 req/min per user สำหรับ write
  - [ ] Return 429 Too Many Requests เมื่อเกิน
  - [ ] ใช้ in-memory counter (Map) หรือ Supabase cache

### 4.3 Cross-Project Dependency
- **มิติ**: โปรเจค (Project Management)
- **Priority**: ต่ำ
- **Effort**: L (3 วัน)
- **Impact**: ปานกลาง — สำหรับโปรเจคใหญ่ที่มีหลาย sub-project
- **รายละเอียด**:
  - [ ] สร้างตาราง `project_dependencies` (project_id, depends_on_project_id, type, notes)
  - [ ] แสดง dependency graph ใน Multi-project Gantt
  - [ ] แจ้งเตือนเมื่อ dependency project delay

### 4.4 Mobile PWA
- **มิติ**: ระบบ (System)
- **Priority**: ต่ำ
- **Effort**: S (1 วัน)
- **Impact**: สูง — ติดตั้งเป็น app บนมือถือ
- **รายละเอียด**:
  - [ ] สร้าง `manifest.json` (name, icons, theme_color, start_url)
  - [ ] สร้าง Service Worker สำหรับ offline caching (static assets)
  - [ ] เพิ่ม `<link rel="manifest">` ใน layout
  - [ ] ทดสอบ "Add to Home Screen" บน Android/iOS

### 4.5 Department KPIs Dashboard
- **มิติ**: แผนก (Department)
- **Priority**: ต่ำ
- **Effort**: L (3-4 วัน)
- **Impact**: สูง — ช่วยผู้บริหารดูผลงานรายแผนก
- **รายละเอียด**:
  - [ ] หน้า Dashboard รายแผนก แสดง: จำนวนคน, utilization rate, active projects, billable hours, task completion rate
  - [ ] เปรียบเทียบผลงานแต่ละแผนก (bar chart)
  - [ ] Trend over time (line chart)
  - [ ] เพิ่ม department annual budget tracking

### 4.6 Performance Review
- **มิติ**: บุคลากร (People/HR)
- **Priority**: ต่ำ
- **Effort**: L (4-5 วัน)
- **Impact**: สูง — ประเมินผลงานตาม data จริง
- **รายละเอียด**:
  - [ ] สร้างตาราง `performance_reviews` (member_id, period, reviewer_id, scores, comments, status)
  - [ ] คำนวณ summary จาก: timelog hours, task completion rate, on-time delivery %, project feedback
  - [ ] แบบฟอร์ม self-assessment + manager review
  - [ ] Dashboard แสดง trend ผลงานรายบุคคล/รายทีม

### 4.7 Email Integration
- **มิติ**: CRM (Sales)
- **Priority**: ต่ำ
- **Effort**: L (3-4 วัน)
- **Impact**: ปานกลาง
- **รายละเอียด**:
  - [ ] เริ่มจาก manual: log email activity เข้า sales_activities (subject, sent_to, date)
  - [ ] อนาคต: เชื่อม Gmail/Outlook API auto-track emails ที่ส่งถึงลูกค้า
  - [ ] แสดง email history ในแท็บลูกค้า

### 4.8 Expense Approval Workflow
- **มิติ**: การเงิน (Finance)
- **Priority**: ต่ำ
- **Effort**: M (2-3 วัน)
- **Impact**: ปานกลาง
- **รายละเอียด**:
  - [ ] เพิ่ม `approval_status` (pending/approved/rejected) + `approved_by` ใน transactions ที่เป็น expense
  - [ ] Route approval ไปหัวหน้าแผนก (ใช้ department head จาก Phase 1)
  - [ ] Notification แจ้งเตือนเมื่อมี expense รออนุมัติ
  - [ ] Dashboard: รวม expenses ที่ pending approval

---

## สรุป Effort & Priority Matrix

| Item | Phase | Priority | Effort | มิติ |
|---|---|---|---|---|
| Audit Log | 1 | สูงมาก | M | ระบบ |
| Department Head | 1 | สูง | S | แผนก |
| Notification Preferences | 1 | ปานกลาง | M | ระบบ |
| Project Health Score | 1 | ปานกลาง | M | โปรเจค |
| Project Templates UI | 2 | สูง | M | โปรเจค |
| Skill Matrix | 2 | สูง | M | บุคลากร |
| Leave Management | 2 | ปานกลาง | L | บุคลากร |
| Role-Based Project Access | 2 | ปานกลาง | M | โปรเจค |
| Onboarding Checklist | 2 | ต่ำ | S | บุคลากร |
| Invoice → Transaction Link | 3 | สูง | M | การเงิน |
| Quotation Versioning | 3 | สูง | M | CRM |
| Win/Loss Analysis | 3 | ปานกลาง | S | CRM |
| Recurring Expenses | 3 | ปานกลาง | M | การเงิน |
| Lead Scoring | 3 | ต่ำ | M | CRM |
| Multi-Currency | 4 | ปานกลาง | L | การเงิน |
| API Rate Limiting | 4 | ปานกลาง | S | ระบบ |
| Cross-Project Dependency | 4 | ต่ำ | L | โปรเจค |
| Mobile PWA | 4 | ต่ำ | S | ระบบ |
| Department KPIs | 4 | ต่ำ | L | แผนก |
| Performance Review | 4 | ต่ำ | L | บุคลากร |
| Email Integration | 4 | ต่ำ | L | CRM |
| Expense Approval | 4 | ต่ำ | M | การเงิน |

**Effort Legend**: S = 1 วัน, M = 2-3 วัน, L = 3-5 วัน

---

## หมายเหตุ

- Phase 1-2 เน้นสิ่งที่กระทบ daily operation ทันที
- Phase 3 เพิ่ม value ให้ฝ่ายขายและการเงิน
- Phase 4 สำหรับ scale ระยะยาว
- ทุก phase สามารถปรับลำดับได้ตาม business priority
- แนะนำทำ Phase 1 ก่อนเพราะ Audit Log เป็น foundation ของระบบที่ดี
