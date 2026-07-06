import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const RESET = "https://repsuk.org/auth?mode=reset";
const LOGIN = "https://repsuk.org/auth";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="The new REPS is here — set your password and unlock your trainer website."
    heading="Your REPS account is waiting"
    proName={proName}
    paragraphs={[
      "The new REPS has launched, and your membership now includes a full trainer website — at no extra cost. Your £34/yr price is unchanged.",
      "Because we rebuilt the platform from the ground up, everyone needs to set a new password. It takes 30 seconds — click the button below, enter your email, and you're in.",
    ]}
    bullets={[
      "Public trainer website — included",
      "Verified badge once your docs are approved",
      "Enquiries route to verified pros first",
    ]}
    ctaHref={RESET}
    ctaLabel="Set my password"
    secondaryHref={LOGIN}
    secondaryLabel="I remember my password — sign me in"
    ps="This link uses REPS's standard forgot-password flow, so it's the same page you'd use if you ever lock yourself out."
  />
);

export const template = {
  component: Email,
  subject: "Your REPS account is waiting — set your password",
  displayName: "Onboarding · Log in #1 (set password)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
