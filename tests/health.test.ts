import { describe, expect, it } from "vitest";
import { calculateCorporateHealth } from "@/lib/health/service";
import type { Company, ComplianceObligation, Contract, Director, DocumentRecord, Shareholding } from "@/lib/types";

const baseCompany: Company = {
  id: "c1",
  workspace_id: "w1",
  legal_name: "Acme (Private) Limited",
  registration_number: "12345",
  ntn: "1234567-8",
  company_type: "PRIVATE_LIMITED",
  incorporation_date: "2020-01-01",
  registered_address: "Lahore",
  province: "PUNJAB",
  status: "ACTIVE",
  fiscal_year_end: "June 30",
  created_at: "2020-01-01T00:00:00Z",
  updated_at: "2020-01-01T00:00:00Z",
};

const director: Director = {
  id: "d1",
  company_id: "c1",
  full_name: "Ali Khan",
  cnic: null,
  designation: "Director",
  appointment_date: "2020-01-01",
  resignation_date: null,
  status: "ACTIVE",
  created_at: "2020-01-01T00:00:00Z",
  updated_at: "2020-01-01T00:00:00Z",
};

const shareholding: Shareholding = {
  id: "s1",
  company_id: "c1",
  shareholder_id: "sh1",
  shares: 100,
  effective_from: "2020-01-01",
  effective_to: null,
  created_at: "2020-01-01T00:00:00Z",
};

const documents: DocumentRecord[] = [];

describe("calculateCorporateHealth", () => {
  it("scores a fully complete, no-risk company as HEALTHY near 100", () => {
    const result = calculateCorporateHealth({
      company: baseCompany,
      directors: [director],
      shareholdings: [shareholding],
      obligations: [],
      contracts: [],
      documents,
      pendingCorporateEvents: 0,
    });

    expect(result.status).toBe("HEALTHY");
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("penalizes overdue compliance obligations and explains why", () => {
    const overdue: ComplianceObligation = {
      id: "o1",
      company_id: "c1",
      rule_id: null,
      title: "Overdue filing",
      description: null,
      due_date: "2000-01-01",
      status: "UPCOMING",
      owner_id: null,
      evidence_document_id: null,
      created_at: "2020-01-01T00:00:00Z",
      updated_at: "2020-01-01T00:00:00Z",
    };

    const healthy = calculateCorporateHealth({
      company: baseCompany,
      directors: [director],
      shareholdings: [shareholding],
      obligations: [],
      contracts: [],
      documents,
      pendingCorporateEvents: 0,
    });

    const withOverdue = calculateCorporateHealth({
      company: baseCompany,
      directors: [director],
      shareholdings: [shareholding],
      obligations: [overdue],
      contracts: [],
      documents,
      pendingCorporateEvents: 0,
    });

    expect(withOverdue.score).toBeLessThan(healthy.score);
    expect(withOverdue.warnings.some((w) => w.includes("overdue"))).toBe(true);
  });

  it("never uses a hard-coded score — it responds to missing directors", () => {
    const noDirectors = calculateCorporateHealth({
      company: baseCompany,
      directors: [],
      shareholdings: [shareholding],
      obligations: [],
      contracts: [],
      documents,
      pendingCorporateEvents: 0,
    });
    const withDirectors = calculateCorporateHealth({
      company: baseCompany,
      directors: [director],
      shareholdings: [shareholding],
      obligations: [],
      contracts: [],
      documents,
      pendingCorporateEvents: 0,
    });

    expect(noDirectors.score).toBeLessThan(withDirectors.score);
  });

  it("penalizes an incomplete company profile", () => {
    const incomplete: Company = { ...baseCompany, ntn: null, registered_address: null, province: null };
    const result = calculateCorporateHealth({
      company: incomplete,
      directors: [director],
      shareholdings: [shareholding],
      obligations: [],
      contracts: [],
      documents,
      pendingCorporateEvents: 0,
    });
    expect(result.warnings.some((w) => w.includes("missing"))).toBe(true);
  });

  it("keeps the score within 0-100 bounds", () => {
    const expiredContract: Contract = {
      id: "k1",
      company_id: "c1",
      name: "Lease",
      counterparty: null,
      contract_type: null,
      start_date: null,
      expiry_date: "2000-01-01",
      renewal_date: null,
      owner_id: null,
      status: "ACTIVE",
      document_id: null,
      notes: null,
      created_at: "2020-01-01T00:00:00Z",
      updated_at: "2020-01-01T00:00:00Z",
    };

    const result = calculateCorporateHealth({
      company: { ...baseCompany, ntn: null, registered_address: null, province: null, registration_number: null, company_type: null, incorporation_date: null, fiscal_year_end: null },
      directors: [],
      shareholdings: [],
      obligations: [],
      contracts: [expiredContract, expiredContract, expiredContract],
      documents,
      pendingCorporateEvents: 5,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.status).toBe("AT_RISK");
  });
});
