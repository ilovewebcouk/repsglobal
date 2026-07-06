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
  firstName?: string;
  ctaUrl?: string;
  resetUrl?: string;
}

const NewRepsRollout = ({
  firstName,
  ctaUrl = "https://repsuk.org/auth",
  resetUrl = "https://repsuk.org/auth?mode=reset",
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Your £34/yr membership now includes a full trainer website. Log in and get verified.
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
          <Heading as="h1" style={h1}>The new REPS is here.</Heading>
          <Text style={p}>
            {firstName ? `Hi ${firstName},` : "Hi there,"}
          </Text>
          <Text style={{ ...p, marginTop: "10px" }}>
            The new REPS is now rolling out, and your membership is becoming much more than a listing.
          </Text>
        </Section>

        {/* Website included */}
        <Section style={{ padding: "22px 32px 4px 32px" }}>
          <Heading as="h2" style={eyebrow}>Your trainer website — included</Heading>
          <Text style={p}>
            You now get access to your own professional trainer website inside REPS. It's included in your membership, and <strong style={ink}>your price is not changing</strong>. Your REPS membership remains <strong style={ink}>£34 per year</strong>.
          </Text>
          <Text style={{ ...p, marginTop: "10px" }}>
            The new website editor lets you build a full public-facing trainer site — your profile, services, coaching plans, method, specialisms, locations, client results, FAQs and enquiry options.
          </Text>
          <Text style={{ ...p, marginTop: "10px" }}>
            For many trainers, this can replace paying separately for Wix, Squarespace, Shopify or a basic website builder. Your REPS profile can now become your professional website.
          </Text>
        </Section>

        {/* Verification */}
        <Section style={{ padding: "22px 32px 4px 32px" }}>
          <Heading as="h2" style={eyebrow}>Unlock your website — get verified</Heading>
          <Text style={p}>
            To fully unlock your website, you need to be verified. Please log in and upload:
          </Text>
          <ul style={ul}>
            <li>ID</li>
            <li>Insurance</li>
            <li>Qualifications</li>
          </ul>
          <Text style={{ ...p, marginTop: "10px" }}>
            Once approved, your profile can show clients that you are a verified REPS professional.
          </Text>
        </Section>

        {/* CTA */}
        <Section style={{ padding: "28px 32px 8px 32px", textAlign: "center" as const }}>
          <table cellPadding={0} cellSpacing={0} role="presentation" align="center">
            <tr>
              <td align="center" style={{ background: "#e85a1a", borderRadius: "10px" }}>
                <a href={ctaUrl} style={ctaLink}>Log in to REPS →</a>
              </td>
            </tr>
          </table>
          <Text style={muted}>
            First time signing in? Most members haven't logged into the new REPS yet — use{" "}
            <Link href={resetUrl} style={inlineLink}>Forgot password</Link>{" "}
            on the sign-in screen to set your password. It takes 30 seconds.
          </Text>
        </Section>

        {/* Insurance heads-up */}
        <Section style={{ padding: "22px 32px 4px 32px" }}>
          <div style={pricingBox}>
            <Heading as="h2" style={eyebrowInk}>Coming soon — insurance options</Heading>
            <Text style={{ ...p, margin: 0 }}>
              We're also giving members early notice that REPS will be offering insurance options in the future. More details will follow soon.
            </Text>
          </div>
        </Section>

        {/* What's next */}
        <Section style={{ padding: "22px 32px 4px 32px" }}>
          <Heading as="h2" style={eyebrow}>This is only the beginning</Heading>
          <Text style={p}>
            We're rolling out improvements daily, so keep checking your profile. The website editor is the first step — next, we're building the software that will let you run your complete fitness business through REPS.
          </Text>
        </Section>

        {/* Sign-off */}
        <Section style={{ padding: "26px 32px 36px 32px" }}>
          <Text style={{ ...p, color: "#0e1116", margin: "0 0 6px 0" }}>
            Log in today, complete your verification and start building your new website.
          </Text>
          <Text style={{ ...p, margin: "0 0 14px 0" }}>
            Your REPS membership remains <strong style={ink}>£34 per year</strong>.
          </Text>
          <Text style={{ ...p, margin: 0 }}>— The REPS Team</Text>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            REPS · The register for fitness professionals ·{" "}
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
  margin: "10px 0 0 0",
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
  component: NewRepsRollout,
  subject: "The new REPS is here — log in and unlock your trainer website",
  displayName: "New REPS rollout — log in & verify",
  previewData: { firstName: "Katie" },
} satisfies TemplateEntry;
