import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "plans-and-pricing",
  category: "account-billing",
  title: "Plans and pricing",
  summary: "Core is open at £99/year. Pro and Studio are waitlisted.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["pricing", "plans", "billing", "core", "pro", "studio"],
  Body: () => (
    <>
      <p>
        REPS has three tiers — Core, Pro and Studio. Core is the only tier currently
        open; Pro and Studio are on a waitlist while we finish them.
      </p>
      <h2 id="core">Core — £99/year</h2>
      <p>
        Public profile, verified badge once your 3-pillar verification is complete, enquiry
        inbox and review collection. Billed annually.
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
