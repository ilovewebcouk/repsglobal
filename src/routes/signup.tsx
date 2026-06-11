import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Apple,
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
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { redirectAfterAuth } from "@/lib/auth-redirect";
import { createCheckoutSession } from "@/lib/billing/billing.functions";

type SignupSearch = {
  tier?: "verified" | "pro";
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
  verified: {
    monthly: {
      name: "REPS Verified",
      tagline: "Monetise your professional trust.",
      price: "£99",
      unit: "/year",
      meta: "Annual membership · charged today",
      highlights: ["Verified badge", "Credentials displayed", "Reviews enabled", "Enquiries inbox"],
    },
    annual: {
      name: "REPS Verified",
      tagline: "Monetise your professional trust.",
      price: "£8.25",
      unit: "/month",
      meta: "£99 billed yearly · 2 months free",
      highlights: ["Verified badge", "Credentials displayed", "Reviews enabled", "Enquiries inbox"],
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
      highlights: ["Everything in Verified", "Leads CRM & bookings", "Advanced check-ins & nutrition", "AI across the platform"],
    },
    annual: {
      name: "Founding Pro",
      tagline: "Run and scale your whole coaching practice.",
      price: "£49",
      was: "£66",
      unit: "/month",
      meta: "£590 billed yearly · 2 months free",
      founding: true,
      highlights: ["Everything in Verified", "Leads CRM & bookings", "Advanced check-ins & nutrition", "AI across the platform"],
    },
  },
};


export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): SignupSearch => {
    const tier = search.tier as SignupSearch["tier"];
    const requestedPeriod = search.period as SignupSearch["period"];
    const next = search.next as SignupSearch["next"];
    const validTier = ["verified", "pro"].includes(tier as string) ? tier : undefined;
    const period = validTier === "verified"
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

    if (typeof window !== "undefined" && search.tier && search.period) {
      try {
        const result = await createCheckoutSession({
          data: { tier: search.tier, period: search.period },
        });
        if (result?.url) {
          window.location.href = result.url;
          // Block route render while the browser navigates to Stripe
          await new Promise(() => {});
        }
      } catch {
        // Fall through and render the page (which will surface the error path)
      }
    }
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
      { property: "og:url", content: "/signup" },
    ],
    links: [{ rel: "canonical", href: "/signup" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const startCheckout = useServerFn(createCheckoutSession);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const planSummary: PlanSummary | null =
    search.tier && search.period && search.tier in PLAN_SUMMARIES
      ? PLAN_SUMMARIES[search.tier as NonNullable<SignupSearch["tier"]>][
          search.period as NonNullable<SignupSearch["period"]>
        ]
      : null;

  const wantsCheckout =
    search.next === "checkout" && !!search.tier && !!search.period;

  const ctaLabel = wantsCheckout
    ? search.tier === "verified"
      ? "Continue to payment"
      : "Continue to secure checkout"
    : "Create account";

  // After we have a session, route to Stripe Checkout or fall back to dashboard
  const continueAfterAuth = async (userId: string) => {
    if (
      search.next === "checkout" &&
      search.tier &&
      search.tier !== undefined &&
      search.period
    ) {
      try {
        const result = await startCheckout({
          data: { tier: search.tier, period: search.period },
        });
        if (result?.url) {
          window.location.href = result.url;
          return;
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Could not start checkout");
      }
    }
    const to = await redirectAfterAuth(userId);
    navigate({ to, replace: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      // Preserve checkout intent across email-verification redirect
      const redirectPath = wantsCheckout
        ? `/signup?tier=${search.tier}&period=${search.period}&next=checkout`
        : "/dashboard";
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath}`,
          data: {
            full_name: fullName,
            signup_kind: "professional",
            account_type: "pro",
            intended_tier: search.tier ?? null,
            intended_period: search.period ?? null,
          },
        },
      });
      if (signUpError) throw signUpError;
      if (data.session && data.user) {
        await continueAfterAuth(data.user.id);
      } else {
        setInfo("Check your inbox to verify, then we'll bring you back to checkout.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      // Friendly mapping for the most common case
      if (/already\s+registered|already\s+exists|user.*exists/i.test(message)) {
        setError("An account already exists for this email. Sign in instead — we'll bring you back to checkout.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError(result.error.message ?? "Google sign-up failed");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await continueAfterAuth(data.user.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-up failed");
      setGoogleLoading(false);
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
          <Link to="/" className="flex items-center gap-3">
            <RepsWordmark className="h-[25px] text-white" />
            <span className="hidden border-l border-white/15 pl-3 text-[11px] leading-tight text-white/70 sm:block">
              The Register of
              <br />
              Exercise Professionals
            </span>
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

            {/* Social */}
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <SocialButton
                label={googleLoading ? "Connecting…" : "Continue with Google"}
                onClick={handleGoogle}
                disabled={googleLoading}
              >
                <GoogleGlyph />
              </SocialButton>
              <SocialButton label="Continue with Apple" disabled>
                <Apple className="h-4 w-4 text-reps-charcoal" />
              </SocialButton>
            </div>

            {/* Divider */}
            <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-reps-muted-light">
              <span className="h-px flex-1 bg-reps-stone" />
              or sign up with email
              <span className="h-px flex-1 bg-reps-stone" />
            </div>

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

function SocialButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-reps-stone bg-reps-warm-white text-[13px] font-semibold text-reps-charcoal shadow-none transition-colors hover:bg-reps-ivory disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
      {label}
    </button>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
