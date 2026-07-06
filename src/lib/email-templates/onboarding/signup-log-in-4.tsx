import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const LOGIN = "https://repsuk.org/auth";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="We'll stop nudging soon. One more invitation to sign in."
    heading="Last nudge before we pause these"
    proName={proName}
    paragraphs={[
      "We've sent a couple of reminders. If REPS isn't for you, no problem — but we don't want to keep filling your inbox either.",
      "If you do want your listing, your website and your verified badge, this is the moment. Sign in and you're straight into your dashboard.",
      "If we don't hear from you after this, we'll pause onboarding emails. Your membership stays as-is — you can always sign in later.",
    ]}
    ctaHref={LOGIN}
    ctaLabel="Sign in to REPS"
  />
);

export const template = {
  component: Email,
  subject: "Last nudge — do you still want your REPS listing?",
  displayName: "Onboarding · Signup · Log in #4 (last nudge)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
