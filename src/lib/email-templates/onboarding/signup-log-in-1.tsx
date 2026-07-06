import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const LOGIN = "https://repsuk.org/auth";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="Welcome to REPS — sign in to finish setting up your profile."
    heading="Welcome to REPS"
    proName={proName}
    paragraphs={[
      "Thanks for joining REPS. Your account is confirmed and your membership is active — you just need to sign in to finish setting up your profile.",
      "Sign in with the email and password you chose at signup. From your dashboard you can complete verification, publish your trainer website and start taking enquiries.",
    ]}
    bullets={[
      "Public trainer website — included in your membership",
      "Verified badge once your documents are approved",
      "New client enquiries route to verified pros first",
    ]}
    ctaHref={LOGIN}
    ctaLabel="Sign in to REPS"
    ps="Forgotten your password? Hit the link on the sign-in page and we'll email you a reset."
  />
);

export const template = {
  component: Email,
  subject: "Welcome to REPS — sign in to finish setup",
  displayName: "Onboarding · Signup · Log in #1 (welcome)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
