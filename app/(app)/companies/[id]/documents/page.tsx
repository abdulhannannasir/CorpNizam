import { requireCompanyAccess } from "@/lib/session/current";
import { listDocuments } from "@/lib/documents/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadForm } from "./upload-form";
import { DocumentItem } from "./document-item";

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
                <DocumentItem key={d.id} companyId={id} doc={d} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
