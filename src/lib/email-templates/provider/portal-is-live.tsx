import {
  Body,
  Button,
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

interface Props {
  /** Display name of the training provider (organisation). */
  providerName?: string;
  /** URL that lets the recipient set their password and sign in. */
  passwordSetUrl?: string;
  /**
   * When true, the recipient already has a REPs account with this email —
   * we skip the password-set CTA and point them at sign-in instead.
   */
  alreadyRegistered?: boolean;
  /** Email address the recipient uses to sign in. */
  emailAddress?: string;
}

const SITE_NAME = "REPS";
const SIGN_IN_URL = "https://repsuk.org/auth";
const VERIFICATION_URL = "https://repsuk.org/dashboard/verification";
const SUPPORT_EMAIL = "support@repsuk.org";

const ProviderPortalIsLive = ({
  providerName,
  passwordSetUrl,
  alreadyRegistered = false,
  emailAddress,
}: Props) => {
  const greeting = providerName ? `Hi ${providerName},` : "Hi,";
  const ctaHref = alreadyRegistered ? SIGN_IN_URL : passwordSetUrl || SIGN_IN_URL;
  const ctaLabel = alreadyRegistered ? "Sign in to your portal" : "Set your password & sign in";

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your new REPs training-provider portal is live</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>{SITE_NAME}</Text>
          </Section>

          <Heading style={h1}>Your training-provider portal is live</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            We&rsquo;ve launched the new REPs training-provider portal and enabled it on your
            account. You can now manage your organisation, submit courses for REPs endorsement,
            register learners, and issue REPs-branded certificates &mdash; all from one place.
          </Text>

          {alreadyRegistered ? (
            <Text style={text}>
              You already have a REPs account with{" "}
              <strong>{emailAddress || "this email address"}</strong>. Sign in with your existing
              password and you&rsquo;ll land on the new portal.
            </Text>
          ) : (
            <Text style={text}>
              Your account has been set up using{" "}
              <strong>{emailAddress || "the email this message was sent to"}</strong>. Set a
              password below to sign in.
            </Text>
          )}

          <Section style={ctaWrap}>
            <Button href={ctaHref} style={cta}>
              {ctaLabel}
            </Button>
          </Section>

          <Hr style={hr} />

          <Heading style={h2}>What&rsquo;s new in the portal</Heading>
          <ul style={list}>
            <li style={li}>
              <strong>Endorsement submissions.</strong> Send REPs your regulated qualifications and
              CPD courses for review and endorsement.
            </li>
            <li style={li}>
              <strong>Issue certificates.</strong> Issue REPs-branded certificates directly from the
              portal, with QR-code verification and a public verify URL per learner.
            </li>
            <li style={li}>
              <strong>Learner registrations.</strong> Register your students against endorsed
              courses so their qualification is recognised on the REPs register.
            </li>
            <li style={li}>
              <strong>Verified provider listing.</strong> Once verified, your organisation appears
              on REPs with a verified provider badge and a public website.
            </li>
            <li style={li}>
              <strong>Reviews &amp; reputation.</strong> Collect verified reviews from learners
              you&rsquo;ve trained.
            </li>
          </ul>

          <Hr style={hr} />

          <Heading style={h2}>Verification is required</Heading>
          <Text style={text}>
            Before you can issue certificates or appear as a verified provider on the public REPs
            register, your organisation must complete full REPs provider verification. This
            includes identity, organisation documents, and confirmation of the qualifications and
            personnel authorised to sign REPs certificates.
          </Text>
          <Text style={text}>
            Head to{" "}
            <Link href={VERIFICATION_URL} style={link}>
              Verification
            </Link>{" "}
            in the portal to start &mdash; most providers clear it within a few working days.
          </Text>

          <Hr style={hr} />

          <Heading style={h2}>How REPs endorsement &amp; certificates work</Heading>
          <Text style={text}>
            REPs endorses regulated qualifications and CPD courses that meet our standards. Once a
            course is endorsed, you can register learners against it and issue an official
            REPs-branded certificate on completion. Every certificate carries a unique verification
            QR code so employers, gyms, and members of the public can confirm it on{" "}
            <Link href="https://repsuk.org/verify" style={link}>
              repsuk.org/verify
            </Link>
            .
          </Text>
          <Text style={text}>
            For the full walkthrough see our resource:{" "}
            <Link
              href="https://repsuk.org/resources/new-training-provider-portal"
              style={link}
            >
              The new REPs training-provider portal
            </Link>
            .
          </Text>

          <Hr style={hr} />

          <Text style={muted}>
            Questions? Reply to this email or reach us at{" "}
            <Link href={`mailto:${SUPPORT_EMAIL}`} style={link}>
              {SUPPORT_EMAIL}
            </Link>
            .
          </Text>
          <Text style={footer}>Sent by {SITE_NAME}.</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: ProviderPortalIsLive,
  subject: "Your REPs training-provider portal is live",
  displayName: "Provider · Portal is live (announcement)",
  previewData: {
    providerName: "Forge Academy",
    passwordSetUrl: "https://repsuk.org/auth?token=example",
    alreadyRegistered: false,
    emailAddress: "director@forgeacademy.co.uk",
  },
} satisfies TemplateEntry;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};
const container = { padding: "32px 24px", maxWidth: "580px", margin: "0 auto" };
const brandBar = { marginBottom: "24px" };
const brandText = {
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "#ff6a00",
  margin: 0,
};
const h1 = {
  fontSize: "24px",
  lineHeight: "30px",
  fontWeight: 700,
  color: "#0f172a",
  margin: "8px 0 16px",
};
const h2 = {
  fontSize: "17px",
  lineHeight: "24px",
  fontWeight: 700,
  color: "#0f172a",
  margin: "0 0 10px",
};
const text = { fontSize: "15px", lineHeight: "24px", color: "#0f172a", margin: "0 0 12px" };
const muted = { fontSize: "13px", lineHeight: "20px", color: "#475569", margin: "0 0 8px" };
const ctaWrap = { margin: "12px 0 4px" };
const cta = {
  backgroundColor: "#ff6a00",
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: "10px",
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
};
const link = { color: "#ff6a00", textDecoration: "underline" };
const list = { margin: "0 0 12px", paddingLeft: "20px", color: "#0f172a" };
const li = { fontSize: "15px", lineHeight: "24px", margin: "0 0 8px" };
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const footer = { fontSize: "12px", color: "#64748b", margin: 0 };
