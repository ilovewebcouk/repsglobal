import {
  Body, Button, Container, Head, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  proName?: string;
  renewalDate?: string;
  amount?: string;
  renewUrl?: string;
}

const Email = ({
  proName = "there",
  renewalDate = "soon",
  amount = "£34",
  renewUrl = "https://repsuk.org/dashboard",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your REPS membership renews on {renewalDate}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>REPS MEMBERSHIP</Text>
        </Section>
        <Text style={greeting}>Hi {proName},</Text>
        <Text style={para}>
          Your REPS membership renews on <strong>{renewalDate}</strong> at{" "}
          <strong>{amount}/year</strong>.
        </Text>
        <Text style={para}>
          We don't have a card on file. Add one in one tap to keep your
          profile live and your Verified badge active — your account stays
          exactly as it is, no changes to your listing or settings.
        </Text>
        <Section style={{ textAlign: "center", margin: "28px 0 24px" }}>
          <Button href={renewUrl} style={cta}>
            Add a card &amp; continue
          </Button>
        </Section>
        <Text style={muted}>
          If you'd rather not renew, you don't need to do anything — your
          listing will hide automatically after the renewal date.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          This link is unique to your account. You don't need to sign in to
          use it.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) =>
    `Your REPS membership renews on ${d.renewalDate ?? "soon"} — add a card to continue`,
  displayName: "Renewal — card needed",
  previewData: {
    proName: "Jordon",
    renewalDate: "12 July 2026",
    amount: "£34",
    renewUrl: "https://repsuk.org/renew/example",
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
