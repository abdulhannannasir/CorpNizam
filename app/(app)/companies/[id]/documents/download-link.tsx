"use client";

import { useState, useTransition } from "react";
import { downloadDocumentAction } from "./actions";
import { Button } from "@/components/ui/button";

export function DownloadLink({ companyId, path }: { companyId: string; path: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              const url = await downloadDocumentAction(companyId, path);
              window.open(url, "_blank", "noopener,noreferrer");
            } catch {
              setError("Couldn't generate a download link.");
            }
          })
        }
      >
        {pending ? "Preparing…" : "Download"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
