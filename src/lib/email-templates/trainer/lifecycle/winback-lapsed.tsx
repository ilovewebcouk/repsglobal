import {
  Body, Button, Container, Head, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "../../registry";

interface Props {
  proName?: string;
  renewUrl?: string;
}

const Email = ({
  proName = "there",
  renewUrl = "https://repsuk.org/dashboard",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reactivate your REPS profile in one tap</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>REPS MEMBERSHIP</Text>
        </Section>
        <Text style={greeting}>Hi {proName},</Text>
        <Text style={para}>
          Your REPS profile is currently hidden from the public register.
          Reactivating brings it straight back — your profile, photo,
          credentials and reviews are all still on your account.
        </Text>
        <Section style={{ textAlign: "center", margin: "28px 0 24px" }}>
          <Button href={renewUrl} style={cta}>
            Reactivate my profile
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          We'll only email about this a couple more times. If you'd rather
          we didn't, use the unsubscribe link below.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Reactivate your REPS profile",
  displayName: "Win-back — lapsed",
  previewData: {
    proName: "Jordon",
    renewUrl: "https://repsuk.org/renew/example",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "20px" };
const brandText = { fontSize: "13px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const greeting = { fontSize: "15px", color: "#1a1d24", margin: "0 0 12px" };
const para = { fontSize: "15px", color: "#1a1d24", lineHeight: 1.6, margin: "0 0 14px" };
const cta = { backgroundColor: "#ff6a00", color: "#ffffff", padding: "13px 28px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, textDecoration: "none", display: "inline-block" };
const hr = { borderColor: "#eaecef", margin: "20px 0 12px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
