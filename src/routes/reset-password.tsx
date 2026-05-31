import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { AuthShell, AuthField, AuthPrimaryButton } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — REPs" },
      { name: "description", content: "Choose a new password for your REPs account." },
      { property: "og:title", content: "Set a new password — REPs" },
      { property: "og:description", content: "Set a new password to regain access to your REPs account." },
    ],
  }),
  component: ResetPasswordPage,
});

const RULES = [
  "At least 12 characters",
  "Mix of upper and lowercase",
  "Includes a number or symbol",
  "Not used on REPs before",
];

function ResetPasswordPage() {
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
      intro="Pick something memorable but unique to REPs. We'll sign you in automatically once it's saved."
    >
      <div className="text-center">
        <h2 className="font-display text-[24px] font-bold leading-tight text-reps-charcoal">
          Create a new password
        </h2>
        <p className="mt-1.5 text-[13px] text-reps-muted-light">
          Your reset link is valid — set a password below.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <AuthField label="New password" type="password" placeholder="Enter a new password" />

        <div className="space-y-2">
          <div className="flex h-1.5 gap-1">
            <span className="flex-1 rounded-full bg-reps-orange" />
            <span className="flex-1 rounded-full bg-reps-orange" />
            <span className="flex-1 rounded-full bg-reps-orange" />
            <span className="flex-1 rounded-full bg-reps-stone" />
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-reps-orange">
            Strong password
          </div>
        </div>

        <AuthField label="Confirm new password" type="password" placeholder="Re-enter password" />

        <ul className="space-y-1.5 rounded-[12px] border border-reps-stone bg-reps-ivory p-3 text-[12px] text-reps-charcoal">
          {RULES.map((r) => (
            <li key={r} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-reps-orange" />
              {r}
            </li>
          ))}
        </ul>

        <AuthPrimaryButton>Save new password</AuthPrimaryButton>
      </form>
    </AuthShell>
  );
}
