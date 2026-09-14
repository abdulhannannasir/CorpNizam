"use client";

import { useActionState } from "react";
import { uploadDocumentAction, type DocumentFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

const initialState: DocumentFormState = {};

export function UploadForm({ companyId }: { companyId: string }) {
  const action = uploadDocumentAction.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
      <div>
        <Label htmlFor="name">Document name</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="document_type">Category</Label>
        <Select id="document_type" name="document_type" defaultValue="OTHER">
          <option value="CORPORATE_DOCUMENT">Corporate Documents</option>
          <option value="COMPLIANCE_EVIDENCE">Compliance Evidence</option>
          <option value="CONTRACT">Contracts</option>
          <option value="IDENTITY_RECORD">Identity/Company Records</option>
          <option value="OTHER">Other</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="file">File</Label>
        <Input id="file" name="file" type="file" required />
      </div>
      <div>
        {state?.error && <p className="mb-2 text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </form>
  );
}
