import { BadgeCheck } from "lucide-react";

/**
 * Honest trust badge for a directory card.
 *  - identity_status='approved' AND verification='verified' → emerald "REPs Verified"
 *  - otherwise → neutral "Unverified" pill
 */
export function VerificationPill({
  identityStatus,
  verification,
  compact = false,
  variant = "default",
}: {
  identityStatus: string | null | undefined;
  verification: string | null | undefined;
  compact?: boolean;
  variant?: "default" | "onImage";
}) {
  const isVerified = identityStatus === "approved" && verification === "verified";

  const padding = compact ? "px-2 py-0.5" : "px-2 py-0.5";
  const text = compact ? "text-[10px]" : "text-[10px]";

  const verifiedClasses =
    variant === "onImage"
      ? `inline-flex items-center gap-1 rounded-full bg-reps-green/15 ring-1 ring-reps-green/30 ${padding} ${text} font-bold uppercase tracking-wider text-reps-green`
      : `inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 ${padding} ${text} font-bold uppercase tracking-wider text-emerald-700`;

  return isVerified ? (
    <span className={verifiedClasses}>
      <BadgeCheck className="h-3 w-3" />
      REPs Verified
    </span>
  ) : (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-reps-stone bg-reps-warm-white ${padding} ${text} font-bold uppercase tracking-wider text-reps-muted-light`}
    >
      Unverified
    </span>
  );
}
