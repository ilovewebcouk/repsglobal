import * as React from "react";
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Hr,
} from "@react-email/components";
import type { TemplateEntry } from "../../registry";

interface Props {
  fullName?: string | null;
  activateUrl: string;
  anniversaryLabel: string;
  priceLabel?: string;
}

const Email = ({ fullName, activateUrl, anniversaryLabel, priceLabel = "£34" }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Activate your REPs Core membership — set a password and add your card.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>REPS</Text>
        <Heading style={h1}>
          {fullName ? `${fullName.split(" ")[0]}, your Core membership is ready` : "Your Core membership is ready"}
        </Heading>
        <Text style={lede}>
          We've set up your REPs Core account. Two quick steps to go live on the register:
        </Text>
        <Section style={stepsBox}>
          <Text style={step}><strong style={num}>1.</strong>&nbsp;&nbsp;Set a password for your REPs account.</Text>
          <Text style={step}><strong style={num}>2.</strong>&nbsp;&nbsp;Add a card so your renewal on <strong>{anniversaryLabel}</strong> goes through automatically.</Text>
        </Section>
        <Section style={ctaWrap}>
          <Button href={activateUrl} style={ctaBtn}>Activate my membership</Button>
        </Section>
        <Text style={fine}>
          Your first charge of {priceLabel} won't happen today — it lands on <strong>{anniversaryLabel}</strong>,
          the anniversary of your last payment. Once your profile is live on the register you'll show up in
          search, verified.
        </Text>
        <Hr style={hr} />
        <Text style={smallprint}>
          If you didn't expect this email, ignore it — nothing will be charged. Questions? Reply to this email
          and a real person at REPs will get back to you.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: "Activate your REPs Core membership",
  displayName: "Core — manual invite (admin)",
  previewData: {
    fullName: "Jane Doe",
    activateUrl: "https://repsuk.org/activate/preview-token",
    anniversaryLabel: "5 August 2026",
    priceLabel: "£34",
  },
} satisfies TemplateEntry;

const main: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  color: "#0F172A",
  margin: 0,
  padding: 0,
};
const container: React.CSSProperties = { maxWidth: "560px", margin: "0 auto", padding: "40px 24px" };
const brand: React.CSSProperties = { fontSize: "18px", fontWeight: 800, letterSpacing: "0.08em", color: "#0F172A", margin: "0 0 32px" };
const h1: React.CSSProperties = { fontSize: "26px", lineHeight: 1.2, fontWeight: 700, color: "#0F172A", margin: "0 0 16px" };
const lede: React.CSSProperties = { fontSize: "16px", lineHeight: 1.55, color: "#334155", margin: "0 0 20px" };
const stepsBox: React.CSSProperties = { backgroundColor: "#F8FAFC", borderRadius: "16px", padding: "20px 22px", margin: "0 0 28px" };
const step: React.CSSProperties = { fontSize: "15px", lineHeight: 1.5, color: "#0F172A", margin: "6px 0" };
const num: React.CSSProperties = { color: "#F97316" };
const ctaWrap: React.CSSProperties = { margin: "0 0 24px" };
const ctaBtn: React.CSSProperties = {
  backgroundColor: "#F97316", color: "#ffffff", padding: "14px 24px", borderRadius: "10px",
  fontWeight: 600, fontSize: "15px", textDecoration: "none", display: "inline-block",
};
const fine: React.CSSProperties = { fontSize: "14px", lineHeight: 1.55, color: "#475569", margin: "0 0 24px" };
const hr: React.CSSProperties = { borderColor: "#E2E8F0", margin: "24px 0" };
const smallprint: React.CSSProperties = { fontSize: "13px", lineHeight: 1.55, color: "#64748B", margin: 0 };
