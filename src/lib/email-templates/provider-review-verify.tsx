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
import type { TemplateEntry } from "./registry";

interface Props {
  providerName?: string;
  verifyUrl?: string;
  rating?: number;
}

const SITE_NAME = "REPS";

const ProviderReviewVerifyEmail = ({
  providerName = "the training provider",
  verifyUrl = "https://repsuk.org",
  rating = 5,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your review of {providerName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{SITE_NAME}</Text>
        </Section>
        <Text style={para}>
          Thanks for reviewing <strong>{providerName}</strong> ({rating}/5) on REPS.
        </Text>
        <Text style={para}>
          Please confirm your email address to publish the review. If you
          don&rsquo;t confirm within 7 days it will be discarded.
        </Text>
        <Section style={{ textAlign: "center", margin: "28px 0 24px" }}>
          <Button href={verifyUrl} style={cta}>
            Confirm my review
          </Button>
        </Section>
        <Text style={smallPara}>
          Or paste this link into your browser:
          <br />
          <span style={mono}>{verifyUrl}</span>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          REPS moderates every review. We may contact you for proof of your
          learning experience (invoice, certificate, or email from the
          provider) before or after publication.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: ProviderReviewVerifyEmail,
  subject: (data: Record<string, unknown>) => {
    const p = (data?.providerName as string) || "your training provider";
    return `Confirm your review of ${p} on REPS`;
  },
  displayName: "Provider review — email verification",
  previewData: {
    providerName: "Example Academy",
    verifyUrl: "https://repsuk.org/reviews/provider/verify/abc",
    rating: 5,
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
const para = {
  fontSize: "15px",
  color: "#1a1d24",
  lineHeight: 1.6,
  margin: "0 0 14px",
};
const smallPara = {
  fontSize: "12px",
  color: "#5a6070",
  lineHeight: 1.5,
  margin: "0 0 8px",
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
const mono = {
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  color: "#33363d",
  wordBreak: "break-all" as const,
};
const hr = { borderColor: "#eaecef", margin: "20px 0 12px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
