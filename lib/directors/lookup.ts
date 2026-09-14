import type { SupabaseClient } from "@supabase/supabase-js";

export async function getDirectorName(supabase: SupabaseClient, directorId: string): Promise<string> {
  const { data, error } = await supabase
    .from("directors")
    .select("full_name")
    .eq("id", directorId)
    .single();

  if (error || !data) throw new Error("Director not found");
  return data.full_name as string;
}
