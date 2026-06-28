import {
  Body, Button, Container, Head, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  proName?: string;
  renewalDate?: string;
  amount?: string;
  dashboardUrl?: string;
}

const Email = ({
  proName = "there",
  renewalDate = "your renewal date",
  amount = "£99",
  dashboardUrl = "https://repsuk.org/dashboard",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your REPS Core membership — next renewal {amount} on {renewalDate}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>REPS MEMBERSHIP</Text>
        </Section>
        <Text style={greeting}>Hi {proName},</Text>
        <Text style={para}>
          A quick note: we've upgraded your REPS membership to native
          recurring billing on the card you already have with us.
        </Text>
        <Text style={para}>
          <strong>Your next annual renewal is {amount} on {renewalDate}.</strong>{" "}
          Nothing will be charged before that date, and the price hasn't
          changed.
        </Text>
        <Text style={para}>
          You can update your card, view invoices, or cancel anytime from
          your dashboard — no need to email us.
        </Text>
        <Section style={{ textAlign: "center", margin: "28px 0 24px" }}>
          <Button href={dashboardUrl} style={cta}>
            Open your dashboard
          </Button>
        </Section>
        <Text style={muted}>
          We'll also send a friendly reminder 7 days before {renewalDate}
          so there are no surprises.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Questions? Just reply to this email and a real human will get back
          to you.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) =>
    `Your REPS Core membership — next renewal ${d.amount ?? "£99"} on ${d.renewalDate ?? "your renewal date"}`,
  displayName: "Legacy → Subscription conversion",
  previewData: {
    proName: "Jordon",
    renewalDate: "12 July 2026",
    amount: "£99",
    dashboardUrl: "https://repsuk.org/dashboard",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "20px" };
const brandText = { fontSize: "13px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const greeting = { fontSize: "15px", color: "#1a1d24", margin: "0 0 12px" };
const para = { fontSize: "15px", color: "#1a1d24", lineHeight: 1.6, margin: "0 0 14px" };
const muted = { fontSize: "13px", color: "#6b7280", lineHeight: 1.6, margin: "0 0 8px" };
const cta = { backgroundColor: "#ff6a00", color: "#ffffff", padding: "13px 28px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, textDecoration: "none", display: "inline-block" };
const hr = { borderColor: "#eaecef", margin: "20px 0 12px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
