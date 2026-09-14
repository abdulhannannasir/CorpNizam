import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditLogEntry {
  workspace_id: string;
  company_id?: string | null;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Writes an append-only audit log entry. There is no corresponding update()
 * or delete() helper by design — audit_logs has no UPDATE/DELETE RLS policy,
 * so the database itself refuses those operations regardless of caller.
 */
export async function writeAuditLog(
  supabase: SupabaseClient,
  entry: AuditLogEntry,
): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    workspace_id: entry.workspace_id,
    company_id: entry.company_id ?? null,
    user_id: entry.user_id,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    metadata: entry.metadata ?? {},
  });

  if (error) {
    // Audit logging must never silently disappear, but it also must not be
    // allowed to break the primary action the user is performing.
    console.error("Failed to write audit log entry:", error, entry);
  }
}
