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
}



