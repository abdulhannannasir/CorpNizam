import { requireCompanyAccess } from "@/lib/session/current";
import { listDocuments } from "@/lib/documents/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { UploadForm } from "./upload-form";
import { DownloadLink } from "./download-link";

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireCompanyAccess(id);
  const documents = await listDocuments(supabase, id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload document</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadForm companyId={id} />
          <p className="mt-2 text-xs text-slate-400">
            Files are stored in a private bucket and served only via short-lived signed URLs.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Document Vault</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{d.name}</p>
                    <p className="text-xs text-slate-500">
                      {d.document_type.replaceAll("_", " ")} · Uploaded {formatDate(d.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={d.status} />
                    <DownloadLink companyId={id} path={d.storage_path} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
