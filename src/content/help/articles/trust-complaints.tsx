import { Callout } from "@/components/help/Callout";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "raise-a-complaint",
  category: "trust-safety",
  title: "Raise a complaint about a professional",
  summary: "How concerns about a listed professional are received, investigated and acted on.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Trust Team",
  tags: ["complaints", "safeguarding", "removal"],
  Body: () => (
    <>
      <p>
        REPS takes complaints seriously and confidentially. If you have a concern about a
        professional listed on REPS, follow the process below — it's the same whether you're a
        client, a colleague or a member of the public.
      </p>
      <h2 id="how-to-raise">How to raise a complaint</h2>
      <ol>
        <li>Email <a href="mailto:support@repsuk.org">support@repsuk.org</a> with the professional's name and the URL of their profile.</li>
        <li>Describe the concern factually. Attach evidence if you have it.</li>
        <li>Tell us if you'd like to remain anonymous to the professional.</li>
      </ol>
      <h2 id="what-happens-next">What happens next</h2>
      <ol>
        <li>We acknowledge within 2 working days.</li>
        <li>We open a private investigation and contact the professional for their account.</li>
        <li>We decide on one of: no action, warning, profile hold, or removal.</li>
        <li>We email you the outcome.</li>
      </ol>
      <Callout tone="warning" title="In urgent risk of harm">
        If you believe someone is in immediate danger, contact the police on 999 (UK) first.
        REPS is not an emergency service.
      </Callout>
    </>
  ),
};
