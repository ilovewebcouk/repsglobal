// Client-side activity beacon. Persists anon_id (localStorage) and session_id
// (sessionStorage, 30-min idle expiry) and reports each route resolution to the
// pageview endpoint. Uses sendBeacon when available so it never blocks
// navigation. Adds the Supabase bearer for authenticated visitors so the
// server can attribute events to a user.

import { supabase } from "@/integrations/supabase/client";

const ANON_KEY = "reps_anon_id";
const SESSION_KEY = "reps_session_id";
const SESSION_TS_KEY = "reps_session_ts";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function uuid(): string {
  // Browsers ship crypto.randomUUID; tiny fallback for stubborn older ones.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      Number(c) ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
    ).toString(16),
  );
}

function getOrCreateAnonId(): string {
  try {
    let v = localStorage.getItem(ANON_KEY);
    if (!v) {
      v = uuid();
      localStorage.setItem(ANON_KEY, v);
    }
    return v;
  } catch {
    return uuid();
  }
}

function getOrRotateSessionId(): string {
  try {
    const now = Date.now();
    const ts = Number(sessionStorage.getItem(SESSION_TS_KEY) ?? 0);
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id || now - ts > SESSION_TIMEOUT_MS) {
      id = uuid();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    sessionStorage.setItem(SESSION_TS_KEY, String(now));
    return id;
  } catch {
    return uuid();
  }
}

function dnt(): boolean {
  try {
    return (
      navigator.doNotTrack === "1" ||
      (window as unknown as { doNotTrack?: string }).doNotTrack === "1"
    );
  } catch {
    return false;
  }
}

async function getBearer(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function post(url: string, body: unknown): Promise<void> {
  const bearer = await getBearer();
  const payload = JSON.stringify(body);

  // sendBeacon doesn't support custom headers, so we use it only when the
  // visitor is anonymous; authed visitors fall back to fetch with
  // keepalive so we can attach the bearer.
  if (!bearer && "sendBeacon" in navigator) {
    try {
      const blob = new Blob([payload], { type: "application/json" });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    } catch {
      // fall through to fetch
    }
  }

  try {
    await fetch(url, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: payload,
    });
  } catch {
    // never let activity capture fail the app
  }
}

export async function reportPageView(path: string, referrer: string | null) {
  if (typeof window === "undefined") return;
  if (dnt()) return;
  // Skip noisy paths
  if (
    path.startsWith("/api/") ||
    path.startsWith("/lovable/") ||
    path.startsWith("/_") ||
    path.startsWith("/@")
  ) {
    return;
  }
  await post("/api/public/activity/pageview", {
    path,
    referrer: referrer || null,
    anon_id: getOrCreateAnonId(),
    session_id: getOrRotateSessionId(),
    is_admin_view: path.startsWith("/admin"),
  });
}

export async function reportAuthEvent(
  event:
    | "sign_in"
    | "sign_out"
    | "sign_in_failed"
    | "password_reset"
    | "email_confirmed"
    | "user_updated",
  email?: string | null,
) {
  if (typeof window === "undefined") return;
  if (dnt()) return;
  await post("/api/public/activity/auth-event", { event, email: email ?? null });
}
