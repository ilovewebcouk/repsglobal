import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "../registry";

interface OpsAlertProps {
  kind?: string;
  severity?: "info" | "warn" | "crit";
  summary?: string;
  openedAt?: string;
  href?: string;
}

const SITE_NAME = "REPS";

const OpsAlertEmail = ({
  kind = "alert",
  severity = "warn",
  summary = "An operational alert has opened.",
  openedAt,
  href = "https://repsuk.org/admin",
}: OpsAlertProps) => {
  const color = severity === "crit" ? "#b91c1c" : severity === "warn" ? "#b45309" : "#0f766e";
  const sevLabel = severity.toUpperCase();
  const when = openedAt ? new Date(openedAt).toLocaleString("en-GB") : "just now";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`[${sevLabel}] ${kind} — ${summary}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>{SITE_NAME} OPERATIONS</Text>
          </Section>

          <Heading style={{ ...h1, color }}>
            [{sevLabel}] {kind}
          </Heading>

          <Section style={card}>
            <Text style={body}>{summary}</Text>
            <Text style={meta}>Opened {when}</Text>
          </Section>

          <Section style={{ textAlign: "center" as const, margin: "24px 0" }}>
            <Link href={href} style={{ ...button, backgroundColor: color }}>
              Open alert
            </Link>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because you're an admin on {SITE_NAME}. Manage alerts at{" "}
            <Link href="https://repsuk.org/admin" style={link}>
              the operations centre
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: OpsAlertEmail,
  subject: (data: Record<string, unknown>) => {
    const sev = ((data?.severity as string) || "warn").toUpperCase();
    const kind = (data?.kind as string) || "alert";
    return `[${sev}] REPS ops: ${kind}`;
  },
  displayName: "Ops · Alert notification",
  previewData: {
    kind: "payments.failed_active",
    severity: "crit",
    summary: "5 failed payments are currently active and need recovery.",
    openedAt: new Date().toISOString(),
    href: "https://repsuk.org/admin",
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
const h1 = {
  fontSize: "22px",
  fontWeight: 700,
  margin: "0 0 16px",
  lineHeight: 1.3,
};
const card = {
  backgroundColor: "#fafafa",
  border: "1px solid #eaecef",
  borderRadius: "12px",
  padding: "18px 20px",
  margin: "8px 0 18px",
};
const body = { fontSize: "15px", color: "#1a1d24", lineHeight: 1.6, margin: 0 };
const meta = { fontSize: "12px", color: "#8a8f99", margin: "10px 0 0" };
const button = {
  display: "inline-block",
  padding: "12px 20px",
  borderRadius: "10px",
  color: "#ffffff",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: "14px",
};
const hr = { borderColor: "#eaecef", margin: "20px 0 12px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
const link = { color: "#ff6a00", textDecoration: "underline" };
