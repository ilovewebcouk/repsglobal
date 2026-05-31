import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, AuthField, AuthPrimaryButton } from "@/components/auth/AuthShell";

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

      <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <AuthField label="Email address" type="email" placeholder="you@example.com" />
        <AuthPrimaryButton>Send reset link</AuthPrimaryButton>

        <p className="text-center text-[12px] text-reps-muted-light">
          Need a different option?{" "}
          <a href="#" className="font-semibold text-reps-orange hover:underline">
            Contact support
          </a>
        </p>
      </form>

      <div className="mt-6 rounded-[12px] border border-reps-stone bg-reps-ivory p-4 text-[12px] text-reps-muted-light">
        For your security, we'll only confirm whether a reset email has been sent — not whether the
        address is registered.
      </div>
    </AuthShell>
  );
}
