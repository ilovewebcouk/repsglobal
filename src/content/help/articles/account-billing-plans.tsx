import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "plans-and-pricing",
  category: "account-billing",
  title: "Plans and pricing",
  summary: "Verified is free during launch. Pro and Studio are waitlisted.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["pricing", "plans", "billing", "verified", "pro", "studio"],
  Body: () => (
    <>
      <p>
        REPS has three tiers — Verified, Pro and Studio. Verified is the only tier currently
        open; Pro and Studio are on a waitlist while we finish them.
      </p>
      <h2 id="verified">Verified — free</h2>
      <p>
        Free during launch. Includes a public profile, verified badge, enquiry inbox and review
        collection. No card required.
      </p>
      <h2 id="pro">Pro — waitlist</h2>
      <p>
        Pro adds analytics, lead routing, ranking boosts, premium profile components and CPD
        tracking. Join the waitlist on the pricing page.
      </p>
      <h2 id="studio">Studio — waitlist</h2>
      <p>
        Studio is for multi-coach gyms and franchises — central billing, coach management and
        client allocation.
      </p>
      <DeepLinkButton to="/pricing" label="See pricing" />
    </>
  ),
};
