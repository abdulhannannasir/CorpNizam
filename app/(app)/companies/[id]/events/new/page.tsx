import { requireCompanyAccess } from "@/lib/session/current";
import { listDirectors } from "@/lib/directors/service";
import { listShareholders } from "@/lib/shareholders/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DirectorResignationForm } from "./director-resignation-form";
import { GenericEventForm } from "./generic-event-form";
import type { CorporateEventType } from "@/lib/types";

const EVENT_LABELS: Record<CorporateEventType, string> = {
  DIRECTOR_RESIGNED: "Director Resignation",
  DIRECTOR_APPOINTED: "Director Appointment",
  SHARE_TRANSFER: "Share Transfer",
  NEW_SHAREHOLDER: "New Shareholder",
  NEW_INVESTMENT: "New Investment",
};

export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const { supabase } = await requireCompanyAccess(id);

  const eventType = (type as CorporateEventType) ?? "DIRECTOR_RESIGNED";

  if (eventType === "DIRECTOR_RESIGNED") {
    const directors = await listDirectors(supabase, id);
    const activeDirectors = directors.filter((d) => d.status === "ACTIVE");
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-xl font-semibold text-slate-900">Record Corporate Event</h1>
        <Card>
          <CardHeader>
            <CardTitle>Director Resignation</CardTitle>
          </CardHeader>
          <CardContent>
            {activeDirectors.length === 0 ? (
              <p className="text-sm text-slate-500">
                There are no active directors to resign. Add a director first.
              </p>
            ) : (
              <DirectorResignationForm companyId={id} directors={activeDirectors} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (eventType === "NEW_SHAREHOLDER" || eventType === "SHARE_TRANSFER") {
    await listShareholders(supabase, id);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Record Corporate Event</h1>
      <Card>
        <CardHeader>
          <CardTitle>{EVENT_LABELS[eventType]}</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericEventForm companyId={id} eventType={eventType} />
        </CardContent>
      </Card>
    </div>
  );
}
