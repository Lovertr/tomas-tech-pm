// Granular per-module permission system (CLIENT-SAFE constants only)
// Levels: 0=NONE, 1=VIEW, 2=COMMENT, 3=EDIT, 4=CREATE, 5=FULL
// Server-only helpers live in ./permissions-server.ts

export const PERM = {
  NONE: 0,
  VIEW: 1,
  COMMENT: 2,
  EDIT: 3,
  CREATE: 4,
  FULL: 5,
} as const;

export type PermLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const PERM_LABEL_TH: Record<PermLevel, string> = {
  0: "ไม่เห็น",
  1: "ดูได้",
  2: "ดู+คอมเมนต์",
  3: "แก้ไขได้",
  4: "แก้+สร้าง",
  5: "ทำได้ทุกอย่าง",
};

export const PERM_LABEL_EN: Record<PermLevel, string> = {
  0: "No access",
  1: "View only",
  2: "View + Comment",
  3: "Edit",
  4: "Edit + Create",
  5: "Full access",
};

export const PERM_COLOR: Record<PermLevel, string> = {
  0: "#475569",
  1: "#3B82F6",
  2: "#06B6D4",
  3: "#F7941D",
  4: "#A855F7",
  5: "#22C55E",
};

/** Quick checks against an effective level */
export const can = {
  view: (lvl: PermLevel) => lvl >= PERM.VIEW,
  comment: (lvl: PermLevel) => lvl >= PERM.COMMENT,
  edit: (lvl: PermLevel) => lvl >= PERM.EDIT,
  create: (lvl: PermLevel) => lvl >= PERM.CREATE,
  delete: (lvl: PermLevel) => lvl >= PERM.FULL,
  approve: (lvl: PermLevel) => lvl >= PERM.FULL,
};
