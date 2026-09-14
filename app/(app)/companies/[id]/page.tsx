import { requireCompanyAccess } from "@/lib/session/current";
import { listDirectors } from "@/lib/directors/service";
import { listShareholdings } from "@/lib/shareholders/service";
import { listComplianceObligations } from "@/lib/compliance/service";
import { listContracts } from "@/lib/contracts/service";
import { listDocuments } from "@/lib/documents/service";
import { listCorporateEvents } from "@/lib/corporate-events/service";
import { calculateCorporateHealth } from "@/lib/health/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function CompanyOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, company } = await requireCompanyAccess(id);

  const [directors, shareholdings, obligations, contracts, documents, events] = await Promise.all([
    listDirectors(supabase, id),
    listShareholdings(supabase, id),
    listComplianceObligations(supabase, id),
    listContracts(supabase, id),
    listDocuments(supabase, id),
    listCorporateEvents(supabase, id),
  ]);

  const health = calculateCorporateHealth({
    company,
    directors,
    shareholdings,
    obligations,
    contracts,
    documents,
    pendingCorporateEvents: events.filter((e) => e.status === "PENDING" || e.status === "PROCESSING").length,
  });

  const fields: [string, string | null][] = [
    ["Legal name", company.legal_name],
    ["Registration number", company.registration_number],
    ["NTN", company.ntn],
    ["Company type", company.company_type],
    ["Incorporation date", formatDate(company.incorporation_date)],
    ["Registered address", company.registered_address],
    ["Province", company.province],
    ["Fiscal year end", company.fiscal_year_end],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Company overview</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="mt-0.5 text-sm text-slate-900">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Corporate Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-slate-900">{health.score}%</p>
          <p className="text-sm font-medium text-slate-600">{health.status.replaceAll("_", " ")}</p>
          <div className="mt-4 space-y-1 text-sm">
            {health.reasons.map((r) => (
              <p key={r} className="text-emerald-700">✓ {r}</p>
            ))}
            {health.warnings.map((w) => (
              <p key={w} className="text-amber-700">⚠ {w}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
