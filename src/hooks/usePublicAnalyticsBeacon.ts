// Public visitor analytics beacon — anonymous only.
//
// Runs ONLY when:
//   - client hydrated
//   - pathname is a public surface (not /admin, /dashboard, /portal, /auth)
//   - no logged-in Supabase session
//   - analytics consent has been granted
//   - DNT/GPC not set
//   - POSTHOG_PUBLIC_KEY is configured
//
// Loads posthog-js dynamically to keep it out of the initial bundle for
// visitors who never consent.

import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  getOrCreateSessionId,
  hasAnalyticsConsent,
  isDntOrGpc,
  isPublicSurface,
} from "@/lib/consent/consent";

type PostHogLike = {
  init: (key: string, opts: Record<string, unknown>) => void;
  capture: (name: string, props?: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
  alias: (alias: string, distinctId?: string) => void;
  reset: () => void;
  get_distinct_id?: () => string;
};

type QueuedEvent = { event: string; props: Record<string, unknown> };
type AnalyticsDebugState = {
  consent: {
    hasCookie: boolean;
    analytics: boolean;
    raw: string | null;
  };
  privacy: {
    dnt: boolean;
    navigatorDoNotTrack: string | null;
    windowDoNotTrack: string | null;
    gpc: boolean;
  };
  surface: {
    pathname: string;
    isPublicSurface: boolean;
  };
  guards: {
    isLoggedIn: boolean | null;
    isAdminPath: boolean;
    isMemberPath: boolean;
    isInternalPath: boolean;
    isPreviewHost: boolean;
    isDevelopment: boolean;
  };
  posthog: {
    configured: boolean;
    exists: boolean;
    loaded: boolean;
    initPromiseExists: boolean;
    initPromiseState: "unknown" | "pending" | "resolved" | "rejected" | "absent";
    apiHost: string | null;
    queueLength: number;
  };
  lastCaptureAttempt: unknown;
  lastCaptureError: unknown;
  lastNetworkAttempt: unknown;
};

declare global {
  interface Window {
    __repsPh?: PostHogLike;
    __repsPhReady?: boolean;
    __repsPhQueue?: QueuedEvent[];
    __repsPhInitPromise?: Promise<PostHogLike | null>;
    __repsPhInitPromiseState?: "pending" | "resolved" | "rejected";
    __repsAnalyticsLastCaptureAttempt?: Record<string, unknown> | null;
    __repsAnalyticsLastCaptureError?: Record<string, unknown> | null;
    __repsAnalyticsDebug?: () => AnalyticsDebugState;
  }
}

const POSTHOG_KEY =
  (import.meta.env.VITE_POSTHOG_PUBLIC_KEY as string | undefined) ?? "";

const DEBUG =
  (import.meta.env.DEV as boolean | undefined) === true ||
  (typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined" &&
    window.localStorage.getItem("reps.analytics.debug") === "1");

function dbg(...args: unknown[]) {
  if (DEBUG) console.debug("[analytics]", ...args);
}

function readConsentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("reps.consent.v1="));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function lastProxyResource(): Record<string, unknown> | null {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") return null;
  const entries = performance
    .getEntriesByType("resource")
    .filter((entry) => entry.name.includes("/api/public/_a/"));
  const last = entries[entries.length - 1] as PerformanceResourceTiming | undefined;
  if (!last) return null;
  return {
    name: last.name,
    initiatorType: last.initiatorType,
    startTime: Math.round(last.startTime),
    duration: Math.round(last.duration),
    transferSize: last.transferSize,
  };
}

