"use client";

import { useActionState } from "react";
import { addDirectorAction, type DirectorFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: DirectorFormState = {};

export function DirectorForm({ companyId }: { companyId: string }) {
  const action = addDirectorAction.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end">
      <div className="sm:col-span-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div>
        <Label htmlFor="cnic">CNIC</Label>
        <Input id="cnic" name="cnic" placeholder="12345-1234567-1" />
      </div>
      <div>
        <Label htmlFor="designation">Designation</Label>
        <Input id="designation" name="designation" placeholder="Director" />
      </div>
      <div>
        <Label htmlFor="appointment_date">Appointment date</Label>
        <Input id="appointment_date" name="appointment_date" type="date" />
      </div>
      <div className="sm:col-span-5">
        {state?.error && <p className="mb-2 text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Adding…" : "Add director"}
        </Button>
      </div>
    </form>
  );
}
