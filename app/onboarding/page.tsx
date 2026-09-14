"use client";

import { useActionState, useState } from "react";
import { completeOnboarding, type OnboardingState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { companyTypeValues, provinceValues } from "@/lib/validation/schemas";

const STEPS = ["Workspace", "Company", "Directors", "Shareholders", "Done"] as const;
const initialState: OnboardingState = {};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-lg">
        <ol className="mb-6 flex items-center justify-between text-xs font-medium text-slate-400">
          {STEPS.map((s, i) => (
            <li key={s} className={i <= step ? "text-slate-900" : ""}>
              {s}
            </li>
          ))}
        </ol>

        <form action={formAction}>
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[step]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={step === 0 ? "block" : "hidden"}>
                <Label htmlFor="workspaceName">Workspace name</Label>
                <Input id="workspaceName" name="workspaceName" placeholder="Acme Holdings" required={step === 0} />
              </div>

              <div className={step === 1 ? "block space-y-4" : "hidden"}>
                <div>
                  <Label htmlFor="legalName">Company legal name</Label>
                  <Input id="legalName" name="legalName" placeholder="Acme (Private) Limited" required={step === 1} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registrationNumber">Registration number</Label>
                    <Input id="registrationNumber" name="registrationNumber" />
                  </div>
                  <div>
                    <Label htmlFor="ntn">NTN</Label>
                    <Input id="ntn" name="ntn" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyType">Company type</Label>
                    <Select id="companyType" name="companyType" defaultValue="">
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
              </div>

              <div className={step === 2 ? "block space-y-4" : "hidden"}>
                <p className="text-sm text-slate-500">Optional — you can add directors later.</p>
                <div>
                  <Label htmlFor="directorName">Director full name</Label>
                  <Input id="directorName" name="directorName" />
                </div>
              </div>

              <div className={step === 3 ? "block space-y-4" : "hidden"}>
                <p className="text-sm text-slate-500">Optional — you can add shareholders later.</p>
                <div>
                  <Label htmlFor="shareholderName">Shareholder name</Label>
                  <Input id="shareholderName" name="shareholderName" />
                </div>
                <div>
                  <Label htmlFor="shareholderShares">Shares</Label>
                  <Input id="shareholderShares" name="shareholderShares" type="number" defaultValue={100} />
                </div>
              </div>

              <div className={step === 4 ? "block" : "hidden"}>
                <p className="text-sm text-slate-600">
                  Everything is ready. Click finish to create your workspace, company, and open your
                  dashboard.
                </p>
              </div>

              {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                >
                  Back
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                    {step === 0 || step === 1 ? "Next" : "Skip / Next"}
                  </Button>
                ) : (
                  <Button type="submit" disabled={pending}>
                    {pending ? "Setting up…" : "Finish"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
