import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit/log";
import type { CompanyInput } from "@/lib/validation/schemas";
import type { Company } from "@/lib/types";

function cleanCompanyInput(input: CompanyInput) {
  return {
    legal_name: input.legal_name,
    registration_number: input.registration_number || null,
    ntn: input.ntn || null,
    company_type: input.company_type || null,
    incorporation_date: input.incorporation_date || null,
    registered_address: input.registered_address || null,
    province: input.province || null,
    fiscal_year_end: input.fiscal_year_end || null,
  };
}

export async function createCompany(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  input: CompanyInput,
): Promise<Company> {
  const { data, error } = await supabase
    .from("companies")
    .insert({ workspace_id: workspaceId, ...cleanCompanyInput(input) })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create company");

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: data.id,
    user_id: userId,
    action: "COMPANY_CREATED",
    entity_type: "company",
    entity_id: data.id,
    metadata: { legal_name: data.legal_name },
  });

  return data;
}

export async function updateCompany(
  supabase: SupabaseClient,
  companyId: string,
  workspaceId: string,
  userId: string,
  input: CompanyInput,
): Promise<Company> {
  const { data, error } = await supabase
    .from("companies")
    .update(cleanCompanyInput(input))
    .eq("id", companyId)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update company");

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "COMPANY_UPDATED",
    entity_type: "company",
    entity_id: companyId,
    metadata: { legal_name: data.legal_name },
  });

  return data;
}

export async function listCompanies(supabase: SupabaseClient, workspaceId: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Company[];
}

export async function getCompany(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Company | null;
}
