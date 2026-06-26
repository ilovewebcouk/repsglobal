import { Callout } from "@/components/help/Callout";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "removed-by-reps",
  category: "enquiries-reviews",
  title: "Why was a review removed?",
  summary:
    "Reviews can be removed for a small number of reasons — and you'll always be told why.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Trust Team",
  tags: ["reviews", "moderation", "removed"],
  Body: () => (
    <>
      <p>
        REPS is a moderated review system. A review can be removed if it falls into one of the
        following categories — and we'll always email you the reason, drafted by a human reviewer.
      </p>
      <h2 id="grounds-for-removal">Grounds for removal</h2>
      <ul>
        <li>Fake — no evidence the reviewer was a real client</li>
        <li>Off-topic — about a different professional, gym or service</li>
        <li>Harassment, slurs or threats</li>
        <li>Disclosure of personal medical information</li>
        <li>Reviewer requested it be removed</li>
        <li>Conflict of interest — written by a family member or competitor</li>
      </ul>
      <Callout tone="note" title="Removed reviews are kept for audit">
        Removed reviews are hidden from the public and from the rating average, but kept in our
        records for one year in case of dispute.
      </Callout>
    </>
  ),
};
