import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AuthShell, AuthField, AuthPrimaryButton } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { redirectAfterAuth } from "@/lib/auth-redirect";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — REPS" },
      { name: "description", content: "Choose a new password for your REPS account." },
      { property: "og:title", content: "Set a new password — REPS" },
      { property: "og:description", content: "Set a new password to regain access to your REPS account." },
    ],
  }),
  component: ResetPasswordPage,
});

const RULES = [
  "At least 12 characters",
  "Mix of upper and lowercase",
  "Includes a number or symbol",
  "Not used on REPS before",
];

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
      const to = data.user ? await redirectAfterAuth(data.user.id) : "/login";
      navigate({ to, replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      topRight={
        <>
          Back to{" "}
          <Link to="/login" className="font-semibold text-reps-orange hover:underline">
            Sign in
          </Link>
        </>
      }
      eyebrow="Set new password"
      heading={
        <>
          Choose a strong{" "}
          <span className="text-reps-orange">new password.</span>
        </>
      }
      intro="Pick something memorable but unique to REPS. We'll sign you in automatically once it's saved."
    >
      <div className="text-center">
        <h2 className="font-display text-[24px] font-bold leading-tight text-reps-charcoal">
          Create a new password
        </h2>
        <p className="mt-1.5 text-[13px] text-reps-muted-light">
          Your reset link is valid — set a password below.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <AuthField
          label="New password"
          type="password"
          placeholder="Enter a new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />

        <AuthField
          label="Confirm new password"
          type="password"
          placeholder="Re-enter password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />

        <ul className="space-y-1.5 rounded-[12px] border border-reps-stone bg-reps-ivory p-3 text-[12px] text-reps-charcoal">
          {RULES.map((r) => (
            <li key={r} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-reps-orange" />
              {r}
            </li>
          ))}
        </ul>

        {error && (
          <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </div>
        )}

        <AuthPrimaryButton disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Saving…" : "Save new password"}
        </AuthPrimaryButton>
      </form>
    </AuthShell>
  );
}
