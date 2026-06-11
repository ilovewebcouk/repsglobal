import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Apple, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";

import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { ShopFrontMock } from "@/components/auth/ShopFrontMock";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { redirectAfterAuth } from "@/lib/auth-redirect";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to REPs" },
      {
        name: "description",
        content:
          "Sign in to REPs to manage your professional profile, clients, bookings and CPD — all in one place.",
      },
      { property: "og:title", content: "Sign in to REPs" },
      {
        property: "og:description",
        content: "Welcome back — sign in to your REPs professional account.",
      },
      { property: "og:url", content: "/auth" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      if (data.user) {
        const to = await redirectAfterAuth(data.user.id);
        navigate({ to, replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
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
        setError(result.error.message ?? "Google sign-in failed");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const to = await redirectAfterAuth(data.user.id);
        navigate({ to, replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-reps-ink text-reps-text">
      {/* Decorative orange glow — chrome, not a hero overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[640px] w-[640px] rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(circle, var(--reps-orange) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full opacity-[0.05]"
        style={{
          background:
            "radial-gradient(circle, var(--reps-orange) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1320px] grid-cols-1 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16 lg:px-10">
        {/* ============ LEFT: FORM COLUMN ============ */}
        <div className="flex min-h-screen flex-col py-8 lg:py-10">
          {/* Wordmark */}
          <Link
            to="/"
            aria-label="REPs — back to home"
            className="inline-flex items-center gap-3 self-start text-white"
          >
            <RepsWordmark className="h-6 w-auto" />
            <span className="hidden border-l border-white/15 pl-3 text-[10px] leading-tight text-white/55 sm:block">
              The Register of
              <br />
              Exercise Professionals
            </span>
          </Link>

          {/* Form, vertically centered in remaining space */}
          <div className="flex flex-1 items-center py-10">
            <div className="w-full max-w-[400px]">
              <h1 className="font-display text-[36px] font-bold leading-[1.05] tracking-[-0.02em] text-white lg:text-[44px]">
                Welcome back to{" "}
                <span className="text-reps-orange">REPs.</span>
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-white/65">
                Sign in to manage your profile, clients and bookings — all in one place.
              </p>

              {/* OAuth row */}
              <div className="mt-7 grid gap-2.5">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-[10px] border border-white/15 bg-white/[0.04] text-[14px] font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleGlyph />
                  )}
                  {googleLoading ? "Connecting…" : "Continue with Google"}
                </button>

                <button
                  type="button"
                  disabled
                  className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-[10px] border border-white/10 bg-white/[0.02] text-[14px] font-semibold text-white/50"
                >
                  <Apple className="h-4 w-4" />
                  Continue with Apple
                  <span className="ml-1 rounded-full border border-white/10 px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-white/45">
                    Soon
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/40">
                <span className="h-px flex-1 bg-white/10" />
                or with email
                <span className="h-px flex-1 bg-white/10" />
              </div>

              {/* Email + password */}
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="text-[12px] font-semibold uppercase tracking-wider text-white/55"
                  >
                    Email
                  </label>
                  <div className="mt-1.5 flex h-11 items-center gap-2 rounded-[12px] border border-white/15 bg-white/[0.04] px-3 focus-within:border-reps-orange/60">
                    <Mail className="h-4 w-4 text-white/40" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full bg-transparent text-[14px] text-white placeholder:text-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-[12px] font-semibold uppercase tracking-wider text-white/55"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[12px] font-semibold text-reps-orange hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="mt-1.5 flex h-11 items-center gap-2 rounded-[12px] border border-white/15 bg-white/[0.04] px-3 focus-within:border-reps-orange/60">
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full bg-transparent text-[14px] text-white placeholder:text-white/30 focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label={showPw ? "Hide password" : "Show password"}
                      onClick={() => setShowPw((v) => !v)}
                      className="text-white/40 hover:text-white/80"
                    >
                      {showPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-[10px] border border-red-400/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-hover disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <p className="mt-6 text-[13px] text-white/55">
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-reps-orange hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Footer line */}
          <p className="mt-6 text-[12px] text-white/35">
            By signing in you agree to our{" "}
            <Link to="/terms" className="hover:text-white/70">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="hover:text-white/70">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* ============ RIGHT: SHOP-FRONT MOCK ============ */}
        <div className="relative hidden items-center justify-center lg:flex">
          <div className="w-full max-w-[640px]">
            <div className="mb-8 max-w-[440px]">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/65">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live on REPs
              </div>
              <h2 className="mt-4 font-display text-[26px] font-bold leading-[1.15] tracking-[-0.01em] text-white">
                This is what you&apos;re signing in to build.
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">
                A real Pro shop-front on REPs. Outcomes-led, verified, and built
                to convert the right clients.
              </p>
            </div>
            <ShopFrontMock />
          </div>
        </div>
      </div>
    </div>
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
