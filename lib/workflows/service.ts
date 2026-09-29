import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit/log";
import type { WorkflowTemplate } from "@/lib/corporate-events/rules";
import type { Workflow, WorkflowTask } from "@/lib/types";

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Generates a workflow and its tasks from a template. This is what the
 * corporate event engine calls after evaluating an event — business rules
 * live in lib/corporate-events/rules.ts, never hard-coded into components.
 */
export async function generateWorkflow(
  supabase: SupabaseClient,
  companyId: string,
  workspaceId: string,
  userId: string,
  eventId: string,
  eventDate: string,
  template: WorkflowTemplate,
): Promise<{ workflow: Workflow; tasks: WorkflowTask[] }> {
  const { data: workflow, error: workflowError } = await supabase
    .from("workflows")
    .insert({
      company_id: companyId,
      event_id: eventId,
      name: template.name,
      description: template.description,
      status: "ACTIVE",
    })
    .select()
    .single();

  if (workflowError || !workflow) {
    throw new Error(workflowError?.message ?? "Failed to generate workflow");
  }

  const taskRows = template.tasks.map((t) => ({
    workflow_id: workflow.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: "TODO" as const,
    requires_evidence: t.requiresEvidence,
    requires_legal_verification: t.requiresLegalVerification,
    due_date: t.dueInDays != null ? addDays(eventDate, t.dueInDays) : null,
  }));

  const { data: tasks, error: tasksError } = await supabase
    .from("workflow_tasks")
    .insert(taskRows)
    .select();

  if (tasksError) throw new Error(tasksError.message);

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "WORKFLOW_CREATED",
    entity_type: "workflow",
    entity_id: workflow.id,
    metadata: { name: workflow.name, task_count: tasks?.length ?? 0, event_id: eventId },
  });

  return { workflow, tasks: (tasks ?? []) as WorkflowTask[] };
}

export async function completeTask(
  supabase: SupabaseClient,
  taskId: string,
  workspaceId: string,
  companyId: string,
  userId: string,
): Promise<WorkflowTask> {
  const { data, error } = await supabase
    .from("workflow_tasks")
    .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
    .eq("id", taskId)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to complete task");

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "TASK_COMPLETED",
    entity_type: "workflow_task",
    entity_id: taskId,
    metadata: { title: data.title },
  });

  return data;
}

export async function updateTaskStatus(
  supabase: SupabaseClient,
  taskId: string,
  workspaceId: string,
  companyId: string,
  userId: string,
  status: WorkflowTask["status"],
): Promise<WorkflowTask> {
  const { data, error } = await supabase
    .from("workflow_tasks")
    .update({ status, completed_at: status === "COMPLETED" ? new Date().toISOString() : null })
    .eq("id", taskId)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to update task");

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "TASK_STATUS_CHANGED",
    entity_type: "workflow_task",
    entity_id: taskId,
    metadata: { title: data.title, status },
  });

  return data;
}

export async function listWorkflowsForCompany(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("workflows")
    .select("*, workflow_tasks(*)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function listTasksForCompany(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("workflow_tasks")
    .select("*, workflows!inner(company_id, name)")
    .eq("workflows.company_id", companyId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return data;
}
