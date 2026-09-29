import type { Metadata } from "next";
import { requireSession } from "@/lib/session/current";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit Trail" };

export default async function AuditTrailPage() {
  const { supabase, workspaceId } = await requireSession();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, companies(legal_name)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Audit Trail</h1>
      <Card>
        <CardHeader>
          <CardTitle>Append-only activity log</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-slate-500">No activity recorded yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Action</th>
                  <th className="py-2 font-medium">Entity</th>
                  <th className="py-2 font-medium">Company</th>
                  <th className="py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 text-slate-900">{log.action.replaceAll("_", " ").toLowerCase()}</td>
                    <td className="py-2 text-slate-600">{log.entity_type}</td>
                    <td className="py-2 text-slate-600">
                      {(log.companies as unknown as { legal_name?: string })?.legal_name ?? "—"}
                    </td>
                    <td className="py-2 text-slate-400">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
