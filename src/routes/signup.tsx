import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RepsLockup } from "@/components/brand/RepsLockup";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";


type SignupSearch = {
  // URL slug for the Core tier is "core" (legacy "verified" still accepted
  // and normalized below for back-compat with old emails/bookmarks).
  // Training-provider slug is "training-provider" (kebab) in the URL.
  tier?: "core" | "pro" | "training_provider";
  period?: "monthly" | "annual";
  next?: "checkout";
};

type PlanSummary = {
  name: string;
  tagline: string;
  price: string;
  was?: string;
  unit: string;
  meta: string;
  founding?: boolean;
  highlights: string[];
};

const PLAN_SUMMARIES: Record<
  NonNullable<SignupSearch["tier"]>,
  Record<NonNullable<SignupSearch["period"]>, PlanSummary>
> = {
  core: {
    monthly: {
      name: "REPS Core",
      tagline: "Monetise your professional trust.",
      price: "£34",
      was: "£99",
      unit: "/year",
      meta: "Annual membership · charged today",
      highlights: [
        "Earn the REPS Core badge",
        "Personalised website",
        "Credentials & reviews displayed",
        "Enquiries inbox",
      ],
    },
    annual: {
      name: "REPS Core",
      tagline: "Monetise your professional trust.",
      price: "£34",
      was: "£99",
      unit: "/year",
      meta: "£34 billed yearly",
      highlights: [
        "Earn the REPS Core badge",
        "Personalised website",
        "Credentials & reviews displayed",
        "Enquiries inbox",
      ],
    },
  },
  pro: {
    monthly: {
      name: "Founding Pro",
      tagline: "Run and scale your whole coaching practice.",
      price: "£59",
      was: "£79",
      unit: "/month",
      meta: "30-day free trial · then £59/month unless cancelled",
      founding: true,
      highlights: [
        "Everything in Core",
        "Personalised website",
        "Leads CRM & bookings",
        "AI across the platform",
      ],
    },
    annual: {
      name: "Founding Pro",
      tagline: "Run and scale your whole coaching practice.",
      price: "£49",
      was: "£66",
      unit: "/month",
      meta: "£590 billed yearly",
      founding: true,
      highlights: [
        "Everything in Core",
        "Personalised website",
        "Leads CRM & bookings",
        "AI across the platform",
      ],
    },
  },
  training_provider: {
    annual: {
      name: "REPs Training Provider Membership",
      tagline: "Independent endorsement for the courses you deliver.",
      price: "£479",
      unit: "/year",
      meta: "£479 billed yearly",
      highlights: [
        "Independent course review by REPs",
        "Public provider website + endorsement badge",
        "Verified learner reviews",
        "Certificates issued at £15 per learner",
      ],
    },
    monthly: {
      name: "REPs Training Provider Membership",
      tagline: "Independent endorsement for the courses you deliver.",
      price: "£479",
      unit: "/year",
      meta: "£479 billed yearly",
      highlights: [
        "Independent course review by REPs",
        "Public provider website + endorsement badge",
        "Verified learner reviews",
        "Certificates issued at £15 per learner",
      ],
    },
  },
};


