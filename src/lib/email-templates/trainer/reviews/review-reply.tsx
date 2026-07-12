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

interface ReviewReplyProps {
  proName?: string;
  proSlug?: string;
  reviewRating?: number;
  replyText?: string;
  clientName?: string;
}

const SITE_NAME = "REPS";

const ReviewReplyEmail = ({
  proName = "Your trainer",
  proSlug = "",
  reviewRating = 5,
  replyText = "Thanks so much for the kind words.",
  clientName,
}: ReviewReplyProps) => {
  const profileUrl = proSlug ? `https://repsuk.org/c/${proSlug}#reviews` : "https://repsuk.org";
  const stars = "★".repeat(Math.max(1, Math.min(5, reviewRating)));
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{proName} replied to your review on REPS</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>{SITE_NAME}</Text>
          </Section>

          <Text style={greeting}>Hi{clientName ? ` ${clientName}` : ""},</Text>

          <Text style={para}>
            <strong>{proName}</strong> just replied to the {stars} review you
            left on REPS.
          </Text>

          <Section style={quote}>
            <Text style={quoteLabel}>{proName} replied:</Text>
            <Text style={quoteBody}>{replyText}</Text>
          </Section>

          <Section style={{ textAlign: "center", margin: "28px 0 24px" }}>
            <Button href={profileUrl} style={cta}>
              View on their profile
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because you left a review on REPS. No reply is
            needed — this is a one-off notification.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: ReviewReplyEmail,
  subject: (data: Record<string, unknown>) => {
    const proName = (data?.proName as string) || "Your trainer";
    return `${proName} replied to your review`;
  },
  displayName: "Trainer · Reviews — Review reply",
  previewData: {
    proName: "Katie Gibbs",
    proSlug: "katie-gibbs",
    reviewRating: 5,
    replyText: "Thanks Arnie — it was great working with you. See you next block!",
    clientName: "Arnie",
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
  backgroundColor: "#f7f3ee",
  borderLeft: "3px solid #ff6a00",
  borderRadius: "10px",
  padding: "14px 16px",
  margin: "8px 0 4px",
};
const quoteLabel = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#ff6a00",
  margin: "0 0 6px",
};
const quoteBody = {
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
