'use client';

import { useState, useEffect, useCallback } from 'react';

// ===== Types (matching DB schema) =====

export interface DBPosition {
  id: string;
  name_th: string | null;
  name_en: string | null;
  name_jp: string | null;
  default_hourly_rate: number;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface DBMember {
  id: string;
  employee_code: string | null;
  first_name_th: string | null;
  last_name_th: string | null;
  first_name_en: string | null;
  last_name_en: string | null;
  first_name_jp: string | null;
  last_name_jp: string | null;
  position_id: string | null;
  hourly_rate: number;
  email: string | null;
  phone: string | null;
  department: string | null;
  user_id: string | null;
  is_active: boolean;
  positions?: DBPosition | null;
  created_at?: string;
}

export interface DBProject {
  id: string;
  project_code: string | null;
  name_th: string | null;
  name_en: string | null;
  name_jp: string | null;
  description: string | null;
  status: string;
  priority: string;
  client_name: string | null;
  client_contact: string | null;
  start_date: string | null;
  end_date: string | null;
  actual_start_date: string | null;
  actual_end_date: string | null;
  estimated_hours: number | null;
  budget_limit: number | null;
  progress: number;
  tags: string[] | null;
  is_archived: boolean;
  created_at?: string;
}

export interface DBTask {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  title_en: string | null;
  title_jp: string | null;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  tags: string[] | null;
  created_at?: string;
}

export interface DBTimeLog {
  id: string;
  project_id: string;
  task_id: string | null;
  team_member_id: string;
  log_date: string;
  hours: number;
  hourly_rate_at_log: number;
  description: string | null;
  is_billable: boolean;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at?: string;
}

// ===== Hook =====

export function useData() {
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [members, setMembers] = useState<DBMember[]>([]);
  const [positions, setPositions] = useState<DBPosition[]>([]);
  const [timelogs, setTimelogs] = useState<DBTimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, tRes, mRes, posRes, tlRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/members'),
        fetch('/api/positions'),
        fetch('/api/timelogs'),
      ]);

      if (pRes.ok) setProjects((await pRes.json()).projects ?? []);
      if (tRes.ok) setTasks((await tRes.json()).tasks ?? []);
      if (mRes.ok) setMembers((await mRes.json()).members ?? []);
      if (posRes.ok) setPositions((await posRes.json()).positions ?? []);
      if (tlRes.ok) setTimelogs((await tlRes.json()).timelogs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ===== Granular refetch =====
  const refetchProjects = useCallback(async () => {
    const r = await fetch('/api/projects');
    if (r.ok) setProjects((await r.json()).projects ?? []);
  }, []);
  const refetchTasks = useCallback(async () => {
    const r = await fetch('/api/tasks');
    if (r.ok) setTasks((await r.json()).tasks ?? []);
  }, []);
  const refetchMembers = useCallback(async () => {
    const r = await fetch('/api/members');
    if (r.ok) setMembers((await r.json()).members ?? []);
  }, []);
  const refetchPositions = useCallback(async () => {
    const r = await fetch('/api/positions');
    if (r.ok) setPositions((await r.json()).positions ?? []);
  }, []);
  const refetchTimelogs = useCallback(async () => {
    const r = await fetch('/api/timelogs');
    if (r.ok) setTimelogs((await r.json()).timelogs ?? []);
  }, []);

  // ===== Mutation helpers (optimistic + refetch) =====
  const createProject = async (payload: Partial<DBProject>) => {
    const r = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Create failed');
    await refetchProjects();
  };
  const updateProject = async (id: string, payload: Partial<DBProject>) => {
    const r = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Update failed');
    await refetchProjects();
  };
  const deleteProject = async (id: string) => {
    const r = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Delete failed');
    await refetchProjects();
  };

  const createTask = async (payload: Partial<DBTask>) => {
    const r = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Create failed');
    await refetchTasks();
  };
  const updateTask = async (id: string, payload: Partial<DBTask>) => {
    const r = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Update failed');
    await refetchTasks();
  };
  const deleteTask = async (id: string) => {
    const r = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Delete failed');
    await refetchTasks();
  };

  const createMember = async (payload: Partial<DBMember>) => {
    const r = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Create failed');
    await refetchMembers();
  };
  const updateMember = async (id: string, payload: Partial<DBMember>) => {
    const r = await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Update failed');
    await refetchMembers();
  };
  const deleteMember = async (id: string) => {
    const r = await fetch(`/api/members/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Delete failed');
    await refetchMembers();
  };

  const createPosition = async (payload: Partial<DBPosition>) => {
    const r = await fetch('/api/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Create failed');
    await refetchPositions();
  };
  const updatePosition = async (id: string, payload: Partial<DBPosition>) => {
    const r = await fetch(`/api/positions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Update failed');
    await refetchPositions();
  };
  const deletePosition = async (id: string) => {
    const r = await fetch(`/api/positions/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Delete failed');
    await refetchPositions();
  };

  const createTimelog = async (payload: Partial<DBTimeLog>) => {
    const r = await fetch('/api/timelogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error((await r.json()).error ?? 'Create failed');
    await refetchTimelogs();
  };

  // ===== Adapters: DB shape -> legacy mockData shape =====
  // These let existing UI code keep working with minimal churn.

  const adaptedPositions = positions.map(p => ({
    id: p.id,
    name_th: p.name_th ?? '',
    name_en: p.name_en ?? '',
    name_jp: p.name_jp ?? '',
    rate: Number(p.default_hourly_rate) || 0,
    color: p.color ?? '#003087',
  }));

  const initials = (en: string | null, th: string | null) => {
    const src = (en || th || '').trim();
    if (!src) return '??';
    const parts = src.split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '??';
  };
  const fullName = (first: string | null, last: string | null) =>
    [first, last].filter(Boolean).join(' ').trim();

  const adaptedMembers = members.map(m => ({
    id: m.id,
    name_th: fullName(m.first_name_th, m.last_name_th) || fullName(m.first_name_en, m.last_name_en),
    name_en: fullName(m.first_name_en, m.last_name_en) || fullName(m.first_name_th, m.last_name_th),
    name_jp: fullName(m.first_name_jp, m.last_name_jp),
    position_id: m.position_id ?? '',
    rate: Number(m.hourly_rate) || 0,
    avatar: initials(
      fullName(m.first_name_en, m.last_name_en),
      fullName(m.first_name_th, m.last_name_th),
    ),
    dept: m.department ?? '',
  }));

  // Project.members: derive from tasks' assignees + timelogs
  const memberIdsByProject = new Map<string, Set<string>>();
  tasks.forEach(t => {
    if (!t.assignee_id) return;
    if (!memberIdsByProject.has(t.project_id)) memberIdsByProject.set(t.project_id, new Set());
    memberIdsByProject.get(t.project_id)!.add(t.assignee_id);
  });
  timelogs.forEach(l => {
    if (!memberIdsByProject.has(l.project_id)) memberIdsByProject.set(l.project_id, new Set());
    memberIdsByProject.get(l.project_id)!.add(l.team_member_id);
  });

  const adaptedProjects = projects.map(p => ({
    id: p.id,
    code: p.project_code ?? '',
    name_th: p.name_th ?? '',
    name_en: p.name_en ?? '',
    name_jp: p.name_jp ?? '',
    status: p.status,
    priority: p.priority,
    client: p.client_name ?? '',
    startDate: p.start_date ?? '',
    endDate: p.end_date ?? '',
    budget: Number(p.budget_limit) || 0,
    progress: p.progress ?? 0,
    members: Array.from(memberIdsByProject.get(p.id) ?? []),
  }));

  const adaptedTasks = tasks.map(t => ({
    id: t.id,
    project_id: t.project_id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    assignee: t.assignee_id ?? '',
    dueDate: t.due_date ?? '',
    hours: Number(t.estimated_hours) || 0,
  }));

  const adaptedTimelogs = timelogs.map(l => ({
    id: l.id,
    project_id: l.project_id,
    task_id: l.task_id ?? '',
    member_id: l.team_member_id,
    date: l.log_date,
    hours: Number(l.hours) || 0,
    rate: Number(l.hourly_rate_at_log) || 0,
    status: l.status,
  }));

  return {
    // raw DB state
    projects, tasks, members, positions, timelogs,
    // legacy-shaped (for existing page.tsx compatibility)
    adaptedProjects, adaptedTasks, adaptedMembers, adaptedPositions, adaptedTimelogs,
    loading, error,
    // refetch
    refetchAll: fetchAll,
    refetchProjects, refetchTasks, refetchMembers, refetchPositions, refetchTimelogs,
    // mutations
    createProject, updateProject, deleteProject,
    createTask, updateTask, deleteTask,
    createMember, updateMember, deleteMember,
    createPosition, updatePosition, deletePosition,
    createTimelog,
  };
}
