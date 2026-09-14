import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceRole } from "@/lib/workspaces/service";
import type { WorkspaceRole } from "@/lib/types";

/**
 * Resolves the signed-in user and their current workspace + role.
 * "Current workspace" is the earliest workspace the user belongs to —
 * enough for the MVP's single-workspace-per-session UX. Every downstream
 * query still passes workspace_id explicitly and is re-checked by RLS, so
 * this is a UX convenience, not an authorization boundary.
 */
export async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(id, name, slug)")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  return {
    supabase,
    user,
    workspaceId: membership.workspace_id as string,
    workspaceName: (membership.workspaces as unknown as { name: string })?.name ?? "Workspace",
    role: membership.role as WorkspaceRole,
  };
}

export async function requireCompanyAccess(companyId: string) {
  const session = await requireSession();
  const { data: company, error } = await session.supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();

  if (error || !company) redirect("/companies");

  return { ...session, company };
}

export async function getWorkspaceRoleFor(workspaceId: string, userId: string) {
  const supabase = await createClient();
  return getWorkspaceRole(supabase, workspaceId, userId);
}
