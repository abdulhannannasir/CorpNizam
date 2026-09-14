import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit/log";
import type { Workspace } from "@/lib/types";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "workspace"}-${suffix}`;
}

export async function createWorkspace(
  supabase: SupabaseClient,
  userId: string,
  name: string,
) {
  const slug = slugify(name);

  // Creates the workspace and the creator's OWNER membership atomically via
  // a single Postgres function (see supabase/migrations/0005), rather than
  // two separate inserts: a failure between them would otherwise leave an
  // orphaned, ownerless workspace, and INSERT ... RETURNING on a bare
  // `.insert().select()` here would fail RLS until the membership row
  // exists (the workspace's SELECT policy checks workspace membership).
  const { data: workspace, error } = await supabase
    .rpc("create_workspace_with_owner", { p_name: name, p_slug: slug })
    .single<Workspace>();

  if (error || !workspace) {
    throw new Error(error?.message ?? "Failed to create workspace");
  }

  await writeAuditLog(supabase, {
    workspace_id: workspace.id,
    user_id: userId,
    action: "WORKSPACE_CREATED",
    entity_type: "workspace",
    entity_id: workspace.id,
    metadata: { name },
  });

  return workspace;
}

export async function listMyWorkspaces(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name, slug, created_at)")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getWorkspaceRole(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.role ?? null;
}
