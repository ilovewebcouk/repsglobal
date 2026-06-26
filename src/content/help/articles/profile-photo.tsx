import { Callout } from "@/components/help/Callout";
import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "your-profile-photo",
  category: "public-profile",
  title: "Your profile photo",
  summary: "The single biggest lever on enquiry rate. Get this right.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["photo", "headshot", "profile"],
  Body: () => (
    <>
      <p>
        Profile photo is the strongest signal you give a prospective client. We measure it: a
        clear headshot lifts enquiry rate by roughly 2x against the platform average.
      </p>
      <h2 id="what-works">What works</h2>
      <ul>
        <li>Face fills 40–60% of the frame</li>
        <li>Looking at camera, relaxed expression</li>
        <li>Natural light, plain or gym-context background</li>
        <li>Recent — taken in the last 18 months</li>
      </ul>
      <h2 id="what-doesnt">What doesn't</h2>
      <ul>
        <li>Logos, watermarks or text overlays</li>
        <li>Sunglasses, caps or anything obscuring the face</li>
        <li>Group photos</li>
        <li>Heavy filters or AI generations</li>
      </ul>
      <Callout tone="warning" title="Match the ID">
        The face on your profile photo must be the same person who passed identity verification.
        Posing as someone else is grounds for removal.
      </Callout>
      <DeepLinkButton to="/dashboard/profile" label="Upload your photo" />
    </>
  ),
};
