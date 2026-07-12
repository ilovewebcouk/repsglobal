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

interface ProposalSentProps {
  clientFirstName?: string;
  proName?: string;
  title?: string;
  summary?: string;
  priceLabel?: string;
  cadenceLabel?: string;
  sessions?: number | null;
  startDate?: string | null;
  notes?: string | null;
  proEmail?: string;
}

const SITE_NAME = "REPS";

const ProposalSentEmail = ({
  clientFirstName = "there",
  proName = "Your REPs Pro",
  title = "Coaching proposal",
  summary,
  priceLabel = "",
  cadenceLabel = "",
  sessions,
  startDate,
  notes,
  proEmail,
}: ProposalSentProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{proName} sent you a proposal: {title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>{SITE_NAME}</Text>
          </Section>

          <Heading style={h1}>{proName} sent you a proposal</Heading>
          <Text style={text}>Hi {clientFirstName},</Text>
          <Text style={text}>
            Thanks for your enquiry. Here are the details {proName} put together for you.
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>{title}</Text>
            {summary ? <Text style={cardSummary}>{summary}</Text> : null}
            <Row label="Price" value={priceLabel} />
            <Row label="Cadence" value={cadenceLabel} />
            {sessions ? <Row label="Sessions" value={String(sessions)} /> : null}
            {startDate ? <Row label="Start date" value={startDate} /> : null}
          </Section>

          {notes ? (
            <>
              <Heading as="h2" style={h2}>A note from {proName}</Heading>
              <Section style={quoteBox}>
                <Text style={quoteText}>{notes}</Text>
              </Section>
            </>
          ) : null}

          {proEmail ? (
            <Section style={{ textAlign: "center", margin: "28px 0" }}>
              <Button href={`mailto:${proEmail}`} style={button}>
                Reply to {proName}
              </Button>
            </Section>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>
            Sent via {SITE_NAME}. Reply to this email to reach {proName} directly.
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
  component: ProposalSentEmail,
  subject: (data: Record<string, unknown>) => {
    const pro = (data?.proName as string) || "Your REPs Pro";
    const title = (data?.title as string) || "Coaching proposal";
    return `${pro} sent you a proposal: ${title}`;
  },
  displayName: "Proposal sent",
  previewData: {
    clientFirstName: "Sarah",
    proName: "James Wilson",
    title: "12-week Strength Block",
    summary: "Two sessions a week focused on barbell strength and conditioning.",
    priceLabel: "£75 / session",
    cadenceLabel: "Weekly",
    sessions: 24,
    startDate: "2026-07-01",
    notes: "Great to meet you Sarah. This plan should get us moving toward your strength goals quickly.",
    proEmail: "james@example.com",
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
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const h2 = { fontSize: "15px", fontWeight: 700, color: "#0b0b0c", margin: "20px 0 8px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.55, margin: "0 0 14px" };
const card = {
  backgroundColor: "#fafafa",
  border: "1px solid #eaecef",
  borderRadius: "12px",
  padding: "16px 18px",
  margin: "8px 0 4px",
};
const cardTitle = { fontSize: "16px", fontWeight: 700, color: "#0b0b0c", margin: "0 0 6px" };
const cardSummary = { fontSize: "14px", color: "#33363d", lineHeight: 1.55, margin: "0 0 10px" };
const rowText = { fontSize: "13.5px", color: "#33363d", lineHeight: 1.55, margin: "4px 0" };
const rowLabel = { fontWeight: 600 as const, color: "#6b6f78" };
const quoteBox = {
  backgroundColor: "#fff6ef",
  border: "1px solid #ffd9bf",
  borderRadius: "12px",
  padding: "14px 16px",
  margin: "4px 0 8px",
};
const quoteText = { fontSize: "14px", color: "#3a2a1c", lineHeight: 1.55, margin: 0, whiteSpace: "pre-wrap" as const };
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
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
