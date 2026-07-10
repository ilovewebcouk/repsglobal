import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  learnerName?: string;
  courseTitle?: string;
  providerName?: string;
  certificateNumber?: string;
  downloadUrl?: string;
  verificationUrl?: string;
}

const SITE_NAME = "REPS";

const LearnerCertificateIssuedEmail = ({
  learnerName,
  courseTitle = "your course",
  providerName = "your training provider",
  certificateNumber,
  downloadUrl,
  verificationUrl,
}: Props) => {
  const greeting = learnerName ? `Congratulations ${learnerName},` : "Congratulations,";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your REPS certificate is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>Your certificate is ready</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            You've successfully completed <strong>{courseTitle}</strong> with {providerName}.
            Your REPS-verified certificate is attached below.
          </Text>
          {certificateNumber ? (
            <Text style={muted}>Certificate number: {certificateNumber}</Text>
          ) : null}
          {downloadUrl ? (
            <Button href={downloadUrl} style={cta}>Download certificate</Button>
          ) : null}
          {verificationUrl ? (
            <Text style={muted}>
              Anyone can verify your certificate at{" "}
              <a href={verificationUrl} style={link}>{verificationUrl}</a>
            </Text>
          ) : null}
          <Hr style={hr} />
          <Text style={footer}>Sent by {SITE_NAME}.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: LearnerCertificateIssuedEmail,
  subject: (d: Record<string, any>) =>
    `Your REPS certificate for ${d?.courseTitle ?? "your course"} is ready`,
  displayName: "Learner certificate issued",
  previewData: {
    learnerName: "Alex Morgan",
    courseTitle: "Level 3 Personal Trainer",
    providerName: "Forge Academy",
    certificateNumber: "REPS-CERT-001234",
    downloadUrl: "https://repsuk.org/verify/example-token",
    verificationUrl: "https://repsuk.org/verify/example-token",
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
const link = { color: "#ff6a00", textDecoration: "underline" };
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const footer = { fontSize: "12px", color: "#64748b", margin: 0 };
