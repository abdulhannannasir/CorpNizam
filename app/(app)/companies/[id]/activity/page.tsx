import { requireCompanyAccess } from "@/lib/session/current";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireCompanyAccess(id);

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("company_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <p className="text-sm text-slate-500">No activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <p className="text-sm text-slate-900">{log.action.replaceAll("_", " ").toLowerCase()}</p>
                  <p className="text-xs text-slate-500">{log.entity_type}</p>
                </div>
                <span className="text-xs text-slate-400">{formatDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
