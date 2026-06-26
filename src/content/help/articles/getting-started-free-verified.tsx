import { Callout } from "@/components/help/Callout";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "free-vs-verified",
  category: "getting-started",
  title: "Free vs Verified — what's the difference?",
  summary: "Verified is free during launch and is the minimum bar to appear in REPS search.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["plans", "verified", "free"],
  related: [
    "verification/how-verification-works",
    "account-billing/plans-and-pricing",
  ],
  Body: () => (
    <>
      <p>
        Every professional on REPS is on one of three tiers: <strong>Verified</strong>,{" "}
        <strong>Pro</strong> or <strong>Studio</strong>. Verified is the foundation — it's free
        during launch and is the only tier that puts a verified badge on your profile.
      </p>
      <h2 id="what-verified-includes">What Verified includes</h2>
      <ul>
        <li>A public profile at <code>reps.org/pro/your-slug</code></li>
        <li>Verified badge once identity, qualifications and insurance are approved</li>
        <li>Listing in directory search, profession pages and city pages</li>
        <li>Client enquiry inbox and review collection</li>
        <li>Annual re-verification of insurance and qualifications</li>
      </ul>
      <h2 id="what-it-doesnt-include">What it doesn't include</h2>
      <p>
        Verified does not include the Pro analytics suite, ranking boosts, lead routing or the
        Studio multi-coach features. Those are on the Pro and Studio tiers — both currently
        waitlisted while we polish them.
      </p>
      <Callout tone="note" title="Why is Verified free?">
        Trust scales when the bar to be on the register is low and the bar to be{" "}
        <em>verified</em> is high. We'd rather have every legitimate professional in the country
        on REPS than gate the basics behind a paywall.
      </Callout>
    </>
  ),
};
