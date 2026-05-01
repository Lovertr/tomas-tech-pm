# TOMAS TECH — Project Management System
# สถานะโครงการ & แผนงาน

> อัปเดตล่าสุด: 2026-05-01
> Supabase Project ID: `yntqhjjqevxkuyhcpfhe`
> Stack: Next.js 16.2.3 (App Router) + TypeScript + Tailwind CSS + Supabase PostgreSQL
> Deploy: Vercel

---

## 1. สถาปัตยกรรมระบบ (Architecture Overview)

```
Frontend (Next.js App Router)
├── src/app/page.tsx              ← หน้าหลัก (SPA-style, sidebar + panels)
├── src/app/login/page.tsx        ← หน้า Login
├── src/app/portal/[token]/       ← Client Portal (public, ลูกค้าเข้าดู)
├── src/app/api/                  ← API Routes (90+ endpoints)
├── src/components/               ← 44 components + 6 modals
├── src/lib/                      ← Auth, Supabase client, i18n, permissions
└── src/hooks/                    ← Custom hooks (keyboard shortcuts)

Backend (Supabase)
├── PostgreSQL                    ← ฐานข้อมูลหลัก
├── Row Level Security (RLS)      ← ความปลอดภัยระดับแถว
├── Storage                       ← เก็บไฟล์แนบ (attachments bucket)
└── Edge Functions                ← (ยังไม่ได้ใช้)
```

### i18n Pattern
- รองรับ 3 ภาษา: ไทย (th), อังกฤษ (en), ญี่ปุ่น (jp)
- ใช้ local dictionary objects (ไม่ใช่ library)
- Task titles: `title` (TH), `title_en`, `title_jp` พร้อม cascade fallback
- `lang` state อยู่ใน page.tsx ส่งผ่าน props ไปทุก component

### Auth & Permissions
- Login ด้วย username/password → session cookie
- Roles: admin(100), manager(70), leader(50), member(10), viewer(5)
- Permission cascade 3 ชั้น: User Override → Department → Role Default → 0
- 38 permission modules ใน 7 categories: admin, core, crm, finance, people, planning, tracking
- 5 permission levels: 0(ปิด), 1(ดู), 3(สร้าง/แก้), 4(แก้ทั้งหมด), 5(เต็มสิทธิ์)
- Department-based permissions + module-level access control
- ใช้ `getAuthContext()` ตรวจสอบทุก API route
- `get_user_permission_level()` — Postgres function สำหรับ resolve สิทธิ์

### User + Member Architecture
- 2 ตาราง: `app_users` (auth/login) + `team_members` (HR/employee profile)
- ลิงก์ผ่าน `team_members.user_id → app_users.id`
- สร้างผู้ใช้ = ฟอร์มเดียวสร้างทั้ง user + team_member
- แผนกเป็น FK dropdown (department_id) ไม่ใช่ free text

---

## 2. ฟีเจอร์ที่เสร็จแล้ว (Completed Features)

### ภาพรวม & การวางแผน
- [x] Dashboard ภาพรวมโปรเจค (สถิติ, กราฟ, งานค้าง)
- [x] Kanban Board (ลาก-วาง, 5 สถานะ: backlog → done)
- [x] Gantt Chart (SVG, 3 zoom levels: วัน/สัปดาห์/เดือน, 2-row header)
- [x] Calendar View (ปฏิทินงาน)
- [x] Sprint Management (สร้าง/จัดการ sprint)
- [x] Milestones (เป้าหมายโปรเจค)
- [x] Recurring Tasks (งานซ้ำอัตโนมัติ: daily/weekly/biweekly/monthly)
- [x] Task Templates (เทมเพลตงาน)
- [x] Project Templates (เทมเพลตโปรเจค)

### การจัดการงาน (Task Management)
- [x] CRUD tasks พร้อม i18n (th/en/jp)
- [x] Task Detail Drawer (รายละเอียด, checklist, dependencies, comments, activity log, attachments)
- [x] AI Estimate Hours (ประมาณชั่วโมงด้วย AI)
- [x] My Tasks (งานของฉัน)
- [x] Task Dependencies (FS, SS, FF, SF)
- [x] Daily Standup Card (สรุปงาน AI)

