// Richard Bennett regression fixture for the subscription resolver.
//
// Reproduces the exact failure mode where Member 360 displayed "No subscription"
// despite a healthy local trialing row (BD rail-swap). The resolver must:
//   • return source = "local-mirror"
//   • surface the tier as "Core"
//   • render "Scheduled Core renewal" + "Renews 28 May 2027"
//   • NEVER render "No subscription", "BD", "legacy", "migrated", "Trial user",
//     or "Free trial".
//
// Run with `bun run src/lib/admin/__fixtures__/richard-bennett.ts` for a
// human-readable trace. Pure-function — no DB / Stripe needed.

import {
  resolveAdminSubscriptionState,
  type LocalSubscriptionRow,
} from "@/lib/admin/subscription-resolver.server";

const RICHARD: LocalSubscriptionRow = {
  id: "sub_richard_local",
  user_id: "89b3285d-3a83-4a55-8aa1-414b870fd5ce",
  stripe_subscription_id: "sub_richard_stripe",
  stripe_customer_id: "cus_richard",
  status: "trialing",
  tier: "verified",
  current_period_end: "2027-05-28T09:15:22.000Z",
  cancel_at_period_end: false,
  environment: "live",
  price_lookup_key: "verified_legacy_annual",
};

export function richardFixture() {
  return resolveAdminSubscriptionState({
    user_id: RICHARD.user_id!,
    mirror: null,
    local: RICHARD,
  });
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
  assertEq("source", r.source, "local-mirror");
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
