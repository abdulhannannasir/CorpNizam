import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit/log";
import { resignDirector } from "@/lib/directors/service";
import { generateWorkflow } from "@/lib/workflows/service";
import { WORKFLOW_TEMPLATES } from "./rules";
import type { CorporateEvent, CorporateEventType } from "@/lib/types";
import type { DirectorResignationInput } from "@/lib/validation/schemas";

export async function createCorporateEvent(
  supabase: SupabaseClient,
  companyId: string,
  workspaceId: string,
  userId: string,
  params: {
    eventType: CorporateEventType;
    title: string;
    description?: string | null;
    eventDate: string;
    metadata?: Record<string, unknown>;
  },
): Promise<CorporateEvent> {
  const { data, error } = await supabase
    .from("corporate_events")
    .insert({
      company_id: companyId,
      event_type: params.eventType,
      title: params.title,
      description: params.description ?? null,
      event_date: params.eventDate,
      status: "PENDING",
      metadata: params.metadata ?? {},
      created_by: userId,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create corporate event");

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "CORPORATE_EVENT_CREATED",
    entity_type: "corporate_event",
    entity_id: data.id,
    metadata: { event_type: params.eventType, title: params.title },
  });

  return data;
}

/**
 * Event -> workflow evaluation step of the corporate event engine.
 * Every event type maps to a workflow template (lib/corporate-events/rules.ts);
 * this function is the single place that turns "an event happened" into
 * "here is the generated workflow and tasks", so new event types plug in by
 * adding a template rather than new UI logic.
 */
export async function evaluateCorporateEvent(
  supabase: SupabaseClient,
  event: CorporateEvent,
  workspaceId: string,
  userId: string,
) {
  const template = WORKFLOW_TEMPLATES[event.event_type];

  const { workflow, tasks } = await generateWorkflow(
    supabase,
    event.company_id,
    workspaceId,
    userId,
    event.id,
    event.event_date,
    template,
  );

  const { error } = await supabase
    .from("corporate_events")
    .update({ status: "PROCESSING" })
    .eq("id", event.id);
  if (error) throw new Error(error.message);

  return { workflow, tasks };
}

/**
 * The first fully wired end-to-end corporate event: a director resigns.
 * Orchestrates: director status update -> corporate event -> workflow ->
 * tasks -> audit trail, in that order, each step audited individually.
 */
export async function recordDirectorResignation(
  supabase: SupabaseClient,
  companyId: string,
  workspaceId: string,
  userId: string,
  directorName: string,
  input: DirectorResignationInput,
) {
  const director = await resignDirector(
    supabase,
    input.director_id,
    companyId,
    workspaceId,
    userId,
    input.resignation_date,
  );

  const event = await createCorporateEvent(supabase, companyId, workspaceId, userId, {
    eventType: "DIRECTOR_RESIGNED",
    title: `${directorName} resigned as director`,
    description: input.reason || input.notes || null,
    eventDate: input.resignation_date,
    metadata: {
      director_id: input.director_id,
      reason: input.reason ?? null,
      notes: input.notes ?? null,
    },
  });

  const { workflow, tasks } = await evaluateCorporateEvent(supabase, event, workspaceId, userId);

  return { director, event, workflow, tasks };
}

export async function listCorporateEvents(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("corporate_events")
    .select("*")
    .eq("company_id", companyId)
    .order("event_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data as CorporateEvent[];
}
