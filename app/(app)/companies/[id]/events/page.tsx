import Link from "next/link";
import { requireCompanyAccess } from "@/lib/session/current";
import { listCorporateEvents } from "@/lib/corporate-events/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const EVENT_TYPES = [
  { type: "DIRECTOR_RESIGNED", label: "Director Resignation" },
  { type: "DIRECTOR_APPOINTED", label: "Director Appointment" },
  { type: "SHARE_TRANSFER", label: "Share Transfer" },
  { type: "NEW_SHAREHOLDER", label: "New Shareholder" },
  { type: "NEW_INVESTMENT", label: "New Investment" },
];

export default async function EventsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireCompanyAccess(id);
  const events = await listCorporateEvents(supabase, id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Record Corporate Event</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((e) => (
            <Link key={e.type} href={`/companies/${id}/events/new?type=${e.type}`}>
              <Button variant="outline" size="sm">
                {e.label}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">No corporate events recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.event_type.replaceAll("_", " ")} · {formatDate(e.event_date)}</p>
                  </div>
                  <StatusBadge status={e.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
