"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyAccess } from "@/lib/session/current";
import { addDirector } from "@/lib/directors/service";
import { directorSchema } from "@/lib/validation/schemas";

export interface DirectorFormState {
  error?: string;
}

export async function addDirectorAction(
  companyId: string,
  _prevState: DirectorFormState,
  formData: FormData,
): Promise<DirectorFormState> {
  const { supabase, workspaceId, user } = await requireCompanyAccess(companyId);

  const parsed = directorSchema.safeParse({
    full_name: formData.get("full_name"),
    cnic: formData.get("cnic") ?? "",
    designation: formData.get("designation") ?? "",
    appointment_date: formData.get("appointment_date") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid director details" };
  }

  try {
    await addDirector(supabase, companyId, workspaceId, user.id, parsed.data);
  } catch {
    return { error: "We couldn't add this director. Please try again." };
  }

  revalidatePath(`/companies/${companyId}/directors`);
  return {};
}
