"use client";

import { useActionState } from "react";
import { recordDirectorResignationAction, type EventFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { Director } from "@/lib/types";

const initialState: EventFormState = {};

export function DirectorResignationForm({
  companyId,
  directors,
}: {
  companyId: string;
  directors: Director[];
}) {
  const action = recordDirectorResignationAction.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="director_id">Director</Label>
        <Select id="director_id" name="director_id" required defaultValue="">
          <option value="" disabled>
            Select a director…
          </option>
          {directors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.full_name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="resignation_date">Resignation date</Label>
        <Input id="resignation_date" name="resignation_date" type="date" required />
      </div>
      <div>
        <Label htmlFor="reason">Reason</Label>
        <Input id="reason" name="reason" />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Recording…" : "Record resignation"}
      </Button>
    </form>
  );
}
