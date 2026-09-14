"use client";

import { useTransition } from "react";
import { completeTaskAction } from "./actions";
import { Button } from "@/components/ui/button";

export function CompleteTaskButton({ companyId, taskId }: { companyId: string; taskId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => completeTaskAction(companyId, taskId))}
    >
      {pending ? "Completing…" : "Mark complete"}
    </Button>
  );
}
