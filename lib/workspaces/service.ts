import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit/log";

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

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({ name, slug, created_by: userId })
    .select()
    .single();

  if (error || !workspace) {
    throw new Error(error?.message ?? "Failed to create workspace");
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: "OWNER",
  });

  if (memberError) {
    throw new Error(memberError.message);
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
