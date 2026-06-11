import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { redirectAfterAuth } from "@/lib/auth-redirect";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — REPs" },
      { name: "description", content: "Choose a new password for your REPs account." },
      { property: "og:title", content: "Set a new password — REPs" },
      {
        property: "og:description",
        content: "Set a new password to regain access to your REPs account.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

const RULES = [
  "At least 8 characters",
  "Mix of upper and lowercase",
  "Includes a number or symbol",
];

function friendlyResetError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("session") || m.includes("token") || m.includes("expired")) {
    return "Your reset link has expired. Request a new one and try again.";
  }
  if (m.includes("same password")) {
    return "That's the same as your current password — choose a different one.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Connection issue — check your internet and try again.";
  }
  return message;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) throw updErr;
      const { data } = await supabase.auth.getUser();
      const to = data.user ? await redirectAfterAuth(data.user.id) : "/auth";
      navigate({ to, replace: true });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Couldn't update password";
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
                Set a new password
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                Choose something memorable but unique to REPs. We&apos;ll sign you in once it&apos;s saved.
              </p>
            </div>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-white/75">
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-11 rounded-[12px] border-white/15 bg-white/[0.04] pr-11 text-white placeholder:text-white/30"
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
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm" className="text-white/75">
                  Confirm new password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-11 rounded-[12px] border-white/15 bg-white/[0.04] pr-11 text-white placeholder:text-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    aria-pressed={showConfirm}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-8 items-center justify-center rounded-[8px] text-white/55 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <ul className="space-y-1.5 rounded-[12px] border border-white/10 bg-white/[0.03] p-3 text-[12px] text-white/65">
                {RULES.map((r) => (
                  <li key={r} className="flex items-center gap-2">
                    <Check className="size-3.5 text-reps-orange" />
                    {r}
                  </li>
                ))}
              </ul>

              {error && (
                <Alert
                  role="alert"
                  variant="destructive"
                  className="border-red-400/30 bg-red-500/10 text-red-200"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white hover:bg-reps-orange-hover"
              >
                {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
                {loading ? "Saving…" : "Save new password"}
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
        </div>
      </div>
    </div>
  );
}
