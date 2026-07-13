import * as React from 'react'
import { render } from '@react-email/components'
import { createFileRoute } from '@tanstack/react-router'
import { TEMPLATES } from '@/lib/email-templates/registry'

// Renders all registered templates with their previewData.
// Gated by LOVABLE_API_KEY — only the Go API calls this.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Max-Age': '86400',
} as const

function getTemplateNameFromSearch(request: Request) {
  const url = new URL(request.url)
  return (
    url.searchParams.get('templateName') ||
    url.searchParams.get('template_name') ||
    url.searchParams.get('name') ||
    url.searchParams.get('template')
  )
}

function getTemplateNameFromBody(body: Record<string, any>) {
  return (
    body.templateName ||
    body.template_name ||
    body.name ||
    body.template ||
    body.templateKey ||
    body.template_key
  )
}

function json(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value))

  return Response.json(data, {
    ...init,
    headers,
  })
}

async function renderTemplateHtml(name: string, data?: Record<string, any>) {
  const entry = TEMPLATES[name]
  if (!entry) {
    return json({ error: `Unknown template: ${name}` }, { status: 404 })
  }

  const templateData = data && Object.keys(data).length > 0 ? data : entry.previewData || {}
  let html: string
  try {
    html = await render(React.createElement(entry.component, templateData))
  } catch (err) {
    console.error('Failed to render transactional email preview', {
      template: name,
      error: err instanceof Error ? err.message : String(err),
    })
    return json(
      { error: 'Failed to render template preview', templateName: name },
      { status: 500 }
    )
  }

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
  })
}

export const Route = createFileRoute("/lovable/email/transactional/preview")({
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
        const token = authHeader?.replace(/^Bearer\s+/i, '')
        if (token !== apiKey) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const name = getTemplateNameFromSearch(request)

        if (!name) {
          return json(
            {
              templates: Object.entries(TEMPLATES).map(([templateName, entry]) => ({
                templateName,
                displayName: entry.displayName || templateName,
              })),
            },
            { status: 200 }
          )
        }

        return renderTemplateHtml(name)
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
        const token = authHeader?.replace(/^Bearer\s+/i, '')
        if (token !== apiKey) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        let body: Record<string, any> = {}
        try {
          const text = await request.text()
          body = text ? JSON.parse(text) : {}
        } catch {
          return json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          )
        }

        const requestedTemplate = getTemplateNameFromBody(body) || getTemplateNameFromSearch(request)
        if (requestedTemplate) {
          const templateData =
            body.templateData && typeof body.templateData === 'object'
              ? body.templateData
              : body.template_data && typeof body.template_data === 'object'
                ? body.template_data
                : undefined
          return renderTemplateHtml(String(requestedTemplate), templateData)
        }

        const templateNames = Object.keys(TEMPLATES)
        const results: Array<{
          templateName: string
          displayName: string
          subject: string
          html: string
          status: 'ready' | 'preview_data_required' | 'render_failed'
          errorMessage?: string
        }> = []

        for (const name of templateNames) {
          const entry = TEMPLATES[name]
          const displayName = entry.displayName || name

          if (!entry.previewData) {
            results.push({
              templateName: name,
              displayName,
              subject: '',
              html: '',
              status: 'preview_data_required',
            })
            continue
          }

          try {
            const html = await render(
              React.createElement(entry.component, entry.previewData)
            )
            const resolvedSubject =
              typeof entry.subject === 'function'
                ? entry.subject(entry.previewData)
                : entry.subject

            results.push({
              templateName: name,
              displayName,
              subject: resolvedSubject,
              html,
              status: 'ready',
            })
          } catch (err) {
            console.error('Failed to render template for preview', {
              template: name,
              error: err,
            })
            results.push({
              templateName: name,
              displayName,
              subject: '',
              html: '',
              status: 'render_failed',
              errorMessage: err instanceof Error ? err.message : String(err),
            })
          }
        }

        return json({ templates: results })
      },
    },
  },
})
