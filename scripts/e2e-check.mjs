/**
 * Manual acceptance-test script for a live Supabase-backed instance.
 *
 * Not part of the automated test suite (npm test) — it drives a real
 * browser against a running `npm run dev` server and a real Supabase
 * project, exercising signup, onboarding, directors, ownership, the
 * director-resignation workflow engine, tasks, and tenant isolation end to
 * end. Requires "Confirm email" to be disabled in Supabase Auth settings
 * (Authentication -> Sign In / Providers -> Email) so signup returns a
 * session immediately instead of requiring an email round-trip.
 *
 * Usage:
 *   npm run dev -- -p 3100 &
 *   BASE_URL=http://localhost:3100 node scripts/e2e-check.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const results = [];

function log(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${detail ? " — " + detail : ""}`);
}

const rand = Math.random().toString(36).slice(2, 8);
const email = `e2e-${rand}@example.com`;
const password = "TestPassword123!";

// PLAYWRIGHT_CHROMIUM_PATH lets this run against a pre-installed browser
// whose revision doesn't match the `playwright` npm package's expected
// bundled version (common in sandboxed environments); otherwise Playwright
// resolves its own downloaded browser as usual.
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});
const context = await browser.newContext();
const page = await context.newPage();
page.setDefaultTimeout(15000);

try {
  // TEST 2: protected route redirects logged-out user
  await page.goto(`${BASE}/dashboard`);
  await page.waitForURL(/\/login/, { timeout: 10000 });
  log("Protected routes redirect logged-out user", page.url().includes("/login"));

  // TEST 1: signup creates an authenticated session
  await page.goto(`${BASE}/signup`);
  await page.fill("#fullName", "E2E Test User");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/onboarding/, { timeout: 15000 });
  log("Signup creates an authenticated session (redirected to onboarding)", page.url().includes("/onboarding"));

  // Onboarding: workspace + company
  const workspaceName = `E2E Workspace ${rand}`;
  const companyName = `E2E Test Company ${rand} (Private) Limited`;
  await page.fill("#workspaceName", workspaceName);
  await page.click('button:has-text("Next")');
  await page.fill("#legalName", companyName);
  await page.fill("#registrationNumber", "REG-0001");
  await page.fill("#ntn", "NTN-0001");
  await page.click('button:has-text("Next")');
  // Directors step - add one director inline
  await page.fill("#directorName", "Ayesha Test Director");
  await page.click('button:has-text("Skip / Next")');
  // Shareholders step - skip
  await page.click('button:has-text("Skip / Next")');
  // Finish
  await page.click('button:has-text("Finish")');
  await page.waitForURL(/\/companies\//, { timeout: 15000 });
  log("Onboarding creates workspace + company + redirects to company profile", page.url().includes("/companies/"));

  const companyUrl = page.url().split("?")[0];
  const companyId = companyUrl.split("/companies/")[1];

  // TEST 4: company creation persists after refresh
  await page.reload();
  const legalNameVisible = await page.getByText(companyName).first().isVisible().catch(() => false);
  log("Company persists after page refresh", legalNameVisible);

  // TEST 5: director appears + audit trail entry
  await page.goto(`${companyUrl}/directors`);
  const directorVisible = await page.getByText("Ayesha Test Director").first().isVisible().catch(() => false);
  log("Director added during onboarding appears on Directors tab", directorVisible);

  await page.goto(`${companyUrl}/activity`);
  const auditHasDirector = await page.getByText(/director added/i).first().isVisible().catch(() => false);
  log("Audit trail records DIRECTOR_ADDED action", auditHasDirector);

  // Add a second director so we have someone to resign
  await page.goto(`${companyUrl}/directors`);
  await page.fill("#full_name", "Bilal Test Director");
  await page.click('button:has-text("Add director")');
  await page.waitForTimeout(1500);
  const secondDirectorVisible = await page.getByText("Bilal Test Director").first().isVisible().catch(() => false);
  log("Second director add works", secondDirectorVisible);

  // TEST 6: shareholders + ownership calculated from shares
  await page.goto(`${companyUrl}/shareholders`);
  await page.fill("#name", "Shareholder One");
  await page.fill("#shares", "60");
  await page.click('button:has-text("Add shareholder")');
  await page.waitForTimeout(1500);
  await page.fill("#name", "Shareholder Two");
  await page.fill("#shares", "40");
  await page.click('button:has-text("Add shareholder")');
  await page.waitForTimeout(1500);
  const percentText = await page.textContent("body");
  const hasSixty = /60\.0%/.test(percentText);
  const hasForty = /40\.0%/.test(percentText);
  log("Ownership % calculated from shares (60/40 split)", hasSixty && hasForty, `found 60%=${hasSixty} 40%=${hasForty}`);

  // TEST 7 + 8: director resignation -> event -> workflow -> tasks
  await page.goto(`${companyUrl}/events/new?type=DIRECTOR_RESIGNED`);
  await page.selectOption("#director_id", { label: "Bilal Test Director" });
  await page.fill("#resignation_date", "2024-06-01");
  await page.fill("#reason", "Personal reasons");
  await page.click('button:has-text("Record resignation")');
  await page.waitForURL(/\/tasks\?workflow=/, { timeout: 15000 });
  log("Director resignation redirects to generated workflow tasks", /\/tasks\?workflow=/.test(page.url()));

  const tasksPageText = await page.textContent("body");
  const workflowGenerated = /Director Resignation/.test(tasksPageText) && /Upload supporting evidence/.test(tasksPageText);
  log("Workflow + tasks generated from the resignation event", workflowGenerated);

  await page.goto(`${companyUrl}/directors`);
  const directorStatusUpdated = await page.locator("tr", { hasText: "Bilal Test Director" }).getByText("RESIGNED").isVisible().catch(() => false);
  log("Director status updated to RESIGNED", directorStatusUpdated);

  await page.goto(`${companyUrl}/events`);
  const eventVisible = await page.getByText(/resigned as director/i).first().isVisible().catch(() => false);
  log("Corporate event recorded and visible on Events tab", eventVisible);

  // TEST 9: complete a task
  await page.goto(`${companyUrl}/tasks`);
  const completeButtons = page.getByRole("button", { name: /Mark complete/i });
  const countBefore = await completeButtons.count();
  if (countBefore > 0) {
    await completeButtons.first().click();
    await page.waitForTimeout(1500);
  }
  const completedVisible = await page.getByText("COMPLETED").first().isVisible().catch(() => false);
  log("Task can be marked COMPLETED", completedVisible, `buttons found=${countBefore}`);

  // TEST 13: compliance obligation shows "Requires legal verification"
  await page.goto(`${companyUrl}/compliance`);
  const complianceText = await page.textContent("body");
  log(
    "Compliance page renders (no obligations yet is a valid empty state)",
    /Compliance Obligations/.test(complianceText),
  );

  // TEST 14: audit trail (workspace level)
  await page.goto(`${BASE}/audit`);
  const auditPageText = await page.textContent("body");
  const auditHasEvent = /corporate event created/i.test(auditPageText);
  log("Workspace audit trail shows corporate event creation", auditHasEvent);

  // TEST 15: corporate health score derived from data
  await page.goto(companyUrl);
  const overviewText = await page.textContent("body");
  const healthMatch = overviewText.match(/(\d{1,3})%/);
  log("Corporate health score rendered and derived from data", !!healthMatch, `score=${healthMatch?.[1]}`);

  // TEST 3: tenant isolation — second user cannot access first user's company
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  const email2 = `e2e-b-${rand}@example.com`;
  await page2.goto(`${BASE}/signup`);
  await page2.fill("#fullName", "E2E User B");
  await page2.fill("#email", email2);
  await page2.fill("#password", password);
  await page2.click('button[type="submit"]');
  await page2.waitForURL(/\/onboarding/, { timeout: 15000 });
  // User B attempts to access User A's company directly by URL
  await page2.goto(companyUrl);
  await page2.waitForTimeout(1500);
  const deniedAccess = page2.url().includes("/companies") && !page2.url().includes(companyId);
  log("Tenant isolation: user B redirected away from user A's company URL", deniedAccess, `landed at ${page2.url()}`);
  await context2.close();

  // TEST 16 (partial): mobile viewport doesn't break the dashboard
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/dashboard`);
  const mobileOk = await page.getByText(/Overview/i).first().isVisible().catch(() => false);
  log("Dashboard renders at mobile viewport (390px)", mobileOk);
} catch (err) {
  log("UNEXPECTED ERROR", false, err.message);
} finally {
  await browser.close();
}

console.log("\n=== SUMMARY ===");
const passCount = results.filter((r) => r.pass).length;
console.log(`${passCount}/${results.length} checks passed`);
for (const r of results) {
  console.log(`${r.pass ? "✓" : "✗"} ${r.name}`);
}
process.exit(results.every((r) => r.pass) ? 0 : 1);
