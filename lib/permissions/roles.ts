import { ADMIN_ROLES, TASK_ROLES, WRITE_ROLES, type WorkspaceRole } from "@/lib/types";

/**
 * Client-side/UI permission helpers. These exist ONLY to drive what the UI
 * shows (hide a button a user can't use). They are never the source of
 * truth for authorization — every mutation is re-checked by Postgres RLS
 * policies (see supabase/migrations/0001_init.sql), so a user who bypasses
 * the UI still cannot perform an action their role doesn't allow.
 */
export function canWriteCompanyData(role: WorkspaceRole | null | undefined): boolean {
  return !!role && WRITE_ROLES.includes(role);
}

export function canManageTasks(role: WorkspaceRole | null | undefined): boolean {
  return !!role && TASK_ROLES.includes(role);
}

export function canManageWorkspace(role: WorkspaceRole | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

export function isViewer(role: WorkspaceRole | null | undefined): boolean {
  return role === "VIEWER";
}
