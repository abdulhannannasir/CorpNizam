import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit/log";
import type { ContractInput } from "@/lib/validation/schemas";
import type { Contract, ContractStatus } from "@/lib/types";

function clean(input: ContractInput) {
  return {
    name: input.name,
    counterparty: input.counterparty || null,
    contract_type: input.contract_type || null,
    start_date: input.start_date || null,
    expiry_date: input.expiry_date || null,
    renewal_date: input.renewal_date || null,
    notes: input.notes || null,
  };
}

export async function createContract(
  supabase: SupabaseClient,
  companyId: string,
  workspaceId: string,
  userId: string,
  input: ContractInput,
): Promise<Contract> {
  const { data, error } = await supabase
    .from("contracts")
    .insert({ company_id: companyId, status: "DRAFT", ...clean(input) })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create contract");

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "CONTRACT_CREATED",
    entity_type: "contract",
    entity_id: data.id,
    metadata: { name: data.name },
  });

  return data;
}

export function deriveContractStatus(
  contract: Pick<Contract, "status" | "expiry_date">,
  now: Date = new Date(),
): ContractStatus {
  if (contract.status === "TERMINATED" || contract.status === "DRAFT") return contract.status;
  if (!contract.expiry_date) return contract.status;

  const expiry = new Date(contract.expiry_date);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / msPerDay);

  if (daysUntilExpiry < 0) return "EXPIRED";
  if (daysUntilExpiry <= 30) return "EXPIRING";
  return "ACTIVE";
}

export async function listContracts(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("company_id", companyId)
    .order("expiry_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return data as Contract[];
}
