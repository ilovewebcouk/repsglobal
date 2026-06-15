import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface AutoResponseProps {
  firstName?: string;
  ticketNumber?: string;
  summary?: string;
}

const SITE_NAME = "REPS";

const ContactAutoResponseEmail = ({
  firstName = "there",
  ticketNumber = "TKT-0000",
  summary = "",
}: AutoResponseProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks — we've received your message ({ticketNumber})</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{SITE_NAME} SUPPORT</Text>
        </Section>

        <Text style={greeting}>Hi {firstName},</Text>

        <Text style={para}>
          Thanks for getting in touch with REPS. We've received your message
          and a real human will reply within <strong>24 hours</strong> (often
          much sooner on weekdays).
        </Text>

        {summary ? (
          <Section style={card}>
            <Text style={cardLabel}>Your message</Text>
            <Text style={cardBody}>{summary}</Text>
          </Section>
        ) : null}

        <Text style={para}>
          If you need to add anything, just reply to this email — it'll be
          attached to the same ticket.
        </Text>

        <Text style={signature}>— REPS Support</Text>

        <Hr style={hr} />
        <Text style={footer}>
          Ticket reference <span style={ref}>{ticketNumber}</span>.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: ContactAutoResponseEmail,
  subject: (data: Record<string, unknown>) => {
    const ticket = (data?.ticketNumber as string) || "";
    return ticket
      ? `We've got your message [${ticket}]`
      : `We've got your message`;
  },
  displayName: "Contact form auto-response",
  previewData: {
    firstName: "Jane",
    ticketNumber: "TKT-4912",
    summary: "Hi — I need help getting verified before next week.",
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
const greeting = {
  fontSize: "15px",
  color: "#1a1d24",
  margin: "0 0 12px",
};
const para = {
  fontSize: "15px",
  color: "#1a1d24",
  lineHeight: 1.6,
  margin: "0 0 14px",
};
const card = {
  backgroundColor: "#fafafa",
  border: "1px solid #eaecef",
  borderRadius: "12px",
  padding: "16px 18px",
  margin: "8px 0 18px",
};
const cardLabel = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#8a8f99",
  margin: "0 0 6px",
};
const cardBody = {
  fontSize: "14px",
  color: "#33363d",
  lineHeight: 1.55,
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};
const signature = {
  fontSize: "14px",
  color: "#33363d",
  margin: "8px 0 0",
};
const hr = { borderColor: "#eaecef", margin: "20px 0 12px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
const ref = { fontFamily: "ui-monospace, SFMono-Regular, monospace", color: "#33363d" };
