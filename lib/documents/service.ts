import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/audit/log";
import type { DocumentCategory, DocumentRecord } from "@/lib/types";

export const DOCUMENTS_BUCKET = "documents";

function storagePath(companyId: string, documentId: string, fileName: string) {
  return `${companyId}/${documentId}/${fileName}`;
}

/**
 * Uploads a file to the private `documents` storage bucket and creates the
 * document metadata row + an initial version record. The bucket must be
 * private (see supabase/README section on storage) — this service never
 * returns a public URL, only short-lived signed URLs via getSignedUrl().
 */
export async function uploadDocument(
  supabase: SupabaseClient,
  companyId: string,
  workspaceId: string,
  userId: string,
  file: File,
  name: string,
  documentType: DocumentCategory,
  workflowId?: string | null,
): Promise<DocumentRecord> {
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      company_id: companyId,
      workflow_id: workflowId ?? null,
      name,
      document_type: documentType,
      storage_path: "",
      status: "ACTIVE",
      uploaded_by: userId,
    })
    .select()
    .single();

  if (docError || !doc) throw new Error(docError?.message ?? "Failed to create document record");

  const path = storagePath(companyId, doc.id, file.name);

  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
    upsert: false,
  });

  if (uploadError) throw new Error(uploadError.message);

  const { error: updateError } = await supabase
    .from("documents")
    .update({ storage_path: path })
    .eq("id", doc.id);
  if (updateError) throw new Error(updateError.message);

  const { error: versionError } = await supabase.from("document_versions").insert({
    document_id: doc.id,
    version_number: 1,
    storage_path: path,
    uploaded_by: userId,
  });
  if (versionError) throw new Error(versionError.message);

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "DOCUMENT_UPLOADED",
    entity_type: "document",
    entity_id: doc.id,
    metadata: { name, document_type: documentType },
  });

  return { ...doc, storage_path: path };
}

/**
 * Adds a new version to an existing document without touching the prior
 * version's storage object — old versions always remain retrievable.
 */
export async function createDocumentVersion(
  supabase: SupabaseClient,
  documentId: string,
  companyId: string,
  workspaceId: string,
  userId: string,
  file: File,
) {
  const { data: versions, error: versionsError } = await supabase
    .from("document_versions")
    .select("version_number")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false })
    .limit(1);

  if (versionsError) throw new Error(versionsError.message);
  const nextVersion = (versions?.[0]?.version_number ?? 0) + 1;

  const path = storagePath(companyId, documentId, `v${nextVersion}-${file.name}`);

  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
    upsert: false,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: version, error: insertError } = await supabase
    .from("document_versions")
    .insert({ document_id: documentId, version_number: nextVersion, storage_path: path, uploaded_by: userId })
    .select()
    .single();
  if (insertError) throw new Error(insertError.message);

  const { error: updateError } = await supabase
    .from("documents")
    .update({ storage_path: path })
    .eq("id", documentId);
  if (updateError) throw new Error(updateError.message);

  await writeAuditLog(supabase, {
    workspace_id: workspaceId,
    company_id: companyId,
    user_id: userId,
    action: "DOCUMENT_VERSION_CREATED",
    entity_type: "document",
    entity_id: documentId,
    metadata: { version_number: nextVersion },
  });

  return version;
}

export async function getSignedUrl(supabase: SupabaseClient, path: string, expiresInSeconds = 60) {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw new Error(error?.message ?? "Failed to create signed URL");
  return data.signedUrl;
}

export async function listDocuments(supabase: SupabaseClient, companyId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as DocumentRecord[];
}

export async function listDocumentVersions(supabase: SupabaseClient, documentId: string) {
  const { data, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
