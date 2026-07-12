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
import type { TemplateEntry } from "../registry";

interface ProviderDomainConfirmProps {
  providerName?: string;
  domain?: string;
  confirmUrl?: string;
  expiresInHours?: number;
}

const SITE_NAME = "REPS";

const ProviderDomainConfirmEmail = ({
  providerName = "Your organisation",
  domain = "your-domain.com",
  confirmUrl = "https://repsuk.org",
  expiresInHours = 24,
}: ProviderDomainConfirmProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Confirm your {domain} email to verify {providerName} on {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>Confirm your provider email</Heading>
          <Text style={text}>
            You've been asked to verify that <strong>{providerName}</strong> owns the domain{" "}
            <strong>{domain}</strong> on {SITE_NAME}.
          </Text>
          <Text style={text}>
            Click the button below to confirm this email. After you confirm, our team will do a
            final review before {providerName} is marked as verified.
          </Text>
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button href={confirmUrl} style={button}>Confirm this email</Button>
          </Section>
          <Text style={smallText}>
            Or paste this link into your browser:<br />
            <span style={linkText}>{confirmUrl}</span>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            This link expires in {expiresInHours} hours. If you didn't expect this email you can safely
            ignore it — nothing will happen without your confirmation.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: ProviderDomainConfirmEmail,
  subject: (data: Record<string, unknown>) => {
    const d = (data.domain as string | undefined) ?? "your provider";
    return `Confirm your ${d} email for ${SITE_NAME}`;
  },
  displayName: "Provider · Domain confirm",
  previewData: {
    providerName: "Northline Academy",
    domain: "northlineacademy.com",
    confirmUrl: "https://repsuk.org/api/public/verify-provider-domain?token=sample",
    expiresInHours: 24,
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.55, margin: "0 0 14px" };
const button = { backgroundColor: "#ff6a00", color: "#ffffff", fontSize: "15px", fontWeight: 600, textDecoration: "none", padding: "12px 24px", borderRadius: "10px", display: "inline-block" };
const smallText = { fontSize: "12.5px", color: "#6b6f78", lineHeight: 1.5, margin: "12px 0 0" };
const linkText = { color: "#ff6a00", wordBreak: "break-all" as const };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0 };
