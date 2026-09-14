"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { downloadDocumentAction, listVersionsAction, uploadNewVersionAction, type VersionFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { DocumentRecord, DocumentVersion } from "@/lib/types";

const initialState: VersionFormState = {};

export function DocumentItem({ companyId, doc }: { companyId: string; doc: DocumentRecord }) {
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[] | null>(null);
  const [loadingVersions, startLoadingVersions] = useTransition();
  const [downloadPending, startDownload] = useTransition();
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const action = uploadNewVersionAction.bind(null, companyId, doc.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const hasMounted = useRef(false);

  function refetchVersions() {
    startLoadingVersions(async () => {
      const result = await listVersionsAction(companyId, doc.id);
      setVersions(result as DocumentVersion[]);
    });
  }

  function toggleVersions() {
    const next = !showVersions;
    setShowVersions(next);
    if (next) refetchVersions();
  }

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (!state?.error) refetchVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function download(path: string) {
    startDownload(async () => {
      try {
        const url = await downloadDocumentAction(companyId, path);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch {
        setDownloadError("Couldn't generate a download link.");
      }
    });
  }

  return (
    <div className="border-b border-slate-100 pb-3 last:border-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">{doc.name}</p>
          <p className="text-xs text-slate-500">
            {doc.document_type.replaceAll("_", " ")} · Uploaded {formatDate(doc.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={doc.status} />
          <Button size="sm" variant="outline" disabled={downloadPending} onClick={() => download(doc.storage_path)}>
            {downloadPending ? "Preparing…" : "Download"}
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleVersions}>
            {showVersions ? "Hide versions" : "Versions"}
          </Button>
        </div>
      </div>
      {downloadError && <p className="mt-1 text-xs text-red-600">{downloadError}</p>}

      {showVersions && (
        <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-3">
          {loadingVersions && <p className="text-xs text-slate-500">Loading versions…</p>}
          {!loadingVersions && versions && versions.length > 0 && (
            <ul className="space-y-1">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    v{v.version_number} · {formatDate(v.created_at)}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => download(v.storage_path)}>
                    Download
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <form action={formAction} className="mt-3 flex items-center gap-2">
            <Input name="file" type="file" required className="text-xs" />
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Uploading…" : "Upload new version"}
            </Button>
          </form>
          {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
        </div>
      )}
    </div>
  );
}
