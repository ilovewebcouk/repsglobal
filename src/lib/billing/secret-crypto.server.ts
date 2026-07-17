// Server-only AES-256-GCM helpers for short-lived at-rest secrets
// (e.g. the pending_signups password used to mint the auth user after
// Stripe payment succeeds). Never expose this module to the browser.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function loadKey(): Buffer {
  const raw = process.env.PENDING_SIGNUP_ENC_KEY;
  if (!raw) throw new Error("PENDING_SIGNUP_ENC_KEY missing");
  // Accept hex (64 chars = 32 bytes) or base64 (~44 chars). Fall back to
  // hashing arbitrary strings so a shorter secret still yields a 32-byte key.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  try {
    const b = Buffer.from(raw, "base64");
    if (b.length === 32) return b;
  } catch {
    /* fall through */
  }
  // Derive a 32-byte key deterministically from whatever we were given.
  return createHash("sha256").update(raw).digest();
}

/**
 * Encrypt a short secret. Returns `v1:<iv>:<tag>:<ciphertext>` (all base64url).
 * v1 prefix lets us rotate schemes later without ambiguity.
 */
export function encryptSecret(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  if (!payload.startsWith("v1:")) {
    throw new Error("Unsupported ciphertext version");
  }
  const [, ivPart, tagPart, ctPart] = payload.split(":");
  if (!ivPart || !tagPart || !ctPart) {
    throw new Error("Malformed ciphertext");
  }
  const key = loadKey();
  const iv = Buffer.from(ivPart, "base64url");
  const tag = Buffer.from(tagPart, "base64url");
  const ct = Buffer.from(ctPart, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ct), decipher.final()]);
  return dec.toString("utf8");
}
