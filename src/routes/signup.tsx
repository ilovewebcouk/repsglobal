import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Apple,
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  Eye,
  Globe,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { PublicFooter } from "@/components/public/PublicFooter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { redirectAfterAuth } from "@/lib/auth-redirect";
import { createCheckoutSession } from "@/lib/billing/billing.functions";
import proSophie from "@/assets/pro-sophie.jpg";
import signupHeroBg from "@/assets/signup-hero-bg.jpg";


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
      meta: "30-day free trial · card required · then £59/month unless cancelled",
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

  beforeLoad: ({ search }) => {
    // REPS is paid-only — a bare /signup with no plan choice goes back to pricing.
    if (!search.tier) {
      throw redirect({ to: "/pricing" });
    }
  },

  head: () => ({
    meta: [
      { title: "Create Your REPS Account — Join the Professional Community" },
      {
        name: "description",
        content:
          "Join REPS and connect with verified fitness professionals and clients worldwide. Create your free account in minutes.",
      },
      { property: "og:title", content: "Create Your REPS Account — REPS" },
      {
        property: "og:description",
        content:
          "Sign up to REPS — the global standard for fitness professionals. Verified credentials, public reviews, trusted worldwide.",
      },
      { property: "og:url", content: "/signup" },
    ],
    links: [{ rel: "canonical", href: "/signup" }],
  }),
  component: SignupPage,
});

const TRUST_BULLETS = [
  {
    icon: BadgeCheck,
    title: "Verified. Trusted. Recognised.",
    sub: "Stand out as a verified fitness professional.",
  },
  {
    icon: Users,
    title: "Grow your business",
    sub: "Tools to attract clients, manage leads and bookings.",
  },
  {
    icon: TrendingUp,
    title: "Develop your career",
    sub: "CPD tracking, qualifications and career progression.",
  },
  {
    icon: Globe,
    title: "Trusted worldwide",
    sub: "The professional standard in fitness across 120+ countries.",
  },
];

const ACCOUNT_TYPES = [
  {
    id: "pro",
    icon: User,
    title: "Fitness Professional",
    sub: "PT, Coach, Instructor",
  },
  {
    id: "biz",
    icon: Building2,
    title: "Business / Facility",
    sub: "Gym, Studio, Club",
  },
];

// Map a pricing-page tier to the right account-type card
const TIER_TO_ACCOUNT_TYPE: Record<string, "pro" | "biz"> = {
  verified: "pro",
  pro: "pro",
  business: "biz",
  studio: "biz",
};

const STATS = [
  { icon: Users, value: "25,000+", label: "Verified Professionals" },
  { icon: ShieldCheck, value: "100%", label: "REPS Verified" },
  { icon: Globe, value: "120+", label: "Countries Worldwide" },
  { icon: Star, value: "Trusted by", label: "Industry Leaders" },
];

const FEATURES = [
  {
    icon: Users,
    title: "Client Management",
    body: "Manage clients, track progress and deliver results that keep them coming back.",
  },
  {
    icon: Calendar,
    title: "Bookings & Scheduling",
    body: "Easy online bookings, automated scheduling and fewer no-shows. More time for what matters.",
  },
  {
    icon: TrendingUp,
    title: "Business Growth Tools",
    body: "Build your brand, attract new clients and grow your business with marketing tools.",
  },
  {
    icon: Award,
    title: "Career Development",
    body: "Access CPD, resources and qualifications to grow your skills and advance your career.",
  },
];

const BRANDS = [
  "Virgin Active",
  "PureGym",
  "David Lloyd",
  "Anytime Fitness",
  "Fitness Australia",
  "YMCA",
];

