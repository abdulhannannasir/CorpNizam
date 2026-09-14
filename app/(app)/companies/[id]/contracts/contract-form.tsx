"use client";

import { useActionState } from "react";
import { createContractAction, type ContractFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const initialState: ContractFormState = {};

export function ContractForm({ companyId }: { companyId: string }) {
  const action = createContractAction.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <Label htmlFor="name">Contract name</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="counterparty">Counterparty</Label>
        <Input id="counterparty" name="counterparty" />
      </div>
      <div>
        <Label htmlFor="contract_type">Type</Label>
        <Input id="contract_type" name="contract_type" />
      </div>
      <div>
        <Label htmlFor="start_date">Start date</Label>
        <Input id="start_date" name="start_date" type="date" />
      </div>
      <div>
        <Label htmlFor="expiry_date">Expiry date</Label>
        <Input id="expiry_date" name="expiry_date" type="date" />
      </div>
      <div>
        <Label htmlFor="renewal_date">Renewal date</Label>
        <Input id="renewal_date" name="renewal_date" type="date" />
      </div>
      <div className="sm:col-span-3">
        {state?.error && <p className="mb-2 text-sm text-red-600">{state.error}</p>}
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Saving…" : "Add contract"}
        </Button>
      </div>
    </form>
  );
}
