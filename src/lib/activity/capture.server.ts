// Server-only helpers for Admin Activity v1 capture.
//
// All capture endpoints share:
//   - HMAC-hash IPs with ACTIVITY_IP_SALT (never store raw IPs).
//   - Light UA parsing (no external dep — Node `node:crypto` only).
//   - Cloudflare-only country code (`CF-IPCountry` header).
//   - Bearer-token user resolution (never trust client-supplied user_id).
//   - DNT / Sec-GPC respect (caller decides what to skip).
//   - No-op when admin is impersonating a member.

import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface CaptureContext {
  userId: string | null;
  ipHash: string | null;
  countryCode: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  userAgent: string | null;
  dnt: boolean;
  gpc: boolean;
  isImpersonating: boolean;
}

export function hashIp(rawIp: string | null | undefined): string | null {
  if (!rawIp) return null;
  const salt = process.env.ACTIVITY_IP_SALT;
  if (!salt) return null;
  return createHmac("sha256", salt).update(rawIp).digest("hex");
}

export function pickClientIp(req: Request): string | null {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  const fwd = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim();
  return fwd || null;
}

// Tiny UA classifier; avoids adding a runtime dep. Conservative on unknowns.
export function parseUA(ua: string | null): { device: string | null; browser: string | null; os: string | null } {
  if (!ua) return { device: null, browser: null, os: null };
  const u = ua;
  let os: string | null = null;
  if (/Windows NT/.test(u)) os = "Windows";
  else if (/Mac OS X|Macintosh/.test(u)) os = "macOS";
  else if (/iPhone|iPad|iPod/.test(u)) os = "iOS";
  else if (/Android/.test(u)) os = "Android";
  else if (/Linux/.test(u)) os = "Linux";

  let browser: string | null = null;
  if (/Edg\//.test(u)) browser = "Edge";
  else if (/OPR\//.test(u)) browser = "Opera";
  else if (/Chrome\//.test(u) && !/Chromium/.test(u)) browser = "Chrome";
  else if (/Firefox\//.test(u)) browser = "Firefox";
  else if (/Safari\//.test(u) && /Version\//.test(u)) browser = "Safari";

  let device: string | null = "desktop";
  if (/iPad/.test(u) || (/Android/.test(u) && !/Mobile/.test(u))) device = "tablet";
  else if (/Mobi|iPhone|iPod|Android.+Mobile/.test(u)) device = "mobile";
  else if (/Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit/i.test(u)) device = "bot";
  return { device, browser, os };
}

async function resolveUserIdFromBearer(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const url = process.env.SUPABASE_URL;
  const pub = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !pub) return null;
  const supa = createClient<Database>(url, pub, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supa.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

export async function buildCaptureContext(req: Request): Promise<CaptureContext> {
  const userId = await resolveUserIdFromBearer(req);
  const ip = pickClientIp(req);
  const ipHash = hashIp(ip);
  const ua = req.headers.get("user-agent");
  const { device, browser, os } = parseUA(ua);
  const country = req.headers.get("cf-ipcountry") || null;
  const dnt = req.headers.get("dnt") === "1";
  const gpc = req.headers.get("sec-gpc") === "1";

  let isImpersonating = false;
  if (userId) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("admin_impersonation_sessions")
        .select("id")
        .eq("admin_id", userId)
        .is("ended_at", null)
        .limit(1)
        .maybeSingle();
      isImpersonating = Boolean(data?.id);
    } catch {
      isImpersonating = false;
    }
  }

  return {
    userId,
    ipHash,
    countryCode: country,
    device,
    browser,
    os,
    userAgent: ua,
    dnt,
    gpc,
    isImpersonating,
  };
}
