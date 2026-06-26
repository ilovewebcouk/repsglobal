import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "code-of-conduct",
  category: "trust-safety",
  title: "Code of conduct",
  summary: "What every REPS-listed professional agrees to uphold.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Trust Team",
  tags: ["conduct", "standards", "ethics"],
  Body: () => (
    <>
      <p>
        Being on REPS is a public commitment. Every professional listed agrees to uphold the
        following — and breaches are grounds for removal.
      </p>
      <h2 id="pillars">The six pillars</h2>
      <ul>
        <li><strong>Client safety first</strong> — screen, programme, and adapt to the person in front of you.</li>
        <li><strong>Honest marketing</strong> — no fabricated results, qualifications or reviews.</li>
        <li><strong>Scope of practice</strong> — coach within what you're trained for; refer out the rest.</li>
        <li><strong>Safeguarding</strong> — protect vulnerable clients and act on disclosures.</li>
        <li><strong>Inclusive practice</strong> — respect every client regardless of body, background or identity.</li>
        <li><strong>Confidentiality</strong> — health information and conversations stay private.</li>
      </ul>
      <DeepLinkButton to="/standards" label="Read the full Standards page" />
    </>
  ),
};
