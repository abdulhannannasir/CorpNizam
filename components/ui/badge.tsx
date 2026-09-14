import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  default: "bg-slate-100 text-slate-700 ring-slate-600/10",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
  neutral: "bg-slate-50 text-slate-600 ring-slate-500/20",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

const STATUS_TONE: Record<string, Tone> = {
  ACTIVE: "success",
  HEALTHY: "success",
  VERIFIED: "success",
  COMPLETED: "success",
  UPCOMING: "info",
  TODO: "neutral",
  DUE_SOON: "warning",
  NEEDS_ATTENTION: "warning",
  IN_PROGRESS: "info",
  REQUIRES_REVIEW: "warning",
  DRAFT: "neutral",
  BLOCKED: "danger",
  OVERDUE: "danger",
  AT_RISK: "danger",
  EXPIRED: "danger",
  TERMINATED: "danger",
  RESIGNED: "neutral",
  REMOVED: "neutral",
  NOT_APPLICABLE: "neutral",
  EXPIRING: "warning",
  CANCELLED: "neutral",
  PENDING: "info",
  PROCESSING: "info",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? "default"}>{status.replace(/_/g, " ")}</Badge>
  );
}
