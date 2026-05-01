'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  display_name_th?: string;
  display_name_jp?: string;
  role: string;
  position_id?: string;
  department?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  language: string;
  theme: string;
  is_active: boolean;
  must_change_password: boolean;
}

export type ModulePerms = Record<string, number>;

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [perms, setPerms] = useState<ModulePerms>({});
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        // load granular per-module permissions
        try {
          const pr = await fetch('/api/permissions/me');
          if (pr.ok) {
            const pd = await pr.json();
            setPerms(pd.permissions ?? {});
          }
        } catch {/* ignore */}
      } else {
        setUser(null); setPerms({});
      }
    } catch {
      setUser(null); setPerms({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Granular permission checks per module
  // Levels: 0=none 1=view 2=comment 3=edit 4=create 5=full
  const moduleLevel = (key: string): number => perms[key] ?? 0;
  const canView = (key: string) => moduleLevel(key) >= 1;
  const canComment = (key: string) => moduleLevel(key) >= 2;
  const canEdit = (key: string) => moduleLevel(key) >= 3;
  const canCreate = (key: string) => moduleLevel(key) >= 4;
  const canDelete = (key: string) => moduleLevel(key) >= 5;

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Permission map aligned with server-side definitions
    const rolePermissions: Record<string, string[]> = {
      admin: [
        'can_manage_users',
        'can_manage_projects',
        'can_manage_tasks',
        'can_manage_positions',
        'can_view_reports',
        'can_manage_settings',
        'can_approve_timelog',
        'can_manage_members',
        'can_view_projects',
        'can_edit_own_tasks',
        'can_log_time',
      ],
      manager: [
        'can_manage_projects',
        'can_manage_tasks',
        'can_view_reports',
        'can_approve_timelog',
        'can_manage_members',
        'can_view_projects',
        'can_edit_own_tasks',
        'can_log_time',
      ],
      member: [
        'can_view_projects',
        'can_edit_own_tasks',
        'can_log_time',
      ],
    };

    const perms = rolePermissions[user.role] || rolePermissions['member'] || [];
    return perms.includes(permission);
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;

  return {
    user,
    loading,
    logout,
    hasPermission,
    isAdmin,
    isManager,
    refetch: fetchUser,
    // Granular module permissions
    perms,
    moduleLevel,
    canView,
    canComment,
    canEdit,
    canCreate,
    canDelete,
  };
}
