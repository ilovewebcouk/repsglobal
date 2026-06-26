import { Callout } from "@/components/help/Callout";
import { DeepLinkButton } from "@/components/help/DeepLinkButton";
import type { HelpArticle } from "../types";

export const article: HelpArticle = {
  slug: "set-up-your-account",
  category: "getting-started",
  title: "Set up your REPS account",
  summary: "From sign-up to a live profile in under an hour — the exact order to do it in.",
  tier: ["verified", "pro", "studio"],
  lastReviewed: "2026-06-26",
  author: "REPS Team",
  tags: ["onboarding", "signup", "first-time"],
  related: [
    "verification/how-verification-works",
    "public-profile/write-a-profile-that-converts",
  ],
  Body: () => (
    <>
      <p>
        REPS is a verified register and a directory. The fastest route to being listed is to do
        these four steps in order — most professionals are live the same day.
      </p>
      <h2 id="1-create-your-account">1. Create your account</h2>
      <p>
        Use the email address you'll keep long-term. Client enquiries and review notifications all
        route through this address, so don't use a throwaway.
      </p>
      <DeepLinkButton to="/signup" label="Create your account" />
      <h2 id="2-verify-your-identity">2. Verify your identity</h2>
      <p>
        Identity is the hard gate — until it's approved, your profile isn't visible in search and
        you can't accept enquiries. We use a government-ID + live selfie check; most are approved
        within minutes.
      </p>
      <Callout tone="tip" title="Have your ID ready">
        Passport or UK driving licence works best. Photograph in good light, all four corners
        visible, no glare.
      </Callout>
      <h2 id="3-upload-qualifications--insurance">3. Upload qualifications & insurance</h2>
      <p>
        Add at least one Level 2/3 qualification from an Ofqual-regulated awarding body, and an
        in-date insurance certificate. You can do this on desktop or by scanning a QR code with
        your phone.
      </p>
      <h2 id="4-publish-your-profile">4. Publish your profile</h2>
      <p>
        Pick your slug, write a clear two-paragraph bio, add a real photo and list the locations
        you serve. Hit <strong>Publish</strong> and you're in the directory.
      </p>
      <DeepLinkButton to="/dashboard/verification" label="Open verification" />
    </>
  ),
  faqs: [
    {
      q: "How long does the whole setup take?",
      a: "Most professionals are live within an hour if they have ID, a qualification PDF and an insurance certificate to hand.",
    },
    {
      q: "Can I start without uploading documents?",
      a: "You can create your account, but your profile won't be visible in the directory until identity is approved.",
    },
  ],
};
