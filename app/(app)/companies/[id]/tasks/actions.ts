"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyAccess } from "@/lib/session/current";
import { completeTask } from "@/lib/workflows/service";

export async function completeTaskAction(companyId: string, taskId: string) {
  const { supabase, workspaceId, user } = await requireCompanyAccess(companyId);
  await completeTask(supabase, taskId, workspaceId, companyId, user.id);
  revalidatePath(`/companies/${companyId}/tasks`);
}
