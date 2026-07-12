import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  proName?: string;
  reason?: string;
  supportEmail?: string;
}

const SITE_NAME = "REPS";

const ProfessionalSuspendedEmail = ({
  proName,
  reason = "We've identified an issue that needs to be reviewed before your profile can be public again.",
  supportEmail = "support@repsuk.org",
}: Props) => {
  const greeting = proName ? `Hi ${proName},` : "Hi,";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {SITE_NAME} profile has been suspended pending review</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>Your profile has been suspended pending review</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            Your professional profile on {SITE_NAME} has been suspended and is no longer visible
            in the public directory or search results.
          </Text>
          <Section style={noteBox}>
            <Text style={noteLabel}>Reason</Text>
            <Text style={noteText}>{reason}</Text>
          </Section>
          <Text style={text}>
            You can still sign in to your dashboard. To appeal this decision or provide more
            information, please reply to this email or contact{" "}
            <a href={`mailto:${supportEmail}`} style={linkText}>{supportEmail}</a>.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Sent by {SITE_NAME} moderation.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: ProfessionalSuspendedEmail,
  subject: () => `Your ${SITE_NAME} profile has been suspended`,
  displayName: "Professional suspended",
  previewData: { proName: "Sam", reason: "Profile content under review." },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.55, margin: "0 0 14px" };
const noteBox = { backgroundColor: "#fff6ef", border: "1px solid #ffd9bf", borderRadius: "12px", padding: "14px 16px", margin: "16px 0" };
const noteLabel = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#a14a00", margin: "0 0 4px" };
const noteText = { fontSize: "14px", color: "#3a2a1c", lineHeight: 1.55, margin: 0 };
const linkText = { color: "#ff6a00" };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0 };
