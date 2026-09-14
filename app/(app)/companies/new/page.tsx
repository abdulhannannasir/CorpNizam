"use client";

import { useActionState } from "react";
import { createCompanyAction, type CompanyFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { companyTypeValues, provinceValues } from "@/lib/validation/schemas";

const initialState: CompanyFormState = {};

export default function NewCompanyPage() {
  const [state, formAction, pending] = useActionState(createCompanyAction, initialState);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Add Company</h1>
      <form action={formAction}>
        <Card>
          <CardHeader>
            <CardTitle>Company details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="legal_name">Legal name</Label>
              <Input id="legal_name" name="legal_name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registration_number">Registration number</Label>
                <Input id="registration_number" name="registration_number" />
              </div>
              <div>
                <Label htmlFor="ntn">NTN</Label>
                <Input id="ntn" name="ntn" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_type">Company type</Label>
                <Select id="company_type" name="company_type" defaultValue="">
                  <option value="">Select…</option>
                  {companyTypeValues.map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="province">Province</Label>
                <Select id="province" name="province" defaultValue="">
                  <option value="">Select…</option>
                  {provinceValues.map((p) => (
                    <option key={p} value={p}>
                      {p.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="incorporation_date">Incorporation date</Label>
                <Input id="incorporation_date" name="incorporation_date" type="date" />
              </div>
              <div>
                <Label htmlFor="fiscal_year_end">Fiscal year end</Label>
                <Input id="fiscal_year_end" name="fiscal_year_end" placeholder="June 30" />
              </div>
            </div>
            <div>
              <Label htmlFor="registered_address">Registered address</Label>
              <Textarea id="registered_address" name="registered_address" />
            </div>

            {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Create company"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
