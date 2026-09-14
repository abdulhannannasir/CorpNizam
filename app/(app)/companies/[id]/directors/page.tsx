import Link from "next/link";
import { requireCompanyAccess } from "@/lib/session/current";
import { listDirectors } from "@/lib/directors/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { DirectorForm } from "./director-form";

export default async function DirectorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireCompanyAccess(id);
  const directors = await listDirectors(supabase, id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add director</CardTitle>
        </CardHeader>
        <CardContent>
          <DirectorForm companyId={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Directors</CardTitle>
          <Link href={`/companies/${id}/events/new?type=DIRECTOR_RESIGNED`}>
            <Button size="sm" variant="outline">Record Resignation</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {directors.length === 0 ? (
            <p className="text-sm text-slate-500">No directors on record.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Designation</th>
                  <th className="py-2 font-medium">Appointed</th>
                  <th className="py-2 font-medium">Resigned</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {directors.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium text-slate-900">{d.full_name}</td>
                    <td className="py-2 text-slate-600">{d.designation ?? "—"}</td>
                    <td className="py-2 text-slate-600">{formatDate(d.appointment_date)}</td>
                    <td className="py-2 text-slate-600">{formatDate(d.resignation_date)}</td>
                    <td className="py-2"><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
