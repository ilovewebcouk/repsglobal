import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props { proName?: string }

const SITE_NAME = "REPS";

const ProfessionalReinstatedEmail = ({ proName }: Props) => {
  const greeting = proName ? `Hi ${proName},` : "Hi,";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {SITE_NAME} profile has been reinstated</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>Your profile is live again</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            Good news — your professional profile on {SITE_NAME} has been reinstated and is
            visible again in the public directory and search results.
          </Text>
          <Text style={text}>Thanks for your patience.</Text>
          <Hr style={hr} />
          <Text style={footer}>Sent by {SITE_NAME} moderation.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: ProfessionalReinstatedEmail,
  subject: () => `Your ${SITE_NAME} profile has been reinstated`,
  displayName: "Professional reinstated",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.55, margin: "0 0 14px" };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0 };
