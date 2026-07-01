// Client-side helper for firing conversion events to Supabase.
// Safe to call regardless of analytics consent — see privacy plan §5.

import { getOrCreateSessionId } from "@/lib/consent/consent";

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

export async function trackConversion(payload: ConversionPayload): Promise<void> {
  if (typeof window === "undefined") return;
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
      properties: payload.properties ?? {},
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
