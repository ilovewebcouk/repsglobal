import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const RESET = "https://repsuk.org/auth?mode=reset";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="We'll stop nudging soon. One last invitation to log in."
    heading="Last nudge before we pause these"
    proName={proName}
    paragraphs={[
      "We've sent a few reminders now. If you're not planning to use REPS, no problem — but we don't want to keep filling your inbox either.",
      "If you do want your listing, your website and your verified badge, this is the moment. One click to reset your password and you're straight in.",
      "If we don't hear from you after this, we'll pause onboarding emails for good. Your membership stays exactly as it is — you can always come back and sign in later.",
    ]}
    ctaHref={RESET}
    ctaLabel="Reset password and log in"
  />
);

export const template = {
  component: Email,
  subject: "Last nudge — do you still want your REPS listing?",
  displayName: "Onboarding · Log in #4 (last nudge)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
