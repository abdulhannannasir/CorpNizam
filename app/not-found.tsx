import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-24 text-center">
      <p className="text-sm font-semibold text-slate-500">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-4 max-w-md text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist, may have moved, or you might not have
        access to it.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button>Go to homepage</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
