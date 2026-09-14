"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyAccess } from "@/lib/session/current";
import { uploadDocument, getSignedUrl } from "@/lib/documents/service";
import { documentUploadSchema } from "@/lib/validation/schemas";

export interface DocumentFormState {
  error?: string;
}

export async function uploadDocumentAction(
  companyId: string,
  _prevState: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const { supabase, workspaceId, user } = await requireCompanyAccess(companyId);

  const file = formData.get("file");
  const parsed = documentUploadSchema.safeParse({
    name: formData.get("name"),
    document_type: formData.get("document_type"),
  });

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload" };
  }
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid document details" };
  }

  try {
    await uploadDocument(supabase, companyId, workspaceId, user.id, file, parsed.data.name, parsed.data.document_type);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "We couldn't upload this document. Please try again." };
  }

  revalidatePath(`/companies/${companyId}/documents`);
  return {};
}

export async function downloadDocumentAction(companyId: string, path: string) {
  const { supabase } = await requireCompanyAccess(companyId);
  return getSignedUrl(supabase, path, 120);
}
