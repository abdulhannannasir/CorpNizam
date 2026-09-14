import Link from "next/link";
import { requireSession } from "@/lib/session/current";
import { listCompanies } from "@/lib/companies/service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";

export default async function CompaniesPage() {
  const { supabase, workspaceId } = await requireSession();
  const companies = await listCompanies(supabase, workspaceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Companies</h1>
        <Link href="/companies/new">
          <Button>Add Company</Button>
        </Link>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            No companies yet. Add your first company to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Legal name</th>
                <th className="px-4 py-2 font-medium">Registration No.</th>
                <th className="px-4 py-2 font-medium">NTN</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/companies/${c.id}`} className="font-medium text-slate-900 hover:underline">
                      {c.legal_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.registration_number ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.ntn ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
