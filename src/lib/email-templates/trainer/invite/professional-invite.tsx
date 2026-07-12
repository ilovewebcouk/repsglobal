import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface ProfessionalInviteProps {
  inviteeName?: string;
  inviterName?: string;
  planLabel?: string;
  acceptUrl?: string;
}

const SITE_NAME = "REPS";

const ProfessionalInviteEmail = ({
  inviteeName,
  inviterName = "The REPs team",
  planLabel = "Pro",
  acceptUrl = "https://repsuk.org/signup",
}: ProfessionalInviteProps) => {
  const greeting = inviteeName ? `Hi ${inviteeName},` : "Hi,";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You've been invited to join {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>You're invited to join {SITE_NAME}</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            {inviterName} has invited you to claim a verified professional listing on {SITE_NAME} —
            the global register of qualified fitness, strength, Pilates, yoga and nutrition
            professionals.
          </Text>
          <Text style={text}>
            We've held a <strong>{planLabel}</strong> plan for you. Click the button below to create
            your account and finish your profile.
          </Text>
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button href={acceptUrl} style={button}>Accept invite & sign up</Button>
          </Section>
          <Text style={smallText}>Or paste this link into your browser:<br /><span style={linkText}>{acceptUrl}</span></Text>
          <Hr style={hr} />
          <Text style={footer}>This invite expires in 14 days. If you weren't expecting this email you can safely ignore it.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: ProfessionalInviteEmail,
  subject: () => `You've been invited to join ${SITE_NAME}`,
  displayName: "Professional invite",
  previewData: {
    inviteeName: "Sam",
    inviterName: "Cruz at REPs",
    planLabel: "Pro",
    acceptUrl: "https://repsuk.org/signup?invite=sample",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.55, margin: "0 0 14px" };
const button = { backgroundColor: "#ff6a00", color: "#ffffff", fontSize: "15px", fontWeight: 600, textDecoration: "none", padding: "12px 24px", borderRadius: "10px", display: "inline-block" };
const smallText = { fontSize: "12.5px", color: "#6b6f78", lineHeight: 1.5, margin: "12px 0 0" };
const linkText = { color: "#ff6a00", wordBreak: "break-all" as const };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0 };
