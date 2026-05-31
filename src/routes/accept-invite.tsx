import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";

import { supabase } from "@/integrations/supabase/client";
import { acceptInvite, lookupInvite } from "@/lib/invites.functions";

export const Route = createFileRoute("/accept-invite")({
  head: () => ({
    meta: [
      { title: "Accept invite — REPs" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s) => ({ token: (s.token as string) ?? "" }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const lookup = useServerFn(lookupInvite);
  const accept = useServerFn(acceptInvite);

  const { data, isLoading, error } = useQuery({
    queryKey: ["invite", token],
    queryFn: () => lookup({ data: { token } }),
    enabled: !!token,
    retry: false,
  });

  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const invite = data?.invite ?? null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!invite) return;
    setSubmitting(true);
    setFormError(null);
    try {
      // 1. Create account
      const { error: signErr } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/portal/today`,
          data: {
            full_name: fullName || invite.full_name || invite.email,
            signup_kind: "client",
          },
        },
      });
      if (signErr && !signErr.message.toLowerCase().includes("already")) {
        throw signErr;
      }

      // 2. If existing user, sign in
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: invite.email,
          password,
        });
        if (signInErr) throw signInErr;
      }

      // 3. Accept invite via authenticated RPC
      await accept({ data: { token } });

      navigate({ to: "/portal/today" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not accept invite");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-reps-orange-soft text-reps-orange">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-white/55">
                REPs Client Invite
              </div>
              <div className="text-[15px] font-semibold text-white">Join your coach</div>
            </div>
          </div>

          {!token && (
            <p className="text-sm text-white/70">No invite token provided.</p>
          )}

          {token && isLoading && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking invite…
            </div>
          )}

          {token && error && (
            <p className="text-sm text-rose-400">Could not load invite.</p>
          )}

          {invite && invite.status !== "pending" && (
            <div className="rounded-[12px] border border-reps-border bg-reps-ink p-4 text-sm text-white/70">
              This invite has already been {invite.status}.{" "}
              <Link to="/login" className="text-reps-orange">
                Sign in instead
              </Link>
              .
            </div>
          )}

          {invite && invite.status === "pending" && invite.expired && (
            <div className="rounded-[12px] border border-reps-border bg-reps-ink p-4 text-sm text-rose-300">
              This invite has expired. Ask your coach to resend.
            </div>
          )}

          {invite && invite.status === "pending" && !invite.expired && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-white/75">
                <span className="font-semibold text-white">{invite.professional_name}</span> has
                invited you to join their coaching on REPs. Set a password to activate your account.
              </p>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">Email</label>
                <div className="flex h-11 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[14px] text-white/80">
                  <Mail className="h-4 w-4 text-white/45" />
                  {invite.email}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  Your full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder={invite.full_name ?? "Full name"}
                  className="h-11 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[14px] text-white placeholder:text-white/30 focus:border-reps-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60">
                  Choose a password
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-[12px] border border-reps-border bg-reps-ink px-3 text-[14px] text-white focus:border-reps-orange focus:outline-none"
                />
              </div>

              {formError && (
                <p className="text-xs text-rose-400">{formError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Activate my account
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Already have an account?{" "}
          <Link to="/login" className="text-reps-orange">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
