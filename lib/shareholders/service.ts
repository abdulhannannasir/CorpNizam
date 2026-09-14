import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit/log";
import type { ShareholderInput } from "@/lib/validation/schemas";
import type { Shareholder, Shareholding } from "@/lib/types";
import { calculateOwnership } from "./ownership";

export async function addShareholder(
  supabase: SupabaseClient,
  companyId: string,
  workspaceId: string,
  userId: string,
  input: ShareholderInput,
): Promise<Shareholder> {
  const { data, error } = await supabase
    .from("shareholders")
    .insert({
      company_id: companyId,
      name: input.name,
      entity_type: input.entity_type,
      identifier: input.identifier || null,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to add shareholder");

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "SHAREHOLDER_ADDED",
    entity_type: "shareholder",
    entity_id: data.id,
    metadata: { name: data.name },
  });

  return data;
}

export async function recordShareholding(
  supabase: SupabaseClient,
  companyId: string,
  workspaceId: string,
  userId: string,
  shareholderId: string,
  shares: number,
  effectiveFrom: string,
): Promise<Shareholding> {
  const { data, error } = await supabase
    .from("shareholdings")
    .insert({
      company_id: companyId,
      shareholder_id: shareholderId,
      shares,
      effective_from: effectiveFrom,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to record shareholding");

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "SHAREHOLDING_RECORDED",
    entity_type: "shareholding",
    entity_id: data.id,
    metadata: { shareholder_id: shareholderId, shares },
  });

  return data;
}

export async function listShareholders(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("shareholders")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Shareholder[];
}

export async function listShareholdings(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("shareholdings")
    .select("*")
    .eq("company_id", companyId)
    .order("effective_from", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Shareholding[];
}

/**
 * Records a share transfer between two existing shareholders as of a given
 * date. Historical shareholdings are never mutated in place — the prior
 * position is closed (effective_to set) and new rows are opened, so the
 * full ownership history remains reconstructable at any point in time.
 */
export async function recordShareTransfer(
  supabase: SupabaseClient,
  companyId: string,
  workspaceId: string,
  userId: string,
  params: {
    fromShareholderId: string;
    toShareholderId: string;
    shares: number;
    effectiveDate: string;
  },
) {
  const { fromShareholderId, toShareholderId, shares, effectiveDate } = params;

  const holdings = await listShareholdings(supabase, companyId);
  const ownership = calculateOwnership(holdings, new Date(effectiveDate));

  const fromCurrent = ownership.find((o) => o.shareholderId === fromShareholderId)?.shares ?? 0;
  const toCurrent = ownership.find((o) => o.shareholderId === toShareholderId)?.shares ?? 0;

  if (fromCurrent < shares) {
    throw new Error("Transferring shareholder does not hold enough shares for this transfer");
  }

  const openIds = holdings
    .filter(
      (h) =>
        (h.shareholder_id === fromShareholderId || h.shareholder_id === toShareholderId) &&
        !h.effective_to,
    )
    .map((h) => h.id);

  if (openIds.length > 0) {
    const { error: closeError } = await supabase
      .from("shareholdings")
      .update({ effective_to: effectiveDate })
      .in("id", openIds);
    if (closeError) throw new Error(closeError.message);
  }

  const newRows = [
    { company_id: companyId, shareholder_id: fromShareholderId, shares: fromCurrent - shares, effective_from: effectiveDate },
    { company_id: companyId, shareholder_id: toShareholderId, shares: toCurrent + shares, effective_from: effectiveDate },
  ].filter((r) => r.shares > 0);

  const { data, error } = await supabase.from("shareholdings").insert(newRows).select();
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "SHARE_TRANSFER_RECORDED",
    entity_type: "shareholding",
    metadata: { fromShareholderId, toShareholderId, shares, effectiveDate },
  });

  return data as Shareholding[];
}
