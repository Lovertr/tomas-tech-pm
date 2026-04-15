-- ============================================================
-- Phase 4: Manpower Features Migration
-- Adds: project_members allocation, weekly_capacity, timelog approval fields
-- Run in Supabase SQL editor (one-time)
-- ============================================================

-- 1) Add weekly capacity to team_members (default 40 hrs/week)
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS weekly_capacity_hours NUMERIC(6,2) DEFAULT 40;

-- 2) project_members: allocation between project <-> team_member
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  allocation_pct NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (allocation_pct >= 0 AND allocation_pct <= 100),
  role TEXT, -- e.g. "Lead", "Developer", "Tester"
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pm_date_order CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_pm_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_member ON project_members(team_member_id);
CREATE INDEX IF NOT EXISTS idx_pm_dates ON project_members(start_date, end_date);

-- 3) TimeLog approval: add reject reason + approver fields if missing
ALTER TABLE time_logs
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 4) updated_at trigger for project_members
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pm_updated ON project_members;
CREATE TRIGGER trg_pm_updated BEFORE UPDATE ON project_members
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- 5) View: member allocation summary (sum of % across active allocations in range)
-- Useful for overallocation detection
CREATE OR REPLACE VIEW v_member_allocation_current AS
SELECT
  tm.id AS team_member_id,
  tm.first_name_en, tm.last_name_en,
  tm.weekly_capacity_hours,
  COALESCE(SUM(pm.allocation_pct) FILTER (
    WHERE pm.is_active
    AND pm.start_date <= CURRENT_DATE
    AND (pm.end_date IS NULL OR pm.end_date >= CURRENT_DATE)
  ), 0) AS total_allocation_pct,
  COUNT(pm.id) FILTER (
    WHERE pm.is_active
    AND pm.start_date <= CURRENT_DATE
    AND (pm.end_date IS NULL OR pm.end_date >= CURRENT_DATE)
  ) AS active_projects
FROM team_members tm
LEFT JOIN project_members pm ON pm.team_member_id = tm.id
WHERE tm.is_active
GROUP BY tm.id;

-- 6) Grant permissions (Supabase default)
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
-- permissive RLS: service_role bypasses anyway; authenticated can read
DROP POLICY IF EXISTS pm_read ON project_members;
CREATE POLICY pm_read ON project_members FOR SELECT TO authenticated USING (true);

-- Done
