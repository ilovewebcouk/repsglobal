import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  proName?: string | null;
  amount?: string;
}

const SITE_NAME = "REPS";

const ChargebackReceivedEmail = ({ proName, amount }: Props) => {
  const greeting = proName ? `Hi ${proName},` : "Hi,";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>A payment dispute has been opened on your REPS membership</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>We've received a payment dispute</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            Your card issuer has notified us that the {amount ? `${amount} ` : ""}
            payment for your REPS membership is being disputed.
          </Text>
          <Text style={text}>
            While the dispute is open we've paused your membership and no
            further payments will be taken. Your professional record,
            qualifications and identity verification remain on file and are
            unaffected.
          </Text>
          <Text style={text}>
            If this was a mistake, please reply to this email or contact
            <a href="mailto:support@repsuk.org" style={link}> support@repsuk.org</a>
            {" "}and we'll help sort it out.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Sent by {SITE_NAME}.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: ChargebackReceivedEmail,
  subject: () => "We've received a payment dispute on your REPS membership",
  displayName: "Chargeback received",
  previewData: { proName: "Sam", amount: "£34.00" },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.55, margin: "0 0 14px" };
const link = { color: "#ff6a00", textDecoration: "underline" };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0 };
