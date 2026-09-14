import type { Company, ComplianceObligation, Contract, Director, DocumentRecord, Shareholding } from "@/lib/types";
import { calculateOwnership } from "@/lib/shareholders/ownership";
import { deriveObligationStatus } from "@/lib/compliance/service";
import { deriveContractStatus } from "@/lib/contracts/service";

export interface CorporateHealthInput {
  company: Company;
  directors: Director[];
  shareholdings: Shareholding[];
  obligations: ComplianceObligation[];
  contracts: Contract[];
  documents: DocumentRecord[];
  pendingCorporateEvents: number;
}

export interface CorporateHealthResult {
  score: number;
  status: "HEALTHY" | "NEEDS_ATTENTION" | "AT_RISK";
  reasons: string[];
  warnings: string[];
}

const COMPANY_FIELDS: (keyof Company)[] = [
  "registration_number",
  "ntn",
  "company_type",
  "incorporation_date",
  "registered_address",
  "province",
  "fiscal_year_end",
];

/**
 * Deterministic corporate health score, computed entirely from records
 * already stored for the company — never a static or fabricated number.
 * Starts at 100 and subtracts weighted penalties for each gap found;
 * `reasons`/`warnings` explain exactly why the score is what it is.
 */
export function calculateCorporateHealth(input: CorporateHealthInput): CorporateHealthResult {
  const { company, directors, shareholdings, obligations, contracts, pendingCorporateEvents } = input;

  let score = 100;
  const reasons: string[] = [];
  const warnings: string[] = [];

  const filledCompanyFields = COMPANY_FIELDS.filter((f) => !!company[f]).length;
  const companyCompleteness = filledCompanyFields / COMPANY_FIELDS.length;
  if (companyCompleteness === 1) {
    reasons.push("Company information complete");
  } else {
    const penalty = Math.round((1 - companyCompleteness) * 15);
    score -= penalty;
    warnings.push(
      `Company profile is missing ${COMPANY_FIELDS.length - filledCompanyFields} field(s)`,
    );
  }

  const activeDirectors = directors.filter((d) => d.status === "ACTIVE");
  if (directors.length === 0) {
    score -= 15;
    warnings.push("No directors on record");
  } else if (activeDirectors.length === 0) {
    score -= 15;
    warnings.push("No active directors on record");
  } else {
    reasons.push("Director information current");
  }

  const ownership = calculateOwnership(shareholdings);
  const totalPercentage = ownership.reduce((sum, o) => sum + o.percentage, 0);
  if (ownership.length === 0) {
    score -= 10;
    warnings.push("No shareholding records found");
  } else if (Math.abs(totalPercentage - 100) > 0.01) {
    score -= 5;
    warnings.push("Shareholding records do not sum to 100% ownership");
  } else {
    reasons.push("Ownership structure fully accounted for");
  }

  const overdueObligations = obligations.filter((o) => deriveObligationStatus(o) === "OVERDUE");
  const dueSoonObligations = obligations.filter((o) => deriveObligationStatus(o) === "DUE_SOON");
  if (overdueObligations.length > 0) {
    score -= Math.min(30, overdueObligations.length * 10);
    warnings.push(
      `${overdueObligations.length} overdue compliance obligation${overdueObligations.length > 1 ? "s" : ""}`,
    );
  } else if (dueSoonObligations.length > 0) {
    score -= Math.min(10, dueSoonObligations.length * 3);
    warnings.push(
      `${dueSoonObligations.length} compliance obligation${dueSoonObligations.length > 1 ? "s" : ""} due soon`,
    );
  } else {
    reasons.push("No overdue compliance obligations");
  }

  const obligationsMissingEvidence = obligations.filter(
    (o) => deriveObligationStatus(o) !== "COMPLETED" && !o.evidence_document_id,
  );
  if (obligationsMissingEvidence.length > 0) {
    score -= Math.min(10, obligationsMissingEvidence.length * 2);
    warnings.push(
      `${obligationsMissingEvidence.length} document${obligationsMissingEvidence.length > 1 ? "s" : ""} requires renewal or upload`,
    );
  }

  const expiringContracts = contracts.filter((c) => deriveContractStatus(c) === "EXPIRING");
  const expiredContracts = contracts.filter((c) => deriveContractStatus(c) === "EXPIRED");
  if (expiredContracts.length > 0) {
    score -= Math.min(10, expiredContracts.length * 5);
    warnings.push(`${expiredContracts.length} expired contract${expiredContracts.length > 1 ? "s" : ""}`);
  } else if (expiringContracts.length > 0) {
    score -= Math.min(5, expiringContracts.length * 2);
    warnings.push(`${expiringContracts.length} contract${expiringContracts.length > 1 ? "s" : ""} expiring soon`);
  }

  if (pendingCorporateEvents > 0) {
    score -= Math.min(10, pendingCorporateEvents * 5);
    warnings.push(
      `${pendingCorporateEvents} unresolved corporate event${pendingCorporateEvents > 1 ? "s" : ""}`,
    );
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const status: CorporateHealthResult["status"] =
    score >= 80 ? "HEALTHY" : score >= 55 ? "NEEDS_ATTENTION" : "AT_RISK";

  return { score, status, reasons, warnings };
}
