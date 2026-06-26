import { Callout } from "@/components/help/Callout";
import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "identity-check",
  category: "verification",
  title: "Identity check — what we ask for and why",
  summary: "Government photo ID + a live selfie. Usually approved within minutes.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Trust Team",
  tags: ["identity", "kyc", "id", "selfie"],
  related: [
    "verification/how-verification-works",
    "verification/why-was-i-rejected",
  ],
  Body: () => (
    <>
      <p>
        The identity check answers one question: is the person on this profile a real human, and
        the one whose name is on it. Without that, every other badge on the platform is
        meaningless.
      </p>
      <h2 id="documents-we-accept">Documents we accept</h2>
      <ul>
        <li>UK or EU passport (preferred — fastest)</li>
        <li>UK photocard driving licence</li>
        <li>National ID card (EU/EEA)</li>
        <li>Other government-issued photo ID — case by case</li>
      </ul>
      <h2 id="how-to-take-the-photo">How to take the photo</h2>
      <ul>
        <li>Plain background, even lighting, no glare or shadows</li>
        <li>All four corners of the document visible</li>
        <li>Every word legible — including the small print at the bottom</li>
        <li>No fingers covering text</li>
      </ul>
      <Callout tone="warning" title="Don't crop, edit or watermark">
        Edited images are auto-rejected. Upload the photo straight from your phone or camera.
      </Callout>
      <h2 id="the-selfie">The live selfie</h2>
      <p>
        You'll be asked to take a selfie at the same session as your ID upload. We match it to the
        photo on the document; we don't keep it for any other purpose and it is never shown on
        your public profile.
      </p>
      <h2 id="how-long-does-it-take">How long does it take?</h2>
      <p>
        Most are auto-approved in under five minutes. Manual reviews — usually triggered by glare,
        a partial crop, or an unusual document — take up to one working day.
      </p>
      <DeepLinkButton to="/dashboard/verification" label="Open identity check" />
    </>
  ),
};
