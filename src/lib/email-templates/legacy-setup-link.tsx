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
  setupUrl?: string;
  amount?: string;
  previousAmount?: string;
  renewalDate?: string;
}

const LegacySetupLink = ({
  proName = "there",
  setupUrl = "https://repsuk.org/billing/setup/REPLACE_TOKEN",
  amount = "£99",
  previousAmount = "£34",
  renewalDate = "your original renewal date",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Add a card to lock in your REPs Core renewal — same price, same value.
    </Preview>
    <Body style={main}>
      <Container style={card}>
        <Section style={header}>
          <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
            <tr>
              <td align="left" style={headerLogo}>REPS</td>
              <td align="right" style={headerTag}>The register for fitness pros</td>
            </tr>
          </table>
        </Section>

        <Section style={{ padding: "36px 32px 8px 32px" }}>
          <Heading as="h1" style={h1}>One quick step to keep your REPs profile live.</Heading>
          <Text style={p}>
            Hi {proName}, when we migrated REPs from the old Brilliant Directories
            platform we couldn't bring across the card on file for your account —
            it was held by the old payment processor, not by us.
          </Text>
          <Text style={{ ...p, marginTop: "12px" }}>
            To keep your profile, verified badge and enquiries running,
            <strong style={ink}> add a card now</strong>. You'll be set up on
            REPs Core at <strong style={ink}>{amount}/year</strong> (was {previousAmount}),
            anchored to {renewalDate}. Nothing is charged today.
          </Text>
          <Text style={{ ...p, marginTop: "12px" }}>
            Honestly — if it gets you <strong style={ink}>one client this year</strong>,
            it's paid for itself several times over. Plus you'll be on the only
            UK-built register that makes you look like a pro.
          </Text>
        </Section>

        <Section style={{ padding: "26px 32px 8px 32px", textAlign: "center" as const }}>
          <table cellPadding={0} cellSpacing={0} role="presentation" align="center">
            <tr>
              <td align="center" style={{ background: "#e85a1a", borderRadius: "10px" }}>
                <a href={setupUrl} style={ctaLink}>Add your card →</a>
              </td>
            </tr>
          </table>
          <Text style={{ ...p, fontSize: "13px", marginTop: "12px", color: "#6a7079" }}>
            Takes about 30 seconds. Secured by Stripe.
          </Text>
        </Section>

        <Section style={{ padding: "22px 32px 4px 32px" }}>
          <Heading as="h2" style={eyebrow}>What's included</Heading>
          <ul style={ul}>
            <li>Fully rebuilt public profile + verified badge</li>
            <li>Direct enquiries from clients searching your area</li>
            <li>Daily platform updates — we ship something new every day</li>
            <li>Cancel any time before your renewal date</li>
          </ul>
        </Section>

        <Section style={{ padding: "22px 32px 4px 32px" }}>
          <Text style={{ ...p, fontSize: "13px", color: "#6a7079" }}>
            If the button doesn't work, copy and paste this link into your browser:<br />
            <Link href={setupUrl} style={inlineLink}>{setupUrl}</Link>
          </Text>
        </Section>

        <Section style={{ padding: "26px 32px 36px 32px" }}>
          <Text style={{ ...p, color: "#0e1116", margin: "0 0 6px 0" }}>
            Thanks for being here.
          </Text>
          <Text style={{ ...p, margin: 0 }}>— The REPs team</Text>
        </Section>

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
  component: LegacySetupLink,
  subject: "One quick step to keep your REPs profile live",
  displayName: "Legacy → setup-link (card capture)",
  previewData: {
    proName: "Jordon",
    setupUrl: "https://repsuk.org/billing/setup/preview-token",
    amount: "£99",
    previousAmount: "£34",
    renewalDate: "12 July 2026",
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
const headerLogo = { fontSize: "18px", fontWeight: 800, letterSpacing: "1px", color: "#ffffff" };
const headerTag = { fontSize: "11px", letterSpacing: "1.2px", textTransform: "uppercase" as const, color: "#9aa0a6" };
const h1 = { margin: "0 0 12px 0", fontSize: "28px", lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.4px", color: "#0e1116" };
const p = { margin: 0, fontSize: "16px", lineHeight: 1.55, color: "#3a3f47" };
const eyebrow = { margin: "0 0 10px 0", fontSize: "13px", fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: "#e85a1a" };
const ul = { margin: 0, padding: "0 0 0 18px", fontSize: "15px", lineHeight: 1.7, color: "#3a3f47" };
const ink = { color: "#0e1116" };
const ctaLink = { display: "inline-block", padding: "14px 26px", fontSize: "15px", fontWeight: 700, letterSpacing: "0.2px", color: "#ffffff", textDecoration: "none" };
const inlineLink = { color: "#e85a1a", textDecoration: "underline" };
const footer = { background: "#faf8f4", borderTop: "1px solid #ece9e3", padding: "18px 28px" };
const footerText = { margin: 0, fontSize: "12px", lineHeight: 1.5, color: "#6a7079" };
const footerLink = { color: "#6a7079", textDecoration: "underline" };
