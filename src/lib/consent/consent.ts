// REPs consent store — first-party cookie `reps.consent.v1`.
// SSR-safe: all reads default to "rejected" when window is missing.

export type ConsentScope = "analytics" | "essential";

export interface ConsentState {
  analytics: boolean;
  essential: true;
  ts: string; // ISO timestamp of the decision
  version: 1;
}

const COOKIE_NAME = "reps.consent.v1";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 12 months

const DEFAULT: ConsentState = {
  analytics: false,
  essential: true,
  ts: "1970-01-01T00:00:00.000Z",
  version: 1,
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function hasDecided(): boolean {
  return readCookie(COOKIE_NAME) !== null;
}

export function getConsent(): ConsentState {
  const raw = readCookie(COOKIE_NAME);
  if (!raw) return { ...DEFAULT };
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      analytics: parsed.analytics === true,
      essential: true,
      ts: parsed.ts ?? DEFAULT.ts,
      version: 1,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function hasAnalyticsConsent(): boolean {
  if (isDntOrGpc()) return false;
  return getConsent().analytics === true;
}

export function isDntOrGpc(): boolean {
  if (typeof navigator === "undefined") return false;
  const dnt =
    (navigator as unknown as { doNotTrack?: string }).doNotTrack === "1" ||
    (window as unknown as { doNotTrack?: string }).doNotTrack === "1";
  const gpc = (navigator as unknown as { globalPrivacyControl?: boolean })
    .globalPrivacyControl === true;
  return Boolean(dnt || gpc);
}

export function setConsent(analytics: boolean, choice: "accepted" | "rejected" | "customised" | "withdrawn"): ConsentState {
  const next: ConsentState = {
    analytics: analytics && !isDntOrGpc(),
    essential: true,
    ts: new Date().toISOString(),
    version: 1,
  };
  writeCookie(COOKIE_NAME, JSON.stringify(next));

  // Fire-and-forget audit log.
  if (typeof fetch !== "undefined") {
    void fetch("/api/public/consent/log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        session_id: getOrCreateSessionId(),
        choice,
        scopes: { analytics: next.analytics, essential: true },
        dnt: isDntOrGpc(),
        gpc: (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true,
      }),
      keepalive: true,
    }).catch(() => {});
  }

  // If withdrawn/rejected, purge PostHog cookies.
  if (!next.analytics && typeof document !== "undefined") {
    document.cookie
      .split("; ")
      .filter((row) => row.startsWith("ph_"))
      .forEach((row) => {
        const name = row.split("=")[0];
        document.cookie = `${name}=; Path=/; Max-Age=0`;
      });
  }
  return next;
}

const SESSION_KEY = "reps.public.session_id";

export function getOrCreateSessionId(): string {
  if (typeof sessionStorage === "undefined") return crypto.randomUUID();
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

/**
 * Whether the current pathname is one where the banner + beacon are allowed.
 * Never runs on admin, dashboard, portal, or auth pages.
 */
export function isPublicSurface(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/dashboard")) return false;
  if (pathname.startsWith("/portal")) return false;
  if (pathname.startsWith("/auth")) return false;
  if (pathname.startsWith("/lovable/")) return false;
  if (pathname.startsWith("/api/")) return false;
  return true;
}
