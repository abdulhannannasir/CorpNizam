"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyAccess } from "@/lib/session/current";
import { createContract } from "@/lib/contracts/service";
import { contractSchema } from "@/lib/validation/schemas";

export interface ContractFormState {
  error?: string;
}

export async function createContractAction(
  companyId: string,
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const { supabase, workspaceId, user } = await requireCompanyAccess(companyId);

  const parsed = contractSchema.safeParse({
    name: formData.get("name"),
    counterparty: formData.get("counterparty") ?? "",
    contract_type: formData.get("contract_type") ?? "",
    start_date: formData.get("start_date") ?? "",
    expiry_date: formData.get("expiry_date") ?? "",
    renewal_date: formData.get("renewal_date") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid contract details" };
  }

  try {
    await createContract(supabase, companyId, workspaceId, user.id, parsed.data);
  } catch {
    return { error: "We couldn't save this contract. Please try again." };
  }

  revalidatePath(`/companies/${companyId}/contracts`);
  return {};
}
