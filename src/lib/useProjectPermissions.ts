'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

interface ProjectMembership {
  project_id: string;
  role_in_project: string;
}

interface ProjectPermissionsData {
  memberships: ProjectMembership[];
  pm_projects: string[];
  team_member_id: string | null;
  role: string; // admin | manager | member
}

export function useProjectPermissions() {
  const [data, setData] = useState<ProjectPermissionsData>({
    memberships: [],
    pm_projects: [],
    team_member_id: null,
    role: 'member',
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/project-membership');
      if (res.ok) {
        const json = await res.json();
        setData({
          memberships: Array.isArray(json.memberships) ? json.memberships : [],
          pm_projects: Array.isArray(json.pm_projects) ? json.pm_projects : [],
          team_member_id: json.team_member_id ?? null,
          role: json.role ?? 'member',
        });
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const memberProjectIds = useMemo(
    () => new Set(data.memberships.map(m => m.project_id)),
    [data.memberships]
  );

  const pmProjectIds = useMemo(
    () => new Set(data.pm_projects),
    [data.pm_projects]
  );

  const isAdminRole = data.role === 'admin';
  const isManagerRole = data.role === 'manager' || isAdminRole;

  /** Is user a member (any role) of this project? Admin always true. */
  const isProjectMember = useCallback(
    (projectId: string): boolean => {
      if (isAdminRole) return true;
      return memberProjectIds.has(projectId);
    },
    [isAdminRole, memberProjectIds]
  );

  /** Is user a member of ANY project? */
  const isMemberOfAnyProject = useMemo(
    () => isAdminRole || memberProjectIds.size > 0,
    [isAdminRole, memberProjectIds]
  );

  /** Is user PM of this project? Admin always true. */
  const isProjectPM = useCallback(
    (projectId: string): boolean => {
      if (isAdminRole) return true;
      return pmProjectIds.has(projectId);
    },
    [isAdminRole, pmProjectIds]
  );

  /** Is user PM of ANY project? */
  const isPMOfAnyProject = useMemo(
    () => isAdminRole || pmProjectIds.size > 0,
    [isAdminRole, pmProjectIds]
  );

  /**
   * Can user CREATE items in a project context?
   * - Tasks, Issues, Risks, Meetings: any project member
   * - Milestones, Sprints, Decisions, CRs: PM or admin
   *
   * filterProjectId: "all" or specific project ID
   * requirePM: true if only PM/admin can do this action
   */
  const canManageInProject = useCallback(
    (filterProjectId: string, requirePM = false): boolean => {
      if (isAdminRole) return true;
      if (filterProjectId === 'all') {
        return requirePM ? isPMOfAnyProject : isMemberOfAnyProject;
      }
      return requirePM ? isProjectPM(filterProjectId) : isProjectMember(filterProjectId);
    },
    [isAdminRole, isPMOfAnyProject, isMemberOfAnyProject, isProjectPM, isProjectMember]
  );

  /**
   * Can user APPROVE items? (PM or admin only)
   */
  const canApproveInProject = useCallback(
    (filterProjectId: string): boolean => {
      return canManageInProject(filterProjectId, true);
    },
    [canManageInProject]
  );

  return {
    loading,
    isProjectMember,
    isProjectPM,
    isMemberOfAnyProject,
    isPMOfAnyProject,
    canManageInProject,
    canApproveInProject,
    isAdminRole,
    isManagerRole,
    teamMemberId: data.team_member_id,
    refetch: fetchData,
  };
}
