import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "../registry";

interface Props {
  providerName?: string;
  count?: number;
  formatLabel?: string;
}

const SITE_NAME = "REPS";

const CertificatesReadyEmail = ({
  providerName,
  count = 1,
  formatLabel = "digital",
}: Props) => {
  const greeting = providerName ? `Hi ${providerName},` : "Hi,";
  const noun = count === 1 ? "certificate is" : "certificates are";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your REPS certificates are ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>Your certificates are ready</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            {count} REPS {noun} ready to download from your Students dashboard.
            {formatLabel === "printed_and_digital"
              ? " Printed copies will be posted to your address on file."
              : ""}
          </Text>
          <Button href="https://repsuk.org/dashboard/students?tab=certificates" style={cta}>
            Open certificates
          </Button>
          <Text style={muted}>
            Each PDF includes a QR code and public verification link on repsuk.org/verify.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Sent by {SITE_NAME}.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: CertificatesReadyEmail,
  subject: (d: Record<string, any>) => {
    const n = Number(d?.count ?? 1);
    return `Your REPS ${n === 1 ? "certificate is" : `${n} certificates are`} ready`;
  },
  displayName: "Certificates ready",
  previewData: { providerName: "Forge Academy", count: 3, formatLabel: "printed_and_digital" },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "22px", lineHeight: "28px", fontWeight: 700, color: "#0f172a", margin: "8px 0 16px" };
const text = { fontSize: "15px", lineHeight: "24px", color: "#0f172a", margin: "0 0 12px" };
const muted = { fontSize: "13px", lineHeight: "20px", color: "#475569", margin: "12px 0 0" };
const cta = { backgroundColor: "#ff6a00", color: "#ffffff", padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none", display: "inline-block", margin: "8px 0 8px" };
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const footer = { fontSize: "12px", color: "#64748b", margin: 0 };
