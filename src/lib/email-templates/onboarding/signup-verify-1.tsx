import { OnboardingEmail } from "./_shell";
import type { TemplateEntry } from "../registry";

const VERIFY = "https://repsuk.org/dashboard/verification";

const Email = ({ proName }: { proName?: string }) => (
  <OnboardingEmail
    preview="You're signed in — one more step to get verified and go public."
    heading="You're in — let's get you verified"
    proName={proName}
    paragraphs={[
      "Nice one — you're signed in. Your profile isn't public yet because we still need to verify you. That's the step that turns your listing on and unlocks enquiries.",
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
  displayName: "Onboarding · Signup · Verify #1 (welcome in)",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;
