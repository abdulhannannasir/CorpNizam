import type { Metadata } from "next";
import { requireSession } from "@/lib/session/current";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase, workspaceId, workspaceName } = await requireSession();

  const { data: members } = await supabase
    .from("workspace_members")
    .select("id, role, user_id")
    .eq("workspace_id", workspaceId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-900">{workspaceName}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members?.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{m.user_id}</span>
              <StatusBadge status={m.role} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
