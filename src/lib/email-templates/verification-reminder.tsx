import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

type Missing = "identity" | "selfie" | "insurance" | "cert";
interface Props { proName?: string; missing?: Missing[] }

const SITE_NAME = "REPS";
const LABELS: Record<Missing, string> = {
  identity: "Government-issued ID",
  selfie: "Selfie for identity match",
  insurance: "Public liability insurance",
  cert: "Qualification certificate",
};

const VerificationReminderEmail = ({ proName, missing = [] }: Props) => {
  const greeting = proName ? `Hi ${proName},` : "Hi,";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Finish your {SITE_NAME} verification</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>One more step to get verified</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            We still need the following to publish your profile on {SITE_NAME}:
          </Text>
          {missing.length > 0 && (
            <Section style={{ margin: "0 0 16px" }}>
              {missing.map((m) => (
                <Text key={m} style={item}>• {LABELS[m] ?? m}</Text>
              ))}
            </Section>
          )}
          <Button href="https://repsuk.org/dashboard/verification" style={cta}>
            Complete verification
          </Button>
          <Hr style={hr} />
          <Text style={footer}>Sent by {SITE_NAME} verification.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: VerificationReminderEmail,
  subject: () => `Finish your ${SITE_NAME} verification`,
  displayName: "Verification reminder",
  previewData: { proName: "Sam", missing: ["insurance", "cert"] },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.55, margin: "0 0 14px" };
const item = { fontSize: "15px", color: "#33363d", lineHeight: 1.5, margin: "0 0 6px" };
const cta = { backgroundColor: "#ff6a00", color: "#ffffff", padding: "12px 20px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, textDecoration: "none" };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0 };