### ทีม & เวลา
- [x] Team Members (จัดการพนักงาน, กรองตามแผนก)
- [x] Allocation Manager (จัดสรรคนเข้าโปรเจค, role in project dropdown)
- [x] Workload Heatmap (แผนที่ภาระงาน)
- [x] Time Log (บันทึกเวลา + Floating Timer)
- [x] Time Log Approval (อนุมัติเวลา)
- [x] Manpower Report + AI Analysis (วิเคราะห์กำลังคน)
- [x] Member Profile Modal (โปรไฟล์พนักงาน + งานของฉัน)

### การเงิน
- [x] Project Budget (งบประมาณโปรเจค)
- [x] Transactions (รายรับ-รายจ่าย)
- [x] Quotations (ใบเสนอราคา: ฟอร์ม TOMAS TECH, PDF, Excel, ระบบอนุมัติ)
- [x] Invoices (ใบแจ้งหนี้)
- [x] Finance P&L / EVM (กำไร-ขาดทุน, Earned Value Management)
- [x] Costs (ค่าใช้จ่าย)

### CRM & การขาย
- [x] Customers (ลูกค้า: รายละเอียด, contacts, comments, tabs)
- [x] Deals Pipeline (7 stages: ลีดใหม่ → ได้รับยอดชำระ)
- [x] Sales Activities (17 ประเภทกิจกรรม, กรองตาม Sales)
- [x] Sales Report (กราฟรายได้, พยากรณ์, AI วิเคราะห์)
- [x] Deal → Project auto-creation (ได้ PO → สร้างโปรเจคอัตโนมัติ)

### ติดตาม & ควบคุม
- [x] Risks Panel (ความเสี่ยง)
- [x] Issues Panel (ปัญหา)
- [x] Change Requests (คำร้องเปลี่ยนแปลง → Decision Log อัตโนมัติ)
- [x] Decision Log (บันทึกการตัดสินใจ)
- [x] Meeting Notes (บันทึกประชุม + AI ถอดเสียง Gemini)
- [x] Client Portal (ลูกค้าดูความคืบหน้า + ส่งคำร้อง + แชท + แนบไฟล์)
- [x] Notification Bell (แจ้งเตือน: งาน overdue, deals, quotations, คำร้องลูกค้า)

