-- ============================================================
-- TOMAS TECH PM - Mockup Data Cleanup Script
-- ============================================================
-- Run this script to remove ALL mockup/seed data and reset
-- the database to a clean state (keeping only system tables
-- like permission_modules, roles, etc.)
--
-- WARNING: This will DELETE all business data!
-- ============================================================

BEGIN;

-- 1. Financial data
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM quotation_items;
DELETE FROM quotations;
DELETE FROM transactions;
DELETE FROM project_budgets;

-- 2. CRM data
DELETE FROM deal_activities;
DELETE FROM deals;
DELETE FROM customer_contacts;
DELETE FROM customers;

-- 3. Project data (tasks depend on projects)
DELETE FROM tasks;
DELETE FROM project_members;
DELETE FROM projects;

-- 4. People data
DELETE FROM team_members;
DELETE FROM department_permissions;

-- 5. Departments & Positions (keep app_users as they have auth)
DELETE FROM positions;
DELETE FROM departments;

-- 6. Reset app_users department/position assignments (don't delete users)
UPDATE app_users SET department_id = NULL, position_id = NULL;

COMMIT;

-- Verification
SELECT 'departments' as tbl, count(*) FROM departments
UNION ALL SELECT 'team_members', count(*) FROM team_members
UNION ALL SELECT 'projects', count(*) FROM projects
UNION ALL SELECT 'tasks', count(*) FROM tasks
UNION ALL SELECT 'customers', count(*) FROM customers
UNION ALL SELECT 'deals', count(*) FROM deals
UNION ALL SELECT 'quotations', count(*) FROM quotations
UNION ALL SELECT 'invoices', count(*) FROM invoices
UNION ALL SELECT 'transactions', count(*) FROM transactions
UNION ALL SELECT 'department_permissions', count(*) FROM department_permissions
ORDER BY tbl;
