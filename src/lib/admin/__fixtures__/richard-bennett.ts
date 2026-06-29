// Richard Bennett regression fixture for the shared member-billing compute.
//
// Reproduces the failure mode where Member 360 displayed "No subscription"
// despite a healthy local trialing row (BD rail-swap). The shared compute
// must:
//   • return plan = "verified" (Core)
//   • render isTrial = true with trialDaysLeft > 0
//   • render renewalDate from current_period_end (source = "stripe")
//   • adapt to "Scheduled Core renewal" + "Renews 28 May 2027"
//   • NEVER render "No subscription", "BD", "legacy", "migrated",
//     "Trial user", or "Free trial".
//
// Pure-function — no DB / Stripe needed.

import {
  computeMemberBillingRow,
  type SubscriptionRowLite,
} from "@/lib/admin/member-billing-row.server";
import { adaptBillingRowToState } from "@/lib/admin/subscription-resolver.server";

const RICHARD_USER_ID = "89b3285d-3a83-4a55-8aa1-414b870fd5ce";

const RICHARD_SUB: SubscriptionRowLite = {
  user_id: RICHARD_USER_ID,
  tier: "verified",
  status: "trialing",
  created_at: "2026-05-28T09:15:22.000Z",
  current_period_end: "2027-05-28T09:15:22.000Z",
  billing_period: "year",
};

export function richardFixture() {
  const row = computeMemberBillingRow({
    user_id: RICHARD_USER_ID,
    subs: [RICHARD_SUB],
    bdNextDueIso: null,
    activePaidTier: null,
  });
  return adaptBillingRowToState(row);
}

function assertEq<T>(name: string, actual: T, expected: T) {
  const ok = actual === expected;
  // eslint-disable-next-line no-console
  console.log(`${ok ? "✓" : "✗"} ${name} — got ${JSON.stringify(actual)}${ok ? "" : ` (expected ${JSON.stringify(expected)})`}`);
  if (!ok) process.exitCode = 1;
}

function assertNotContains(name: string, haystack: string, banned: string[]) {
  const hit = banned.find((b) => haystack.toLowerCase().includes(b.toLowerCase()));
  // eslint-disable-next-line no-console
  console.log(`${hit ? "✗" : "✓"} ${name}${hit ? ` — found "${hit}" in "${haystack}"` : ""}`);
  if (hit) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = richardFixture();
  // eslint-disable-next-line no-console
  console.log("Resolved:", r);
  assertEq("source", r.source, "shared-compute");
  assertEq("tier", r.tier, "verified");
  assertEq("tier_label", r.tier_label, "Core");
  assertEq("has_active_entitlement", r.has_active_entitlement, true);
  assertEq("is_scheduled_renewal", r.is_scheduled_renewal, true);
  assertEq("display_status_label", r.display_status_label, "Scheduled Core renewal");
  assertEq("display_renewal_label", r.display_renewal_label, "Renews 28 May 2027");
  const banned = ["No subscription", "BD", "legacy", "migrated", "Free trial", "Trial user"];
  assertNotContains("display_status_label clean", r.display_status_label, banned);
  assertNotContains("display_renewal_label clean", r.display_renewal_label ?? "", banned);
}
