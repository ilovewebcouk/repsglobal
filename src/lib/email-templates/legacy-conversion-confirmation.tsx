import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  proName?: string;
  renewalDate?: string;
  amount?: string;
  previousAmount?: string;
  cardBrand?: string;
  cardLast4?: string;
  manageBillingUrl?: string;
  settingsUrl?: string;
}

const LegacyConversionConfirmation = ({
  proName = "there",
  renewalDate = "your renewal date",
  amount = "£99",
  previousAmount = "£34",
  cardBrand = "Card",
  cardLast4 = "••••",
  manageBillingUrl = "https://repsuk.org/dashboard/settings",
  settingsUrl = "https://repsuk.org/dashboard/settings",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Same card, same date, new platform. Your REPs Core renewal is locked in.
    </Preview>
    <Body style={main}>
      <Container style={card}>
        {/* Header */}
        <Section style={header}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td align="left" style={headerLogo}>REPS</td>
              <td align="right" style={headerTag}>The register for fitness pros</td>
            </tr>
          </table>
        </Section>

        {/* Hero */}
        <Section style={{ padding: "36px 32px 8px 32px" }}>
          <Heading as="h1" style={h1}>Your REPs Core renewal is set.</Heading>
          <Text style={p}>
            Hi {proName}, when you joined REPs through Brilliant Directories you
            agreed to an annual auto-renewal on the card we have on file.
            We've now moved your membership onto the rebuilt REPs platform —
            <strong style={ink}> same card, same renewal date.</strong>
          </Text>
          <Text style={{ ...p, marginTop: "12px" }}>
            Your renewal is now <strong style={ink}>{amount}</strong> (was {previousAmount}).
            That difference gets you a fully rebuilt profile, verified badge,
            client discovery tools, and the same platform-wide visibility that used
            to cost several times more elsewhere. Nothing is charged today — your next
            payment lands on {renewalDate}.
          </Text>
          <Text style={{ ...p, marginTop: "12px" }}>
            Honestly — if it gets you <strong style={ink}>one client this year</strong>,
            it's paid for itself several times over. Plus you'll be on the only
            global register that makes you look like a pro.
          </Text>
        </Section>

        {/* Summary card */}
        <Section style={{ padding: "26px 32px 4px 32px" }}>
          <Heading as="h2" style={eyebrow}>Renewal summary</Heading>
          <div style={pricingBox}>
            <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={summaryTable}>
              <tbody>
                <tr>
                  <td style={summaryLabel}>Plan</td>
                  <td style={summaryValue}>REPs Core (annual)</td>
                </tr>
                <tr>
                  <td style={summaryLabel}>Amount</td>
                  <td style={summaryValue}>{amount}</td>
                </tr>
                <tr>
                  <td style={summaryLabel}>Renews on</td>
                  <td style={summaryValue}>{renewalDate}</td>
                </tr>
                <tr>
                  <td style={{ ...summaryLabel, borderBottom: "none" }}>Card</td>
                  <td style={{ ...summaryValue, borderBottom: "none" }}>
                    {cardBrand} •••• {cardLast4}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* CTA */}
        <Section style={{ padding: "26px 32px 8px 32px", textAlign: "center" as const }}>
          <table cellPadding={0} cellSpacing={0} role="presentation" align="center">
            <tr>
              <td align="center" style={{ background: "#e85a1a", borderRadius: "10px" }}>
                <a href={manageBillingUrl} style={ctaLink}>Manage billing →</a>
              </td>
            </tr>
          </table>
        </Section>

        {/* What happens next */}
        <Section style={{ padding: "22px 32px 4px 32px" }}>
          <Heading as="h2" style={eyebrow}>What happens next</Heading>
          <ul style={ul}>
            <li><strong style={ink}>Nothing today</strong> — we won't charge anything until {renewalDate}.</li>
            <li>We'll send a reminder <strong style={ink}>7 days before</strong> the renewal date.</li>
            <li>
              You can update your card, view invoices, or cancel any time from{" "}
              <Link href={settingsUrl} style={inlineLink}>Settings → Billing</Link>.
            </li>
          </ul>
        </Section>

        {/* Straight talk */}
        <Section style={{ padding: "22px 32px 4px 32px" }}>
          <Heading as="h2" style={eyebrow}>Straight talk</Heading>
          <Text style={p}>
            We ship updates every single day — the platform you see this week
            is not the platform you'll see next week. If you'd rather not be
            along for the ride, you can close your account in{" "}
            <Link href={settingsUrl} style={inlineLink}>Settings → Account</Link>{" "}
            any time before your renewal date.
          </Text>
        </Section>

        {/* Sign-off */}
        <Section style={{ padding: "26px 32px 36px 32px" }}>
          <Text style={{ ...p, color: "#0e1116", margin: "0 0 6px 0" }}>
            Thanks for being here.
          </Text>
          <Text style={{ ...p, margin: 0 }}>— The REPs team</Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            REPs · The register for fitness professionals ·{" "}
            <Link href="https://repsuk.org" style={footerLink}>repsuk.org</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: LegacyConversionConfirmation,
  subject: (d: Record<string, unknown>) =>
    `Your REPs Core renewal is set — ${d.amount ?? "£99"} on ${d.renewalDate ?? "your renewal date"}`,
  displayName: "Legacy → Subscription conversion",
  previewData: {
    proName: "Jordon",
    renewalDate: "12 July 2026",
    amount: "£99",
    previousAmount: "£34",
    cardBrand: "Visa",
    cardLast4: "4242",
    manageBillingUrl: "https://repsuk.org/dashboard/settings",
    settingsUrl: "https://repsuk.org/dashboard/settings",
  },
} satisfies TemplateEntry;

