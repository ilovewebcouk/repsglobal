import { Callout } from "@/components/help/Callout";
import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "how-verification-works",
  category: "verification",
  title: "How REPS verification works",
  summary:
    "The three checks that put a verified badge on your profile — what we look at, what we don't, and how long each one takes.",
  tier: ["verified"],
  lastReviewed: "2026-06-26",
  author: "REPS Trust Team",
  tags: ["verification", "identity", "qualifications", "insurance", "badge"],
  related: [
    "verification/identity-check",
    "verification/qualifications",
    "verification/insurance",
    "verification/typical-verification-times",
  ],
  Body: () => (
    <>
      <p>
        Verification is what makes REPS a register, not a listings site. Every verified badge on
        the platform represents three discrete checks completed by a human reviewer.
      </p>
      <h2 id="the-three-checks">The three checks</h2>
      <ol>
        <li>
          <strong>Identity</strong> — the person on the profile is real, alive, and is who they
          say they are. Government photo ID + live selfie.
        </li>
        <li>
          <strong>Qualifications</strong> — each listed qualification is genuine, current, and
          from an Ofqual-regulated or recognised awarding body. Original certificate required.
        </li>
        <li>
          <strong>Insurance</strong> — active professional liability cover in the professional's
          own name, valid for the services they're listing.
        </li>
      </ol>
      <Callout tone="tip" title="Order matters">
        Identity is the hard gate. Until it's approved, your profile is hidden, the dashboard is
        limited, and you can't take enquiries. Always do identity first.
      </Callout>
      <h2 id="what-we-dont-do">What verification is not</h2>
      <ul>
        <li>It is not a guarantee of coaching quality. Quality is signalled by reviews.</li>
        <li>It is not a clinical or medical screening.</li>
        <li>It is not a permanent stamp — insurance is re-checked every 12 months.</li>
      </ul>
      <DeepLinkButton to="/dashboard/verification" label="Start or continue verification" />
    </>
  ),
  faqs: [
    {
      q: "Do all three checks have to pass before I'm verified?",
      a: "Yes. You'll see partial progress badges in your dashboard, but the public verified mark only appears once all three are approved.",
    },
    {
      q: "Is there a fee for verification?",
      a: "No. Verification is included free at every tier.",
    },
  ],
};
