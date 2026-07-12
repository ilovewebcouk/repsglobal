import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components";
import type { TemplateEntry } from "../../registry";

interface Props {
  proName?: string;
  reasonLabel?: string;
}

const SITE_NAME = "REPS";
const SITE_URL = "https://repsuk.org";

/**
 * "member-cancelled" — sent when an admin closes a member account (from
 * Member 360 or in response to a support request). Tone matches the
 * /admin/support founder-friend drafts: warm, plain, short.
 *
 * The system rule is "no active account without an active subscription",
 * so this email confirms the account is closed — it does NOT promise
 * continued access until a renewal date.
 */
const MemberCancelledEmail = ({ proName, reasonLabel }: Props) => {
  const greeting = proName ? `Hi ${proName.split(" ")[0]},` : "Hi,";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your REPS account is closed — thank you for being part of it</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}><Text style={brandText}>{SITE_NAME}</Text></Section>

          <Heading style={h1}>Your REPS account is closed</Heading>

          <Text style={text}>{greeting}</Text>

          <Text style={text}>
            Just confirming we&apos;ve closed your REPS membership and cancelled
            your subscription{reasonLabel ? ` (${reasonLabel})` : ""}. You
            won&apos;t be charged again.
          </Text>

          <Text style={text}>
            Your public profile has been removed from the directory and your
            login no longer works. We&apos;ve held onto your email so we can let
            you know when there&apos;s something genuinely worth coming back for
            — a new feature, a major update, or an invitation to rejoin on
            better terms.
          </Text>

          <Text style={text}>
            If you ever want to come back, just reply to this email and I&apos;ll
            personally get you set up again — no forms, no waiting.
          </Text>

          <Text style={text}>
            Thank you for being part of REPS.
          </Text>

          <Text style={signoff}>— The REPS team<br /><a style={link} href={SITE_URL}>{SITE_URL}</a></Text>

          <Hr style={hr} />
          <Text style={footer}>
            Don&apos;t want future updates from us? Reply with &quot;unsubscribe&quot;
            and we&apos;ll remove you from the list.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: MemberCancelledEmail,
  subject: "Your REPS account is closed",
  displayName: "Trainer · Billing — Subscription cancelled",
  previewData: { proName: "Sam Carter", reasonLabel: "at your request" },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = { fontSize: "14px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#ff6a00", margin: 0 };
const h1 = { fontSize: "24px", fontWeight: 700, color: "#0b0b0c", lineHeight: 1.25, margin: "0 0 20px" };
const text = { fontSize: "15px", color: "#33363d", lineHeight: 1.6, margin: "0 0 14px" };
const signoff = { fontSize: "15px", color: "#33363d", lineHeight: 1.6, margin: "20px 0 0" };
const link = { color: "#ff6a00", textDecoration: "none" };
const hr = { borderColor: "#eaecef", margin: "28px 0 16px" };
const footer = { fontSize: "12px", color: "#8a8f99", margin: 0, lineHeight: 1.5 };
