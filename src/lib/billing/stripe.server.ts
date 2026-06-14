// Stripe client — server-only. Never import from client code.
//
// BYOK (bring-your-own-key): talks directly to api.stripe.com using the
// real Stripe secret keys stored as project secrets:
//   sandbox  → STRIPE_SECRET_KEY_TEST  (sk_test_...)
//   live     → STRIPE_SECRET_KEY_LIVE  (sk_live_...)
import Stripe from "stripe";

export type StripeEnv = "sandbox" | "live";

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
}

export function getSecretKey(env: StripeEnv): string {
  return env === "sandbox"
    ? getEnv("STRIPE_SECRET_KEY_TEST")
    : getEnv("STRIPE_SECRET_KEY_LIVE");
}

let _sandbox: Stripe | undefined;
let _live: Stripe | undefined;

export function createStripeClient(env: StripeEnv): Stripe {
  if (env === "sandbox" && _sandbox) return _sandbox;
  if (env === "live" && _live) return _live;

  const client = new Stripe(getSecretKey(env), {
    // Pinned. Do NOT bump without auditing every Stripe API request/response
    // shape in this codebase against the new revision.
    apiVersion: "2026-05-27.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });

  if (env === "sandbox") _sandbox = client;
  else _live = client;
  return client;
}

/** Resolve a human-readable lookup key (e.g. "pro_monthly") to a Stripe Price object. */
export async function resolvePriceByLookupKey(
  stripe: Stripe,
  lookupKey: string,
): Promise<Stripe.Price> {
  const list = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
  if (!list.data.length) throw new Error(`Price not found for lookup key: ${lookupKey}`);
  return list.data[0];
}

export function getStripeErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { message?: string; raw?: { message?: string } };
    return e.raw?.message ?? e.message ?? "Stripe request failed";
  }
  return "Stripe request failed";
}

/**
 * Returns the absolute origin to use for Stripe success_url / cancel_url
 * and any other outbound link in a server function. Prefers the explicit
 * `PUBLIC_SITE_URL` secret, falls back to the inbound request Origin,
 * then to the published REPs domain as a last resort.
 */
export function getCheckoutOrigin(): string {
  const fromEnv = process.env.PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  try {
    // Lazy-required to avoid a hard dependency at module load.
    const { getRequest } = require("@tanstack/react-start/server") as {
      getRequest: () => Request | undefined;
    };
    const req = getRequest();
    const origin = req?.headers.get("origin");
    if (origin) return origin;
  } catch {
    /* outside a request context */
  }
  return "https://repsglobal.lovable.app";
}

/** HMAC-SHA256 webhook signature verification (no Stripe SDK dependency). */
export async function verifyWebhook(
  req: Request,
  env: StripeEnv,
): Promise<{ type: string; data: { object: unknown }; id: string }> {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const secret =
    env === "sandbox"
      ? getEnv("STRIPE_WEBHOOK_SECRET_TEST")
      : getEnv("STRIPE_WEBHOOK_SECRET_LIVE");

  if (!signature || !body) throw new Error("Missing signature or body");

  let timestamp: string | undefined;
  const v1: string[] = [];
  for (const part of signature.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k === "t") timestamp = v;
    if (k === "v1") v1.push(v);
  }
  if (!timestamp || v1.length === 0) throw new Error("Invalid signature format");

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) throw new Error("Webhook timestamp too old");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const expected = Buffer.from(new Uint8Array(signed)).toString("hex");
  if (!v1.includes(expected)) throw new Error("Invalid webhook signature");

  const parsed = JSON.parse(body) as { type: string; data: { object: unknown }; id: string };
  return parsed;
}
