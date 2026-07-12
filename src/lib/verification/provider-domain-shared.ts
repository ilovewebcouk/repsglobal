/**
 * Shared helpers for training-provider domain verification (stage 2 of
 * the provider verification flow).
 *
 * IMPORTANT: this file is imported by both server functions and client UI,
 * so it must contain zero server-only imports.
 */

/** Free / consumer email domains we refuse to accept as "provider" domains. */
export const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "live.co.uk",
  "msn.com",
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "aol.com",
  "gmx.com",
  "gmx.co.uk",
  "mail.com",
  "yandex.com",
  "yandex.ru",
  "zoho.com",
  "fastmail.com",
  "tutanota.com",
]);

/**
 * Extract the bare registrable domain from a raw website string.
 * Returns lowercase host, stripped of protocol/`www.`/path/port.
 * Returns null if we can't parse anything useful.
 */
export function domainFromWebsite(website: string | null | undefined): string | null {
  if (!website) return null;
  let raw = website.trim().toLowerCase();
  if (!raw) return null;

  // Add scheme so URL() parses relative-looking inputs like "example.com/foo".
  if (!/^https?:\/\//.test(raw)) raw = `https://${raw}`;

  try {
    const url = new URL(raw);
    let host = url.hostname;
    if (host.startsWith("www.")) host = host.slice(4);
    // Basic sanity: must contain a dot and only allowed chars.
    if (!host.includes(".")) return null;
    if (!/^[a-z0-9.-]+$/.test(host)) return null;
    return host;
  } catch {
    return null;
  }
}

/** Extract the domain portion of an email (lowercase, no `www.`). */
export function domainFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.trim().toLowerCase().split("@");
  if (at.length !== 2 || !at[1]) return null;
  let host = at[1];
  if (host.startsWith("www.")) host = host.slice(4);
  return host;
}

export function isFreeEmailDomain(domain: string | null | undefined): boolean {
  if (!domain) return false;
  return FREE_EMAIL_DOMAINS.has(domain.toLowerCase());
}

/**
 * Loose email shape check — real validation happens on send. We don't need
 * RFC-perfect regex here.
 */
export function isEmailShape(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export type ProviderDomainStatus =
  | "unstarted"
  | "email_sent"
  | "email_confirmed"
  | "pending_admin_review"
  | "approved"
  | "rejected";

export interface ProviderDomainState {
  status: ProviderDomainStatus;
  /** Domain the provider is verifying against, derived from their website. */
  expectedDomain: string | null;
  /** Whatever the user last submitted (may not be confirmed yet). */
  email: string | null;
  emailSentAt: string | null;
  emailConfirmedAt: string | null;
  adminReviewedAt: string | null;
  adminDecisionReason: string | null;
  adminNotes: string | null;
  /**
   * True when `professionals.website_url` isn't set / can't be parsed —
   * user must fix their profile before starting.
   */
  websiteMissing: boolean;
  rawWebsite: string | null;
}
