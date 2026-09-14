import { describe, expect, it } from "vitest";
import { deriveObligationStatus } from "@/lib/compliance/service";
import { deriveContractStatus } from "@/lib/contracts/service";
import { WORKFLOW_TEMPLATES } from "@/lib/corporate-events/rules";

describe("deriveObligationStatus", () => {
  const now = new Date("2024-06-15");

  it("marks a past due date as OVERDUE", () => {
    expect(deriveObligationStatus({ status: "UPCOMING", due_date: "2024-06-01" }, now)).toBe("OVERDUE");
  });

  it("marks a due date within 7 days as DUE_SOON", () => {
    expect(deriveObligationStatus({ status: "UPCOMING", due_date: "2024-06-20" }, now)).toBe("DUE_SOON");
  });

  it("marks a far-future due date as UPCOMING", () => {
    expect(deriveObligationStatus({ status: "UPCOMING", due_date: "2024-12-01" }, now)).toBe("UPCOMING");
  });

  it("never overrides an explicit COMPLETED status", () => {
    expect(deriveObligationStatus({ status: "COMPLETED", due_date: "2000-01-01" }, now)).toBe("COMPLETED");
  });
});

describe("deriveContractStatus", () => {
  const now = new Date("2024-06-15");

  it("marks an expired contract as EXPIRED", () => {
    expect(deriveContractStatus({ status: "ACTIVE", expiry_date: "2024-01-01" }, now)).toBe("EXPIRED");
  });

  it("marks a contract expiring within 30 days as EXPIRING", () => {
    expect(deriveContractStatus({ status: "ACTIVE", expiry_date: "2024-06-30" }, now)).toBe("EXPIRING");
  });

  it("leaves DRAFT and TERMINATED contracts untouched", () => {
    expect(deriveContractStatus({ status: "DRAFT", expiry_date: "2020-01-01" }, now)).toBe("DRAFT");
    expect(deriveContractStatus({ status: "TERMINATED", expiry_date: "2020-01-01" }, now)).toBe("TERMINATED");
  });
});

describe("legal-data safety in workflow templates", () => {
  it("flags every task that cites an unverified statutory requirement", () => {
    for (const template of Object.values(WORKFLOW_TEMPLATES)) {
      for (const task of template.tasks) {
        const mentionsStatutoryFiling = /SECP|FBR|statutory|regulatory filing/i.test(
          `${task.title} ${task.description}`,
        );
        if (mentionsStatutoryFiling) {
          expect(task.requiresLegalVerification).toBe(true);
        }
      }
    }
  });

  it("never hard-codes a specific deadline or penalty for a filing that requires legal verification", () => {
    for (const template of Object.values(WORKFLOW_TEMPLATES)) {
      for (const task of template.tasks.filter((t) => t.requiresLegalVerification)) {
        expect(task.description.toLowerCase()).toContain("not been verified");
        expect(task.dueInDays).toBeUndefined();
      }
    }
  });
});
