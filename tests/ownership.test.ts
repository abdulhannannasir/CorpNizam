import { describe, expect, it } from "vitest";
import { calculateOwnership } from "@/lib/shareholders/ownership";
import type { Shareholding } from "@/lib/types";

function holding(overrides: Partial<Shareholding>): Shareholding {
  return {
    id: crypto.randomUUID(),
    company_id: "company-1",
    shareholder_id: "shareholder-1",
    shares: 100,
    effective_from: "2024-01-01",
    effective_to: null,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("calculateOwnership", () => {
  it("returns empty ownership when there are no shareholdings", () => {
    expect(calculateOwnership([])).toEqual([]);
  });

  it("calculates percentage ownership from shares, not manual entry", () => {
    const holdings = [
      holding({ shareholder_id: "a", shares: 60 }),
      holding({ shareholder_id: "b", shares: 25 }),
      holding({ shareholder_id: "c", shares: 15 }),
    ];

    const ownership = calculateOwnership(holdings, new Date("2024-06-01"));

    expect(ownership).toHaveLength(3);
    const totalPercentage = ownership.reduce((sum, o) => sum + o.percentage, 0);
    expect(totalPercentage).toBeCloseTo(100, 5);

    const a = ownership.find((o) => o.shareholderId === "a")!;
    expect(a.percentage).toBeCloseTo(60, 5);
  });

  it("sums multiple holdings for the same shareholder", () => {
    const holdings = [
      holding({ shareholder_id: "a", shares: 40, effective_from: "2024-01-01" }),
      holding({ shareholder_id: "a", shares: 20, effective_from: "2024-02-01" }),
    ];

    const ownership = calculateOwnership(holdings, new Date("2024-06-01"));
    expect(ownership).toHaveLength(1);
    expect(ownership[0]!.shares).toBe(60);
  });

  it("excludes holdings that have not yet become effective", () => {
    const holdings = [holding({ shareholder_id: "a", shares: 100, effective_from: "2030-01-01" })];
    const ownership = calculateOwnership(holdings, new Date("2024-06-01"));
    expect(ownership).toEqual([]);
  });

  it("excludes holdings closed by effective_to (share transfer supersedes them)", () => {
    const holdings = [
      holding({
        shareholder_id: "a",
        shares: 100,
        effective_from: "2024-01-01",
        effective_to: "2024-06-01",
      }),
      holding({ shareholder_id: "b", shares: 100, effective_from: "2024-06-01" }),
    ];

    const before = calculateOwnership(holdings, new Date("2024-03-01"));
    expect(before.find((o) => o.shareholderId === "a")?.shares).toBe(100);

    const after = calculateOwnership(holdings, new Date("2024-07-01"));
    expect(after.find((o) => o.shareholderId === "a")).toBeUndefined();
    expect(after.find((o) => o.shareholderId === "b")?.shares).toBe(100);
  });

  it("retains historical ownership at a past point in time after a transfer", () => {
    // Simulates recordShareTransfer: original holding closed, two new holdings opened.
    const holdings = [
      holding({ shareholder_id: "a", shares: 100, effective_from: "2024-01-01", effective_to: "2024-06-01" }),
      holding({ shareholder_id: "a", shares: 70, effective_from: "2024-06-01" }),
      holding({ shareholder_id: "b", shares: 30, effective_from: "2024-06-01" }),
    ];

    const historical = calculateOwnership(holdings, new Date("2024-03-01"));
    expect(historical).toHaveLength(1);
    expect(historical[0]!.percentage).toBeCloseTo(100, 5);

    const current = calculateOwnership(holdings, new Date("2024-12-01"));
    const a = current.find((o) => o.shareholderId === "a")!;
    const b = current.find((o) => o.shareholderId === "b")!;
    expect(a.percentage).toBeCloseTo(70, 5);
    expect(b.percentage).toBeCloseTo(30, 5);
  });
});
