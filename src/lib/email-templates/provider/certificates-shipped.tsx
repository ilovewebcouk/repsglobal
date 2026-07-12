import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "../registry";

interface Props {
  providerName?: string;
  count?: number;
  serviceLabel?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

const SITE_NAME = "REPS";

const CertificatesShippedEmail = ({
  providerName,
  count = 1,
  serviceLabel = "Royal Mail Tracked 48",
  trackingNumber,
  trackingUrl,
}: Props) => {
  const greeting = providerName ? `Hi ${providerName},` : "Hi,";
  const noun = count === 1 ? "certificate is" : "certificates are";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your REPS certificates are on the way</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>Your certificates are on the way</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            {count} printed {noun} been dispatched via {serviceLabel}.
            {trackingNumber ? ` Tracking number: ${trackingNumber}.` : ""}
          </Text>
          {trackingUrl ? (
            <Button href={trackingUrl} style={cta}>Track parcel</Button>
          ) : null}
          <Text style={muted}>
            Expected delivery: 1–2 working days (Tracked 24) or 2–3 working days (Tracked 48).
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Sent by {SITE_NAME}.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: CertificatesShippedEmail,
  subject: (d: Record<string, any>) => {
    const n = Number(d?.count ?? 1);
    return `Your REPS ${n === 1 ? "certificate is" : `${n} certificates are`} on the way`;
  },
  displayName: "Provider · Certificates shipped",
  previewData: {
    providerName: "Forge Academy",
    count: 3,
    serviceLabel: "Royal Mail Tracked 48",
    trackingNumber: "AB123456789GB",
    trackingUrl: "https://www.royalmail.com/track-your-item#/tracking-results/AB123456789GB",
  },
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
