import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const LOGIN = "https://repsuk.org/auth";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="One click to sign in and finish setting up your REPS profile."
    heading="One click. That's all it takes."
    proName={proName}
    paragraphs={[
      "This is the final onboarding email — we won't ping you again after this.",
      "If you'd like to finish setting up your REPS profile, the button below takes you straight to sign in.",
    ]}
    ctaHref={LOGIN}
    ctaLabel="Sign in to REPS"
    ps="After this we'll stop the reminders. Your account stays active either way."
  />
);

export const template = {
  component: Email,
  subject: "One click to sign in to REPS",
  displayName: "Onboarding · Signup · Log in #5 (final)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
