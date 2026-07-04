import { Callout } from "@/components/help/Callout";
import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "write-a-profile-that-converts",
  category: "public-profile",
  title: "Write a profile that converts enquiries",
  summary: "A two-paragraph structure that consistently outperforms long, list-heavy bios.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["bio", "profile", "copywriting"],
  related: [
    "public-profile/your-profile-photo",
    "public-profile/choose-your-slug",
  ],
  Body: () => (
    <>
      <p>
        Clients skim. The two-paragraph bio is the highest-converting structure we see — short,
        scannable, specific to the client in front of them.
      </p>
      <h2 id="paragraph-1">Paragraph one — who you help</h2>
      <p>
        Open with the client, not your CV. One sentence on who you work with, one sentence on the
        outcome you help them get, one sentence on how you work.
      </p>
      <h2 id="paragraph-2">Paragraph two — what to expect</h2>
      <p>
        Describe the first session, the format, the location, and the kind of person you're a bad
        fit for. Naming a bad fit is the single highest trust signal you can add to a profile.
      </p>
      <Callout tone="tip" title="One sentence per line">
        Break paragraphs into one-sentence lines. It reads better on mobile, which is where 70%
        of enquiries start.
      </Callout>
      <DeepLinkButton to="/dashboard/website" label="Edit your website" />
    </>
  ),
};
