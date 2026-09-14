"use client";

import { useActionState } from "react";
import { addShareholderAction, type ShareholderFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

const initialState: ShareholderFormState = {};

export function ShareholderForm({ companyId }: { companyId: string }) {
  const action = addShareholderAction.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="entity_type">Type</Label>
        <Select id="entity_type" name="entity_type" defaultValue="INDIVIDUAL">
          <option value="INDIVIDUAL">Individual</option>
          <option value="COMPANY">Company</option>
          <option value="TRUST">Trust</option>
          <option value="OTHER">Other</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="shares">Shares</Label>
        <Input id="shares" name="shares" type="number" min={1} required />
      </div>
      <div>
        <Label htmlFor="identifier">Identifier (optional)</Label>
        <Input id="identifier" name="identifier" />
      </div>
      <div className="sm:col-span-4">
        {state?.error && <p className="mb-2 text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Adding…" : "Add shareholder"}
        </Button>
      </div>
    </form>
  );
}
