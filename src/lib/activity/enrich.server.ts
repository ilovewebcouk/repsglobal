// Server-only helpers for activity capture: IP / UA / geo enrichment.
// Worker-safe (no Node-only modules).

import { UAParser } from "ua-parser-js";

export interface EnrichedRequest {
  ipHash: string | null;
  userAgent: string | null;
  countryCode: string | null;
  city: string | null;
  device: string;        // mobile | tablet | desktop | bot
  browser: string | null;
  os: string | null;
}

function pickFirst(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const first = headerValue.split(",")[0]?.trim();
  return first || null;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function enrichRequest(request: Request): Promise<EnrichedRequest> {
  const h = request.headers;
  const ip =
    pickFirst(h.get("cf-connecting-ip")) ??
    pickFirst(h.get("x-forwarded-for")) ??
    pickFirst(h.get("x-real-ip"));
  const ua = h.get("user-agent");
  const country = h.get("cf-ipcountry");
  const city = h.get("cf-ipcity");

  let device = "desktop";
  let browser: string | null = null;
  let os: string | null = null;

  if (ua) {
    try {
      const parser = new UAParser(ua);
      const ures = parser.getResult();
      const t = (ures.device.type ?? "").toLowerCase();
      if (t === "mobile" || t === "tablet") device = t;
      if (/bot|crawler|spider|crawling/i.test(ua)) device = "bot";
      browser = ures.browser.name ?? null;
      os = ures.os.name ?? null;
    } catch {
      // ignore parse errors
    }
  }

  const ipHash = ip ? await sha256Hex(ip) : null;

  return {
    ipHash,
    userAgent: ua,
    countryCode: country && country !== "XX" ? country : null,
    city: city || null,
    device,
    browser,
    os,
  };
}

/** Resolve the bearer user from a request without throwing. */
export async function resolveBearerUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}
