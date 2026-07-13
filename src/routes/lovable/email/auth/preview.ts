import * as React from 'react'
import { render } from 'react-email'
import { createFileRoute } from '@tanstack/react-router'
import { SignupEmail } from '@/lib/email-templates/auth/signup'
import { InviteEmail } from '@/lib/email-templates/auth/invite'
import { MagicLinkEmail } from '@/lib/email-templates/auth/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/auth/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/auth/email-change'
import { ReauthenticationEmail } from '@/lib/email-templates/auth/reauthentication'

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Max-Age': '86400',
} as const

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init?.headers ?? {}) },
  })
}

function getTypeFromSearch(request: Request) {
  const url = new URL(request.url)
  return (
    url.searchParams.get('type') ||
    url.searchParams.get('template') ||
    url.searchParams.get('templateName') ||
    url.searchParams.get('template_name') ||
    url.searchParams.get('name')
  )
}

function getTypeFromBody(body: Record<string, any>) {
  return (
    body.type ||
    body.template ||
    body.templateName ||
    body.template_name ||
    body.name
  )
}

async function renderAuthPreview(type: string) {
  const EmailTemplate = EMAIL_TEMPLATES[type]

  if (!EmailTemplate) {
    return json(
      { error: `Unknown email type: ${type}` },
      { status: 400 }
    )
  }

  const sampleData = SAMPLE_DATA[type] || {}
  const html = await render(React.createElement(EmailTemplate, sampleData))

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
  })
}

// Configuration
const SITE_NAME = "repsglobal"
const ROOT_DOMAIN = "repsuk.org"

// Sample data for preview mode ONLY (not used in actual email sending).
// URLs are baked in at scaffold time from the project's real data.
// The sample email uses a fixed placeholder (RFC 6761 .test TLD) so the Go backend
// can always find-and-replace it with the actual recipient when sending test emails,
// even if the project's domain has changed since the template was scaffolded.
const SAMPLE_PROJECT_URL = "https://repsglobal.lovable.app"
const SAMPLE_EMAIL = "user@example.test"
const SAMPLE_DATA: Record<string, object> = {
  signup: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    recipient: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  magiclink: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  recovery: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  invite: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  email_change: {
    siteName: SITE_NAME,
    oldEmail: SAMPLE_EMAIL,
    email: SAMPLE_EMAIL,
    newEmail: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  reauthentication: {
    token: '123456',
  },
}

export const Route = createFileRoute("/lovable/email/auth/preview")({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, { status: 204, headers: CORS_HEADERS })
      },
      GET: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY

        if (!apiKey) {
          return json(
            { error: 'Server configuration error' },
            { status: 500 }
          )
        }

        const authHeader = request.headers.get('Authorization')
        if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const type = getTypeFromSearch(request)
        if (!type) {
          return json({
            templates: Object.keys(EMAIL_TEMPLATES).map((templateName) => ({ templateName })),
          })
        }

        return renderAuthPreview(type)
      },
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY

        if (!apiKey) {
          return json(
            { error: 'Server configuration error' },
            { status: 500 }
          )
        }

        // Verify the caller is authorized with LOVABLE_API_KEY
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        let body: Record<string, any>
        try {
          const text = await request.text()
          body = text ? JSON.parse(text) : {}
        } catch {
          return json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          )
        }

        const type = getTypeFromBody(body) || getTypeFromSearch(request)
        if (!type) {
          return json({
            templates: Object.keys(EMAIL_TEMPLATES).map((templateName) => ({ templateName })),
          })
        }

        return renderAuthPreview(type)
      },
    },
  },
})
