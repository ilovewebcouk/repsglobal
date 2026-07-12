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
import type { TemplateEntry } from "./registry";

interface ReviewRequestProps {
  proName?: string;
  reviewUrl?: string;
  serviceLabel?: string;
  clientName?: string;
}

const SITE_NAME = "REPS";

const ReviewRequestEmail = ({
  proName = "Your trainer",
  reviewUrl = "https://repsuk.org",
  serviceLabel,
  clientName,
}: ReviewRequestProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{proName} would love your review on REPS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>

        <Text style={greeting}>Hi{clientName ? ` ${clientName}` : ""},</Text>

        <Text style={para}>
          <strong>{proName}</strong> has invited you to leave a review on
          REPS{serviceLabel ? ` about ${serviceLabel}` : ""}.
        </Text>

        <Text style={para}>
          Your review helps other people find great professionals — and helps
          {` ${proName}`} keep doing what they do best. It takes about a minute.
        </Text>

        <Section style={{ textAlign: "center", margin: "28px 0 24px" }}>
          <Button href={reviewUrl} style={cta}>Leave a review</Button>
        </Section>

        <Text style={smallPara}>
          Or paste this link into your browser:
          <br />
          <span style={mono}>{reviewUrl}</span>
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          This link is unique to you and expires in 90 days. If you weren't
          expecting this email, you can safely ignore it.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: ReviewRequestEmail,
  subject: (data: Record<string, unknown>) => {
    const proName = (data?.proName as string) || "your trainer";
    return `${proName} asked for your review on REPS`;
  },
  displayName: "Review request",
  previewData: {
    proName: "James Wilson",
    reviewUrl: "https://repsuk.org/r/abc123",
    serviceLabel: "1:1 Strength Coaching",
    clientName: "Sarah",
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
const para = {
  fontSize: "15px",
  color: "#1a1d24",
  lineHeight: 1.6,
  margin: "0 0 14px",
};
const smallPara = {
  fontSize: "12px",
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
const mono = {
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  color: "#33363d",
  wordBreak: "break-all" as const,
};
const hr = { borderColor: "#eaecef", margin: "20px 0 12px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