const main = {
  margin: 0,
  padding: "32px 16px",
  backgroundColor: "#ffffff",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  color: "#0e1116",
};
const card = {
  width: "600px",
  maxWidth: "600px",
  background: "#ffffff",
  borderRadius: "18px",
  overflow: "hidden" as const,
  border: "1px solid #ece9e3",
  margin: "0 auto",
};
const header = { background: "#0e1116", padding: "22px 28px" };
const headerLogo = {
  fontSize: "18px",
  fontWeight: 800,
  letterSpacing: "1px",
  color: "#ffffff",
};
const headerTag = {
  fontSize: "11px",
  letterSpacing: "1.2px",
  textTransform: "uppercase" as const,
  color: "#9aa0a6",
};
const h1 = {
  margin: "0 0 12px 0",
  fontSize: "28px",
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: "-0.4px",
  color: "#0e1116",
};
const p = { margin: 0, fontSize: "16px", lineHeight: 1.55, color: "#3a3f47" };
const eyebrow = {
  margin: "0 0 10px 0",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "1.4px",
  textTransform: "uppercase" as const,
  color: "#e85a1a",
};
const ul = {
  margin: 0,
  padding: "0 0 0 18px",
  fontSize: "15px",
  lineHeight: 1.7,
  color: "#3a3f47",
};
const ink = { color: "#0e1116" };
const ctaLink = {
  display: "inline-block",
  padding: "14px 26px",
  fontSize: "15px",
  fontWeight: 700,
  letterSpacing: "0.2px",
  color: "#ffffff",
  textDecoration: "none",
};
const pricingBox = {
  border: "1px solid #ece9e3",
  background: "#faf8f4",
  borderRadius: "14px",
  padding: "6px 18px",
};
const summaryTable = {
  borderCollapse: "collapse" as const,
  width: "100%",
};
const summaryLabel = {
  padding: "12px 0",
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.2px",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  borderBottom: "1px solid #ece9e3",
  width: "38%",
};
const summaryValue = {
  padding: "12px 0",
  fontSize: "15px",
  fontWeight: 600,
  color: "#0e1116",
  textAlign: "right" as const,
  borderBottom: "1px solid #ece9e3",
};
const inlineLink = {
  color: "#e85a1a",
  textDecoration: "none",
  fontWeight: 600,
};
const footer = {
  padding: "18px 32px",
  borderTop: "1px solid #ece9e3",
  background: "#faf8f4",
};
const footerText = {
  margin: 0,
  fontSize: "12px",
  lineHeight: 1.55,
  color: "#6b7280",
  textAlign: "center" as const,
};
const footerLink = { color: "#6b7280", textDecoration: "underline" };
