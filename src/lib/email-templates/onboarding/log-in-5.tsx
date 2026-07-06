import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const RESET = "https://repsuk.org/auth?mode=reset";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="One click to reset your password and see everything that's changed."
    heading="One click. That's all it takes."
    proName={proName}
    paragraphs={[
      "This is the final onboarding email. We won't ping you again after this.",
      "If you'd like to see the new REPS, the button below is a direct link to reset your password. Nothing else to fill in.",
    ]}
    ctaHref={RESET}
    ctaLabel="Reset password"
    ps="After this we'll stop the reminders. Your account stays active either way."
  />
);

export const template = {
  component: Email,
  subject: "One click to log back in to REPS",
  displayName: "Onboarding · Log in #5 (final)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
