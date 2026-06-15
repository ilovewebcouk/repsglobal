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

interface SupportOutboundProps {
  ticketNumber?: string;
  agentName?: string;
  bodyText?: string;
  subject?: string;
}

const SITE_NAME = "REPS";

const SupportOutboundEmail = ({
  ticketNumber = "TKT-0000",
  agentName = "REPS Support",
  bodyText = "",
  subject = "",
}: SupportOutboundProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{subject || `A message from REPS Support (${ticketNumber})`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{SITE_NAME} SUPPORT</Text>
        </Section>

        <Section style={card}>
          <Text style={bodyStyle}>{bodyText}</Text>
        </Section>

        <Text style={signature}>— {agentName}</Text>

        <Hr style={hr} />
        <Text style={footer}>
          Reply to this email to continue the conversation. Ticket reference{" "}
          <span style={ref}>{ticketNumber}</span>.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: SupportOutboundEmail,
  subject: (data: Record<string, unknown>) => {
    const subj = (data?.subject as string) || "A message from REPS Support";
    const ticket = (data?.ticketNumber as string) || "";
    return ticket ? `${subj} [${ticket}]` : subj;
  },
  displayName: "Support outbound (new conversation)",
  previewData: {
    ticketNumber: "TKT-4902",
    agentName: "Emma at REPS",
    subject: "Quick question about your REPS profile",
    bodyText:
      "Hi Sarah — just reaching out about the profile photo you uploaded yesterday. Could you re-send it as a JPG? The PNG didn't render correctly on the public listing.",
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
const card = {
  backgroundColor: "#fafafa",
  border: "1px solid #eaecef",
  borderRadius: "12px",
  padding: "18px 20px",
  margin: "8px 0 18px",
};
const bodyStyle = {
  fontSize: "15px",
  color: "#1a1d24",
  lineHeight: 1.6,
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};
const signature = {
  fontSize: "14px",
  color: "#33363d",
  margin: "0 0 8px",
};
const hr = { borderColor: "#eaecef", margin: "20px 0 12px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
const ref = { fontFamily: "ui-monospace, SFMono-Regular, monospace", color: "#33363d" };
