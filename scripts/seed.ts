/**
 * Development seed script — creates a demo workspace, company, directors,
 * shareholders, corporate events, tasks, compliance obligations, and audit
 * events so the app has something to look at in local development.
 *
 * This is clearly demo data: the workspace/company names are prefixed with
 * "[DEMO]" and this data must never be presented as real legal information.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (service-role, server-only) because it
 * creates an auth user directly. Run with:
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const DEMO_EMAIL = "demo@corpnizam.test";
const DEMO_PASSWORD = "CorpNizamDemo123!";

async function main() {
  console.log("Creating demo user...");
  const { data: userResult, error: userError } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Demo User" },
  });
  if (userError && !userError.message.includes("already been registered")) {
    throw userError;
  }
  const userId =
    userResult?.user?.id ??
    (await supabase.auth.admin.listUsers()).data.users.find((u) => u.email === DEMO_EMAIL)?.id;
  if (!userId) throw new Error("Could not resolve demo user id");

  console.log("Creating demo workspace...");
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name: "[DEMO] Acme Holdings", slug: `demo-acme-${Date.now()}`, created_by: userId })
    .select()
    .single();
  if (wsError) throw wsError;

  await supabase.from("workspace_members").insert({ workspace_id: workspace.id, user_id: userId, role: "OWNER" });

  console.log("Creating demo company...");
  const { data: company, error: coError } = await supabase
    .from("companies")
    .insert({
      workspace_id: workspace.id,
      legal_name: "[DEMO] Acme (Private) Limited",
      registration_number: "0012345",
      ntn: "1234567-8",
      company_type: "PRIVATE_LIMITED",
      incorporation_date: "2019-03-01",
      registered_address: "123 Main Boulevard, Lahore",
      province: "PUNJAB",
      status: "ACTIVE",
      fiscal_year_end: "June 30",
    })
    .select()
    .single();
  if (coError) throw coError;

  console.log("Adding directors...");
  const directorNames = ["Ayesha Siddiqui", "Bilal Ahmed", "Sana Malik"];
  const { data: directors } = await supabase
    .from("directors")
    .insert(
      directorNames.map((full_name, i) => ({
        company_id: company.id,
        full_name,
        designation: i === 0 ? "CEO / Director" : "Director",
        appointment_date: "2019-03-01",
        status: "ACTIVE",
      })),
    )
    .select();

  console.log("Adding shareholders...");
  const { data: shareholders } = await supabase
    .from("shareholders")
    .insert([
      { company_id: company.id, name: "Ayesha Siddiqui", entity_type: "INDIVIDUAL" },
      { company_id: company.id, name: "Bilal Ahmed", entity_type: "INDIVIDUAL" },
      { company_id: company.id, name: "Founders Capital (Pvt) Ltd", entity_type: "COMPANY" },
    ])
    .select();

  if (shareholders) {
    await supabase.from("shareholdings").insert([
      { company_id: company.id, shareholder_id: shareholders[0]!.id, shares: 500, effective_from: "2019-03-01" },
      { company_id: company.id, shareholder_id: shareholders[1]!.id, shares: 300, effective_from: "2019-03-01" },
      { company_id: company.id, shareholder_id: shareholders[2]!.id, shares: 200, effective_from: "2019-03-01" },
    ]);
  }

  console.log("Recording a corporate event, workflow, and tasks...");
  const { data: event } = await supabase
    .from("corporate_events")
    .insert({
      company_id: company.id,
      event_type: "NEW_INVESTMENT",
      title: "Seed round closed",
      description: "[DEMO] Seed investment round of PKR 20,000,000.",
      event_date: "2023-09-01",
      status: "PROCESSING",
      created_by: userId,
    })
    .select()
    .single();

  const { data: workflow } = await supabase
    .from("workflows")
    .insert({
      company_id: company.id,
      event_id: event?.id,
      name: "New Investment",
      description: "[DEMO] Workflow generated from the seed investment event.",
      status: "ACTIVE",
    })
    .select()
    .single();

  if (workflow) {
    await supabase.from("workflow_tasks").insert([
      { workflow_id: workflow.id, title: "Record investment details", status: "COMPLETED", priority: "HIGH", completed_at: new Date().toISOString() },
      { workflow_id: workflow.id, title: "Upload investment agreement", status: "TODO", priority: "HIGH", requires_evidence: true, due_date: "2023-09-08" },
      { workflow_id: workflow.id, title: "Assess regulatory filing requirements", status: "TODO", priority: "URGENT" },
    ]);
  }

  console.log("Adding a compliance obligation (requires legal verification)...");
  await supabase.from("compliance_obligations").insert({
    company_id: company.id,
    title: "[DEMO] Annual filing (requires legal verification)",
    description: "Requirement identified — requires legal verification before a deadline is set.",
    status: "REQUIRES_REVIEW",
  });

  console.log("Adding a contract...");
  await supabase.from("contracts").insert({
    company_id: company.id,
    name: "[DEMO] Office lease agreement",
    counterparty: "Lahore Business Center",
    contract_type: "Lease",
    start_date: "2022-01-01",
    expiry_date: "2025-12-31",
    status: "ACTIVE",
  });

  console.log("Writing audit log entries...");
  await supabase.from("audit_logs").insert([
    { workspace_id: workspace.id, company_id: company.id, user_id: userId, action: "COMPANY_CREATED", entity_type: "company", entity_id: company.id },
    { workspace_id: workspace.id, company_id: company.id, user_id: userId, action: "CORPORATE_EVENT_CREATED", entity_type: "corporate_event", entity_id: event?.id },
  ]);

  console.log("\nDone. Demo login:");
  console.log(`  email: ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
  console.log(`  directors created: ${directors?.length ?? 0}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
