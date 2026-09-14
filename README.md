# CorpNizam

A Corporate Legal & Compliance Operating System for Pakistani businesses.

CorpNizam is company-centric and event-driven: every corporate event (a
director resigning, a share transfer, a new investment) is recorded once and
automatically generates the workflow, tasks, deadlines, and evidence
requests needed to handle it — with every material action written to an
append-only audit trail.

```
Company → Corporate Event → Legal/Compliance Consequences → Workflow →
Tasks → Documents → Deadlines → Evidence → Audit Trail
```

## What it is

- **Company-first.** Every record belongs to a company, and every company
  belongs to a workspace.
- **Event-driven.** Corporate events (see `lib/corporate-events/rules.ts`)
  generate workflows and tasks through a reusable engine, not hard-coded UI
  logic.
- **Evidence-based & auditable.** Tasks can require evidence; every material
  action writes an audit log entry that cannot be edited or deleted through
  the application.
- **Permission-aware.** Six workspace roles (`OWNER`, `ADMIN`, `LAWYER`,
  `MANAGER`, `MEMBER`, `VIEWER`) are enforced by Postgres Row Level Security,
  not just hidden UI buttons — see "Security model" below.
- **Pakistan-focused, legally honest.** No Pakistani legal requirement,
  deadline, or filing form is fabricated anywhere in this codebase. Anything
  not verified against an official source is explicitly labelled
  **"Requires legal verification"** rather than presented as fact.

## Architecture

```
app/                    Next.js App Router routes (UI + server actions)
  (app)/                Authenticated app shell: dashboard, companies, tasks…
  login/, signup/, onboarding/
components/ui/          Small local UI primitives (button, card, badge, input…)
lib/
  supabase/             Browser/server/middleware Supabase clients
  validation/           Zod schemas — the single source of input validation
  permissions/          UI-only role helpers (never the authorization boundary)
  audit/                Append-only audit log writer
  companies/ directors/ shareholders/ corporate-events/ workflows/
  documents/ compliance/ contracts/ health/ workspaces/
                         Domain services — all Supabase queries live here,
                         never inline in a page/component
  session/               Server-side "current user + workspace" resolution
supabase/migrations/     SQL schema + Row Level Security policies
tests/                   Vitest unit tests for pure business logic
scripts/seed.ts          Demo data seed script
```

Business logic is deliberately kept out of components: a page/server action
calls a function in `lib/<domain>/service.ts`, which talks to Supabase and
writes the audit log entry, so the same logic is reusable and independently
testable.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres,
Auth, Storage, Row Level Security) · Zod · React Server Actions · Vitest.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's URL + anon key
npm run dev
```

## Supabase setup

1. Create a Supabase project.
2. Apply the migrations in `supabase/migrations/`, in order, via the
   Supabase CLI (`supabase db push`) or by pasting each into the SQL
   editor. `0001_init.sql` creates every table, index, and RLS policy;
   `0002`–`0003` harden the RLS helper functions per the security advisor
   (pinned `search_path`, moved two non-membership-checking lookups into a
   `private` schema so they aren't exposed as public RPC endpoints);
   `0004` creates the private `documents` storage bucket with tenant-scoped
   policies on `storage.objects` — no separate manual bucket-creation step
   is needed if you run this migration.
3. Copy the project URL and publishable/anon key into `.env.local` (see
   `.env.example`).
4. For local browser testing, disable **Confirm email** under
   Authentication → Sign In / Providers → Email so signups return a session
   immediately; otherwise Supabase's default email rate limit (a handful of
   emails/hour before custom SMTP is configured) will block repeated
   signups during testing.

### Migrations

Keep schema changes as new files in `supabase/migrations/`, applied in
order. Never hand-edit a production schema outside of a migration file.
After any DDL change, run Supabase's security/performance advisors and
address what they flag — that's how `0002`/`0003` were derived.

### Seed data

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
```

Creates a demo workspace, company, directors, shareholders, a corporate
event with a generated workflow, a compliance obligation, a contract, and
audit log entries — everything prefixed `[DEMO]`. The service-role key is
required only for this script (to create the demo auth user) and must never
be used from the browser or committed to the repo.