function installAnalyticsDebug(memberRef?: { current: boolean }) {
  if (typeof window === "undefined") return;
  window.__repsAnalyticsDebug = () => {
    const raw = readConsentCookie();
    let analytics = false;
    try {
      analytics = raw ? JSON.parse(raw).analytics === true : false;
    } catch {
      analytics = false;
    }
    const pathname = window.location.pathname;
    const nav = navigator as unknown as { doNotTrack?: string; globalPrivacyControl?: boolean };
    const win = window as unknown as { doNotTrack?: string };
    const promiseState = window.__repsPhInitPromise
      ? window.__repsPhInitPromiseState ?? "unknown"
      : "absent";

    return {
      consent: {
        hasCookie: raw !== null,
        analytics,
        raw,
      },
      privacy: {
        dnt: isDntOrGpc(),
        navigatorDoNotTrack: nav.doNotTrack ?? null,
        windowDoNotTrack: win.doNotTrack ?? null,
        gpc: nav.globalPrivacyControl === true,
      },
      surface: {
        pathname,
        isPublicSurface: isPublicSurface(pathname),
      },
      guards: {
        isLoggedIn: memberRef ? memberRef.current : null,
        isAdminPath: pathname.startsWith("/admin"),
        isMemberPath: pathname.startsWith("/dashboard") || pathname.startsWith("/portal"),
        isInternalPath: pathname.startsWith("/api/") || pathname.startsWith("/lovable/"),
        isPreviewHost: window.location.hostname.includes("lovable.app"),
        isDevelopment: import.meta.env.DEV === true,
      },
      posthog: {
        configured: Boolean(POSTHOG_KEY),
        exists: Boolean(window.__repsPh),
        loaded: window.__repsPhReady === true,
        initPromiseExists: Boolean(window.__repsPhInitPromise),
        initPromiseState: promiseState,
        apiHost: `${window.location.origin}/api/public/_a`,
        queueLength: window.__repsPhQueue?.length ?? 0,
      },
      lastCaptureAttempt: window.__repsAnalyticsLastCaptureAttempt ?? null,
      lastCaptureError: window.__repsAnalyticsLastCaptureError ?? null,
      lastNetworkAttempt: lastProxyResource(),
    };
  };
}

function flushQueue(ph: PostHogLike) {
  const q = (typeof window !== "undefined" && window.__repsPhQueue) || [];
  if (!q.length) return;
  dbg("flushing queued events", q.length);
  for (const item of q) {
    try {
      ph.capture(item.event, item.props);
    } catch (err) {
      if (DEBUG) console.warn("[analytics] flush failed", item.event, err);
    }
  }
  window.__repsPhQueue = [];
}

async function loadPostHog(): Promise<PostHogLike | null> {
  if (typeof window === "undefined") return null;
  // Singleton: ready instance.
  if (window.__repsPh && window.__repsPhReady) {
    dbg("posthog init skipped existing instance");
    return window.__repsPh;
  }
  // Singleton: in-flight init.
  if (window.__repsPhInitPromise) {
    dbg("posthog init reused pending promise");
    return window.__repsPhInitPromise;
  }
  if (!POSTHOG_KEY) return null;

  window.__repsPhQueue = window.__repsPhQueue ?? [];
  dbg("posthog init start");

  window.__repsPhInitPromise = (async () => {
    window.__repsPhInitPromiseState = "pending";
    try {
      const mod = await import("posthog-js");
      const posthog = (mod.default ?? mod) as unknown as PostHogLike;
      // Guard against a concurrent init from another code path having
      // already bound __repsPh in the interim.
      if (window.__repsPh && window.__repsPhReady) {
        dbg("posthog init skipped existing instance");
        return window.__repsPh;
      }
      const origin = window.location.origin;
      posthog.init(POSTHOG_KEY, {
        api_host: `${origin}/api/public/_a`,
        ui_host: "https://eu.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false, // we do it manually to attach session_id
        // Built-in pageleave fires on every unload regardless of surface —
        // leaks admin/dashboard events into public analytics. We keep this
        // off and rely on our own $pageview beacon.
        capture_pageleave: false,
        disable_compression: true,
        disable_session_recording: true,
        disable_surveys: true,
        disable_web_experiments: true,
        disable_external_dependency_loading: true,
        // posthog-js >=1.190 renamed `advanced_disable_decide` → `advanced_disable_flags`.
        advanced_disable_flags: true,
        advanced_disable_feature_flags: true,
        advanced_disable_feature_flags_on_first_load: true,
        autocapture: false,
        loaded: (ph: PostHogLike) => {
          window.__repsPh = ph;
          window.__repsPhReady = true;
          dbg("posthog loaded");
          flushQueue(ph);
        },
      });
      window.__repsPh = posthog;
      // Do NOT set __repsPhReady here — wait for the loaded callback so
      // captures made before flush get queued instead of silently dropped.
      window.__repsPhInitPromiseState = "resolved";
      return posthog;
    } catch (err) {
      if (DEBUG) console.warn("[analytics] posthog load failed", err);
      // Clear the promise so a later retry can attempt init again.
      window.__repsPhInitPromise = undefined;
      window.__repsPhInitPromiseState = "rejected";
      return null;
    }
  })();
  return window.__repsPhInitPromise;
}

