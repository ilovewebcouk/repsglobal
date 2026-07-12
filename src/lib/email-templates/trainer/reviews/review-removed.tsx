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

interface ReviewRemovedProps {
  proName?: string;
  clientName?: string;
  reviewRating?: number;
  reviewBody?: string;
  removalCategory?: string;
  removalReason?: string;
  dashboardUrl?: string;
}

const SITE_NAME = "REPS";

const ReviewRemovedEmail = ({
  proName = "there",
  clientName = "a client",
  reviewRating = 5,
  reviewBody = "",
  removalCategory,
  removalReason = "It didn't meet our review guidelines.",
  dashboardUrl = "https://repsuk.org/dashboard/reviews",
}: ReviewRemovedProps) => {
  const stars = "★".repeat(Math.max(1, Math.min(5, reviewRating)));
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>A review on your profile was removed by REPS moderation</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>{SITE_NAME} MODERATION</Text>
          </Section>

          <Text style={greeting}>Hi {proName},</Text>

          <Text style={para}>
            We've removed a recent review on your profile from{" "}
            <strong>{clientName}</strong> ({stars}). It won't appear publicly.
          </Text>

          {reviewBody ? (
            <Section style={quote}>
              <Text style={quoteLabel}>The review</Text>
              <Text style={quoteBody}>"{reviewBody}"</Text>
            </Section>
          ) : null}

          <Section style={reasonBox}>
            <Text style={reasonLabel}>
              Reason{removalCategory ? ` · ${removalCategory}` : ""}
            </Text>
            <Text style={reasonBody}>{removalReason}</Text>
          </Section>

          <Text style={para}>
            If you think this was the wrong call, reply to this email and we'll
            take another look.
          </Text>

          <Section style={{ textAlign: "center", margin: "28px 0 24px" }}>
            <Button href={dashboardUrl} style={cta}>
              Open your reviews dashboard
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because you have a professional profile on
            REPS. Moderation notifications can't be turned off.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: ReviewRemovedEmail,
  subject: "A review on your profile was removed",
  displayName: "Trainer · Reviews — Review removed",
  previewData: {
    proName: "Katie",
    clientName: "Arnie B.",
    reviewRating: 1,
    reviewBody: "Don't bother — go to my cousin's gym instead, code KATIE10.",
    removalCategory: "Spam / promotion",
    removalReason:
      "The review promoted another business and included a discount code, which breaks our review guidelines. No action needed from you.",
    dashboardUrl: "https://repsuk.org/dashboard/reviews",
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
const quote = {
  backgroundColor: "#f5f6f8",
  borderLeft: "3px solid #cdd1d8",
  borderRadius: "10px",
  padding: "12px 14px",
  margin: "8px 0 14px",
};
const quoteLabel = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#6a6f78",
  margin: "0 0 4px",
};
const quoteBody = {
  fontSize: "13.5px",
  color: "#3a3e46",
  lineHeight: 1.55,
  margin: 0,
  fontStyle: "italic" as const,
};
const reasonBox = {
  backgroundColor: "#fff5ec",
  borderLeft: "3px solid #ff6a00",
  borderRadius: "10px",
  padding: "14px 16px",
  margin: "4px 0 14px",
};
const reasonLabel = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#ff6a00",
  margin: "0 0 6px",
};
const reasonBody = {
  fontSize: "14px",
  color: "#1a1d24",
  lineHeight: 1.55,
  margin: 0,
  whiteSpace: "pre-wrap" as const,
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
