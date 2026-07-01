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

declare global {
  interface Window {
    __repsPh?: PostHogLike;
    __repsPhInitPromise?: Promise<PostHogLike | null>;
  }
}

const POSTHOG_KEY =
  (import.meta.env.VITE_POSTHOG_PUBLIC_KEY as string | undefined) ?? "";

async function loadPostHog(): Promise<PostHogLike | null> {
  if (typeof window === "undefined") return null;
  if (window.__repsPh) return window.__repsPh;
  if (window.__repsPhInitPromise) return window.__repsPhInitPromise;
  if (!POSTHOG_KEY) return null;

  window.__repsPhInitPromise = (async () => {
    try {
      const mod = await import("posthog-js");
      const posthog = (mod.default ?? mod) as unknown as PostHogLike;
      const origin = window.location.origin;
      posthog.init(POSTHOG_KEY, {
        api_host: `${origin}/api/public/_a`,
        ui_host: "https://eu.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false, // we do it manually to attach session_id
        capture_pageleave: true,
        disable_session_recording: true,
        disable_surveys: true,
        disable_web_experiments: true,
        disable_external_dependency_loading: true,
        advanced_disable_decide: true,
        advanced_disable_feature_flags: true,
        advanced_disable_feature_flags_on_first_load: true,
        autocapture: false,
        loaded: (ph: PostHogLike) => {
          window.__repsPh = ph;
        },
      });
      window.__repsPh = posthog;
      return posthog;
    } catch {
      return null;
    }
  })();
  return window.__repsPhInitPromise;
}

/**
 * capturePublic — safe to call from anywhere. No-ops if consent missing or
 * PostHog not loaded. Attaches session_id automatically.
 */
export async function capturePublic(
  event: string,
  props: Record<string, unknown> = {},
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;
  const ph = await loadPostHog();
  if (!ph) return;
  ph.capture(event, {
    ...props,
    session_id: getOrCreateSessionId(),
  });
}

/**
 * aliasOnSignup — link the anonymous distinct_id to the new user_id so we
 * can attribute the signup back to the pre-signup browsing.
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
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) memberRef.current = Boolean(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      memberRef.current = Boolean(session);
      // On sign-out, reset PostHog distinct_id.
      if (event === "SIGNED_OUT" && typeof window !== "undefined" && window.__repsPh) {
        try {
          window.__repsPh.reset();
        } catch {
          /* no-op */
        }
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Route-change pageview.
  useEffect(() => {
    if (!pathname) return;
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
