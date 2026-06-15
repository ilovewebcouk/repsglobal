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
import { template as enquiryNotification } from './enquiry-notification'
import { template as proposalSent } from './proposal-sent'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'client-invite': clientInvite,
  'enquiry-notification': enquiryNotification,
  'proposal-sent': proposalSent,
}
