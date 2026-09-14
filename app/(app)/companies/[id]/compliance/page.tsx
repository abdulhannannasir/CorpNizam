import { requireCompanyAccess } from "@/lib/session/current";
import { listComplianceObligations, deriveObligationStatus } from "@/lib/compliance/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function CompliancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireCompanyAccess(id);
  const obligations = await listComplianceObligations(supabase, id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Obligations</CardTitle>
      </CardHeader>
      <CardContent>
        {obligations.length === 0 ? (
          <p className="text-sm text-slate-500">
            No compliance obligations recorded yet. Obligations are generated from workflows and can also
            be added manually once verified rules are configured.
          </p>
        ) : (
          <div className="space-y-3">
            {obligations.map((o) => {
              const rule = (o as unknown as { compliance_rules?: { verification_status: string; authority: string } }).compliance_rules;
              const status = deriveObligationStatus(o);
              return (
                <div key={o.id} className="rounded-md border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">{o.title}</p>
                    <StatusBadge status={status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{o.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {o.due_date && <span className="text-xs text-slate-400">Due {formatDate(o.due_date)}</span>}
                    {rule ? (
                      <Badge tone={rule.verification_status === "VERIFIED" ? "success" : "warning"}>
                        {rule.verification_status === "VERIFIED"
                          ? `Verified · ${rule.authority}`
                          : "Requires legal verification"}
                      </Badge>
                    ) : (
                      <Badge tone="warning">Requires legal verification</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
