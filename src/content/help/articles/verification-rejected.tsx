import { Callout } from "@/components/help/Callout";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "why-was-i-rejected",
  category: "verification",
  title: "Why was my document rejected?",
  summary: "The handful of reasons that account for almost every rejection — and how to fix.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Trust Team",
  tags: ["rejected", "resubmit", "errors"],
  related: [
    "verification/identity-check",
    "verification/qualifications",
    "verification/insurance",
  ],
  Body: () => (
    <>
      <p>
        We'd rather tell you exactly why something was rejected than leave you guessing. Almost
        every rejection comes down to one of these:
      </p>
      <h2 id="identity">Identity</h2>
      <ul>
        <li>Document edges cropped — corners must be visible</li>
        <li>Glare from a flash or window</li>
        <li>Selfie photo doesn't match the ID photo</li>
        <li>ID has expired</li>
      </ul>
      <h2 id="qualifications">Qualifications</h2>
      <ul>
        <li>Image is a screenshot of a screenshot — upload the original PDF</li>
        <li>Awarding body isn't recognised — message us with the body's UK accreditation</li>
        <li>Certificate is in someone else's name</li>
      </ul>
      <h2 id="insurance">Insurance</h2>
      <ul>
        <li>Document is a quote or invitation, not an in-force certificate</li>
        <li>Policy expires within 7 days — renew first, then upload</li>
        <li>Cover description doesn't include the services you teach</li>
      </ul>
      <Callout tone="tip" title="You can resubmit as many times as you need">
        There's no penalty for a rejected upload. Fix the issue, upload again, and the review
        clock restarts.
      </Callout>
    </>
  ),
};
