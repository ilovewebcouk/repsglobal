import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

// ─────────────────────────────────────────────────────────────
// Trainer — invite
// ─────────────────────────────────────────────────────────────
import { template as professionalInvite } from './trainer/invite/professional-invite'
import { template as adminInvite } from './trainer/invite/admin-invite'

// ─────────────────────────────────────────────────────────────
// Trainer — onboarding
// ─────────────────────────────────────────────────────────────
import { template as onboardingSignupLogIn1 } from './onboarding/signup-log-in-1'
import { template as onboardingSignupLogIn2 } from './onboarding/signup-log-in-2'
import { template as onboardingSignupLogIn3 } from './onboarding/signup-log-in-3'
import { template as onboardingSignupLogIn4 } from './onboarding/signup-log-in-4'
import { template as onboardingSignupLogIn5 } from './onboarding/signup-log-in-5'
import { template as onboardingSignupVerify1 } from './onboarding/signup-verify-1'
import { template as onboardingLogIn1 } from './onboarding/log-in-1'
import { template as onboardingLogIn2 } from './onboarding/log-in-2'
import { template as onboardingLogIn3 } from './onboarding/log-in-3'
import { template as onboardingLogIn4 } from './onboarding/log-in-4'
import { template as onboardingLogIn5 } from './onboarding/log-in-5'
import { template as onboardingVerify1 } from './onboarding/verify-1'
import { template as onboardingVerify2 } from './onboarding/verify-2'
import { template as onboardingVerify3 } from './onboarding/verify-3'
import { template as onboardingVerify4 } from './onboarding/verify-4'
import { template as onboardingWebsite1 } from './onboarding/website-1'
import { template as onboardingWebsite2 } from './onboarding/website-2'
import { template as onboardingWebsite3 } from './onboarding/website-3'
import { template as onboardingComplete } from './onboarding/complete'

// ─────────────────────────────────────────────────────────────
// Trainer — verification
// ─────────────────────────────────────────────────────────────
import { template as verificationReminder } from './trainer/verification/verification-reminder'
import { template as verificationDecision } from './trainer/verification/verification-decision'
import { template as insuranceBlocked } from './trainer/verification/insurance-blocked'
import { template as insuranceRenewalDue } from './trainer/verification/insurance-renewal-due'

// ─────────────────────────────────────────────────────────────
// Trainer — billing
// ─────────────────────────────────────────────────────────────
import { template as purchaseConfirmation } from './trainer/billing/purchase-confirmation'
import { template as cancellationConfirmation } from './trainer/billing/cancellation-confirmation'
import { template as renewalCardNeeded } from './trainer/billing/renewal-card-needed'
import { template as renewalPaymentFailed } from './trainer/billing/renewal-payment-failed'
import { template as memberCancelled } from './trainer/billing/member-cancelled'
import { template as chargebackReceived } from './trainer/billing/chargeback-received'
import { template as chargebackResolvedWon } from './trainer/billing/chargeback-resolved-won'
import { template as chargebackResolvedLost } from './trainer/billing/chargeback-resolved-lost'
import { template as disputeWonResubscribe } from './trainer/billing/dispute-won-resubscribe'

// ─────────────────────────────────────────────────────────────
// Trainer — reviews
// ─────────────────────────────────────────────────────────────
import { template as reviewRequest } from './trainer/reviews/review-request'
import { template as reviewReply } from './trainer/reviews/review-reply'
import { template as reviewRemoved } from './trainer/reviews/review-removed'

// ─────────────────────────────────────────────────────────────
// Trainer — enquiries
// ─────────────────────────────────────────────────────────────
import { template as enquiryNotification } from './trainer/enquiries/enquiry-notification'
import { template as proposalSent } from './trainer/enquiries/proposal-sent'

// ─────────────────────────────────────────────────────────────
// Trainer — moderation
// ─────────────────────────────────────────────────────────────
import { template as professionalSuspended } from './trainer/moderation/professional-suspended'
import { template as professionalReinstated } from './trainer/moderation/professional-reinstated'

// ─────────────────────────────────────────────────────────────
// Trainer — lifecycle
// ─────────────────────────────────────────────────────────────
import { template as welcomeSignup } from './trainer/lifecycle/welcome-signup'
import { template as relaunchAnnouncement } from './trainer/lifecycle/relaunch-announcement'
import { template as winbackLapsed } from './trainer/lifecycle/winback-lapsed'

// ─────────────────────────────────────────────────────────────
// Training provider
// ─────────────────────────────────────────────────────────────
import { template as providerDomainConfirm } from './provider/provider-domain-confirm'
import { template as certificatesReady } from './provider/certificates-ready'
import { template as certificatesShipped } from './provider/certificates-shipped'
import { template as providerPortalIsLive } from './provider/portal-is-live'

