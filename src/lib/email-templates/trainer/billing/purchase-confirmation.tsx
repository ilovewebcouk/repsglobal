import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "../../registry";

interface Props {
  proName?: string;
  tierLabel?: string;
  amountText?: string;
  periodText?: string;
}

const SITE_NAME = "REPS";

const PurchaseConfirmationEmail = ({
  proName,
  tierLabel = "REPS Core",
  amountText,
  periodText,
}: Props) => {
  const greeting = proName ? `Hi ${proName},` : "Hi,";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to {tierLabel}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>Welcome to {tierLabel}</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            Your {tierLabel} membership is now active{amountText ? ` (${amountText}${periodText ? ` ${periodText}` : ""})` : ""}.
            You'll find your receipt in your Stripe email.
          </Text>
          <Text style={text}>
            Next: finish verification (ID, qualification, insurance) so your
            profile is publicly listed and discoverable.
          </Text>
          <Button href="https://repsuk.org/dashboard" style={cta}>
            Open your dashboard
          </Button>
          <Hr style={hr} />
          <Text style={footer}>Sent by {SITE_NAME}.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: PurchaseConfirmationEmail,
  subject: (d: Record<string, any>) => `Welcome to ${d?.tierLabel ?? "REPS Core"}`,
  displayName: "Trainer · Billing — Purchase confirmation",
  previewData: { proName: "Sam", tierLabel: "REPS Core", amountText: "£34", periodText: "/year" },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.55, margin: "0 0 14px" };
const cta = { backgroundColor: "#ff6a00", color: "#ffffff", padding: "12px 20px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, textDecoration: "none" };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0 };
