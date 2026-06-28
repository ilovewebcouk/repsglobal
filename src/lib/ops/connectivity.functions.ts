// Connectivity probes for Stripe, Mail (Mailgun), and Storage (Supabase).
// Each probe is short, server-only, and returns {ok, latency_ms, error?}.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: unknown; userId: string }) {
  const supa = ctx.supabase as { rpc: (n: string, p: object) => Promise<{ data: unknown }> };
  const { data } = await supa.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export interface ProbeResult {
  ok: boolean;
  latency_ms: number;
  error?: string;
  detail?: string;
}

export interface ConnectivitySnapshot {
  stripe: ProbeResult;
  mail: ProbeResult;
  storage: ProbeResult;
  checked_at: string;
}

async function probeStripe(): Promise<ProbeResult> {
  const t0 = Date.now();
  try {
    const { createStripeClient } = await import("@/lib/billing/stripe.server");
    const stripe = createStripeClient("live");
    const b = await stripe.balance.retrieve();
    return { ok: true, latency_ms: Date.now() - t0, detail: b.livemode ? "live" : "test" };
  } catch (e) {
    return { ok: false, latency_ms: Date.now() - t0, error: (e as Error).message };
  }
}

async function probeMail(): Promise<ProbeResult> {
  const t0 = Date.now();
  const lovableKey = process.env.LOVABLE_API_KEY;
  const connectionKey = process.env.MAILGUN_API_KEY;
  if (!lovableKey || !connectionKey) {
    return { ok: false, latency_ms: 0, error: "Mailgun connector keys missing" };
  }
  try {
    const res = await fetch(`https://connector-gateway.lovable.dev/mailgun/repsuk.org`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
      },
    });
    if (!res.ok) {
      return { ok: false, latency_ms: Date.now() - t0, error: `Mailgun ${res.status}` };
    }
    return { ok: true, latency_ms: Date.now() - t0, detail: "repsuk.org" };
  } catch (e) {
    return { ok: false, latency_ms: Date.now() - t0, error: (e as Error).message };
  }
}

async function probeStorage(): Promise<ProbeResult> {
  const t0 = Date.now();
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    if (error) return { ok: false, latency_ms: Date.now() - t0, error: error.message };
    return { ok: true, latency_ms: Date.now() - t0, detail: `${data?.length ?? 0} buckets` };
  } catch (e) {
    return { ok: false, latency_ms: Date.now() - t0, error: (e as Error).message };
  }
}

export const pingConnectivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConnectivitySnapshot> => {
    await assertAdmin(context);
    const [stripe, mail, storage] = await Promise.all([probeStripe(), probeMail(), probeStorage()]);
    return { stripe, mail, storage, checked_at: new Date().toISOString() };
  });