// ─────────────────────────────────────────────────────────────
// Learner
// ─────────────────────────────────────────────────────────────
import { template as learnerCertificateIssued } from './learner/learner-certificate-issued'

// ─────────────────────────────────────────────────────────────
// Client (trainer's client)
// ─────────────────────────────────────────────────────────────
import { template as clientInvite } from './client/client-invite'

// ─────────────────────────────────────────────────────────────
// Public (contact form, support)
// ─────────────────────────────────────────────────────────────
import { template as contactAutoresponse } from './public/contact-autoresponse'
import { template as supportReply } from './public/support-reply'
import { template as supportOutbound } from './public/support-outbound'

// ─────────────────────────────────────────────────────────────
// Ops (internal)
// ─────────────────────────────────────────────────────────────
import { template as opsAlert } from './ops/ops-alert'


/**
 * Registered app-email templates.
 *
 * Grouped by audience so preview / dashboard lists stay readable.
 * Template keys are stable identifiers — DO NOT rename them; they
 * are persisted in `email_send_log.template_name` and referenced
 * by the onboarding nudge scheduler and churn lifecycle types.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  // ── Trainer · Invite ───────────────────────────────────────
  'professional-invite': professionalInvite,
  'admin-invite': adminInvite,

  // ── Trainer · Onboarding (signup track) ────────────────────
  'onboarding-signup-log-in-1': onboardingSignupLogIn1,
  'onboarding-signup-log-in-2': onboardingSignupLogIn2,
  'onboarding-signup-log-in-3': onboardingSignupLogIn3,
  'onboarding-signup-log-in-4': onboardingSignupLogIn4,
  'onboarding-signup-log-in-5': onboardingSignupLogIn5,
  'onboarding-signup-verify-1': onboardingSignupVerify1,

  // ── Trainer · Onboarding (invited track) ───────────────────
  'onboarding-log-in-1': onboardingLogIn1,
  'onboarding-log-in-2': onboardingLogIn2,
  'onboarding-log-in-3': onboardingLogIn3,
  'onboarding-log-in-4': onboardingLogIn4,
  'onboarding-log-in-5': onboardingLogIn5,
  'onboarding-verify-1': onboardingVerify1,
  'onboarding-verify-2': onboardingVerify2,
  'onboarding-verify-3': onboardingVerify3,
  'onboarding-verify-4': onboardingVerify4,
  'onboarding-website-1': onboardingWebsite1,
  'onboarding-website-2': onboardingWebsite2,
  'onboarding-website-3': onboardingWebsite3,
  'onboarding-complete': onboardingComplete,

  // ── Trainer · Verification ─────────────────────────────────
  'verification-reminder': verificationReminder,
  'verification-decision': verificationDecision,
  'insurance-blocked': insuranceBlocked,
  'insurance-renewal-due': insuranceRenewalDue,

  // ── Trainer · Billing ──────────────────────────────────────
  'purchase-confirmation': purchaseConfirmation,
  'cancellation-confirmation': cancellationConfirmation,
  'renewal-card-needed': renewalCardNeeded,
  'renewal-payment-failed': renewalPaymentFailed,
  'member-cancelled': memberCancelled,
  'chargeback-received': chargebackReceived,
  'chargeback-resolved-won': chargebackResolvedWon,
  'chargeback-resolved-lost': chargebackResolvedLost,
  'dispute-won-resubscribe': disputeWonResubscribe,

  // ── Trainer · Reviews ──────────────────────────────────────
  'review-request': reviewRequest,
  'review-reply': reviewReply,
  'review-removed': reviewRemoved,

  // ── Trainer · Enquiries ────────────────────────────────────
  'enquiry-notification': enquiryNotification,
  'proposal-sent': proposalSent,

  // ── Trainer · Moderation ───────────────────────────────────
  'professional-suspended': professionalSuspended,
  'professional-reinstated': professionalReinstated,

  // ── Trainer · Lifecycle ────────────────────────────────────
  'welcome-signup': welcomeSignup,
  'relaunch-announcement': relaunchAnnouncement,
  'winback-lapsed': winbackLapsed,

  // ── Training provider ──────────────────────────────────────
  'provider-domain-confirm': providerDomainConfirm,
  'certificates-ready': certificatesReady,
  'certificates-shipped': certificatesShipped,
  'provider-portal-is-live': providerPortalIsLive,

  // ── Learner ────────────────────────────────────────────────
  'learner-certificate-issued': learnerCertificateIssued,

  // ── Client (trainer's client) ──────────────────────────────
  'client-invite': clientInvite,

  // ── Public (contact / support) ─────────────────────────────
  'contact-autoresponse': contactAutoresponse,
  'support-reply': supportReply,
  'support-outbound': supportOutbound,

  // ── Ops (internal) ─────────────────────────────────────────
  'ops-alert': opsAlert,
}
