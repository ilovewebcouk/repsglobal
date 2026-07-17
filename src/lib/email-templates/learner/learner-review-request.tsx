import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "../registry";

interface LearnerReviewRequestProps {
  learnerName?: string;
  courseTitle?: string;
  providerName?: string;
  reviewUrl?: string;
  joinRepsUrl?: string;
}

const SITE_NAME = "REPS";

const LearnerReviewRequestEmail = ({
  learnerName,
  courseTitle = "your course",
  providerName = "your training provider",
  reviewUrl = "https://repsuk.org",
  joinRepsUrl = "https://repsuk.org/join?ref=cert&code=NEWPRO50",
}: LearnerReviewRequestProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Congratulations on completing {courseTitle} — share your honest review
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>

        <Text style={greeting}>
          Hi{learnerName ? ` ${learnerName}` : " there"},
        </Text>

        <Text style={h1}>Your certificate is on its way.</Text>

        <Text style={para}>
          Congratulations on completing <strong>{courseTitle}</strong> with{" "}
          <strong>{providerName}</strong>. That's a real qualification, from a
          REPs-recognised provider — you earned it.
        </Text>

        <Text style={para}>
          Would you take 60 seconds to leave an honest review of your
          experience? Other learners rely on it when they're choosing where to
          train, and providers who deliver a great course deserve credit for
          it. If it wasn't world class, say so — we want the truth.
        </Text>

        <Section style={{ textAlign: "center", margin: "24px 0" }}>
          <Button href={reviewUrl} style={cta}>Write your review</Button>
        </Section>

        <Text style={smallPara}>
          Your review is tied to your certificate, so it publishes as a
          verified learner review on {providerName}'s REPs page.
        </Text>

        <Hr style={hr} />

        <Text style={eyebrow}>Now get seen for it</Text>
        <Text style={h2}>Turn your qualification into paying clients.</Text>
        <Text style={para}>
          Join the REPs professional register and get a verified profile,
          reviews, and enquiries from clients in your area — the same register
          gyms and studios check when they hire.
        </Text>
        <Text style={offerLine}>
          <strong>NEWPRO50</strong> — 50% off your first year, applied at
          checkout.
        </Text>
        <Section style={{ textAlign: "center", margin: "18px 0 8px" }}>
          <Button href={joinRepsUrl} style={ctaSecondary}>
            Claim 50% off your first year
          </Button>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          This review link is unique to your certificate and expires in 180
          days. If you weren't expecting this email, you can safely ignore it.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: LearnerReviewRequestEmail,
  subject: (data: Record<string, unknown>) => {
    const courseTitle = (data?.courseTitle as string) || "your course";
    const providerName = (data?.providerName as string) || "your provider";
    return `Review ${providerName} — ${courseTitle}`;
  },
  displayName: "Learner — Review request (after certificate print)",
  previewData: {
    learnerName: "Sarah",
    courseTitle: "Level 3 Diploma in Personal Training",
    providerName: "Forge Academy",
    reviewUrl: "https://repsuk.org/r/abc123",
    joinRepsUrl: "https://repsuk.org/join?ref=cert&code=NEWPRO50",
  },
} satisfies TemplateEntry;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "20px" };
const brandText = {
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "#ff6a00",
  margin: 0,
};
const greeting = { fontSize: "15px", color: "#1a1d24", margin: "0 0 12px" };
const h1 = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#1a1d24",
  lineHeight: 1.25,
  margin: "0 0 14px",
};
const h2 = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#1a1d24",
  lineHeight: 1.3,
  margin: "0 0 10px",
};
const eyebrow = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "#ff6a00",
  margin: "0 0 6px",
};
const para = {
  fontSize: "15px",
  color: "#1a1d24",
  lineHeight: 1.6,
  margin: "0 0 14px",
};
const offerLine = {
  fontSize: "14px",
  color: "#1a1d24",
  lineHeight: 1.5,
  margin: "10px 0 6px",
};
const smallPara = {
  fontSize: "12.5px",
  color: "#5a6070",
  lineHeight: 1.5,
  margin: "0 0 8px",
};
const cta = {
  backgroundColor: "#ff6a00",
  color: "#ffffff",
  padding: "13px 28px",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
};
const ctaSecondary = {
  backgroundColor: "#1a1d24",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "10px",
  fontSize: "13.5px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
};
const hr = { borderColor: "#eaecef", margin: "22px 0 16px" };
const footer = {
  fontSize: "12px",
  color: "#8a8f99",
  margin: 0,
  lineHeight: 1.5,
};
