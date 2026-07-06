import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const LOGIN = "https://repsuk.org/auth";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="Enquiries route to verified pros first. You're not in the queue yet."
    heading="Client enquiries are going to verified pros"
    proName={proName}
    paragraphs={[
      "REPS routes new client enquiries to verified pros first. Your account is confirmed, but until you sign in and complete verification, you're not in that queue.",
      "Sign in, upload your insurance and headline qualification, and your profile flips to verified. Most pros complete it in under 10 minutes.",
    ]}
    ctaHref={LOGIN}
    ctaLabel="Sign in and get verified"
  />
);

export const template = {
  component: Email,
  subject: "You're missing new client enquiries",
  displayName: "Onboarding · Signup · Log in #3 (enquiries)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
