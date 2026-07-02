// Client-side helper for firing conversion events to Supabase.
//
// Guard symmetry with capturePublic (see hooks/usePublicAnalyticsBeacon.ts):
//   - analytics consent required (which internally checks DNT/GPC)
//   - public surface only (never on /admin, /dashboard, /portal, /auth, /api)
//   - member/admin signed-in flag fail-closes
//   - never persist raw free-text (message body, name, email, phone)

import { getOrCreateSessionId, hasAnalyticsConsent, isPublicSurface } from "@/lib/consent/consent";
import { isMemberSignedInForAnalytics } from "@/hooks/usePublicAnalyticsBeacon";

type ConversionKind =
  | "enquiry_started"
  | "enquiry_created"
  | "signup_started"
  | "checkout_started"
  | "signup_complete";

interface ConversionPayload {
  event_kind: ConversionKind;
  enquiry_id?: string;
  pending_signup_id?: string;
  user_id?: string;
  professional_id?: string;
  properties?: Record<string, unknown>;
}

function detectDevice(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/edg\//i.test(ua)) return "edge";
  if (/chrome\//i.test(ua)) return "chrome";
  if (/firefox\//i.test(ua)) return "firefox";
  if (/safari\//i.test(ua)) return "safari";
  return "other";
}

/**
 * Strip anything that could be free-text PII. Only primitive scalars and
 * known-safe fields (slug, plan, interval, position, result_count) are
 * forwarded to the conversion writer.
 */
const ALLOWED_PROPERTY_KEYS = new Set([
  "slug",
  "plan",
  "interval",
  "position",
  "result_count",
  "profession",
  "location",
  "cta",
  "source",
]);
function sanitizeProperties(input?: Record<string, unknown>): Record<string, unknown> {
  if (!input) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!ALLOWED_PROPERTY_KEYS.has(k)) continue;
    if (v === null || v === undefined) continue;
    const t = typeof v;
    if (t === "string") {
      const s = (v as string).slice(0, 120);
      if (s) out[k] = s;
    } else if (t === "number" || t === "boolean") {
      out[k] = v;
    }
  }
  return out;
}

export async function trackConversion(payload: ConversionPayload): Promise<void> {
  if (typeof window === "undefined") return;

  // Guard symmetry: consent → surface → member. Fail closed.
  if (!hasAnalyticsConsent()) return;
  if (!isPublicSurface(window.location.pathname)) return;
  if (isMemberSignedInForAnalytics()) return;

  try {
    const anon =
      typeof window !== "undefined" && window.__repsPh?.get_distinct_id
        ? window.__repsPh.get_distinct_id()
        : undefined;
    const body = {
      session_id: getOrCreateSessionId(),
      event_kind: payload.event_kind,
      anonymous_id: anon,
      posthog_distinct_id: anon,
      enquiry_id: payload.enquiry_id,
      pending_signup_id: payload.pending_signup_id,
      user_id: payload.user_id,
      professional_id: payload.professional_id,
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      device: detectDevice(),
      browser: detectBrowser(),
      properties: sanitizeProperties(payload.properties),
    };
    await fetch("/api/public/activity/public-conversion", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    /* silent */
  }
}

