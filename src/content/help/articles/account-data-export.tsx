import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "export-your-data",
  category: "account-billing",
  title: "Export your data",
  summary: "Download a copy of your profile, enquiries and reviews at any time.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["gdpr", "export", "data", "privacy"],
  Body: () => (
    <>
      <p>
        Your data on REPS belongs to you. Under UK GDPR you have a right to a copy of it in a
        structured, machine-readable format — and you don't need to give a reason to ask.
      </p>
      <h2 id="how-to-export">How to export</h2>
      <ol>
        <li>
          Email <a href="mailto:privacy@repsuk.org">privacy@repsuk.org</a> from the address on
          your account
        </li>
        <li>We'll verify it's you and respond within 30 days (usually under 5)</li>
        <li>You'll receive a JSON archive of your profile, enquiries, reviews and audit log</li>
      </ol>
      <h2 id="what-its-not">What it doesn't include</h2>
      <ul>
        <li>Personal data belonging to other people (e.g. clients' phone numbers)</li>
        <li>Internal moderation notes</li>
      </ul>
    </>
  ),
};
