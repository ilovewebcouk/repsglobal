import { Callout } from "@/components/help/Callout";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "reply-to-a-review",
  category: "enquiries-reviews",
  title: "Reply to a review",
  summary: "Your reply is held in the dashboard while we polish the public display.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["reviews", "replies", "responses"],
  Body: () => (
    <>
      <p>
        You can write a reply to any approved review from the Reviews tab in your dashboard.
        Replies are stored against the review and visible to you and to REPS admins.
      </p>
      <Callout tone="note" title="Public display coming soon">
        Replies aren't displayed on your public profile yet — we're finishing the moderation and
        threading UI. The reply you write today will publish automatically when that's live.
      </Callout>
      <h2 id="reply-style">A reply style that doesn't backfire</h2>
      <ul>
        <li>Thank specifically — name the moment, not the rating</li>
        <li>Stay short — 1–2 sentences</li>
        <li>Never argue with a low rating in public — handle it via support</li>
      </ul>
    </>
  ),
};
