"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createWorkspace } from "@/lib/workspaces/service";
import { createCompany } from "@/lib/companies/service";
import { addDirector } from "@/lib/directors/service";
import { addShareholder, recordShareholding } from "@/lib/shareholders/service";
import { companySchema, directorSchema, shareholderSchema, workspaceSchema } from "@/lib/validation/schemas";

export interface OnboardingState {
  error?: string;
}

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const workspaceParsed = workspaceSchema.safeParse({ name: formData.get("workspaceName") });
  if (!workspaceParsed.success) {
    return { error: workspaceParsed.error.issues[0]?.message ?? "Workspace name is required" };
  }

  const companyParsed = companySchema.safeParse({
    legal_name: formData.get("legalName"),
    registration_number: formData.get("registrationNumber") ?? "",
    ntn: formData.get("ntn") ?? "",
    company_type: formData.get("companyType") || undefined,
    province: formData.get("province") || undefined,
  });
  if (!companyParsed.success) {
    return { error: companyParsed.error.issues[0]?.message ?? "Company details are invalid" };
  }

  const workspace = await createWorkspace(supabase, user.id, workspaceParsed.data.name);
  const company = await createCompany(supabase, workspace.id, user.id, companyParsed.data);

  const directorName = formData.get("directorName");
  if (directorName && String(directorName).trim()) {
    const directorParsed = directorSchema.safeParse({ full_name: directorName });
    if (directorParsed.success) {
      await addDirector(supabase, company.id, workspace.id, user.id, directorParsed.data);
    }
  }

  const shareholderName = formData.get("shareholderName");
  if (shareholderName && String(shareholderName).trim()) {
    const shareholderParsed = shareholderSchema.safeParse({
      name: shareholderName,
      entity_type: "INDIVIDUAL",
    });
    if (shareholderParsed.success) {
      const shareholder = await addShareholder(supabase, company.id, workspace.id, user.id, shareholderParsed.data);
      const shares = Number(formData.get("shareholderShares")) || 100;
      await recordShareholding(
        supabase,
        company.id,
        workspace.id,
        user.id,
        shareholder.id,
        shares,
        new Date().toISOString().slice(0, 10),
      );
    }
  }

  redirect(`/companies/${company.id}`);
}
