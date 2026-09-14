import { requireCompanyAccess } from "@/lib/session/current";
import { listShareholders, listShareholdings } from "@/lib/shareholders/service";
import { calculateOwnership } from "@/lib/shareholders/ownership";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareholderForm } from "./shareholder-form";

export default async function ShareholdersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireCompanyAccess(id);

  const [shareholders, shareholdings] = await Promise.all([
    listShareholders(supabase, id),
    listShareholdings(supabase, id),
  ]);

  const ownership = calculateOwnership(shareholdings);
  const byId = new Map(shareholders.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add shareholder</CardTitle>
        </CardHeader>
        <CardContent>
          <ShareholderForm companyId={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ownership</CardTitle>
        </CardHeader>
        <CardContent>
          {ownership.length === 0 ? (
            <p className="text-sm text-slate-500">No shareholding records yet.</p>
          ) : (
            <div className="space-y-3">
              {ownership.map((o) => {
                const holder = byId.get(o.shareholderId);
                return (
                  <div key={o.shareholderId}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">{holder?.name ?? "Unknown"}</span>
                      <span className="text-slate-600">
                        {o.percentage.toFixed(1)}% ({o.shares.toLocaleString()} shares)
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{ width: `${Math.min(100, o.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="pt-2 text-xs text-slate-400">
                Total shares: {ownership.reduce((sum, o) => sum + o.shares, 0).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
