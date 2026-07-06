/**
 * Shared shell for all onboarding-drip templates so they match the canonical
 * app-email visual (brandBar + heading + text + single CTA). Every drip
 * template renders through <OnboardingEmail /> so we never drift back into
 * the bespoke marketing look of relaunch-announcement / new-reps-rollout.
 */
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import React from "react";

const SITE_NAME = "REPS";

export interface OnboardingEmailProps {
  preview: string;
  heading: string;
  proName?: string;
  paragraphs: string[];
  bullets?: string[];
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  ps?: string;
}

export function OnboardingEmail({
  preview, heading, proName, paragraphs, bullets, ctaHref, ctaLabel,
  secondaryHref, secondaryLabel, ps,
}: OnboardingEmailProps) {
  const greeting = proName ? `Hi ${proName},` : "Hi,";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>{heading}</Heading>
          <Text style={text}>{greeting}</Text>
          {paragraphs.map((p, i) => (
            <Text key={i} style={text}>{p}</Text>
          ))}
          {bullets && bullets.length > 0 && (
            <Section style={{ margin: "0 0 16px" }}>
              {bullets.map((b, i) => (
                <Text key={i} style={item}>• {b}</Text>
              ))}
            </Section>
          )}
          <Button href={ctaHref} style={cta}>{ctaLabel}</Button>
          {secondaryHref && secondaryLabel && (
            <Text style={{ ...text, marginTop: "18px" }}>
              Or: <a href={secondaryHref} style={inlineLink}>{secondaryLabel}</a>
            </Text>
          )}
          {ps && (
            <Text style={{ ...text, marginTop: "22px", fontStyle: "italic" as const, color: "#5a5f6a" }}>
              {ps}
            </Text>
          )}
          <Hr style={hr} />
          <Text style={footer}>
            Sent by {SITE_NAME}. You're receiving this because your membership is active
            and we noticed a step in your setup is still open. Once you're set up you
            won't receive further onboarding reminders.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.55, margin: "0 0 14px" };
const item = { fontSize: "15px", color: "#33363d", lineHeight: 1.5, margin: "0 0 6px" };
const cta = { backgroundColor: "#ff6a00", color: "#ffffff", padding: "12px 20px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, textDecoration: "none" };
const inlineLink = { color: "#ff6a00", textDecoration: "underline", fontWeight: 600 };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
