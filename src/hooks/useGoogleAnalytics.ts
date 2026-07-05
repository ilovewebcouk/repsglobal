// Google Analytics 4 — pageview tracking + helpers for consent, user id,
// and custom events. Consent Mode v2 defaults to denied and is upgraded
// only after the user accepts analytics via the cookie banner.
import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

export const GA_MEASUREMENT_ID = "G-JNSVN6QD87";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") window.gtag(...args);
}

/** Upgrade / downgrade Consent Mode v2 after the banner decision. */
export function setGaConsent(analyticsGranted: boolean): void {
  gtag("consent", "update", {
    analytics_storage: analyticsGranted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

/** Bind (or unbind) the signed-in user + a `logged_in` user property. */
export function setGaUser(userId: string | null): void {
  gtag("set", "user_properties", { logged_in: userId ? "true" : "false" });
  gtag("config", GA_MEASUREMENT_ID, {
    user_id: userId ?? undefined,
    send_page_view: false,
  });
}

/** Fire any custom GA4 event (ecommerce, sign_up, generate_lead, etc.). */
export function trackGaEvent(
  event: string,
  params: Record<string, unknown> = {},
): void {
  gtag("event", event, params);
}

/** Read the GA client_id from the _ga cookie so the server can attribute
 * Measurement Protocol events to the same visitor. Falls back to null. */
export function getGaClientId(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("_ga="));
  if (!match) return null;
  // _ga cookie format: GA1.2.<cid1>.<cid2>  →  client_id = "<cid1>.<cid2>"
  const parts = match.split("=")[1]?.split(".");
  if (!parts || parts.length < 4) return null;
  return `${parts[2]}.${parts[3]}`;
}

export function useGoogleAnalytics() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `${pathname}${search ?? ""}`;
    if (url === lastPathRef.current) return;
    lastPathRef.current = url;
    gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, search]);
}
