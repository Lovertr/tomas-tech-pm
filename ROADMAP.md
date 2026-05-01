# TOMAS TECH Project Manager — Development Roadmap

> อัปเดตล่าสุด: 2026-05-01  
> สถานะ: **Phase 1–4 Complete** ✅

---

## Phase 1 — Foundation & Governance ✅ COMPLETE
| # | Feature | Status |
|---|---------|--------|
| 1.1 | Audit Logging (DB + API + Admin UI) | ✅ |
| 1.2 | Department Head (head_member_id + UI) | ✅ |
| 1.3 | Notification Preferences | ✅ |
| 1.4 | Project Health Score | ✅ |
| 1.5 | CI/CD Pipeline (GitHub Actions + Vercel) | ✅ |

## Phase 2 — Team & Process ✅ COMPLETE
| # | Feature | Status |
|---|---------|--------|
| 2.1 | Project Templates | ✅ |
| 2.2 | Skill Matrix (catalog + member skills + UI) | ✅ |
| 2.3 | Leave / Availability Management | ✅ |
| 2.4 | Role-Based Project Access (permission helper) | ✅ |
| 2.5 | Onboarding Checklist (auto-create tasks) | ✅ |

## Phase 3 — Finance & CRM Automation ✅ COMPLETE
| # | Feature | Status |
|---|---------|--------|
| 3.1 | Invoice → Transaction Auto-Link | ✅ |
| 3.2 | Quotation Versioning | ✅ |
| 3.3 | Win/Loss Analysis Dashboard | ✅ |
| 3.4 | Recurring Expenses | ✅ |
| 3.5 | Lead Scoring (auto-calculate) | ✅ |

## Phase 4 — Scale & Intelligence ✅ COMPLETE
| # | Feature | Status |
|---|---------|--------|
| 4.1 | Multi-Currency Support | ✅ |
| 4.2 | API Rate Limiting (middleware) | ✅ |
| 4.3 | Cross-Project Dependencies (UI + API) | ✅ |
| 4.4 | Mobile PWA (manifest + service worker) | ✅ |
| 4.5 | Department KPIs Dashboard | ✅ |
| 4.6 | Performance Reviews (scores + workflow) | ✅ |
| 4.7 | Email Integration (activity logging) | ✅ |
| 4.8 | Expense Approval Workflow | ✅ |

---

## Summary

All 23 features across 4 phases have been implemented:
- **6 new API routes** (skills, leave, recurring-transactions, lead-score, performance-reviews, project-dependencies, onboarding, quotation versioning, transactions/[id])
- **9 new UI panels** (SkillMatrix, LeaveManagement, RecurringExpenses, DeptKPI, WinLoss, ProjectDependency, PerformanceReview, EmailActivity, ExpenseApproval)
- **Infrastructure**: Rate limiting middleware, PWA support, CI/CD pipeline
- **Automation**: Invoice→Transaction link, lead scoring, onboarding checklist
- **Database**: 