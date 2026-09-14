"use server";

import { redirect } from "next/navigation";
import { requireCompanyAccess } from "@/lib/session/current";
import { recordDirectorResignation, createCorporateEvent, evaluateCorporateEvent } from "@/lib/corporate-events/service";
import { directorResignationSchema } from "@/lib/validation/schemas";
import type { CorporateEventType } from "@/lib/types";
import { getDirectorName } from "@/lib/directors/lookup";

export interface EventFormState {
  error?: string;
}

export async function recordDirectorResignationAction(
  companyId: string,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const { supabase, workspaceId, user } = await requireCompanyAccess(companyId);

  const parsed = directorResignationSchema.safeParse({
    director_id: formData.get("director_id"),
    resignation_date: formData.get("resignation_date"),
    reason: formData.get("reason") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid resignation details" };
  }

  let workflowId: string | null = null;
  let errorMessage: string | null = null;
  try {
    const directorName = await getDirectorName(supabase, parsed.data.director_id);
    const result = await recordDirectorResignation(
      supabase,
      companyId,
      workspaceId,
      user.id,
      directorName,
      parsed.data,
    );
    workflowId = result.workflow.id;
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "We couldn't record this resignation. Please try again.";
  }

  if (errorMessage || !workflowId) {
    return { error: errorMessage ?? "We couldn't record this resignation. Please try again." };
  }

  redirect(`/companies/${companyId}/tasks?workflow=${workflowId}`);
}

export async function recordGenericEventAction(
  companyId: string,
  eventType: CorporateEventType,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const { supabase, workspaceId, user } = await requireCompanyAccess(companyId);

  const title = String(formData.get("title") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "");
  const description = String(formData.get("description") ?? "");

  if (!title || !eventDate) {
    return { error: "Title and event date are required" };
  }

  let workflowId: string | null = null;
  try {
    const event = await createCorporateEvent(supabase, companyId, workspaceId, user.id, {
      eventType,
      title,
      description,
      eventDate,
    });
    const result = await evaluateCorporateEvent(supabase, event, workspaceId, user.id);
    workflowId = result.workflow.id;
  } catch {
    return { error: "We couldn't record this event. Please try again." };
  }

  if (!workflowId) {
    return { error: "We couldn't record this event. Please try again." };
  }

  redirect(`/companies/${companyId}/tasks?workflow=${workflowId}`);
}
