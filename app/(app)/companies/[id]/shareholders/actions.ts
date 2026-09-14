"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyAccess } from "@/lib/session/current";
import { addShareholder, recordShareholding } from "@/lib/shareholders/service";
import { shareholderSchema } from "@/lib/validation/schemas";

export interface ShareholderFormState {
  error?: string;
}

export async function addShareholderAction(
  companyId: string,
  _prevState: ShareholderFormState,
  formData: FormData,
): Promise<ShareholderFormState> {
  const { supabase, workspaceId, user } = await requireCompanyAccess(companyId);

  const parsed = shareholderSchema.safeParse({
    name: formData.get("name"),
    entity_type: formData.get("entity_type") || "INDIVIDUAL",
    identifier: formData.get("identifier") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid shareholder details" };
  }

  const shares = Number(formData.get("shares"));
  if (!shares || shares <= 0) {
    return { error: "Shares must be greater than zero" };
  }

  try {
    const shareholder = await addShareholder(supabase, companyId, workspaceId, user.id, parsed.data);
    await recordShareholding(
      supabase,
      companyId,
      workspaceId,
      user.id,
      shareholder.id,
      shares,
      new Date().toISOString().slice(0, 10),
    );
  } catch {
    return { error: "We couldn't save this shareholder. Please try again." };
  }

  revalidatePath(`/companies/${companyId}/shareholders`);
  return {};
}
