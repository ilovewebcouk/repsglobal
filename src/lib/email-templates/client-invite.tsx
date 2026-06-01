import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface ClientInviteProps {
  proName?: string;
  tradingName?: string;
  clientName?: string;
  personalNote?: string;
  acceptUrl?: string;
}

const SITE_NAME = "REPs";

const ClientInviteEmail = ({
  proName = "Your coach",
  tradingName,
  clientName,
  personalNote,
  acceptUrl = "https://repsglobal.lovable.app/accept-invite",
}: ClientInviteProps) => {
  const fromLabel = tradingName ? `${proName} (${tradingName})` : proName;
  const greeting = clientName ? `Hi ${clientName},` : "Hi,";

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {proName} has invited you to train on {SITE_NAME}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>{SITE_NAME}</Text>
          </Section>

          <Heading style={h1}>You're invited to train with {fromLabel}</Heading>

          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            {proName} has invited you to join their client portal on {SITE_NAME}.
            Accept the invite to view your programme, log nutrition, send check-ins
            and message your coach — all in one place.
          </Text>

          {personalNote ? (
            <Section style={noteBox}>
              <Text style={noteLabel}>A note from {proName}</Text>
              <Text style={noteText}>"{personalNote}"</Text>
            </Section>
          ) : null}

          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button href={acceptUrl} style={button}>
              Accept invite
            </Button>
          </Section>

          <Text style={smallText}>
            Or paste this link into your browser:
            <br />
            <span style={linkText}>{acceptUrl}</span>
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            This invite expires in 14 days. If you weren't expecting this email
            you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: ClientInviteEmail,
  subject: (data: Record<string, unknown>) => {
    const pro = (data?.proName as string) || "Your coach";
    return `${pro} invited you to train on ${SITE_NAME}`;
  },
  displayName: "Client invite",
  previewData: {
    proName: "James Carter",
    tradingName: "Carter Strength",
    clientName: "Sarah",
    personalNote: "Looking forward to working with you — let's get block 1 dialled in.",
    acceptUrl: "https://repsglobal.lovable.app/accept-invite?token=sample",
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
const text = {
  fontSize: "15px",
  color: "#33363d",
  lineHeight: 1.55,
  margin: "0 0 14px",
};
const noteBox = {
  backgroundColor: "#fff6ef",
  border: "1px solid #ffd9bf",
  borderRadius: "12px",
  padding: "14px 16px",
  margin: "16px 0 8px",
};
const noteLabel = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "#a14a00",
  margin: "0 0 4px",
};
const noteText = {
  fontSize: "14px",
  color: "#3a2a1c",
  lineHeight: 1.55,
  margin: 0,
  fontStyle: "italic" as const,
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
const smallText = {
  fontSize: "12.5px",
  color: "#6b6f78",
  lineHeight: 1.5,
  margin: "12px 0 0",
};
const linkText = { color: "#ff6a00", wordBreak: "break-all" as const };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0 };
