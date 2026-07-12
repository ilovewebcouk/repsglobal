import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  proName?: string | null;
}

const SITE_NAME = "REPS";
const SITE_URL = "https://repsuk.org";
const PRICING_URL = `${SITE_URL}/pricing`;

/**
 * "dispute-won-resubscribe" — sent when a payment dispute is resolved in
 * REPS' favour. The member's account was suspended during the dispute and
 * their subscription was cancelled. To come back on the platform they need
 * to resubscribe, so this email invites them to do so.
 */
const DisputeWonResubscribeEmail = ({ proName }: Props) => {
  const greeting = proName ? `Hi ${proName},` : "Hi,";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your dispute is resolved — you're welcome back on REPS</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>

          <Heading style={h1}>Your dispute has been resolved</Heading>

          <Text style={text}>{greeting}</Text>

          <Text style={text}>
            The payment dispute on your REPS membership has been resolved and
            we've lifted the suspension on your account.
          </Text>

          <Text style={text}>
            Because your original subscription was cancelled while the dispute
            was open, you'll need to pick a plan again to come back on the
            platform. Your profile record is preserved — as soon as you
            resubscribe, we'll put you back live.
          </Text>

          <Section style={{ margin: "24px 0" }}>
            <Button href={PRICING_URL} style={button}>View plans</Button>
          </Section>

          <Text style={text}>
            Any questions, just reply to this email.
          </Text>

          <Text style={signoff}>— The REPS team<br /><a style={link} href={SITE_URL}>{SITE_URL}</a></Text>

          <Hr style={hr} />
          <Text style={footer}>Sent by {SITE_NAME}.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: DisputeWonResubscribeEmail,
  subject: "Your REPS dispute is resolved — welcome back",
  displayName: "Dispute won — resubscribe",
  previewData: { proName: "Sam" },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.6, margin: "0 0 14px" };
const signoff = { fontSize: "15px", color: "#33363d", lineHeight: 1.6, margin: "20px 0 0" };
const link = { color: "#ff6a00", textDecoration: "none" };
const button = {
  backgroundColor: "#ff6a00",
  color: "#000000",
  padding: "12px 20px",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
};
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