const FAQS = [
  "Is REPS membership required to use the platform?",
  "How does REPS verify fitness professionals?",
  "Can I upgrade my account later?",
  "What features are included with my account?",
  "Is my data secure?",
  "Can I cancel my account anytime?",
];

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
        setInfo("Check your inbox to verify your email, then sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
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


  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      {/* ============ AUTH HEADER ============ */}
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
              className="font-semibold text-reps-orange hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </header>

      {/* ============ HERO + FORM ============ */}
      <section className="relative overflow-hidden">
        {/* Dashboard laptop background */}
        <img
          src={signupHeroBg}
          alt=""
          aria-hidden
          width={1920}
          height={1080}
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-left opacity-80"
        />
        {/* Ink wash + right-side fade so the form card stays high contrast */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(90deg, var(--reps-ink) 0%, color-mix(in oklab, var(--reps-ink) 55%, transparent) 35%, color-mix(in oklab, var(--reps-ink) 75%, transparent) 60%, var(--reps-ink) 100%)",
          }}
        />
        {/* Decorative orange swooshes */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-20 z-10 h-[420px] w-[420px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, var(--reps-orange) 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-10 z-10 h-[520px] w-[520px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, var(--reps-orange) 0%, transparent 70%)" }}
        />

        <div className="relative z-20 mx-auto grid max-w-[1320px] gap-12 px-6 pb-20 pt-8 lg:grid-cols-2 lg:gap-14 lg:px-10">

          {/* Left: value prop */}
          <div className="flex flex-col">
            <h1 className="font-display text-[44px] font-bold leading-[1.06] tracking-[-0.02em] text-white lg:text-[52px]">
              Your fitness business, clients and professional profile{" "}
              <span className="text-reps-orange">in one place.</span>
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-white/65">
              Join thousands of exercise professionals who use REPS to grow
              their business, manage clients and advance their career with
              confidence.
            </p>

            <ul className="mt-8 grid gap-5">

              {TRUST_BULLETS.map((b) => (
                <li key={b.title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                    <b.icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold text-white">
                      {b.title}
                    </div>
                    <div className="text-[13px] text-white/60">{b.sub}</div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Testimonial */}
            <figure className="mt-10 w-full max-w-[480px] rounded-[18px] border border-reps-border bg-reps-panel/80 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-reps-orange text-reps-orange"
                  />
                ))}
              </div>
              <blockquote className="mt-3 text-[14px] leading-relaxed text-white/80">
                &ldquo;REPS has helped me build trust with clients and grow
                my business. The tools and support are incredible.&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <img
                  src={proSophie}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <div className="text-[13px] font-semibold text-white">
                    Sophie Williams
                  </div>
                  <div className="text-[12px] text-white/60">
                    Pilates Instructor
                  </div>
                </div>
              </figcaption>
            </figure>
          </div>

          {/* Right: signup form */}
          <div className="rounded-[22px] bg-reps-warm-white p-8 text-reps-charcoal shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
            <div className="text-center">
              <h2 className="font-display text-[24px] font-bold leading-tight text-reps-charcoal">
                Create Your REPS Account
              </h2>
              <p className="mt-1.5 text-[13px] text-reps-muted-light">
                Join the professional community and take your career further.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {planSummary && (
                <Card className="overflow-hidden rounded-[18px] border border-reps-orange/40 bg-reps-warm-white p-0 shadow-[0_8px_24px_-12px_rgba(232,93,58,0.35)]">
                  {planSummary.founding && (
                    <Badge className="flex w-full items-center justify-center gap-1.5 rounded-none border-transparent bg-reps-orange px-3 py-1.5 text-[11px] uppercase tracking-wider text-white hover:bg-reps-orange">
                      <Sparkles className="h-3 w-3" />
                      Founding member pricing
                    </Badge>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                          You're signing up for
                        </div>
                        <div className="mt-0.5 font-display text-[18px] font-bold leading-tight text-reps-charcoal">
                          {planSummary.name}
                        </div>
                        <div className="mt-0.5 text-[12px] text-reps-muted-light">
                          {planSummary.tagline}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {planSummary.was && (
                          <div className="text-[11px] text-reps-muted-light line-through">
                            {planSummary.was}
                          </div>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-[24px] font-bold leading-none text-reps-charcoal">
                            {planSummary.price}
                          </span>
                          <span className="text-[12px] text-reps-muted-light">
                            {planSummary.unit}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-reps-muted-light">
                          {planSummary.meta}
                        </div>
                      </div>
                    </div>

                    <Separator className="mt-3 bg-reps-stone" />

                    <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {planSummary.highlights.map((h) => (
                        <li
                          key={h}
                          className="flex items-start gap-1.5 text-[12px] text-reps-charcoal"
                        >
                          <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-reps-muted-light">
                      <ShieldCheck className="h-3.5 w-3.5 text-reps-orange" />
                      Continue to secure checkout after creating your account.
                      {" "}
                      <Link to="/pricing" className="text-reps-orange hover:underline">
                        Change plan
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}



              {/* Full name */}
              <Field label="Full name">
                <User className="h-4 w-4 text-reps-muted-light" />
                <input
                  type="text"
                  required
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
                  placeholder="Enter your email address"
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
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={showPw ? "Hide password" : "Show password"}
                    onClick={() => setShowPw((v) => !v)}
                    className="text-reps-muted-light hover:text-reps-charcoal"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-reps-muted-light">
                  Minimum 8 characters with a mix of letters, numbers &amp; symbols.
                </p>
              </div>

              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  {error}
                </div>
              )}
              {info && (
                <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                  {info}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Creating account…" : "Create Account"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-wider text-reps-muted-light">
                <span className="h-px flex-1 bg-reps-stone" />
                or continue with
                <span className="h-px flex-1 bg-reps-stone" />
              </div>

              {/* Social */}
              <div className="grid grid-cols-2 gap-2">
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
          </div>
        </div>
      </section>

      {/* ============ STATS STRIP ============ */}
      <section className="bg-reps-midnight">
        <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4 lg:px-10">
          {STATS.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <div className="font-display text-[20px] font-bold leading-none text-white">
                  {s.value}
                </div>
                <div className="mt-1 text-[12px] text-white/60">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="bg-reps-ink">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <h2 className="text-center font-display text-[32px] font-bold leading-tight text-white lg:text-[36px]">
            Everything you need in one professional platform
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <article key={f.title} className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-[18px] font-bold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">
                  {f.body}
                </p>
              </article>
            ))}
          </div>

          {/* Brands strip */}
          <div className="mt-16 border-t border-reps-border pt-10">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-white/50">
              Trusted by leading brands and organisations
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {BRANDS.map((b) => (
                <span
                  key={b}
                  className="font-display text-[18px] font-semibold tracking-tight text-white/55"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="bg-reps-midnight">
        <div className="mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
          <h2 className="text-center font-display text-[32px] font-bold leading-tight text-white lg:text-[36px]">
            Frequently asked questions
          </h2>
          <div className="mx-auto mt-10 grid max-w-[960px] gap-3 sm:grid-cols-2">
            {FAQS.map((q) => (
              <button
                key={q}
                type="button"
                className="flex items-center justify-between gap-4 rounded-[12px] border border-reps-border bg-reps-panel px-4 py-3.5 text-left text-[14px] font-medium text-white/85 transition-colors hover:bg-reps-panel-soft"
              >
                <span>{q}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-white/50" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA STRIP ============ */}
      <section className="bg-reps-ink">
        <div className="mx-auto max-w-[1320px] px-6 pb-20 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-5 rounded-[22px] border border-reps-border bg-reps-panel p-7 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                <Briefcase className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-[20px] font-bold text-white">
                  Join thousands of professionals advancing their careers
                </h3>
                <p className="mt-1 text-[13.5px] text-white/60">
                  Create your account today and become part of the world&apos;s
                  leading fitness community.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange px-7 text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover"
            >
              Create Your Account
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
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
