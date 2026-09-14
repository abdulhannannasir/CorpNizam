import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompanyAccess } from "@/lib/session/current";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { company } = await requireCompanyAccess(id);
  return { title: company?.legal_name ?? "Company" };
}

const TABS = [
  { href: "", label: "Overview" },
  { href: "/directors", label: "Directors" },
  { href: "/shareholders", label: "Ownership" },
  { href: "/events", label: "Events" },
  { href: "/compliance", label: "Compliance" },
  { href: "/documents", label: "Documents" },
  { href: "/contracts", label: "Contracts" },
  { href: "/tasks", label: "Tasks" },
  { href: "/activity", label: "Activity" },
];

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { company } = await requireCompanyAccess(id);
  if (!company) notFound();

  const base = `/companies/${id}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/companies" className="text-xs text-slate-500 hover:underline">
          ← All Companies
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{company.legal_name}</h1>
          <StatusBadge status={company.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Registration No: {company.registration_number ?? "—"} · NTN: {company.ntn ?? "—"}
        </p>
      </div>

      <div className="overflow-x-auto border-b border-slate-200">
        <nav className="flex gap-1 text-sm">
          {TABS.map((tab) => (
            <CompanyTabLink key={tab.href} href={`${base}${tab.href}`} label={tab.label} />
          ))}
        </nav>
      </div>

      {children}
    </div>
  );
}

function CompanyTabLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-slate-600 hover:text-slate-900",
      )}
    >
      {label}
    </Link>
  );
}
