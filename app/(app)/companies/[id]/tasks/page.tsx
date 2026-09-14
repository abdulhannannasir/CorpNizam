import { requireCompanyAccess } from "@/lib/session/current";
import { listWorkflowsForCompany } from "@/lib/workflows/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CompleteTaskButton } from "./complete-button";
import type { WorkflowTask } from "@/lib/types";

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ workflow?: string }>;
}) {
  const { id } = await params;
  const { workflow: highlightedWorkflow } = await searchParams;
  const { supabase } = await requireCompanyAccess(id);
  const workflows = await listWorkflowsForCompany(supabase, id);

  return (
    <div className="space-y-6">
      {workflows.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            No workflows yet. Recording a corporate event automatically generates a workflow with tasks.
          </CardContent>
        </Card>
      )}

      {workflows.map((wf) => {
        const tasks = (wf.workflow_tasks ?? []) as WorkflowTask[];
        const completed = tasks.filter((t) => t.status === "COMPLETED").length;
        return (
          <Card key={wf.id} className={wf.id === highlightedWorkflow ? "ring-2 ring-slate-900" : undefined}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>{wf.name}</CardTitle>
                <p className="mt-1 text-xs text-slate-500">
                  {completed}/{tasks.length} tasks complete
                </p>
              </div>
              <StatusBadge status={wf.status} />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-emerald-500"
                  style={{ width: `${tasks.length ? (completed / tasks.length) * 100 : 0}%` }}
                />
              </div>
              {tasks
                .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
                .map((t) => (
                  <div key={t.id} className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{t.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span>Priority: {t.priority}</span>
                        {t.due_date && <span>Due {formatDate(t.due_date)}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={t.status} />
                      {t.status !== "COMPLETED" && <CompleteTaskButton companyId={id} taskId={t.id} />}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
