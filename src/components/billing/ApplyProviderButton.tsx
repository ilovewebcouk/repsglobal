import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";

/**
 * The three "Apply to become a provider" CTAs on /training-providers all
 * route to the /training-providers/apply gateway. That page handles the
 * sign-in / sign-up / checkout kick so the CTAs stay presentation-only.
 * Styling is identical across every use to keep the locked hero visuals.
 */
export function ApplyProviderButton({
  className,
}: {
  className?: string;
}) {
  return (
    <Link
      to="/training-providers/apply"
      className={
        className ??
        "inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
      }
    >
      Apply to become a provider <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function ApplyProviderCheckoutButton({
  onClick,
  loading,
  className,
  children,
}: {
  onClick: () => void;
  loading: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={
        className ??
        "inline-flex h-12 items-center gap-2 rounded-[10px] bg-reps-orange px-6 text-[14px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover disabled:opacity-60"
      }
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Taking you to Stripe…
        </>
      ) : (
        <>
          {children ?? "Continue to secure checkout"} <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
