import type { Shareholding } from "@/lib/types";

export interface OwnershipEntry {
  shareholderId: string;
  shares: number;
  percentage: number;
}

/**
 * Derives current ownership percentages from shareholding records.
 * Ownership is NEVER stored as a manually entered percentage — it is always
 * calculated from shares so it can never drift from the underlying records.
 *
 * A shareholding is "current" when effective_from <= asOf and
 * (effective_to is null OR effective_to > asOf).
 */
export function calculateOwnership(
  shareholdings: Shareholding[],
  asOf: Date = new Date(),
): OwnershipEntry[] {
  const current = shareholdings.filter((s) => {
    const from = new Date(s.effective_from);
    if (from > asOf) return false;
    if (s.effective_to) {
      const to = new Date(s.effective_to);
      if (to <= asOf) return false;
    }
    return true;
  });

  const byShareholder = new Map<string, number>();
  for (const s of current) {
    byShareholder.set(s.shareholder_id, (byShareholder.get(s.shareholder_id) ?? 0) + Number(s.shares));
  }

  const totalShares = Array.from(byShareholder.values()).reduce((a, b) => a + b, 0);

  return Array.from(byShareholder.entries())
    .map(([shareholderId, shares]) => ({
      shareholderId,
      shares,
      percentage: totalShares > 0 ? (shares / totalShares) * 100 : 0,
    }))
    .sort((a, b) => b.shares - a.shares);
}

export function totalCurrentShares(shareholdings: Shareholding[], asOf: Date = new Date()): number {
  return calculateOwnership(shareholdings, asOf).reduce((sum, e) => sum + e.shares, 0);
}