export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): SignupSearch => {
    // Back-compat: accept legacy `?tier=verified` -> `core`, and accept
    // both `training-provider` (URL kebab slug) and `training_provider`.
    let rawTier = search.tier as string | undefined;
    if (rawTier === "verified") rawTier = "core";
    if (rawTier === "training-provider") rawTier = "training_provider";
    const requestedPeriod = search.period as SignupSearch["period"];
    const next = search.next as SignupSearch["next"];
    const validTier = ["core", "pro", "training_provider"].includes(rawTier as string)
      ? (rawTier as SignupSearch["tier"])
      : undefined;
    const period =
      validTier === "core" || validTier === "training_provider"
        ? "annual"
        : validTier === "pro" && (requestedPeriod === "monthly" || requestedPeriod === "annual")
          ? requestedPeriod
          : validTier === "pro"
            ? "monthly"
            : undefined;
    return {
      tier: validTier,
      period: requestedPeriod === period ? requestedPeriod : period,
      next: next === "checkout" ? "checkout" : undefined,
    };
  },

  beforeLoad: async ({ search }) => {
    // REPS is paid-only — a bare /signup with no plan choice goes back to pricing.
    if (!search.tier) {
      throw redirect({ to: "/pricing" });
    }

    // Pro is waitlist-only pre-launch — bounce ?tier=pro signups to the contact/waitlist page.
    if (search.tier === "pro") {
      throw redirect({ to: "/contact" });
    }

    // Orphaned-account recovery: if the user is already signed in we skip the
    // form entirely. If they already paid, send them to the dashboard. If not,
    // kick checkout immediately — the only reason they're here is to pay.
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("tier,status")
      .eq("user_id", user.id)
      .maybeSingle();

    const LIVE = ["active", "trialing", "past_due", "unpaid"];
    const PAID = ["verified", "pro", "studio"];
    const isPaid =
      !!sub &&
      PAID.includes(sub.tier as string) &&
      LIVE.includes(sub.status as string);

    if (isPaid) {
      throw redirect({ to: "/dashboard" });
    }
    // Note: checkout is kicked from the component (continueAfterAuth) after
    // sign-up returns a session. Never call createCheckoutSession from a
    // loader — public route loaders have no auth context during SSR /
    // prerender, and the email-link round-trip races session restore.
  },

  head: () => ({
    meta: [
      { title: "Create Your REPS Account — Continue to Secure Checkout" },
      {
        name: "description",
        content:
          "Create your REPS account and continue to secure checkout. Verified credentials, public reviews, trusted worldwide.",
      },
      { property: "og:title", content: "Create Your REPS Account — REPS" },
      {
        property: "og:description",
        content:
          "Sign up to REPS — the global standard for fitness professionals.",
      },
      { property: "og:url", content: "https://repsuk.org/signup" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://repsuk.org/signup" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Public analytics — signup_start once per mount.
  useEffect(() => {
    void import("@/lib/analytics/track").then(({ track }) =>
      track.signupStart({ plan: search.tier ?? null, path: "/signup" }),
    );
    void import("@/lib/analytics/public-conversion").then(({ trackConversion }) => {
      void trackConversion({
        event_kind: "signup_started",
        properties: { plan: search.tier ?? undefined },
      });
    });
  }, [search.tier]);



  const planSummary: PlanSummary | null =
    search.tier && search.period && search.tier in PLAN_SUMMARIES
      ? PLAN_SUMMARIES[search.tier as NonNullable<SignupSearch["tier"]>][
          search.period as NonNullable<SignupSearch["period"]>
        ]
      : null;

  const wantsCheckout =
    search.next === "checkout" && !!search.tier && !!search.period;

  const ctaLabel = wantsCheckout
    ? search.tier === "core" || search.tier === "training_provider"
      ? "Continue to payment"
      : "Continue to secure checkout"
    : "Create account";

  // Deferred signup uses handleSubmit → startDeferredCheckout → Stripe.
  // No post-auth redirect path is needed here; the user is signed in by
  // the magic link returned from /checkout/return.



  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (!search.tier || !search.period) {
        navigate({ to: "/pricing", replace: true });
        return;
      }
      // Deferred signup (Option 1, June 2026): no auth.users row is created
      // here. We stash the credentials in `pending_signups` and only mint the
      // real account after Stripe payment succeeds — see
      // src/lib/billing/deferred-signup.functions.ts and the
      // checkout.session.completed branch of the Stripe webhook.
      const environment =
        ((import.meta as unknown as { env?: { VITE_STRIPE_ENV?: string } }).env
          ?.VITE_STRIPE_ENV as "sandbox" | "live" | undefined) ?? "live";
      const { startDeferredCheckout } = await import(
        "@/lib/billing/deferred-signup.functions"
      );
      const result = await startDeferredCheckout({
        data: {
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          // Internal billing enum still uses "verified" for the Core tier.
          tier: search.tier === "core" ? "verified" : (search.tier as "pro" | "training_provider"),
          period: search.period,
          environment,
        },
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      // Go straight to Stripe Hosted Checkout — the account doesn't exist yet.
      const interval: "monthly" | "yearly" | null =
        search.period === "yearly" ? "yearly" : search.period === "monthly" ? "monthly" : null;
      void import("@/lib/analytics/track").then(({ track }) =>
        track.checkoutStarted({ plan: search.tier ?? "core", interval }),
      );
      // Conversion row — write BEFORE navigating away so keepalive can flush.
      const pendingSignupId =
        "pending_signup_id" in result
          ? (result as { pending_signup_id?: string }).pending_signup_id
          : undefined;
      void import("@/lib/analytics/public-conversion").then(({ trackConversion }) => {
        void trackConversion({
          event_kind: "checkout_started",
          pending_signup_id: pendingSignupId && pendingSignupId.length === 36 ? pendingSignupId : undefined,
          properties: { plan: search.tier ?? "core", interval: interval ?? undefined },
        });
      });
      window.location.assign(result.url);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };


  // Build a sign-in URL that preserves checkout intent
  const signInHref = wantsCheckout
    ? `/auth?tier=${search.tier}&period=${search.period}&next=checkout`
    : "/auth";

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      {/* ============ HEADER ============ */}
      <header className="relative z-30">
        <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-6 lg:px-10">
          <Link to="/" className="flex items-center">
            <RepsLockup className="h-[48px]" />
          </Link>
          <p className="text-[14px] text-white/70">
            Already have an account?{" "}
            <Link
              to="/auth"
              search={wantsCheckout ? { tier: search.tier, period: search.period, next: "checkout" } as never : undefined}
              className="font-semibold text-reps-orange hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </header>

      {/* ============ CONVERSION SCREEN ============ */}
      <section className="relative overflow-hidden">
        {/* Decorative orange swooshes only — no dashboard background */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-10 z-0 h-[520px] w-[520px] rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, var(--reps-orange) 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-20 z-0 h-[620px] w-[620px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, var(--reps-orange) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 mx-auto grid max-w-[1180px] items-start gap-10 px-6 pb-16 pt-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12 lg:px-10 lg:pt-10">

          {/* ===== LEFT: plan reassurance ===== */}
          <aside className="flex flex-col gap-6">
            {planSummary && (
              <Card className="overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/60 p-0 backdrop-blur-sm">
                {planSummary.founding && (
                  <Badge className="flex w-full items-center justify-center gap-1.5 rounded-none border-transparent bg-reps-orange px-3 py-1.5 text-[11px] uppercase tracking-wider text-white hover:bg-reps-orange">
                    <Sparkles className="h-3 w-3" />
                    Founding member pricing
                  </Badge>
                )}
                <CardContent className="p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                    You're signing up for
                  </div>
                  <h1 className="mt-1 font-display text-[22px] font-bold leading-tight text-white">
                    {planSummary.name}
                  </h1>
                  <p className="mt-1 text-[13px] text-white/60">
                    {planSummary.tagline}
                  </p>

                  <div className="mt-5 flex items-baseline gap-2">
                    {planSummary.was && (
                      <span className="text-[14px] text-white/40 line-through">
                        {planSummary.was}
                      </span>
                    )}
                    <span className="font-display text-[40px] font-bold leading-none text-white">
                      {planSummary.price}
                    </span>
                    <span className="text-[14px] text-white/60">
                      {planSummary.unit}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[12px] text-white/55">
                    {planSummary.meta}
                  </div>

                  <Separator className="mt-5 bg-white/10" />

                  <ul className="mt-4 grid gap-2">
                    {planSummary.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex items-start gap-2 text-[13px] text-white/80"
                      >
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 text-[12px] text-white/55">
                    Not the right plan?{" "}
                    <Link to="/pricing" className="text-reps-orange hover:underline">
                      Change plan
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trust micro-rows */}
            <ul className="grid gap-2.5 text-[12.5px] text-white/55">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-white/45" />
                Secured by Stripe · PCI-DSS Level 1
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-white/45" />
                Cancel anytime from your dashboard
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-white/45" />
                We never see your card details
              </li>
            </ul>
          </aside>

          {/* ===== RIGHT: form ===== */}
          <div className="rounded-[22px] bg-reps-warm-white p-7 text-reps-charcoal shadow-[0_28px_90px_rgba(0,0,0,0.38)] lg:p-8">
            <h2 className="font-display text-[24px] font-bold leading-tight text-reps-charcoal">
              Create your account
            </h2>
            <p className="mt-1 text-[13px] text-reps-muted-light">
              Takes about 30 seconds.
            </p>


            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {/* Full name */}
              <Field label="Full name">
                <User className="h-4 w-4 text-reps-muted-light" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                />
              </Field>

              {/* Email */}
              <Field label="Email address">
                <Mail className="h-4 w-4 text-reps-muted-light" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                />
              </Field>

              {/* Password */}
              <div>
                <label className="text-[13px] font-semibold text-reps-charcoal">
                  Password
                </label>
                <div className="mt-1.5 flex h-11 items-center gap-2 rounded-[12px] border border-reps-stone bg-reps-warm-white px-3">
                  <Lock className="h-4 w-4 text-reps-muted-light" />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    aria-pressed={showPw}
                    onClick={() => setShowPw((v) => !v)}
                    className="text-reps-muted-light hover:text-reps-charcoal"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Reserved error/info line — prevents layout shift */}
              <div className="min-h-[36px]">
                {error && (
                  <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                    {error}{" "}
                    {/already exists/i.test(error) && (
                      <Link to="/auth" className="font-semibold underline">
                        Sign in
                      </Link>
                    )}
                  </div>
                )}
                {info && !error && (
                  <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                    {info}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Taking you to Stripe…
                  </>
                ) : (
                  <>
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {wantsCheckout && (
                <p className="text-center text-[12px] text-reps-muted-light">
                  Next: secure payment via Stripe. You'll be back here in under a minute.
                </p>
              )}

              <p className="text-center text-[11px] text-reps-muted-light">
                By creating an account, you agree to our{" "}
                <Link to="/terms" className="text-reps-orange hover:underline">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-reps-orange hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>

            {/* Mobile-only: sign-in echo */}
            <p className="mt-5 text-center text-[12px] text-reps-muted-light sm:hidden">
              Already a member?{" "}
              <Link to={signInHref} className="font-semibold text-reps-orange hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bits                                                               */
/* ------------------------------------------------------------------ */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[13px] font-semibold text-reps-charcoal">
        {label}
      </label>
      <div className="mt-1.5 flex h-11 items-center gap-2 rounded-[12px] border border-reps-stone bg-reps-warm-white px-3">
        {children}
      </div>
    </div>
  );
}


