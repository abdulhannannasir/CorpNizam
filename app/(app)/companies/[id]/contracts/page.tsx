import { requireCompanyAccess } from "@/lib/session/current";
import { listContracts, deriveContractStatus } from "@/lib/contracts/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ContractForm } from "./contract-form";

export default async function ContractsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireCompanyAccess(id);
  const contracts = await listContracts(supabase, id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add contract</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm companyId={id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="text-sm text-slate-500">No contracts tracked yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Counterparty</th>
                  <th className="py-2 font-medium">Expiry</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium text-slate-900">{c.name}</td>
                    <td className="py-2 text-slate-600">{c.counterparty ?? "—"}</td>
                    <td className="py-2 text-slate-600">{formatDate(c.expiry_date)}</td>
                    <td className="py-2"><StatusBadge status={deriveContractStatus(c)} /></td>
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
