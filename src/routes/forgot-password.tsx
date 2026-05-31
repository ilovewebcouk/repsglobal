import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { AuthShell, AuthField, AuthPrimaryButton } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — REPs" },
      { name: "description", content: "Enter your email and we'll send you a link to reset your REPs password." },
      { property: "og:title", content: "Reset your password — REPs" },
      { property: "og:description", content: "Recover access to your REPs professional account." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      // Don't disclose whether the email exists; still flag generic failures.
      setError(err instanceof Error ? err.message : "Couldn't send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      topRight={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-reps-orange hover:underline">
            Sign in
          </Link>
        </>
      }
      eyebrow="Account recovery"
      heading={
        <>
          Forgot your <span className="text-reps-orange">password?</span>
        </>
      }
      intro="No problem — it happens. Enter the email on your REPs account and we'll send you a secure link to set a new password."
    >
      <div className="text-center">
        <h2 className="font-display text-[24px] font-bold leading-tight text-reps-charcoal">
          Reset your password
        </h2>
        <p className="mt-1.5 text-[13px] text-reps-muted-light">
          We'll email a recovery link valid for 30 minutes.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <AuthField
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        {error && (
          <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </div>
        )}
        {sent && (
          <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
            If an account exists for that email, a reset link is on its way.
          </div>
        )}

        <AuthPrimaryButton disabled={loading || sent}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Sending…" : sent ? "Sent" : "Send reset link"}
        </AuthPrimaryButton>

        <p className="text-center text-[12px] text-reps-muted-light">
          Need a different option?{" "}
          <Link to="/contact" className="font-semibold text-reps-orange hover:underline">
            Contact support
          </Link>
        </p>
      </form>

      <div className="mt-6 rounded-[12px] border border-reps-stone bg-reps-ivory p-4 text-[12px] text-reps-muted-light">
        For your security, we'll only confirm whether a reset email has been sent — not whether the
        address is registered.
      </div>
    </AuthShell>
  );
}
