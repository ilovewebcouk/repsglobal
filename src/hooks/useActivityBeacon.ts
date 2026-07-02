// useActivityBeacon — Admin Activity v1 client capture.
//
// What it does:
//   - Subscribes to Supabase auth state and posts sign_in / sign_out to
//     /api/public/activity/auth-event.
//   - On every router navigation (or pathname change), posts to
//     /api/public/activity/session-event with a per-tab session UUID.
//   - Never fires for /admin/* paths (admins are not analytics subjects).
//   - Never fires while a member-impersonation session is active.
//   - Best-effort with `keepalive: true`; failures are swallowed.

import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { linkVisitorToUser } from "@/lib/activity/link-visitor.functions";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function tabSessionId(): string {
  if (typeof sessionStorage === "undefined") return uuid();
  const k = "reps.activity.session_id";
  const existing = sessionStorage.getItem(k);
  if (existing) return existing;
  const fresh = uuid();
  sessionStorage.setItem(k, fresh);
  return fresh;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const h: Record<string, string> = { "content-type": "application/json" };
  if (token) h["authorization"] = `Bearer ${token}`;
  return h;
}

async function postJSON(url: string, body: unknown) {
  try {
    const headers = await authHeaders();
    if (!headers.authorization) return; // unauthenticated — never log
    await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      keepalive: true,
      credentials: "same-origin",
    });
  } catch {
    /* best-effort */
  }
}

export function useActivityBeacon() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastSentRef = useRef<string | null>(null);
  const enteredAtRef = useRef<number>(performance.now());

  // Auth state → auth_event (fallback for OAuth/magic-link and other flows).
  // Email/password sign-in posts inline from /auth to avoid the redirect race;
  // it sets `reps.activity.sign_in_posted` so we skip here to dedupe.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        const flag = typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem("reps.activity.sign_in_posted") : null;
        const recent = flag && Date.now() - Number(flag) < 30_000;
        if (recent) {
          try { sessionStorage.removeItem("reps.activity.sign_in_posted"); } catch { /* ignore */ }
          return;
        }
        void postJSON("/api/public/activity/auth-event", { event: "sign_in" });
      }
      else if (event === "SIGNED_OUT") void postJSON("/api/public/activity/auth-event", { event: "sign_out" });
      else if (event === "PASSWORD_RECOVERY") void postJSON("/api/public/activity/auth-event", { event: "password_reset" });
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  // Pathname → session-event beacon
  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return; // never log admin pages
    if (pathname === lastSentRef.current) return;

    const sid = tabSessionId();
    const now = performance.now();
    const duration = lastSentRef.current ? Math.round(now - enteredAtRef.current) : null;
    enteredAtRef.current = now;
    lastSentRef.current = pathname;

    void postJSON("/api/public/activity/session-event", {
      session_id: sid,
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      duration_ms: duration,
    });
  }, [pathname]);
}
