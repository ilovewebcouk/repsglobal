import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const RESET = "https://repsuk.org/auth?mode=reset";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="Enquiries route to verified pros first. You're still marked inactive."
    heading="Client enquiries are going to verified pros"
    proName={proName}
    paragraphs={[
      "REPS routes new client enquiries to verified pros first. Right now your account still shows as inactive because you haven't signed in — so you're not in the queue.",
      "Sign in, upload your insurance and qualification, and your profile flips to verified. Most pros complete it in under 10 minutes.",
    ]}
    ctaHref={RESET}
    ctaLabel="Sign in and get verified"
    ps="Your £34/yr membership hasn't changed. This is the free upgrade — you just need to log in to take it."
  />
);

export const template = {
  component: Email,
  subject: "You're missing new client enquiries",
  displayName: "Onboarding · Log in #3 (FOMO / enquiries)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
