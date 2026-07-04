// Server-only preview token helpers (HMAC via node:crypto).
// Kept in a .server.ts file so the client bundle never pulls in node:crypto.

import { createHmac, timingSafeEqual } from "node:crypto";

const PREVIEW_TTL_SECONDS = 60 * 60 * 4; // 4 hours

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 2 ? "==" : s.length % 4 === 3 ? "=" : "";
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function getPreviewSecret(): string {
  const s = process.env.WEBSITE_PREVIEW_SECRET;
  if (!s) throw new Error("WEBSITE_PREVIEW_SECRET is not configured");
  return s;
}

export const PREVIEW_TOKEN_TTL_SECONDS = PREVIEW_TTL_SECONDS;

export function signPreviewToken(slug: string, ttlSeconds = PREVIEW_TTL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${slug}:${exp}`;
  const mac = createHmac("sha256", getPreviewSecret()).update(payload).digest();
  return `${base64url(Buffer.from(payload, "utf8"))}.${base64url(mac)}`;
}

export function verifyPreviewToken(token: string, expectedSlug: string): boolean {
  try {
    const [payloadPart, macPart] = token.split(".");
    if (!payloadPart || !macPart) return false;
    const payload = b64urlDecode(payloadPart).toString("utf8");
    const [slug, expStr] = payload.split(":");
    if (!slug || !expStr) return false;
    if (slug !== expectedSlug) return false;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    const expectedMac = createHmac("sha256", getPreviewSecret()).update(payload).digest();
    const gotMac = b64urlDecode(macPart);
    if (gotMac.length !== expectedMac.length) return false;
    return timingSafeEqual(gotMac, expectedMac);
  } catch {
    return false;
  }
}
