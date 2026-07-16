import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { RepsLockup } from "@/components/brand/RepsLockup";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { ORG_TIERS, CERTIFICATE_UNIT_PRICE_LABEL } from "@/lib/billing";

export const Route = createFileRoute("/training-providers/apply")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Apply to become a REPs training provider" },
      {
        name: "description",
        content:
          "Join the REPs LMS — independent course review, public recognition, verified learner reviews and REPs-issued certificates. £479/year.",
      },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: ApplyPage,
});

const TIER = ORG_TIERS.training_provider;

function ApplyPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<
    "checking" | "signed_out" | "starting_checkout" | "error"
  >("checking");
  const [error, setError] = useState<string | null>(null);

  // Signed-out signup form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const kickCheckout = async () => {
    setStatus("starting_checkout");
    setError(null);
    try {
      const { startOrgCheckoutRedirect } = await import(
        "@/lib/billing/startOrgCheckout"
      );
      await startOrgCheckoutRedirect();
      // Browser is navigating to Stripe.
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start checkout";
      setError(message);
      setStatus("error");
    }
  };

  // On mount: if signed in, kick checkout immediately. Otherwise show the
  // signup / sign-in choices below.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data?.user) {
        await kickCheckout();
      } else {
        setStatus("signed_out");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const trimmedEmail = email.trim();
      const trimmedName = fullName.trim();
      const trimmedOrg = organisationName.trim();
      if (!trimmedName || !trimmedEmail || !password || !trimmedOrg) {
        throw new Error("Please complete every field to continue.");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            organisation_name: trimmedOrg,
            account_type: "training_provider",
          },
          emailRedirectTo: `${window.location.origin}/training-providers/apply`,
        },
      });
      if (signUpError) throw signUpError;

      // If Supabase returned a live session (email confirmation disabled),
      // kick checkout straight away. Otherwise ask the user to confirm.
      if (data.session) {
        await kickCheckout();
      } else if (data.user) {
        setError(
          "Almost there — check your email to confirm your address, then come back to finish payment.",
        );
        setStatus("error");
      } else {
        throw new Error("Sign-up didn't complete. Please try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <header className="relative z-30">
        <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-6 lg:px-10">
          <Link to="/" className="flex items-center">
            <RepsLockup className="h-[48px]" />
          </Link>
          <p className="text-[14px] text-white/70">
            Already have an account?{" "}
            <Link
              to="/auth"
              search={{ next: "/training-providers/apply" } as never}
              className="font-semibold text-reps-orange hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-10 z-0 h-[520px] w-[520px] rounded-full opacity-[0.08]"
          style={{
            background:
              "radial-gradient(circle, var(--reps-orange) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-20 z-0 h-[620px] w-[620px] rounded-full opacity-[0.06]"
          style={{
            background:
              "radial-gradient(circle, var(--reps-orange) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto grid max-w-[1180px] items-start gap-10 px-6 pb-16 pt-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12 lg:px-10 lg:pt-10">
          {/* ===== LEFT: plan summary ===== */}
          <aside className="flex flex-col gap-6">
            <Card className="overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/60 p-0 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                  You're joining
                </div>
                <h1 className="mt-1 font-display text-[22px] font-bold leading-tight text-white">
                  {TIER.label}
                </h1>
                <p className="mt-1 text-[13px] text-white/60">
                  Independent endorsement for any course you deliver.
                </p>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-[40px] font-bold leading-none text-white">
                    {TIER.priceLabel}
                  </span>
                  <span className="text-[14px] text-white/60">
                    {TIER.intervalLabel}
                  </span>
                </div>
                <div className="mt-1.5 text-[12px] text-white/55">
                  Annual membership · charged today
                </div>

                <Separator className="mt-5 bg-white/10" />

                <ul className="mt-4 grid gap-2">
                  {[
                    "Independent course review by REPs",
                    "Public provider website + endorsement badge",
                    "Verified learner reviews",
                    `Certificates issued at ${CERTIFICATE_UNIT_PRICE_LABEL} per learner`,
                  ].map((h) => (
                    <li
                      key={h}
                      className="flex items-start gap-2 text-[13px] text-white/80"
                    >
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

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

          {/* ===== RIGHT: state-dependent panel ===== */}
          <div className="rounded-[22px] bg-reps-warm-white p-7 text-reps-charcoal shadow-[0_28px_90px_rgba(0,0,0,0.38)] lg:p-8">
            {status === "checking" || status === "starting_checkout" ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-reps-orange" />
                <p className="text-[14px] font-semibold text-reps-charcoal">
                  {status === "checking"
                    ? "Preparing your application…"
                    : "Taking you to Stripe…"}
                </p>
                <p className="max-w-[320px] text-[12.5px] text-reps-muted-light">
                  You'll finish payment on Stripe's secure checkout and come
                  straight back to your REPs dashboard.
                </p>
              </div>
            ) : status === "error" ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                  {error ?? "Something went wrong."}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStatus("checking");
                    void (async () => {
                      const { data } = await supabase.auth.getUser();
                      if (data?.user) await kickCheckout();
                      else setStatus("signed_out");
                    })();
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
                >
                  Try again <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-[24px] font-bold leading-tight text-reps-charcoal">
                  Create your provider account
                </h2>
                <p className="mt-1 text-[13px] text-reps-muted-light">
                  We'll take you straight to secure payment after this step.
                </p>

                <form className="mt-5 space-y-4" onSubmit={handleSignup}>
                  <Field label="Your name">
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

                  <Field label="Organisation name">
                    <input
                      type="text"
                      required
                      value={organisationName}
                      onChange={(e) => setOrganisationName(e.target.value)}
                      placeholder="e.g. Northline Fitness Academy"
                      autoComplete="organization"
                      className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                    />
                  </Field>

                  <Field label="Work email">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@yourprovider.com"
                      autoComplete="email"
                      className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                    />
                  </Field>

                  <Field label="Password">
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      className="w-full bg-transparent text-[14px] text-reps-charcoal placeholder:text-reps-muted-light focus:outline-none"
                    />
                  </Field>

                  {error && (
                    <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating account…
                      </>
                    ) : (
                      <>
                        Continue to secure checkout
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-reps-muted-light">
                    By creating an account, you agree to our{" "}
                    <Link
                      to="/terms"
                      className="text-reps-orange hover:underline"
                    >
                      Terms of Use
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-reps-orange hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>

                <p className="mt-5 text-center text-[12px] text-reps-muted-light">
                  Already have a REPs account?{" "}
                  <Link
                    to="/auth"
                    search={{ next: "/training-providers/apply" } as never}
                    className="font-semibold text-reps-orange hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
