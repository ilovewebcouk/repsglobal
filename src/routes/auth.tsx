import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Apple, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { redirectAfterAuth } from "@/lib/auth-redirect";

export const Route = createFileRoute("/auth")({
  ssr: false,
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "That email and password don't match. Double-check and try again — or reset your password.";
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email first — check your inbox for the confirmation link.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (m.includes("user not found")) {
    return "No account found for that email. Want to sign up instead?";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Connection issue — check your internet and try again.";
  }
  return message;
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (value: string): string | null => {
    const v = value.trim();
    if (!v) return "Please enter your email.";
    if (!EMAIL_RE.test(v)) return "That doesn't look like a valid email address.";
    return null;
  };

  const validatePassword = (value: string): string | null => {
    if (!value) return "Please enter your password.";
    if (value.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    setEmailTouched(true);
    setPasswordTouched(true);
    if (eErr || pErr) {
      // Focus the first invalid field for assistive tech.
      const id = eErr ? "email" : "password";
      requestAnimationFrame(() => document.getElementById(id)?.focus());
      return;
    }

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
      const raw = err instanceof Error ? err.message : "Sign in failed";
      setError(friendlyAuthError(raw));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    const setBusy = provider === "google" ? setGoogleLoading : setAppleLoading;
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError(
          friendlyAuthError(
            result.error.message ?? `Couldn't sign in with ${provider === "google" ? "Google" : "Apple"}. Please try again.`,
          ),
        );
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const to = await redirectAfterAuth(data.user.id);
        navigate({ to, replace: true });
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : `${provider} sign-in failed`;
      setError(friendlyAuthError(raw));
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-reps-ink text-reps-text">
      {/* Decorative orange glow — brand chrome */}
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

      {/* Centred card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">
        <div className="w-full max-w-[420px]">
          <div className="mb-6 flex justify-center">
            <Link
              to="/"
              aria-label="REPs — back to home"
              className="inline-flex items-center text-white"
            >
              <RepsWordmark className="h-7 w-auto" />
            </Link>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)] backdrop-blur-sm">

            <div className="text-center">
              <h1 className="font-display text-[24px] font-bold leading-tight text-white lg:text-[28px]">
                Login to your account
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                Welcome back — sign in to continue.
              </p>
            </div>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-white/75">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailTouched) setEmailError(validateEmail(e.target.value));
                    if (error) setError(null);
                  }}
                  onBlur={() => {
                    setEmailTouched(true);
                    setEmailError(validateEmail(email));
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? "email-error" : undefined}
                  className={`h-11 rounded-[12px] bg-white/[0.04] text-white placeholder:text-white/30 ${
                    emailError
                      ? "border-red-400/60 focus-visible:ring-red-400/40"
                      : "border-white/15"
                  }`}
                />
                {emailError && (
                  <p id="email-error" className="text-[12px] text-red-300">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white/75">
                    Password
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-[12px] font-semibold text-reps-orange hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordTouched) setPasswordError(validatePassword(e.target.value));
                      if (error) setError(null);
                    }}
                    onBlur={() => {
                      setPasswordTouched(true);
                      setPasswordError(validatePassword(password));
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={passwordError ? true : undefined}
                    aria-describedby={passwordError ? "password-error" : undefined}
                    className={`h-11 rounded-[12px] bg-white/[0.04] pr-11 text-white placeholder:text-white/30 ${
                      passwordError
                        ? "border-red-400/60 focus-visible:ring-red-400/40"
                        : "border-white/15"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-8 items-center justify-center rounded-[8px] text-white/55 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p id="password-error" className="text-[12px] text-red-300">
                    {passwordError}
                  </p>
                )}
              </div>

              {error && (
                <Alert
                  role="alert"
                  variant="destructive"
                  className="border-red-400/30 bg-red-500/10 text-red-200"
                >
                  <AlertDescription>
                    {error}{" "}
                    {/that email and password/i.test(error) && (
                      <Link
                        to="/forgot-password"
                        className="font-semibold text-red-100 underline underline-offset-2 hover:text-white"
                      >
                        Reset password
                      </Link>
                    )}
                    {/no account found/i.test(error) && (
                      <Link
                        to="/signup"
                        className="font-semibold text-red-100 underline underline-offset-2 hover:text-white"
                      >
                        Create account
                      </Link>
                    )}
                  </AlertDescription>
                </Alert>
              )}


              <Button
                type="submit"
                disabled={loading}
                className="h-11 rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/40">
              <span className="h-px flex-1 bg-white/10" />
              Or continue with
              <span className="h-px flex-1 bg-white/10" />
            </div>

            {/* OAuth row */}
            <div className="flex flex-col gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuth("google")}
                disabled={googleLoading}
                className="h-11 rounded-[10px] border-white/15 bg-white/[0.04] text-[14px] font-semibold text-white hover:bg-white/[0.08] hover:text-white"
              >
                {googleLoading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <GoogleGlyph />
                )}
                {googleLoading ? "Connecting…" : "Continue with Google"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuth("apple")}
                disabled={appleLoading}
                className="h-11 rounded-[10px] border-white/15 bg-white/[0.04] text-[14px] font-semibold text-white hover:bg-white/[0.08] hover:text-white"
              >
                {appleLoading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Apple data-icon="inline-start" />
                )}
                {appleLoading ? "Connecting…" : "Continue with Apple"}
              </Button>
            </div>

            <p className="mt-6 text-center text-[13px] text-white/55">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-reps-orange hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>

          <p className="mt-6 text-center text-[12px] text-white/35">
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
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
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
