import Link from "next/link";
import { requireSession } from "@/lib/session/current";
import { listCompanies } from "@/lib/companies/service";
import { listTasksForCompany } from "@/lib/workflows/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function WorkspaceTasksPage() {
  const { supabase, workspaceId } = await requireSession();
  const companies = await listCompanies(supabase, workspaceId);

  const tasksByCompany = await Promise.all(
    companies.map(async (c) => ({ company: c, tasks: await listTasksForCompany(supabase, c.id) })),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
      {tasksByCompany.every(({ tasks }) => tasks.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            No tasks yet across your companies.
          </CardContent>
        </Card>
      ) : (
        tasksByCompany
          .filter(({ tasks }) => tasks.length > 0)
          .map(({ company, tasks }) => (
            <Card key={company.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/companies/${company.id}/tasks`} className="hover:underline">
                    {company.legal_name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {t.due_date ? `Due ${formatDate(t.due_date)}` : "No due date"} · {t.priority}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
      )}
    </div>
  );
}
