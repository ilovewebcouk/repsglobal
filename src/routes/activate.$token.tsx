// Public activation page. A trainer clicks the link from the admin-sent
// invite → they set a password → we hand them off to Stripe Checkout in
// mode=setup to save a payment method against their existing Stripe
// customer. The webhook does the rest.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

// ─── Server functions used only by this route ─────────────────
async function getTokenRow(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("billing_setup_tokens")
    .select(
      "id, email, kind, consumed_at, revoked_at, expires_at, professional_id, user_id, stripe_customer_id, target_renewal_at, client_reference",
    )
    .eq("token", token)
    .maybeSingle();
  return data as any;
}

export const inspectActivateToken = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: (d.token ?? "").trim() }))
  .handler(async ({ data }) => {
    const row = await getTokenRow(data.token);
    if (!row) return { ok: false as const, reason: "not_found" as const };
    if (row.kind !== "admin_core_invite") return { ok: false as const, reason: "wrong_kind" as const };
    if (row.revoked_at) return { ok: false as const, reason: "revoked" as const };
    if (row.consumed_at) return { ok: false as const, reason: "consumed" as const };
    if (new Date(row.expires_at as string).getTime() < Date.now()) {
      return { ok: false as const, reason: "expired" as const };
    }
    const anniversary = new Date(row.target_renewal_at as string);
    return {
      ok: true as const,
      email: row.email as string,
      anniversaryLabel: anniversary.toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      }),
    };
  });

export const setPasswordForToken = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; password: string }) => {
    const token = (d.token ?? "").trim();
    const password = d.password ?? "";
    if (!token) throw new Error("Token required.");
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    return { token, password };
  })
  .handler(async ({ data }) => {
    const row = await getTokenRow(data.token);
    if (!row || row.kind !== "admin_core_invite" || row.consumed_at || row.revoked_at) {
      throw new Error("This invite is no longer valid.");
    }
    if (!row.user_id) throw new Error("Invite has no user.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(row.user_id, {
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true, email: row.email as string };
  });

export const createStripeSetupSessionForToken = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: (d.token ?? "").trim() }))
  .handler(async ({ data }) => {
    const row = await getTokenRow(data.token);
    if (!row || row.kind !== "admin_core_invite" || row.consumed_at || row.revoked_at) {
      throw new Error("This invite is no longer valid.");
    }
    if (!row.stripe_customer_id || !row.client_reference) {
      throw new Error("Invite is missing Stripe details.");
    }
    const { createStripeClient, getCheckoutOrigin } = await import("@/lib/billing/stripe.server");
    const stripeEnv: "sandbox" | "live" =
      (process.env.STRIPE_ENV ?? "live") === "sandbox" ? "sandbox" : "live";
    const stripe = createStripeClient(stripeEnv);
    const origin = getCheckoutOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: row.stripe_customer_id,
      payment_method_types: ["card"],
      client_reference_id: row.client_reference,
      success_url: `${origin}/activate/${data.token}?stripe=success`,
      cancel_url: `${origin}/activate/${data.token}?stripe=cancel`,
      metadata: {
        kind: "admin_core_invite",
        token_id: row.id as string,
      },
    });
    return { url: session.url };
  });

// ─── Route ───────────────────────────────────────────────────
export const Route = createFileRoute("/activate/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Activate your REPs Core membership" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ActivatePage,
});

function ActivatePage() {
  const { token } = Route.useParams();
  const inspect = useServerFn(inspectActivateToken);
  const setPassword = useServerFn(setPasswordForToken);
  const startStripe = useServerFn(createStripeSetupSessionForToken);

  const [stage, setStage] = useState<"loading" | "password" | "stripe" | "done" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [anniversary, setAnniversary] = useState<string | null>(null);
  const [password, setPasswordVal] = useState("");
  const [busy, setBusy] = useState(false);

  // Detect Stripe return.
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const stripeParam = params?.get("stripe");

  // Initial inspection.
  useState(() => {
    (async () => {
      try {
        const res = await inspect({ data: { token } });
        if (!res.ok) {
          setError(
            res.reason === "not_found"
              ? "This activation link isn't valid."
              : res.reason === "consumed"
                ? "This membership is already active — try signing in."
                : res.reason === "revoked"
                  ? "This invite was revoked. Contact REPs if this is unexpected."
                  : res.reason === "expired"
                    ? "This link has expired. Contact REPs for a fresh one."
                    : "This link isn't valid.",
          );
          setStage("error");
          return;
        }
        setEmail(res.email);
        setAnniversary(res.anniversaryLabel);
        if (stripeParam === "success") setStage("done");
        else setStage("password");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setStage("error");
      }
    })();
    return undefined;
  });

  async function onSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await setPassword({ data: { token, password } });
      // Sign the user in on the client so they're logged in when they return.
      await supabase.auth.signInWithPassword({ email: res.email, password });
      setStage("stripe");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't set password.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoToStripe() {
    setBusy(true);
    setError(null);
    try {
      const res = await startStripe({ data: { token } });
      if (res.url) window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start Stripe.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      <div className="mx-auto max-w-md px-6 py-16">
        <p className="font-black tracking-widest text-white/60 mb-8">REPS</p>
        {stage === "loading" && <p className="text-white/70">Loading…</p>}
        {stage === "error" && (
          <>
            <h1 className="text-2xl font-semibold mb-3">We couldn't open this link</h1>
            <p className="text-white/70 text-[15px]">{error}</p>
          </>
        )}
        {stage === "password" && (
          <>
            <h1 className="text-2xl font-semibold mb-2">Activate your Core membership</h1>
            <p className="text-white/70 text-[15px] mb-6">
              Set a password for <strong className="text-white">{email}</strong>. Next step is adding a card
              — your first charge (£34) lands on <strong className="text-white">{anniversary}</strong>.
            </p>
            <form onSubmit={onSetPassword} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-white/80">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPasswordVal(e.target.value)}
                  className="mt-1 bg-white/5 border-white/15 text-white"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" disabled={busy} className="w-full bg-reps-orange hover:bg-reps-orange/90 text-white">
                {busy ? "Setting password…" : "Continue"}
              </Button>
            </form>
          </>
        )}
        {stage === "stripe" && (
          <>
            <h1 className="text-2xl font-semibold mb-2">Add your card</h1>
            <p className="text-white/70 text-[15px] mb-6">
              Stripe will save your card securely. No charge today —
              your renewal (£34) is on <strong className="text-white">{anniversary}</strong>.
            </p>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <Button onClick={onGoToStripe} disabled={busy} className="w-full bg-reps-orange hover:bg-reps-orange/90 text-white">
              {busy ? "Opening Stripe…" : "Continue to Stripe"}
            </Button>
          </>
        )}
        {stage === "done" && (
          <>
            <h1 className="text-2xl font-semibold mb-3">You're all set</h1>
            <p className="text-white/70 text-[15px] mb-6">
              Your card's on file and your Core membership is active. Your profile will appear on the
              register within a couple of minutes. First charge (£34) is scheduled for{" "}
              <strong className="text-white">{anniversary}</strong>.
            </p>
            <a href="/dashboard" className="inline-block px-5 py-3 rounded-[10px] bg-reps-orange text-white font-semibold">
              Go to my dashboard
            </a>
          </>
        )}
      </div>
    </main>
  );
}