### ระบบ & UI
- [x] Department Management (9 แผนก + สิทธิ์แผนก + department_id FK)
- [x] User Management (ฟอร์มรวม user+member, 3 ภาษา, dropdown แผนก/ตำแหน่ง)
- [x] Open Projects (โครงการว่าง — สมัครเข้าร่วม)
- [x] Command Palette (Ctrl+K)
- [x] Keyboard Shortcuts (?)
- [x] Light Theme (TOMAS TECH brand: #003087, #00AEEF, #F7941D)
- [x] Mobile Responsive (sidebar ยุบได้)
- [x] Error Boundary (ป้องกัน white page crash)
- [x] Translate Button (แปลข้อความ AI)

---

## 3. DB Migrations ที่ใช้แล้ว

| Migration | รายละเอียด |
|---|---|
| add_task_title_translations | เพิ่ม title_en, title_jp ใน tasks |
| add_recurring_task_title_translations | เพิ่ม title_en, title_jp ใน recurring_tasks |
| add_client_portal_tables | สร้าง client_requests + เพิ่ม source ใน tasks |
| add_attachment_storage | สร้าง attachments bucket + comments attachments |
| add_deal_stages | เพิ่ม stages: new_lead, payment_received |
| add_quotation_columns | ขยาย quotations + quotation_items |
| add_project_enrollment | open_positions, is_enrollment_open, pm_member_id |
| add_department_id_to_members | เพิ่ม department_id FK ใน team_members |
| add_viewer_role | เพิ่ม viewer role (level=5) + default permissions |
| fix_client_portal_category | ย้าย client_portal จาก finance → tracking |
| unify_pm_role | role_in_project: "pm" → "project_manager" |
| ... (และอื่นๆ ก่อนหน้า) | |

---

## 4. แผนงานที่แนะนำ (Recommended Next Steps)

### Priority A — ควรทำก่อน (ส่งผลต่อ usability)

- [ ] **Reports Dashboard** — หน้ารายงานรวม (ตอนนี้มีแค่เมนูว่าง)
  - สรุปภาพรวมทุกโปรเจค, ผลงานทีม, timeline, budget vs actual
  - Export เป็น PDF/Excel

- [ ] **Search & Filter ขั้นสูง** — ค้นหางานข้ามโปรเจค, filter ตามวันที่/สถานะ/คน
  - ตอนนี้ filter ได้แค่ตามโปรเจค

- [ ] **Audit Trail / Activity Log** — บันทึกการเปลี่ยนแปลงทุกอย่างในระบบ
  - ใครแก้อะไร เมื่อไหร่ (ตอนนี้มีแค่ใน Task Detail)

- [ ] **Email Notifications** — แจ้งเตือนทาง Email เมื่อมี task มอบหมาย, deadline ใกล้, comment ใหม่
  - ตอนนี้แจ้งเตือนแค่ในระบบ (bell)

### Priority B — ดีถ้ามี (เพิ่ม value)

- [ ] **Dashboard Charts** — กราฟสรุปภาพรวม (burndown, velocity, team performance)
  - ใช้ recharts ที่มีอยู่แล้ว

- [ ] **File Manager** — จัดการเอกสารโปรเจค (ไม่ใช่แค่แนบไฟล์ใน task)
  - Upload, folder structure, preview

- [ ] **Gantt Dependencies Visual** — ลากเส้น dependency ใน Gantt ได้ (ตอนนี้เป็น arrow แต่ยังสร้างจาก Task Detail เท่านั้น)

- [ ] **Multi-project Gantt** — Gantt รวมหลายโปรเจค

- [ ] **Client Portal — Progress Photos** — ลูกค้าดูรูปความคืบหน้าหน้างานได้

- [ ] **Bulk Operations** — เลือกหลาย task แล้ว update สถานะ/มอบหมายพร้อมกัน

### Priority C — อนาคต (nice-to-have)

- [ ] **Real-time Updates** — ใช้ Supabase Realtime ให้ข้อมูลอัปเดตทันทีโดยไม่ต้อง refresh
- [ ] **Mobile PWA** — Service Worker + manifest.json ให้ install เป็น PWA ได้
- [ ] **API Documentation** — Swagger/OpenAPI สำหรับ API ทั้งหมด
- [ ] **Automated Testing** — Unit tests + E2E tests
- [ ] **CI/CD Pipeline** — GitHub Actions auto-deploy
- [ ] **Data Export/Import** — CSV/Excel export ข้อมูลทั้งหมด
- [ ] **Dark Mode** — โหมดมืด (ตอนนี้ light theme only)
- [ ] **Custom Fields** — ให้ admin กำหนด field เพิ่มเองได้
- [ ] **Webhooks** — ส่ง event ไป LINE/Slack เมื่อเกิดเหตุการณ์สำคัญ
- [ ] **Skill Matrix** — member_skills table (skill, proficiency) สำหรับ AI จัดสรรคน
- [ ] **Leave/Attendance** — ระบบลา/วันหยุด กระทบ capacity planning
- [ ] **Invoice → Transaction auto-link** — สร้าง invoice → pending transaction อัตโนมัติ
- [ ] **Multi-currency** — รองรับ JPY, USD นอกจาก THB
- [ ] **Quotation Versioning** — เก็บ revision history (v1, v2, v3)
- [ ] **Lead Scoring** — คะแนน lead อัตโนมัติสำหรับ CRM
- [ ] **Department Head** — column head_member_id ใน departments สำหรับ auto-route approval
- [ ] **Project Health Score** — คำนวณ 🟢🟡🔴 จาก task completion, budget, risks
- [ ] **Notification Preferences** — user เลือกรับ notification ประเภทไหน
- [ ] **API Rate Limiting** — ป้องกัน abuse บน API routes

---

## 5. ปัญหาที่ควรระวัง (Known Issues & Gotchas)

### Disk Truncation (Edit Tool)
- เมื่อใช้ Edit/Write tool แก้ไฟล์ขนาดใหญ่ (>300 lines) มีโอกาสเกิด null bytes / truncation บน disk
- **วิธีตรวจ**: หลัง edit ทุกครั้ง ให้ verify ด้วย `wc -l` + `xxd | tail` ผ่าน bash
- **วิธีแก้**: `tr -d '\0' < file > /tmp/clean && cat /tmp/clean > file`

### Compile Check
- ต้อง run `npx tsc --noEmit` ทุกครั้งก่อน push
- ถ้ามี error ให้แก้จน 0 errors ก่อน

### Inter-device Move
- ใน bash sandbox ใช้ `mv /tmp/x > /mounted/path` ไม่ได้ (inter-device move)
- ต้องใช้ `cat /tmp/x > /mounted/path` แทน

### Supabase RLS
- บาง table ยังไม่ได้เปิด RLS อย่างเข้มงวด
- ใช้ `supabaseAdmin` (service role) ในทุก API route → bypass RLS
- ถ้า deploy production จริง ควรปรับให้ใช้ user token + RLS policies

### AI Features (Gemini)
- AI Transcription ใช้ Google Gemini → ระวัง hallucination ในข้อความซ้ำ
- มี post-processing ตรวจจับ output ซ้ำแล้ว

---

## 6. บัญชีทดสอบ

| Username | Role | แผนก |
|---|---|---|
| admin | admin | - |
| tanaka_kenji | manager | Software |
| somchai_pm | leader | Software |
| narong_dev | member | Software |
| ... | ... | ... |

> ดูรายชื่อเต็มที่ DB: `SELECT username, role FROM app_users ORDER BY role`

---

## 7. Git Push Commands (Template)

```powershell
cd C:\Users\trin_\tomas-tech-pm
git add -A
git commit -m "feat/fix: <สรุปสิ่งที่ทำ>"
git push origin main
```

---

## 8. ประวัติการอัปเดต (Change Log)

### 2026-05-01
- รวมฟอร์มสร้าง user + member เป็นฟอร์มเดียว (admin/users)
- เปลี่ยนแผนกจาก text input → dropdown FK ทั้งระบบ (members API + MemberModal)
- เพิ่ม department_id ใน team_members + backfill ข้อมูลเดิม
- เพิ่ม viewer role (level=5) + default permissions 38 modules
- แก้ client_portal category: finance → tracking
- Unify role_in_project: "pm" → "project_manager"
- ตรวจสอบระบบสิทธิ์ 3 ชั้นครบ + เพิ่มคำแนะนำครอบคลุม 6 มิติ
- i18n: เพิ่ม title_en, title_jp ใน tasks + recurring_tasks
- Gantt Chart: ปรับ 2-row header (เดือน/วัน), weekend shading
- Client Portal Gantt: ปรับใหม่ให้อ่านง่าย (grid lines, date labels on bars)
- ย้ายพอร์ทัลลูกค้าไป "ติดตาม & ควบคุม"
- แก้ compile errors จาก duplicate lines + missing definitions

### 2026-04-30
- Client Portal: เพิ่มระบบแนบไฟล์ในแชท (ทั้ง portal + internal)
- แก้ username regex รองรับ . - _ /

### 2026-04-29
- Client Portal: ระบบแชท/คอมเมนต์ระหว่างลูกค้ากับทีม
- แก้ bug: admin เพิ่ม user ใหม่ไม่แสดง, FK violation, position_id uuid error
- i18n: แก้ภาษาไม่เปลี่ยนในหลายหน้า

### 2026-04-28
- Client Portal: สร้างหน้า public + internal management
- แจ้งเตือนคำร้องลูกค้าที่ notification bell
- Gantt Chart + รายละเอียดในหน้า Client Portal

### ก่อนหน้านี้
- ระบบ Quotation ครบวงจร (ฟอร์ม TOMAS TECH + PDF + Excel + อนุมัติ)
- AI Transcription (Gemini) + anti-hallucination
- Sales Report: กราฟรายได้ + พยากรณ์ + AI วิเคราะห์
- CRM ครบ: Customers, Deals, Activities
- ระบบแจ้งเตือน, Open Projects, Manpower AI
- Light theme + mobile responsive + keyboard shortcuts
- 9 แผนก + department permissions
- Mockup data (พนักงาน, โปรเจค, tasks, CRM, การเงิน)
