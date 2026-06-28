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
}

const LegacyReactivation = ({
  proName = "there",
  setupUrl = "https://repsuk.org/billing/setup/REPLACE_TOKEN",
  amount = "£99",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your REPs membership is paused — reactivate to keep your profile live.</Preview>
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
          <Heading as="h1" style={h1}>Your REPs membership is paused.</Heading>
          <Text style={p}>
            Hi {proName}, your renewal date passed a while back and we couldn't
            take the payment. Your profile is hidden from search right now — but
            you can switch it back on in under a minute.
          </Text>
          <Text style={{ ...p, marginTop: "12px" }}>
            Add a card and we'll start a fresh REPs Core membership at
            <strong style={ink}> {amount}/year</strong>. You get the rebuilt
            profile, verified badge, and the same client discovery tools every
            other member is using.
          </Text>
          <Text style={{ ...p, marginTop: "12px" }}>
            Honestly — if it gets you <strong style={ink}>one client this year</strong>,
            it's paid for itself several times over. Plus you'll be back on
            the only global register that makes you look like a pro.
          </Text>
        </Section>

        <Section style={{ padding: "26px 32px 8px 32px", textAlign: "center" as const }}>
          <table cellPadding={0} cellSpacing={0} role="presentation" align="center">
            <tr>
              <td align="center" style={{ background: "#e85a1a", borderRadius: "10px" }}>
                <a href={setupUrl} style={ctaLink}>Reactivate now →</a>
              </td>
            </tr>
          </table>
          <Text style={{ ...p, fontSize: "13px", marginTop: "12px", color: "#6a7079" }}>
            Takes about 30 seconds. Secured by Stripe.
          </Text>
        </Section>

        <Section style={{ padding: "22px 32px 4px 32px" }}>
          <Text style={{ ...p, fontSize: "13px", color: "#6a7079" }}>
            If the button doesn't work, copy and paste this link into your browser:<br />
            <Link href={setupUrl} style={inlineLink}>{setupUrl}</Link>
          </Text>
        </Section>

        <Section style={{ padding: "26px 32px 36px 32px" }}>
          <Text style={{ ...p, color: "#0e1116", margin: "0 0 6px 0" }}>
            We'd love to have you back.
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
  component: LegacyReactivation,
  subject: "Your REPs membership is paused — reactivate in 30 seconds",
  displayName: "Legacy → reactivation",
  previewData: {
    proName: "Jordon",
    setupUrl: "https://repsuk.org/billing/setup/preview-token",
    amount: "£99",
  },
} satisfies TemplateEntry;

const main = { margin: 0, padding: "32px 16px", backgroundColor: "#ffffff", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", color: "#0e1116" };
const card = { width: "600px", maxWidth: "600px", background: "#ffffff", borderRadius: "18px", overflow: "hidden" as const, border: "1px solid #ece9e3", margin: "0 auto" };
const header = { background: "#0e1116", padding: "22px 28px" };
const headerLogo = { fontSize: "18px", fontWeight: 800, letterSpacing: "1px", color: "#ffffff" };
const headerTag = { fontSize: "11px", letterSpacing: "1.2px", textTransform: "uppercase" as const, color: "#9aa0a6" };
const h1 = { margin: "0 0 12px 0", fontSize: "28px", lineHeight: 1.2, fontWeight: 800, letterSpacing: "-0.4px", color: "#0e1116" };
const p = { margin: 0, fontSize: "16px", lineHeight: 1.55, color: "#3a3f47" };
const ink = { color: "#0e1116" };
const ctaLink = { display: "inline-block", padding: "14px 26px", fontSize: "15px", fontWeight: 700, letterSpacing: "0.2px", color: "#ffffff", textDecoration: "none" };
const inlineLink = { color: "#e85a1a", textDecoration: "underline" };
const footer = { background: "#faf8f4", borderTop: "1px solid #ece9e3", padding: "18px 28px" };
const footerText = { margin: 0, fontSize: "12px", lineHeight: 1.5, color: "#6a7079" };
