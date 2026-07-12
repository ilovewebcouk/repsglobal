import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "../../registry";

interface InsuranceRenewalDueProps {
  proName?: string;
  expiryDate?: string;
  daysLeft?: number;
  dashboardUrl?: string;
}

const SITE_NAME = "REPS";

const InsuranceRenewalDueEmail = ({
  proName = "there",
  expiryDate = "soon",
  daysLeft = 30,
  dashboardUrl = "https://repsuk.org/dashboard/verification",
}: InsuranceRenewalDueProps) => {
  const isExpired = daysLeft <= 0;
  const headline = isExpired
    ? "Your insurance cover has lapsed"
    : `Your insurance expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{headline}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>{SITE_NAME} VERIFICATION</Text>
          </Section>

          <Text style={greeting}>Hi {proName},</Text>

          <Text style={para}>
            {isExpired
              ? `Your insurance certificate on file expired on ${expiryDate}.`
              : `A quick heads-up — your insurance certificate expires on ${expiryDate}.`}
          </Text>

          <Text style={para}>
            {isExpired
              ? "Until you upload a current certificate, your REPS Verified badge will be removed and your profile will display as Unverified to potential clients."
              : "Upload your renewed certificate before it expires to keep your REPS Verified badge live and avoid any interruption to enquiries."}
          </Text>

          <Section style={{ textAlign: "center", margin: "28px 0 24px" }}>
            <Button href={dashboardUrl} style={cta}>
              {isExpired ? "Upload renewed certificate" : "Upload new certificate"}
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            We send these reminders 60, 30, 7 and 0 days before expiry so you
            always have time to renew.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: InsuranceRenewalDueEmail,
  subject: (data: Record<string, unknown>) => {
    const days = Number(data.daysLeft ?? 30);
    if (days <= 0) return "Your insurance cover has lapsed";
    return `Your insurance expires in ${days} day${days === 1 ? "" : "s"}`;
  },
  displayName: "Insurance renewal due",
  previewData: {
    proName: "Jordon",
    expiryDate: "2027-01-15",
    daysLeft: 30,
    dashboardUrl: "https://repsuk.org/dashboard/verification",
  },
} satisfies TemplateEntry;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "20px" };
const brandText = {
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "#ff6a00",
  margin: 0,
};
const greeting = { fontSize: "15px", color: "#1a1d24", margin: "0 0 12px" };
const para = {
  fontSize: "15px",
  color: "#1a1d24",
  lineHeight: 1.6,
  margin: "0 0 14px",
};
const cta = {
  backgroundColor: "#ff6a00",
  color: "#ffffff",
  padding: "13px 28px",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
};
const hr = { borderColor: "#eaecef", margin: "20px 0 12px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
