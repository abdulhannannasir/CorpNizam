import type { SupabaseClient } from "@supabase/supabase-js";
import type { ComplianceObligation, ComplianceRule, ObligationStatus } from "@/lib/types";

/**
 * Derives the display status of an obligation from its due date. COMPLETED
 * and NOT_APPLICABLE/REQUIRES_REVIEW are stored states set explicitly by a
 * user action, not derived — this function only computes the date-driven
 * states for anything still open.
 */
export function deriveObligationStatus(
  obligation: Pick<ComplianceObligation, "status" | "due_date">,
  now: Date = new Date(),
): ObligationStatus {
  if (obligation.status === "COMPLETED" || obligation.status === "NOT_APPLICABLE" || obligation.status === "REQUIRES_REVIEW") {
    return obligation.status;
  }
  if (!obligation.due_date) return "UPCOMING";

  const due = new Date(obligation.due_date);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDue = Math.floor((due.getTime() - now.getTime()) / msPerDay);

  if (daysUntilDue < 0) return "OVERDUE";
  if (daysUntilDue <= 7) return "DUE_SOON";
  return "UPCOMING";
}

export async function listComplianceRules(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("compliance_rules")
    .select("*")
    .order("authority", { ascending: true });

  if (error) throw new Error(error.message);
  return data as ComplianceRule[];
}

export async function listComplianceObligations(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("compliance_obligations")
    .select("*, compliance_rules(*)")
    .eq("company_id", companyId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createComplianceObligation(
  supabase: SupabaseClient,
  companyId: string,
  params: {
    title: string;
    description?: string | null;
    dueDate?: string | null;
    ruleId?: string | null;
    ownerId?: string | null;
  },
) {
  const { data, error } = await supabase
    .from("compliance_obligations")
    .insert({
      company_id: companyId,
      title: params.title,
      description: params.description ?? null,
      due_date: params.dueDate ?? null,
      rule_id: params.ruleId ?? null,
      owner_id: params.ownerId ?? null,
      status: "UPCOMING",
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create compliance obligation");
  return data;
}
