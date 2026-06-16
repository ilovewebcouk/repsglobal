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
}

