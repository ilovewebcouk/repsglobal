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

interface InsuranceBlockedProps {
  proName?: string;
  reason?:
    | "expired"
    | "low_cover"
    | "name_mismatch"
    | "missing"
    | "unknown_provider";
  expiryDate?: string | null;
  insuredName?: string | null;
  identityName?: string | null;
  coverGbp?: number | null;
  dashboardUrl?: string;
}

const SITE_NAME = "REPS";

const titleByReason: Record<
  NonNullable<InsuranceBlockedProps["reason"]>,
  string
> = {
  expired: "Your insurance certificate has expired",
  low_cover: "Your insurance cover is below £1m",
  name_mismatch: "Name on your insurance doesn't match your verified identity",
  missing: "Your verification is blocked — insurance missing",
  unknown_provider: "We couldn't recognise your insurance provider",
};

const InsuranceBlockedEmail = ({
  proName = "there",
  reason = "expired",
  expiryDate,
  insuredName,
  identityName,
  coverGbp,
  dashboardUrl = "https://repsuk.org/dashboard/verification",
}: InsuranceBlockedProps) => {
  const headline = titleByReason[reason];
  const bodyByReason: Record<
    NonNullable<InsuranceBlockedProps["reason"]>,
    string
  > = {
    expired: `The certificate you uploaded shows an expiry date of ${expiryDate ?? "—"}. Public liability cover must be in date for you to appear as REPS Verified.`,
    low_cover: `The cover amount on your certificate is £${(coverGbp ?? 0).toLocaleString()}. The industry minimum is £1,000,000.`,
    name_mismatch: `Your certificate is in the name of "${insuredName ?? "—"}" but your verified legal name on REPS is "${identityName ?? "—"}". We need these to match.`,
    missing:
      "We can't complete your verification without a current insurance certificate.",
    unknown_provider:
      "We couldn't match the provider on your certificate to our list of recognised insurers. Upload a clearer copy or contact us if this looks wrong.",
  };

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

          <Text style={para}>{headline}.</Text>

          <Section style={reasonBox}>
            <Text style={reasonBody}>{bodyByReason[reason]}</Text>
          </Section>

          <Text style={para}>
            Upload a current certificate and we'll re-run the checks
            immediately. Most pros get verified within one working day after a
            clean upload.
          </Text>

          <Section style={{ textAlign: "center", margin: "28px 0 24px" }}>
            <Button href={dashboardUrl} style={cta}>
              Upload new certificate
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because your REPS verification is blocked.
            We'll keep notifying you until the issue is resolved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: InsuranceBlockedEmail,
  subject: (data: Record<string, unknown>) =>
    titleByReason[
      ((data.reason as InsuranceBlockedProps["reason"]) ?? "expired") as NonNullable<
        InsuranceBlockedProps["reason"]
      >
    ],
  displayName: "Insurance blocked (verification)",
  previewData: {
    proName: "Jordon",
    reason: "expired" as const,
    expiryDate: "2024-11-30",
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
const reasonBox = {
  backgroundColor: "#fff5ec",
  borderLeft: "3px solid #ff6a00",
  borderRadius: "10px",
  padding: "14px 16px",
  margin: "8px 0 14px",
};
const reasonBody = {
  fontSize: "14px",
  color: "#1a1d24",
  lineHeight: 1.55,
  margin: 0,
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
