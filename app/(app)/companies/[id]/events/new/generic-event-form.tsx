"use client";

import { useActionState } from "react";
import { recordGenericEventAction, type EventFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { CorporateEventType } from "@/lib/types";

const initialState: EventFormState = {};

export function GenericEventForm({ companyId, eventType }: { companyId: string; eventType: CorporateEventType }) {
  const action = recordGenericEventAction.bind(null, companyId, eventType);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>
      <div>
        <Label htmlFor="event_date">Event date</Label>
        <Input id="event_date" name="event_date" type="date" required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Recording…" : "Record event"}
      </Button>
    </form>
  );
}
