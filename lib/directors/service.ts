import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit/log";
import type { DirectorInput } from "@/lib/validation/schemas";
import type { Director } from "@/lib/types";

export async function addDirector(
  supabase: SupabaseClient,
  companyId: string,
  workspaceId: string,
  userId: string,
  input: DirectorInput,
): Promise<Director> {
  const { data, error } = await supabase
    .from("directors")
    .insert({
      company_id: companyId,
      full_name: input.full_name,
      cnic: input.cnic || null,
      designation: input.designation || null,
      appointment_date: input.appointment_date || null,
      status: "ACTIVE",
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to add director");

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "DIRECTOR_ADDED",
    entity_type: "director",
    entity_id: data.id,
    metadata: { full_name: data.full_name },
  });

  return data;
}

export async function resignDirector(
  supabase: SupabaseClient,
  directorId: string,
  companyId: string,
  workspaceId: string,
  userId: string,
  resignationDate: string,
): Promise<Director> {
  const { data, error } = await supabase
    .from("directors")
    .update({ status: "RESIGNED", resignation_date: resignationDate })
    .eq("id", directorId)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to resign director");

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "DIRECTOR_RESIGNED",
    entity_type: "director",
    entity_id: directorId,
    metadata: { resignation_date: resignationDate },
  });

  return data;
}

export async function listDirectors(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("directors")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Director[];
}
