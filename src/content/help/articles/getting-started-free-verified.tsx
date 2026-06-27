import { Callout } from "@/components/help/Callout";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "free-vs-verified",
  category: "getting-started",
  title: "What you get on Core",
  summary: "Core (£99/year) is the foundation tier and the minimum bar to appear in REPS search.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["plans", "core", "verified"],
  related: [
    "verification/how-verification-works",
    "account-billing/plans-and-pricing",
  ],
  Body: () => (
    <>
      <p>
        Every professional on REPS is on one of three tiers: <strong>Core</strong>,{" "}
        <strong>Pro</strong> or <strong>Studio</strong>. Core is the foundation — it's the only
        tier that puts a verified badge on your profile once your three pillars are approved.
      </p>
      <h2 id="what-core-includes">What Core includes</h2>
      <ul>
        <li>A public profile at <code>reps.org/pro/your-slug</code></li>
        <li>Verified badge once identity, qualifications and insurance are approved</li>
        <li>Listing in directory search, profession pages and city pages</li>
        <li>Client enquiry inbox and review collection</li>
        <li>Annual re-verification of insurance and qualifications</li>
      </ul>
      <h2 id="what-it-doesnt-include">What it doesn't include</h2>
      <p>
        Core does not include the Pro analytics suite, ranking boosts, lead routing or the
        Studio multi-coach features. Those are on the Pro and Studio tiers — both currently
        waitlisted while we polish them.
      </p>
      <Callout tone="note" title="Why £99/year?">
        Core covers the cost of verifying your identity, qualifications and insurance every
        year, and keeping you on a register the public actively searches. It's deliberately
        priced so every legitimate professional can be on REPS without the Pro suite getting
        in the way.
      </Callout>
    </>
  ),
};
