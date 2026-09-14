import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/session/current";
import { listCompanies } from "@/lib/companies/service";
import { listDirectors } from "@/lib/directors/service";
import { listShareholdings } from "@/lib/shareholders/service";
import { listComplianceObligations, deriveObligationStatus } from "@/lib/compliance/service";
import { listContracts } from "@/lib/contracts/service";
import { listDocuments } from "@/lib/documents/service";
import { listCorporateEvents } from "@/lib/corporate-events/service";
import { calculateCorporateHealth } from "@/lib/health/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const { supabase, workspaceId } = await requireSession();
  const companies = await listCompanies(supabase, workspaceId);

  const perCompany = await Promise.all(
    companies.map(async (company) => {
      const [directors, shareholdings, obligations, contracts, documents, events] = await Promise.all([
        listDirectors(supabase, company.id),
        listShareholdings(supabase, company.id),
        listComplianceObligations(supabase, company.id),
        listContracts(supabase, company.id),
        listDocuments(supabase, company.id),
        listCorporateEvents(supabase, company.id),
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

      return { company, health, obligations, events, documents };
    }),
  );

  const { data: recentAudit } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(8);

  const avgScore =
    perCompany.length > 0
      ? Math.round(perCompany.reduce((sum, c) => sum + c.health.score, 0) / perCompany.length)
      : null;

  const allObligations = perCompany.flatMap((c) => c.obligations.map((o) => ({ ...o, companyName: c.company.legal_name })));
  const overdue = allObligations.filter((o) => deriveObligationStatus(o) === "OVERDUE");
  const dueSoon = allObligations.filter((o) => deriveObligationStatus(o) === "DUE_SOON");
  const upcoming = allObligations.filter((o) => deriveObligationStatus(o) === "UPCOMING");

  const recentEvents = perCompany
    .flatMap((c) => c.events.map((e) => ({ ...e, companyName: c.company.legal_name })))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Overview</h1>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-slate-600">You haven&apos;t added a company yet.</p>
            <Link href="/companies/new">
              <Button>Add Company</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Corporate Health</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-slate-900">{avgScore ?? "—"}%</p>
                <p className="mt-1 text-sm text-slate-500">Average across {companies.length} compan{companies.length === 1 ? "y" : "ies"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="text-red-600">{overdue.length} overdue</p>
                <p className="text-amber-600">{dueSoon.length} due this week</p>
                <p className="text-slate-500">{upcoming.length} upcoming</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Link href="/companies/new"><Button size="sm" variant="outline">Add Company</Button></Link>
                <Link href="/companies"><Button size="sm" variant="outline">Record Event</Button></Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Companies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {perCompany.map(({ company, health }) => (
                  <Link
                    key={company.id}
                    href={`/companies/${company.id}`}
                    className="flex items-center justify-between rounded-md border border-slate-100 p-3 hover:border-slate-300"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{company.legal_name}</p>
                      <p className="text-xs text-slate-500">{company.registration_number ?? "No registration number"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{health.score}%</p>
                      <StatusBadge status={health.status} />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Corporate Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentEvents.length === 0 && <p className="text-sm text-slate-500">No corporate events recorded yet.</p>}
                {recentEvents.map((e) => (
                  <div key={e.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{e.title}</p>
                      <p className="text-xs text-slate-500">{e.companyName} · {formatDate(e.event_date)}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(!recentAudit || recentAudit.length === 0) && (
                <p className="text-sm text-slate-500">No activity recorded yet.</p>
              )}
              {recentAudit?.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{log.action.replaceAll("_", " ").toLowerCase()}</span>
                  <span className="text-xs text-slate-400">{formatDate(log.created_at)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
