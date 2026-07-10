import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as clientInvite } from './client-invite'
import { template as contactAutoresponse } from './contact-autoresponse'
import { template as enquiryNotification } from './enquiry-notification'
import { template as proposalSent } from './proposal-sent'
import { template as supportReply } from './support-reply'
import { template as supportOutbound } from './support-outbound'
import { template as professionalInvite } from './professional-invite'
import { template as professionalSuspended } from './professional-suspended'
import { template as professionalReinstated } from './professional-reinstated'
import { template as reviewRequest } from './review-request'
import { template as reviewReply } from './review-reply'
import { template as reviewRemoved } from './review-removed'
import { template as insuranceBlocked } from './insurance-blocked'
import { template as insuranceRenewalDue } from './insurance-renewal-due'
import { template as renewalCardNeeded } from './renewal-card-needed'
import { template as renewalPaymentFailed } from './renewal-payment-failed'
import { template as winbackLapsed } from './winback-lapsed'
import { template as verificationReminder } from './verification-reminder'
import { template as purchaseConfirmation } from './purchase-confirmation'
import { template as cancellationConfirmation } from './cancellation-confirmation'
import { template as welcomeSignup } from './welcome-signup'
import { template as opsAlert } from './ops-alert'
import { template as relaunchAnnouncement } from './relaunch-announcement'
import { template as chargebackReceived } from './chargeback-received'
import { template as chargebackResolvedWon } from './chargeback-resolved-won'
import { template as chargebackResolvedLost } from './chargeback-resolved-lost'
import { template as memberCancelled } from './member-cancelled'
import { template as disputeWonResubscribe } from './dispute-won-resubscribe'
import { template as adminInvite } from './admin-invite'
import { template as providerDomainConfirm } from './provider-domain-confirm'
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
import { template as onboardingSignupLogIn1 } from './onboarding/signup-log-in-1'
import { template as onboardingSignupLogIn2 } from './onboarding/signup-log-in-2'
import { template as onboardingSignupLogIn3 } from './onboarding/signup-log-in-3'
import { template as onboardingSignupLogIn4 } from './onboarding/signup-log-in-4'
import { template as onboardingSignupLogIn5 } from './onboarding/signup-log-in-5'
import { template as onboardingSignupVerify1 } from './onboarding/signup-verify-1'
import { template as certificatesReady } from './certificates-ready'





export const TEMPLATES: Record<string, TemplateEntry> = {
  'client-invite': clientInvite,
  'contact-autoresponse': contactAutoresponse,
  'enquiry-notification': enquiryNotification,
  'proposal-sent': proposalSent,
  'support-reply': supportReply,
  'support-outbound': supportOutbound,
  'professional-invite': professionalInvite,
  'professional-suspended': professionalSuspended,
  'professional-reinstated': professionalReinstated,
  'review-request': reviewRequest,
  'review-reply': reviewReply,
  'review-removed': reviewRemoved,
  'insurance-blocked': insuranceBlocked,
  'insurance-renewal-due': insuranceRenewalDue,
  'renewal-card-needed': renewalCardNeeded,
  'renewal-payment-failed': renewalPaymentFailed,
  'winback-lapsed': winbackLapsed,
  'verification-reminder': verificationReminder,
  'purchase-confirmation': purchaseConfirmation,
  'cancellation-confirmation': cancellationConfirmation,
  'welcome-signup': welcomeSignup,
  'ops-alert': opsAlert,
  'relaunch-announcement': relaunchAnnouncement,
  'chargeback-received': chargebackReceived,
  'chargeback-resolved-won': chargebackResolvedWon,
  'chargeback-resolved-lost': chargebackResolvedLost,
  'member-cancelled': memberCancelled,
  'dispute-won-resubscribe': disputeWonResubscribe,
  'admin-invite': adminInvite,
  'provider-domain-confirm': providerDomainConfirm,
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
  'onboarding-signup-log-in-1': onboardingSignupLogIn1,
  'onboarding-signup-log-in-2': onboardingSignupLogIn2,
  'onboarding-signup-log-in-3': onboardingSignupLogIn3,
  'onboarding-signup-log-in-4': onboardingSignupLogIn4,
  'onboarding-signup-log-in-5': onboardingSignupLogIn5,
  'onboarding-signup-verify-1': onboardingSignupVerify1,
  'certificates-ready': certificatesReady,
}





