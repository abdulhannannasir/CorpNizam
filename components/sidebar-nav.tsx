"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavGroup {
  label: string;
  items: { href: string; label: string }[];
}

function buildGroups(): NavGroup[] {
  return [
    { label: "", items: [{ href: "/dashboard", label: "Overview" }] },
    { label: "Companies", items: [{ href: "/companies", label: "All Companies" }] },
    {
      label: "Work",
      items: [
        { href: "/tasks", label: "Tasks" },
      ],
    },
    {
      label: "",
      items: [
        { href: "/audit", label: "Audit Trail" },
        { href: "/ask", label: "Ask CorpNizam" },
        { href: "/settings", label: "Settings" },
      ],
    },
  ];
}

export function SidebarNav() {
  const pathname = usePathname();
  const groups = buildGroups();

  return (
    <nav className="flex flex-col gap-5 p-4 text-sm">
      {groups.map((group, i) => (
        <div key={i}>
          {group.label && (
            <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      active && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