/**
 * resetPostHog — called when consent is withdrawn. Clears queue,
 * resets distinct id, and drops the singleton so a future consent
 * grant can re-init cleanly.
 */
function resetPostHog() {
  if (typeof window === "undefined") return;
  try {
    window.__repsPh?.reset();
  } catch {
    /* no-op */
  }
  window.__repsPhQueue = [];
  // Intentionally leave __repsPh/__repsPhReady in place — posthog-js
  // does not support un-initialising a loaded instance. The consent
  // gate in capturePublic prevents further sends.
}

/**
 * capturePublic — safe to call from anywhere. No-ops if consent missing.
 * Queues events until PostHog's `loaded` callback fires; flushes on load.
 */
export async function capturePublic(
  event: string,
  props: Record<string, unknown> = {},
): Promise<void> {
  if (typeof window === "undefined") return;
  window.__repsAnalyticsLastCaptureAttempt = {
    event,
    path: window.location.pathname,
    at: new Date().toISOString(),
    consent: hasAnalyticsConsent(),
    publicSurface: isPublicSurface(window.location.pathname),
    dntOrGpc: isDntOrGpc(),
  };
  if (!hasAnalyticsConsent()) {
    dbg("skip (no consent)", event);
    return;
  }
  const finalProps = { ...props, session_id: getOrCreateSessionId() };

  // If SDK is already fully loaded, capture immediately.
  if (window.__repsPhReady && window.__repsPh) {
    try {
      window.__repsPh.capture(event, finalProps);
      dbg("capture sent", event);
    } catch (err) {
      window.__repsAnalyticsLastCaptureError = {
        event,
        message: err instanceof Error ? err.message : String(err),
        at: new Date().toISOString(),
      };
      if (DEBUG) console.warn("[analytics] capture failed", event, err);
    }
    return;
  }

  // Otherwise queue and kick off / wait on init.
  window.__repsPhQueue = window.__repsPhQueue ?? [];
  window.__repsPhQueue.push({ event, props: finalProps });
  dbg("queued", event, "queue size", window.__repsPhQueue.length);
  const ph = await loadPostHog();
  if (!ph) return;
  // If loaded callback already fired between push and here, flush now.
  // (flushQueue is idempotent — a second call finds an empty queue.)
  if (window.__repsPhReady) flushQueue(ph);
}

/**
 * aliasOnSignup — link the anonymous distinct_id to the new user_id.
 */
export async function aliasOnSignup(userId: string): Promise<void> {
  if (!hasAnalyticsConsent()) return;
  const ph = await loadPostHog();
  if (!ph) return;
  try {
    ph.alias(userId);
    ph.identify(userId);
  } catch {
    /* no-op */
  }
}

export function usePublicAnalyticsBeacon() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastPathRef = useRef<string | null>(null);
  const memberRef = useRef<boolean>(false);

  // Track auth state — never capture as public when signed in.
  useEffect(() => {
    installAnalyticsDebug(memberRef);
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) memberRef.current = Boolean(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      memberRef.current = Boolean(session);
      if (event === "SIGNED_OUT") {
        resetPostHog();
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Route-change pageview + consent-withdrawal guard.
  useEffect(() => {
    if (!pathname) return;
    // Consent withdrawn while PostHog is loaded — reset and clear queue.
    if (
      typeof window !== "undefined" &&
      window.__repsPh &&
      !hasAnalyticsConsent()
    ) {
      resetPostHog();
    }
    if (memberRef.current) return;
    if (!isPublicSurface(pathname)) return;
    if (isDntOrGpc()) return;
    if (!hasAnalyticsConsent()) return;
    if (pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;

    void capturePublic("$pageview", {
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    });
  }, [pathname]);
}
