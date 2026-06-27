import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  email: z.string().email().optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Verify your email — REPS" },
      { name: "description", content: "Check your inbox for the verification link to activate your REPS account." },
      { property: "og:title", content: "Verify your email — REPS" },
      { property: "og:description", content: "Activate your REPS account by confirming your email." },
    ],
  }),
  component: VerifyEmailPage,
});

// Map common email domains to their webmail URL so "Open my email" is useful.
const WEBMAIL: Record<string, string> = {
  "gmail.com": "https://mail.google.com",
  "googlemail.com": "https://mail.google.com",
  "outlook.com": "https://outlook.live.com/mail",
  "hotmail.com": "https://outlook.live.com/mail",
  "live.com": "https://outlook.live.com/mail",
  "yahoo.com": "https://mail.yahoo.com",
  "yahoo.co.uk": "https://mail.yahoo.com",
  "icloud.com": "https://www.icloud.com/mail",
  "me.com": "https://www.icloud.com/mail",
  "protonmail.com": "https://mail.proton.me",
  "proton.me": "https://mail.proton.me",
};

function openInbox(email: string | undefined) {
  if (!email) return;
  const domain = email.split("@")[1]?.toLowerCase();
  const url = domain ? WEBMAIL[domain] : null;
  if (url) window.open(url, "_blank", "noopener,noreferrer");
  else window.location.href = `mailto:${email}`;
}

function VerifyEmailPage() {
  const { email, redirect } = useSearch({ from: "/verify-email" });
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) {
      setResendState("error");
      setErrorMessage("We don't have your email on file. Sign up again to receive a new link.");
      return;
    }
    setResendState("sending");
    setErrorMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${redirect ?? "/dashboard"}`,
        },
      });
      if (error) throw error;
      setResendState("sent");
    } catch (err) {
      setResendState("error");
      setErrorMessage(err instanceof Error ? err.message : "Couldn't resend the email. Try again in a moment.");
    }
  };

  return (
    <AuthShell
      topRight={
        <>
          Wrong address?{" "}
          <Link to="/signup" className="font-semibold text-reps-orange hover:underline">
            Sign up again
          </Link>
        </>
      }
      eyebrow="One last step"
      heading={
        <>
          Confirm your <span className="text-reps-orange">email address.</span>
        </>
      }
      intro="We've sent a verification link to the email you used to register. Click it to activate your REPS account and access your dashboard."
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
          <Mail className="h-6 w-6" />
        </span>
        <h2 className="mt-5 font-display text-[24px] font-bold leading-tight text-reps-charcoal">
          Check your inbox
        </h2>
        <p className="mt-2 max-w-[320px] text-[13px] text-reps-muted-light">
          {email ? (
            <>
              We sent a verification link to{" "}
              <span className="font-semibold text-reps-charcoal">{email}</span>. The link expires
              in 24 hours.
            </>
          ) : (
            <>The link in your inbox expires in 24 hours.</>
          )}
        </p>

        <div className="mt-6 w-full space-y-3">
          <button
            type="button"
            onClick={() => openInbox(email)}
            disabled={!email}
            className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Open my email
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendState === "sending" || resendState === "sent"}
            className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-reps-stone bg-reps-warm-white text-[13px] font-semibold text-reps-charcoal shadow-none transition-colors hover:bg-reps-ivory disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendState === "sending"
              ? "Resending…"
              : resendState === "sent"
                ? "Verification email resent ✓"
                : "Resend verification email"}
          </button>
          {resendState === "error" && errorMessage && (
            <p className="text-left text-[12px] text-red-600">{errorMessage}</p>
          )}
        </div>

        <div className="mt-6 w-full rounded-[12px] border border-reps-stone bg-reps-ivory p-4 text-left text-[12px] text-reps-muted-light">
          <div className="font-semibold text-reps-charcoal">Not seeing it?</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Check your spam or promotions folder.</li>
            <li>Add <span className="font-mono">no-reply@repsglobal.com</span> to your contacts.</li>
            <li>
              Still nothing?{" "}
              <Link to="/help" className="font-semibold text-reps-orange hover:underline">
                Contact support
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>
    </AuthShell>
  );
}
