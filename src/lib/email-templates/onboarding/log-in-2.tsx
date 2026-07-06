import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const RESET = "https://repsuk.org/auth?mode=reset";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="Your trainer website is built and sitting there. One click to unlock it."
    heading="Your website is built — you just need to unlock it"
    proName={proName}
    paragraphs={[
      "Your professional trainer website is already set up inside REPS. It's included in your membership — but you can't see it or edit it until you sign in.",
      "Reset your password below and you'll land on your dashboard with the website editor ready to go.",
    ]}
    ctaHref={RESET}
    ctaLabel="Unlock my website"
    ps="If the reset email doesn't arrive in a minute, check spam or reply and we'll help."
  />
);

export const template = {
  component: Email,
  subject: "Your REPS trainer website is waiting",
  displayName: "Onboarding · Log in #2 (website waiting)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
