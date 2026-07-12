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
import type { TemplateEntry } from "../../registry";

type Kind =
  | "identity.approved"
  | "identity.rejected"
  | "identity.needs_more_info"
  | "provider_name.approved"
  | "provider_name.rejected"
  | "provider_domain.approved"
  | "provider_domain.rejected"
  | "provider_change.approved"
  | "provider_change.rejected";

interface Props {
  kind?: Kind;
  proName?: string;
  detail?: string | null;
  adminNote?: string | null;
  dashboardUrl?: string;
}

const SITE_NAME = "REPS";

const COPY: Record<Kind, { title: string; body: (detail?: string | null) => string }> = {
  "identity.approved": {
    title: "Identity verified",
    body: () => "Your Stripe Identity check has been approved. That's step 1 of provider verification complete.",
  },
  "identity.rejected": {
    title: "Identity check failed",
    body: () => "Stripe couldn't verify your ID. Please restart the check with a clearer image or a different accepted document.",
  },
  "identity.needs_more_info": {
    title: "Identity check needs more info",
    body: () => "Stripe needs a bit more from you to complete the check. Head back to your verification page to continue.",
  },
  "provider_name.approved": {
    title: "Provider name approved",
    body: (d) => `Your training provider name${d ? ` "${d}"` : ""} has been approved and is now live.`,
  },
  "provider_name.rejected": {
    title: "Provider name not approved",
    body: (d) => `We weren't able to approve the requested name change${d ? ` "${d}"` : ""}.`,
  },
  "provider_domain.approved": {
    title: "Provider domain verified",
    body: (d) => `Your provider domain${d ? ` ${d}` : ""} has been verified. All three verification steps are now complete.`,
  },
  "provider_domain.rejected": {
    title: "Provider domain not approved",
    body: (d) => `We weren't able to approve your provider domain${d ? ` ${d}` : ""}.`,
  },
  "provider_change.approved": {
    title: "Profile change approved",
    body: (d) => `Your update to ${d ?? "your profile"} is now live on your public page.`,
  },
  "provider_change.rejected": {
    title: "Profile change not approved",
    body: (d) => `Your update to ${d ?? "your profile"} wasn't approved.`,
  },
};

const VerificationDecisionEmail = ({
  kind = "provider_domain.approved",
  proName,
  detail = null,
  adminNote = null,
  dashboardUrl = "https://repsuk.org/dashboard/verification",
}: Props) => {
  const copy = COPY[kind];
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{copy.title} on {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>
          <Heading style={h1}>{copy.title}</Heading>
          <Text style={text}>{proName ? `Hi ${proName},` : "Hi,"}</Text>
          <Text style={text}>{copy.body(detail)}</Text>
          {adminNote ? (
            <Section style={noteBox}>
              <Text style={noteLabel}>Note from the REPS team</Text>
              <Text style={noteText}>{adminNote}</Text>
            </Section>
          ) : null}
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Button href={dashboardUrl} style={button}>
              Open your dashboard
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            You're getting this because you're verifying a training provider on {SITE_NAME}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: VerificationDecisionEmail,
  subject: (data: Record<string, unknown>) => {
    const kind = (data.kind as Kind | undefined) ?? "provider_domain.approved";
    return `${COPY[kind]?.title ?? "Verification update"} — ${SITE_NAME}`;
  },
  displayName: "Verification decision",
  previewData: {
    kind: "provider_domain.approved",
    proName: "Northline Academy",
    detail: "northlineacademy.com",
    dashboardUrl: "https://repsuk.org/dashboard/verification",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.55, margin: "0 0 14px" };
const noteBox = { backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px", padding: "14px 16px", margin: "18px 0" };
const noteLabel = { fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#9a3412", margin: "0 0 4px" };
const noteText = { fontSize: "14px", color: "#33363d", lineHeight: 1.5, margin: 0 };
const button = { backgroundColor: "#ff6a00", color: "#ffffff", fontSize: "15px", fontWeight: 600, textDecoration: "none", padding: "12px 24px", borderRadius: "10px", display: "inline-block" };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0 };
