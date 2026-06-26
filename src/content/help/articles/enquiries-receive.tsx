import { Callout } from "@/components/help/Callout";
import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "receive-and-reply-to-enquiries",
  category: "enquiries-reviews",
  title: "Receive and reply to client enquiries",
  summary: "Where enquiries land, how fast to reply, and what we measure.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["enquiries", "inbox", "messages", "response time"],
  Body: () => (
    <>
      <p>
        Every enquiry from your REPS profile lands in your dashboard inbox and, by default, in
        your email. Reply from either — both routes write back to the same conversation.
      </p>
      <h2 id="how-fast">How fast should I reply?</h2>
      <p>
        Median first-reply on REPS is under 4 hours. Profiles that reply within an hour book at
        roughly 3x the rate of profiles that take 24+.
      </p>
      <Callout tone="tip" title="The bell badge is canonical">
        The bell in your dashboard is the canonical source of unread enquiries. Email is a
        notification, not a queue — clear them in the dashboard.
      </Callout>
      <DeepLinkButton to="/dashboard/enquiries" label="Open enquiries" />
    </>
  ),
};
