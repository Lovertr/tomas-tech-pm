// Phase 2.4: Role-Based Project Access helper
// Determines what a user can see/do within a specific project based on their role

export type ProjectRole = "owner" | "manager" | "developer" | "viewer";

export interface ProjectPermission {
  canEditProject: boolean;
  canViewBudget: boolean;
  canEditBudget: boolean;
  canManageTeam: boolean;
  canDeleteProject: boolean;
  canCreateTasks: boolean;
  canEditAllTasks: boolean;
}

export function getProjectPermission(
  userRole: string,          // app-level role: admin, manager, member
  projectRole?: string,      // role within this project
  isProjectOwner?: boolean,  // is the PM/owner of this project
): ProjectPermission {
  // Admin can do everything
  if (userRole === "admin") {
    return { canEditProject: true, canViewBudget: true, canEditBudget: true, canManageTeam: true, canDeleteProject: true, canCreateTasks: true, canEditAllTasks: true };
  }

  // Manager-level
  if (userRole === "manager" || projectRole === "manager" || isProjectOwner) {
    return { canEditProject: true, canViewBudget: true, canEditBudget: isProjectOwner || userRole === "manager", canManageTeam: true, canDeleteProject: false, canCreateTasks: true, canEditAllTasks: true };
  }

  // Developer / member
  if (projectRole === "developer" || projectRole === "member" || userRole === "member") {
    return { canEditProject: false, canViewBudget: false, canEditBudget: false, canManageTeam: false, canDeleteProject: false, canCreateTasks: true, canEditAllTasks: false };
  }

  // Viewer
  return { canEditProject: false, canViewBudget: false, canEditBudget: false, canManageTeam: false, canDeleteProject: false, canCreateTasks: false, canEditAllTasks: false };
}
