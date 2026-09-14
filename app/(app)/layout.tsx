import Link from "next/link";
import { requireSession } from "@/lib/session/current";
import { SidebarNav } from "@/components/sidebar-nav";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspaceName, role } = await requireSession();

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="border-b border-slate-200 px-4 py-4">
          <Link href="/dashboard" className="text-base font-semibold tracking-tight">
            CorpNizam
          </Link>
          <p className="mt-0.5 truncate text-xs text-slate-500">{workspaceName}</p>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <p className="text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-900">{user.email}</span>{" "}
            <span className="text-slate-400">({role})</span>
          </p>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </header>
        <main className="flex-1 bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
