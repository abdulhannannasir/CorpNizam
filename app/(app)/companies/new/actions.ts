"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session/current";
import { createCompany } from "@/lib/companies/service";
import { companySchema } from "@/lib/validation/schemas";

export interface CompanyFormState {
  error?: string;
}

export async function createCompanyAction(
  _prevState: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const { supabase, workspaceId, user } = await requireSession();

  const parsed = companySchema.safeParse({
    legal_name: formData.get("legal_name"),
    registration_number: formData.get("registration_number") ?? "",
    ntn: formData.get("ntn") ?? "",
    company_type: formData.get("company_type") || undefined,
    incorporation_date: formData.get("incorporation_date") ?? "",
    registered_address: formData.get("registered_address") ?? "",
    province: formData.get("province") || undefined,
    fiscal_year_end: formData.get("fiscal_year_end") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid company details" };
  }

  let companyId: string;
  try {
    const company = await createCompany(supabase, workspaceId, user.id, parsed.data);
    companyId = company.id;
  } catch {
    return { error: "We couldn't save this company. Please try again." };
  }

  redirect(`/companies/${companyId}`);
}
