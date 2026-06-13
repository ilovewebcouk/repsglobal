// Stripe client — server-only. Never import from client code.
//
// Routes all api.stripe.com requests through Lovable's connector gateway,
// which holds the real Stripe secret key. The env vars here
// (STRIPE_SANDBOX_API_KEY / STRIPE_LIVE_API_KEY) are opaque gateway
// connection identifiers, NOT real Stripe secrets — they must never be
// passed directly to `new Stripe(...)` without the gateway proxy.
import Stripe from "stripe";

export type StripeEnv = "sandbox" | "live";

const GATEWAY_STRIPE_BASE = "https://connector-gateway.lovable.dev/stripe";

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
}

export function getConnectionApiKey(env: StripeEnv): string {
  return env === "sandbox"
    ? getEnv("STRIPE_SANDBOX_API_KEY")
    : getEnv("STRIPE_LIVE_API_KEY");
}

/** Resolve which Stripe env this server is operating against.
 *  Prefer live if its key exists (post go-live), otherwise sandbox. */
export function resolveStripeEnv(): StripeEnv {
  if (process.env.STRIPE_LIVE_API_KEY) return "live";
  return "sandbox";
}

let _sandbox: Stripe | undefined;
let _live: Stripe | undefined;

export function createStripeClient(env: StripeEnv): Stripe {
  if (env === "sandbox" && _sandbox) return _sandbox;
  if (env === "live" && _live) return _live;

  const connectionApiKey = getConnectionApiKey(env);
  const lovableApiKey = getEnv("LOVABLE_API_KEY");

  const client = new Stripe(connectionApiKey, {
    apiVersion: "2026-03-25.dahlia",
    httpClient: Stripe.createFetchHttpClient((input, init) => {
      const stripeUrl = input instanceof Request ? input.url : input.toString();
      const gatewayUrl = stripeUrl.replace("https://api.stripe.com", GATEWAY_STRIPE_BASE);
      return fetch(gatewayUrl, {
        ...init,
        headers: {
          ...Object.fromEntries(
            new Headers(
              init?.headers ?? (input instanceof Request ? input.headers : undefined),
            ).entries(),
          ),
          "X-Connection-Api-Key": connectionApiKey,
          "Lovable-API-Key": lovableApiKey,
        },
      });
    }),
  });

  if (env === "sandbox") _sandbox = client;
  else _live = client;
  return client;
}

/** Backwards-compatible accessor used across billing.functions.ts and webhook. */
export function getStripe(): Stripe {
  return createStripeClient(resolveStripeEnv());
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

/** HMAC-SHA256 webhook signature verification (no Stripe SDK dependency). */
export async function verifyWebhook(
  req: Request,
  env: StripeEnv,
): Promise<{ type: string; data: { object: unknown }; id: string }> {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const secret =
    env === "sandbox"
      ? getEnv("PAYMENTS_SANDBOX_WEBHOOK_SECRET")
      : getEnv("PAYMENTS_LIVE_WEBHOOK_SECRET");

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
