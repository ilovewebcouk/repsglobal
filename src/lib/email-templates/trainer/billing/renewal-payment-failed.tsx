import {
  Body, Button, Container, Head, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "../../registry";

interface Props {
  proName?: string;
  amount?: string;
  graceEndDate?: string;
  renewUrl?: string;
}

const Email = ({
  proName = "there",
  amount = "£34",
  graceEndDate = "soon",
  renewUrl = "https://repsuk.org/dashboard",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Update your card to keep your REPS membership active</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>REPS MEMBERSHIP</Text>
        </Section>
        <Text style={greeting}>Hi {proName},</Text>
        <Text style={para}>
          We tried to renew your REPS membership for <strong>{amount}</strong>{" "}
          but your card was declined.
        </Text>
        <Text style={para}>
          Your profile is still live until <strong>{graceEndDate}</strong>.
          Update your card in one tap and we'll retry — no other changes
          needed.
        </Text>
        <Section style={{ textAlign: "center", margin: "28px 0 24px" }}>
          <Button href={renewUrl} style={cta}>
            Update card
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you'd rather cancel, do nothing — your listing will hide
          automatically after the date above.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Your REPS payment didn't go through — update your card",
  displayName: "Renewal — payment failed",
  previewData: {
    proName: "Jordon",
    amount: "£34",
    graceEndDate: "26 July 2026",
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
