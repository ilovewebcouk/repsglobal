import { Callout } from "@/components/help/Callout";
import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "choose-your-slug",
  category: "public-profile",
  title: "Choose your profile URL (slug)",
  summary: "Your /c/your-name URL is permanent-ish. Pick once, pick well.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["slug", "url", "seo"],
  Body: () => (
    <>
      <p>
        Your slug is the bit after <code>/c/</code> in your public URL. It shows up in search
        results, on shared links, and in client text messages — so make it readable.
      </p>
      <h2 id="good-slugs">Good slug patterns</h2>
      <ul>
        <li><code>/c/katiegibbs</code> — clean first + surname</li>
        <li><code>/c/katie-gibbs-pt</code> — adds a role for common names</li>
        <li><code>/c/katie-gibbs-leeds</code> — adds a city for very common names</li>
      </ul>
      <h2 id="avoid">Avoid</h2>
      <ul>
        <li>Numbers, random characters, or your gym's brand</li>
        <li>Hashtags, emojis or Insta handles</li>
      </ul>
      <Callout tone="note" title="Changing your slug later">
        You can change it — but the old URL will 404. If you've shared the old URL anywhere,
        you'll lose those clicks. Pick once if you can.
      </Callout>
      <DeepLinkButton to="/dashboard/website" label="Edit your slug" />
    </>
  ),
};
