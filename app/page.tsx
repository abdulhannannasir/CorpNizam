import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PRICING_PLANS = [
  {
    name: "Starter",
    price: "PKR 3,000",
    period: "/month",
    audience: "For small businesses.",
    features: ["1 company", "Core corporate records", "Compliance calendar", "Document vault"],
  },
  {
    name: "Business",
    price: "PKR 7,500",
    period: "/month",
    audience: "For growing companies.",
    features: ["Up to 5 companies", "Corporate event workflows", "Task management", "Audit trail"],
  },
  {
    name: "Professional",
    price: "PKR 15,000",
    period: "/month",
    audience: "For companies and legal teams managing multiple entities.",
    features: ["Unlimited companies", "Full RBAC", "Contracts module", "Priority support"],
  },
];

const FAQS = [
  {
    question: "What is CorpNizam?",
    answer:
      "CorpNizam is a corporate legal & compliance operating system for Pakistani businesses. It's company-centric and event-driven: every director change, share transfer, or new investment is recorded once as a corporate event, which automatically generates the workflow, tasks, and evidence requests needed to handle it — with a full audit trail of who did what, when.",
  },
  {
    question: "Is CorpNizam a law firm, or does it give legal advice?",
    answer:
      "No. CorpNizam is software, not a law firm, and does not provide legal advice. Compliance content is always clearly labelled Verified (backed by a checked source) or Requires legal verification (not yet confirmed) — it never presents an unverified rule as settled law.",
  },
  {
    question: "How is my company's data kept separate from other companies on the platform?",
    answer:
      "Every company belongs to a workspace, and Postgres Row Level Security enforces that isolation at the database level — not just in the UI. A user can only read or write data for workspaces they're a member of, and this is enforced by the database itself regardless of what the client sends.",
  },
  {
    question: "What happens when I record something like a director resignation?",
    answer:
      "Recording the event updates the director's status, creates a corporate event record, and automatically generates a workflow with the relevant tasks (updating records, requesting supporting documents, flagging any filing that needs legal verification). Every step is written to the audit trail as it happens.",
  },
  {
    question: "Where are my documents stored, and who can access them?",
    answer:
      "Documents live in a private storage bucket and are only ever served through short-lived signed URLs — there's no public link to a document, ever. Access follows the same workspace-role permissions as everything else.",
  },
  {
    question: "Can I manage more than one company?",
    answer:
      "Yes. A workspace can hold multiple companies, and each plan sets a different limit — from 1 company on Starter up to unlimited companies on Professional.",
  },
  {
    question: "Is CorpNizam specific to Pakistani companies?",
    answer:
      "Yes, the initial product is designed around Pakistani corporate structures and provinces. We're deliberately cautious about statutory detail, though: no SECP/FBR filing deadline, form, or penalty is presented as fact unless it has been verified against an official source — anything else is flagged as requiring legal verification.",
  },
];

const SECTIONS = [
  {
    title: "The problem",
    body: "Corporate records, compliance deadlines, and supporting documents for Pakistani companies usually live scattered across spreadsheets, email threads, and paper files — with no single source of truth and no audit trail of what changed, when, or why.",
  },
  {
    title: "The product",
    body: "CorpNizam is company-centric and event-driven: every director change, share transfer, or new investment is recorded as a corporate event that automatically generates the workflow, tasks, and evidence requests needed to handle it.",
  },
  {
    title: "How CorpNizam works",
    body: "Company → Corporate Event → Legal/Compliance Consequences → Workflow → Tasks → Documents → Deadlines → Evidence → Audit Trail. Nothing happens silently — every material action is explained and logged.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex-1">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="shrink-0 text-lg font-semibold tracking-tight">CorpNizam</span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm">
                <span className="hidden sm:inline">Start Managing Your Company</span>
                <span className="sm:hidden">Get started</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Run Your Company. Stay Corporate-Ready.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            CorpNizam brings company records, corporate events, compliance workflows, documents,
            deadlines, and audit trails into one operating system for Pakistani businesses.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Start Managing Your Company</Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {SECTIONS.map((s) => (
            <Card key={s.title}>
              <CardHeader>
                <CardTitle>{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-slate-600">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-slate-900">
            Corporate events, compliance, documents, audit trail
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-4">
            {[
              { title: "Corporate Events", body: "Director resignations, appointments, share transfers, and new investments — recorded once, tracked everywhere." },
              { title: "Compliance", body: "Obligations clearly labelled Verified or Requires legal verification — never a fabricated deadline." },
              { title: "Documents", body: "A private, versioned document vault with signed-URL access — nothing is exposed publicly." },
              { title: "Audit Trail", body: "Every material action is logged: who, what, when, and why. The log itself cannot be edited." },
            ].map((f) => (
              <div key={f.title}>
                <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-slate-900">Security</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
          Every company belongs to a workspace, and every workspace is isolated by Postgres row-level
          security enforced on the database itself — not just hidden in the UI. Documents are stored
          in private buckets and served only via short-lived signed URLs.
        </p>
      </section>

      <section id="pricing" className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-slate-900">Pricing</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <Card key={plan.name} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-2xl font-semibold text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  </div>
                  <CardDescription>{plan.audience}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <ul className="space-y-2 text-sm text-slate-600">
                    {plan.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <Button variant="outline" className="w-full">
                      Get started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-slate-900">
          Frequently asked questions
        </h2>
        <div className="mt-10 divide-y divide-slate-200 border-t border-b border-slate-200">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-900 transition-colors hover:text-slate-600">
                {faq.question}
                <span className="shrink-0 text-slate-400 transition-transform duration-300 ease-out group-open:rotate-45 group-open:text-slate-900">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Ready to get corporate-ready?</h2>
        <div className="mt-6">
          <Link href="/signup">
            <Button size="lg">Start Managing Your Company</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-xs text-slate-400">
          CorpNizam is not a law firm and does not provide legal advice. Compliance content is
          clearly labelled Verified or Requires legal verification.
        </div>
      </footer>
    </div>
  );
}
