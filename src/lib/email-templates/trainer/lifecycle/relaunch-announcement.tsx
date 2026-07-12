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
import type { TemplateEntry } from "../../registry";

interface Props {
  ctaUrl?: string;
  settingsUrl?: string;
  resetUrl?: string;
}

const RelaunchAnnouncement = ({
  ctaUrl = "https://repsuk.org/auth",
  settingsUrl = "https://repsuk.org/dashboard/settings",
  resetUrl = "https://repsuk.org/auth",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      REPs is back — verified status, your public website, and a full business OS on the way.
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
          <Heading as="h1" style={h1}>REPs has relaunched.</Heading>
          <Text style={p}>
            You're one of the first members of the new REPs — and we've been busy. New register. New verification. A public website for every pro. Real protection for the trainers behind it. This is the platform you always deserved.
          </Text>
        </Section>

        {/* What's new */}
        <Section style={{ padding: "24px 32px 4px 32px" }}>
          <Heading as="h2" style={eyebrow}>What's new today</Heading>
          <ul style={ul}>
            <li><strong style={ink}>A real register</strong> — every member listed, searchable by city and specialism.</li>
            <li><strong style={ink}>3-pillar verification</strong> — ID, qualifications and insurance, all checked.</li>
            <li><strong style={ink}>Your public website</strong> — your profile is now a page that wins clients.</li>
            <li><strong style={ink}>World-class admin behind the scenes</strong> — so things just work.</li>
          </ul>
        </Section>

        {/* What's next */}
        <Section style={{ padding: "22px 32px 4px 32px" }}>
          <Heading as="h2" style={eyebrow}>Landing very soon — Pro</Heading>
          <Text style={p}>
            Pro is the full business OS for trainers — clients, bookings, payments, programmes, reviews, follow-ups — all in one place. We're opening a <strong style={ink}>Founding price of £59/mo</strong> for the first wave. Locked in for life.
          </Text>
        </Section>

        {/* CTA */}
        <Section style={{ padding: "30px 32px 8px 32px", textAlign: "center" as const }}>
          <table cellPadding={0} cellSpacing={0} role="presentation" align="center">
            <tr>
              <td align="center" style={{ background: "#e85a1a", borderRadius: "10px" }}>
                <a href={ctaUrl} style={ctaLink}>Set my password & sign in →</a>
              </td>
            </tr>
          </table>
          <Text style={muted}>
            First time signing in? Your old password didn't carry over. Tap above (or use{" "}
            <Link href={resetUrl} style={inlineLink}>Forgot password</Link>{" "}
            on the sign-in page) to set a new one — takes 30 seconds. Then verify your account: ID, qualification, insurance.
          </Text>
        </Section>


        {/* Pricing card */}
        <Section style={{ padding: "26px 32px 4px 32px" }}>
          <div style={pricingBox}>
            <Heading as="h2" style={eyebrowInk}>A word on pricing</Heading>
            <Text style={{ ...p, margin: "0 0 8px 0" }}>
              Core membership is <strong style={ink}>£34/yr</strong> (reduced from £99) — every feature we ship, no add-ons, no surprises.
            </Text>
            <Text style={{ ...muted, margin: 0 }}>
              Nothing to do today — we'll bill the card on file when your renewal date arrives.
            </Text>
          </div>
        </Section>

        {/* Honesty */}
        <Section style={{ padding: "22px 32px 4px 32px" }}>
          <Heading as="h2" style={eyebrow}>Straight talk</Heading>
          <Text style={p}>
            You'll spot the odd placeholder. We ship updates every single day — the platform you see this week is not the platform you'll see next week. If you'd rather not be along for the ride, you can close your account in{" "}
            <Link href={settingsUrl} style={inlineLink}>Settings → Account</Link>{" "}
            any time.
          </Text>
        </Section>

        {/* Sign-off */}
        <Section style={{ padding: "26px 32px 36px 32px" }}>
          <Text style={{ ...p, color: "#0e1116", margin: "0 0 6px 0" }}>
            Thank you for being here from day one.
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
  fontSize: "30px",
  lineHeight: 1.15,
  fontWeight: 800,
  letterSpacing: "-0.5px",
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
const eyebrowInk = { ...eyebrow, color: "#0e1116" };
const ul = {
  margin: 0,
  padding: "0 0 0 18px",
  fontSize: "15px",
  lineHeight: 1.6,
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
const muted = {
  margin: "14px 0 0 0",
  fontSize: "13px",
  color: "#6b7280",
};
const pricingBox = {
  border: "1px solid #ece9e3",
  background: "#faf8f4",
  borderRadius: "14px",
  padding: "18px 20px",
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

export const template = {
  component: RelaunchAnnouncement,
  subject: "REPs has relaunched — set your password to sign in",
  displayName: "Relaunch announcement",
  previewData: {},
} satisfies TemplateEntry;
