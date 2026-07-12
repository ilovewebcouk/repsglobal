import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "../../registry";

interface Props {
  proName?: string;
  tierLabel?: string;
  endsAt?: string; // ISO or formatted date
}

const SITE_NAME = "REPS";

const CancellationConfirmationEmail = ({ proName, tierLabel = "REPS Core", endsAt }: Props) => {
  const greeting = proName ? `Hi ${proName},` : "Hi,";
  let endsText = "";
  if (endsAt) {
    try {
      const d = new Date(endsAt);
      endsText = isNaN(d.getTime()) ? endsAt : d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
    } catch { endsText = endsAt; }
  }
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {tierLabel} cancellation is confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>Cancellation confirmed</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            Your {tierLabel} subscription has been cancelled.
            {endsText ? ` Your access remains active until ${endsText}.` : ""}
          </Text>
          <Text style={text}>
            You can re-subscribe at any time from your dashboard. We don't issue
            pro-rated refunds for the remainder of the period.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Sent by {SITE_NAME}.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: CancellationConfirmationEmail,
  subject: (d: Record<string, any>) => `Your ${d?.tierLabel ?? "REPS"} cancellation is confirmed`,
  displayName: "Trainer · Billing — Cancellation confirmation",
  previewData: { proName: "Sam", tierLabel: "REPS Core", endsAt: "2027-01-01" },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.55, margin: "0 0 14px" };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0 };
