import { Callout } from "@/components/help/Callout";
import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "qualifications",
  category: "verification",
  title: "Qualifications — what we accept and how to upload",
  summary:
    "Ofqual-regulated and recognised awarding bodies, mapped to the specialism you're listing.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Trust Team",
  tags: ["qualifications", "certificates", "ofqual", "level-2", "level-3"],
  related: [
    "verification/how-verification-works",
    "verification/why-was-i-rejected",
  ],
  Body: () => (
    <>
      <p>
        Every specialism you list against your profile is tied to a qualification we've verified.
        That's how clients can trust the labels on REPS profiles.
      </p>
      <h2 id="minimum-levels">Minimum levels by profession</h2>
      <ul>
        <li>Personal Trainer — Level 3</li>
        <li>Group Exercise Instructor — Level 2</li>
        <li>Strength & Conditioning Coach — Level 3 or above</li>
        <li>Yoga Teacher — recognised training (typically 200+ hours)</li>
        <li>Pilates Instructor — recognised matwork or apparatus qualification</li>
        <li>Nutritionist — registration with a recognised body in your jurisdiction</li>
      </ul>
      <h2 id="recognised-awarding-bodies">Recognised awarding bodies</h2>
      <p>
        We accept any Ofqual-regulated awarding body for UK qualifications — including Active IQ,
        YMCA Awards, Focus Awards, NCFE / CACHE, VTCT and Future Fit. For overseas qualifications,
        upload the certificate and we'll map it to the closest UK level.
      </p>
      <h2 id="what-to-upload">What to upload</h2>
      <ul>
        <li>The original certificate from the awarding body</li>
        <li>PDF, JPG or PNG, up to 20MB per file</li>
        <li>All edges visible, all text legible</li>
      </ul>
      <Callout tone="tip" title="Upload from your phone">
        Use the QR code on the certificate dialog to upload directly from your phone camera —
        usually faster than scanning to PDF.
      </Callout>
      <h2 id="re-verification">Re-verification</h2>
      <p>
        Qualifications are checked once at upload, and again whenever you add a new specialism
        that depends on them. We don't re-check qualifications annually — once verified, they
        stay verified.
      </p>
      <DeepLinkButton to="/dashboard/verification" label="Add a qualification" />
    </>
  ),
};
