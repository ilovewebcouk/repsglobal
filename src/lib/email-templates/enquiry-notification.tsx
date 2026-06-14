import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface EnquiryNotificationProps {
  proFirstName?: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string | null;
  serviceTitle?: string | null;
  goals?: string[];
  frequency?: string | null;
  startBy?: string | null;
  budget?: string | null;
  location?: string | null;
  message?: string;
  inboxUrl?: string;
}

const SITE_NAME = "REPS";

const EnquiryNotificationEmail = ({
  proFirstName = "there",
  senderName = "A potential client",
  senderEmail = "",
  senderPhone,
  serviceTitle,
  goals = [],
  frequency,
  startBy,
  budget,
  location,
  message = "",
  inboxUrl = "https://repsglobal.lovable.app/dashboard/leads",
}: EnquiryNotificationProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        New enquiry from {senderName} on {SITE_NAME}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>{SITE_NAME}</Text>
          </Section>

          <Heading style={h1}>You have a new enquiry</Heading>

          <Text style={text}>Hi {proFirstName},</Text>
          <Text style={text}>
            <strong>{senderName}</strong> just sent you a private enquiry on {SITE_NAME}.
            Reply to them directly at{" "}
            <a href={`mailto:${senderEmail}`} style={linkText}>{senderEmail}</a>
            {senderPhone ? <> or call {senderPhone}.</> : <>.</>}
          </Text>

          <Section style={card}>
            {serviceTitle ? <Row label="Interested in" value={serviceTitle} /> : null}
            {goals.length ? <Row label="Goals" value={goals.join(", ")} /> : null}
            {frequency ? <Row label="Frequency" value={frequency} /> : null}
            {startBy ? <Row label="Start by" value={startBy} /> : null}
            {budget ? <Row label="Budget" value={budget} /> : null}
            {location ? <Row label="Location" value={location} /> : null}
          </Section>

          <Heading as="h2" style={h2}>Their message</Heading>
          <Section style={quoteBox}>
            <Text style={quoteText}>{message}</Text>
          </Section>

          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button href={inboxUrl} style={button}>
              Open your enquiry inbox
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Replies sent to <a href={`mailto:${senderEmail}`} style={footerLink}>{senderEmail}</a>{" "}
            go straight to the client. Pros who reply within 2 hours convert 3× more.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={rowText}>
      <span style={rowLabel}>{label}: </span>
      {value}
    </Text>
  );
}

export const template = {
  component: EnquiryNotificationEmail,
  subject: (data: Record<string, unknown>) => {
    const name = (data?.senderName as string) || "A potential client";
    return `New enquiry from ${name} — ${SITE_NAME}`;
  },
  displayName: "Enquiry notification",
  previewData: {
    proFirstName: "James",
    senderName: "Sarah Mitchell",
    senderEmail: "sarah@example.com",
    senderPhone: "+44 7700 900123",
    serviceTitle: "1:1 Personal Training",
    goals: ["Build muscle", "Get stronger"],
    frequency: "2x / week",
    startBy: "Within 2 weeks",
    budget: "£50–£80 / session",
    location: "EC2A — central London",
    message:
      "Hi James — I'm hoping to build strength after a long break from the gym. I can train two evenings a week.",
    inboxUrl: "https://repsglobal.lovable.app/dashboard/leads",
  },
} satisfies TemplateEntry;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = {
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "#ff6a00",
  margin: 0,
};
const h1 = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#0b0b0c",
  lineHeight: 1.25,
  margin: "0 0 20px",
};
const h2 = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#0b0b0c",
  margin: "20px 0 8px",
};
const text = {
  fontSize: "15px",
  color: "#33363d",
  lineHeight: 1.55,
  margin: "0 0 14px",
};
const card = {
  backgroundColor: "#fafafa",
  border: "1px solid #eaecef",
  borderRadius: "12px",
  padding: "14px 18px",
  margin: "8px 0 4px",
};
const rowText = {
  fontSize: "13.5px",
  color: "#33363d",
  lineHeight: 1.55,
  margin: "4px 0",
};
const rowLabel = {
  fontWeight: 600 as const,
  color: "#6b6f78",
};
const quoteBox = {
  backgroundColor: "#fff6ef",
  border: "1px solid #ffd9bf",
  borderRadius: "12px",
  padding: "14px 16px",
  margin: "4px 0 8px",
};
const quoteText = {
  fontSize: "14px",
  color: "#3a2a1c",
  lineHeight: 1.55,
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};
const button = {
  backgroundColor: "#ff6a00",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "10px",
  display: "inline-block",
};
const linkText = { color: "#ff6a00", textDecoration: "underline" };
const footerLink = { color: "#6b6f78", textDecoration: "underline" };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
