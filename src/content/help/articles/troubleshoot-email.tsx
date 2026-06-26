import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "im-not-getting-emails",
  category: "troubleshooting",
  title: "I'm not getting emails from REPS",
  summary: "Where to look first when enquiry or notification emails don't arrive.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["email", "deliverability", "spam"],
  Body: () => (
    <>
      <p>
        Every email REPS sends comes from a <code>@repsuk.org</code> address. If you're not
        seeing them, run through this list in order.
      </p>
      <ol>
        <li><strong>Check spam / promotions</strong> — especially on Gmail and Outlook.</li>
        <li><strong>Allow-list our domain</strong> — add <code>@repsuk.org</code> to safe senders.</li>
        <li><strong>Confirm the address on your account</strong> — typos in the address field cause silent failure.</li>
        <li><strong>Workplace filters</strong> — corporate IT often quarantines outside senders. Use a personal email if needed.</li>
        <li><strong>Mailbox full</strong> — old free accounts run out of storage and bounce silently.</li>
      </ol>
      <p>
        If none of those help, contact <a href="mailto:support@repsuk.org">support@repsuk.org</a>{" "}
        — we can re-send anything from the last 30 days from the audit log.
      </p>
    </>
  ),
};