## Testing

```bash
npm run test        # Vitest — ownership calculation, corporate health,
                     # obligation/contract status, permissions, validation,
                     # legal-data-safety checks on workflow templates
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # next build
```

For live acceptance testing against a running Supabase-backed instance
(auth, tenant isolation, the director-resignation workflow, ownership
math, document upload), start the dev server and run:

```bash
npm run dev -- -p 3100 &
npm run e2e
```

`scripts/e2e-check.mjs` drives a real browser through signup, onboarding,
directors, share-based ownership, recording a director resignation,
completing a generated task, and a second user's browser being denied
access to the first user's company (tenant isolation) — printing a
PASS/FAIL line per acceptance-test scenario.

Unit tests cover pure business logic that doesn't require a live database
(ownership math, corporate health scoring, status derivation, RBAC helpers,
Zod schemas). End-to-end flows that need a live Supabase project and a
running app (auth, tenant isolation, RLS enforcement, document upload) are
described in "Acceptance tests" below and require a configured Supabase
project to execute against — see that section for what has and has not been
verified in this environment.

## Security model

- **Row Level Security is the authorization boundary**, not the UI.
  `lib/permissions/roles.ts` only decides what buttons to show; every
  mutation is re-checked by the RLS policies in
  `supabase/migrations/0001_init.sql`. A user who bypasses the UI still
  cannot read or write data outside their workspace.
- **Tenant isolation.** Every company-scoped table's RLS policy resolves the
  owning workspace server-side (`company_workspace_id()`,
  `workflow_workspace_id()`) and checks workspace membership — a client can
  never supply a workspace/company id to escalate access.
- **Documents are private.** The storage bucket is private; the app only
  issues short-lived signed URLs, never public links.
- **Audit logs are append-only.** `audit_logs` has SELECT and INSERT
  policies only — no UPDATE/DELETE policy exists, so the database itself
  refuses those operations regardless of caller.
- **No service-role key in the browser.** The service-role key is used only
  in `scripts/seed.ts`, a server-only script, never imported by any
  browser-reachable code.
- **Validation.** All form input is validated with Zod
  (`lib/validation/schemas.ts`) before it reaches a service function.

## Legal-data safety model

CorpNizam never fabricates Pakistani statutory requirements. Every
`compliance_rules` row carries a `verification_status`
(`VERIFIED` / `REQUIRES_REVIEW` / `DRAFT`), and the UI always renders that
status as a visible badge. Workflow task templates
(`lib/corporate-events/rules.ts`) that would otherwise need to cite a
specific SECP/FBR form or statutory deadline instead say explicitly:

> Requirement identified — requires legal verification.

This is enforced, not just documented: `tests/compliance.test.ts` asserts
that any task template mentioning a statutory filing is flagged
`requiresLegalVerification: true` and carries no fabricated due date.

## Roadmap (explicitly out of scope for this MVP)

SECP/FBR/bank/accounting integrations, e-signatures, email/WhatsApp
notifications, a live "Ask CorpNizam" model connection, contract drafting,
client portals, billing/payments, and a public API. The architecture (event
→ rule → workflow engine, domain service layer, RLS-scoped multi-tenancy)
is designed so these can be added later without a rewrite.

## Status of this build

This is a from-scratch MVP build covering the full vertical slice described
in the product brief: auth, workspaces/RBAC, company management,
directors/shareholders/ownership, the corporate event engine, a fully wired
director-resignation workflow, tasks/deadlines, a compliance
obligations/rules view, a private/versioned document vault, a contracts
module, an append-only audit trail, a deterministic corporate health score,
and the Ask CorpNizam architecture (UI + response-category model, not yet
wired to a live model, by design — see product brief section 48).

`npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` all
pass in this environment. End-to-end acceptance testing against a live
Supabase project (real signups, live RLS enforcement, live document
upload/download) has **not** been performed in this environment, because no
Supabase project credentials were available here — see the PR description
for the exact pass/fail/blocked status of each acceptance test.
