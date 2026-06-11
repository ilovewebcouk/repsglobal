import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — REPs" },
      {
        name: "description",
        content:
          "Enter your email and we'll send you a link to reset your REPs password.",
      },
      { property: "og:title", content: "Reset your password — REPs" },
      {
        property: "og:description",
        content: "Recover access to your REPs professional account.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyResetError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "That doesn't look like a valid email address.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Connection issue — check your internet and try again.";
  }
  return message;
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (value: string): string | null => {
    const v = value.trim();
    if (!v) return "Please enter your email.";
    if (!EMAIL_RE.test(v)) return "That doesn't look like a valid email address.";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const eErr = validateEmail(email);
    setEmailError(eErr);
    setEmailTouched(true);
    if (eErr) {
      requestAnimationFrame(() => document.getElementById("email")?.focus());
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Couldn't send reset email";
      setError(friendlyResetError(raw));
    } finally {
      setLoading(false);
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
                Reset your password
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                Enter your email and we&apos;ll send you a secure link.
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
                  disabled={sent}
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

              {error && (
                <Alert
                  role="alert"
                  variant="destructive"
                  className="border-red-400/30 bg-red-500/10 text-red-200"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {sent && (
                <Alert
                  role="status"
                  className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                >
                  <AlertDescription className="text-emerald-200">
                    If an account exists for that email, a reset link is on its way. The link is valid for 30 minutes.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading || sent}
                className="h-11 rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {loading ? "Sending…" : sent ? "Sent" : "Send reset link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-[13px] text-white/55">
              Remember your password?{" "}
              <Link
                to="/auth"
                className="font-semibold text-reps-orange hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 rounded-[12px] border border-white/10 bg-white/[0.03] p-4 text-[12px] leading-relaxed text-white/55">
            For your security, we&apos;ll only confirm that a reset email has been
            sent — not whether the address is registered.
          </div>
        </div>
      </div>
    </div>
  );
}
