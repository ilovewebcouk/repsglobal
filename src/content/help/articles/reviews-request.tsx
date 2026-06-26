import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "request-a-review",
  category: "enquiries-reviews",
  title: "Request reviews from your clients",
  summary: "How to send a REPS review request and what makes a client actually leave one.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["reviews", "requests", "ratings"],
  Body: () => (
    <>
      <p>
        Reviews on REPS are tied to a verified professional and moderated by humans. That's why
        they carry weight with prospective clients — but it also means the request has to come
        from inside REPS, not from a copy-paste link.
      </p>
      <h2 id="how-to-send">How to send a request</h2>
      <ol>
        <li>Open the Reviews tab in your dashboard</li>
        <li>Click <strong>Request a review</strong></li>
        <li>Enter the client's name and email</li>
        <li>Send — they get a one-click link valid for 30 days</li>
      </ol>
      <h2 id="what-makes-clients-leave-reviews">What makes clients actually leave a review</h2>
      <ul>
        <li>Send within 48 hours of a great session — not at the end of the year</li>
        <li>Send to one client at a time, not a batch blast</li>
        <li>Mention the specific outcome you helped with — primes them to write it back</li>
      </ul>
      <DeepLinkButton to="/dashboard/reviews" label="Open reviews" />
    </>
  ),
};
