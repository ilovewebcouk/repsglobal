import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const VERIFY = "https://repsuk.org/dashboard/verification";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="You're logged in — one more step to get verified and go public."
    heading="Welcome back — let's finish verifying you"
    proName={proName}
    paragraphs={[
      "You're in. Nice one. Your profile isn't public yet because we still need to verify you — that's the step that turns your listing on and unlocks enquiries.",
      "The three things we need:",
    ]}
    bullets={[
      "Government-issued ID (passport or driving licence)",
      "Public liability insurance certificate",
      "Your headline qualification certificate",
    ]}
    ctaHref={VERIFY}
    ctaLabel="Start verification"
    ps="Most pros complete it in under 10 minutes. You can pause and resume any time."
  />
);

export const template = {
  component: Email,
  subject: "Finish verifying your REPS profile",
  displayName: "Onboarding · Verify #1 (welcome back)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
