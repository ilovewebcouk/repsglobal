import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/verify-email")({
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

function VerifyEmailPage() {
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
          We sent a verification link to{" "}
          <span className="font-semibold text-reps-charcoal">james@example.com</span>. The link
          expires in 24 hours.
        </p>

        <div className="mt-6 w-full space-y-3">
          <button className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover">
            Open my email
          </button>
          <button className="inline-flex h-11 w-full items-center justify-center rounded-[10px] border border-reps-stone bg-reps-warm-white text-[13px] font-semibold text-reps-charcoal shadow-none transition-colors hover:bg-reps-ivory">
            Resend verification email
          </button>
        </div>

        <div className="mt-6 w-full rounded-[12px] border border-reps-stone bg-reps-ivory p-4 text-left text-[12px] text-reps-muted-light">
          <div className="font-semibold text-reps-charcoal">Not seeing it?</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Check your spam or promotions folder.</li>
            <li>Add <span className="font-mono">no-reply@repsglobal.com</span> to your contacts.</li>
            <li>Still nothing? <a href="#" className="font-semibold text-reps-orange hover:underline">Contact support</a>.</li>
          </ul>
        </div>
      </div>
    </AuthShell>
  );
}
