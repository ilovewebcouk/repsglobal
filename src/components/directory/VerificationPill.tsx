import * as React from "react";
import { BadgeCheck, Sparkles } from "lucide-react";

/**
 * Honest trust badge for a directory card.
 *  - identity_status='approved' AND verification='verified' → emerald "REPs Verified"
 *  - otherwise → neutral "Unverified" pill
 * Pro / Studio tier shows a small orange tier chip alongside, but only when
 * the pro is also verified — otherwise we'd be advertising tier without trust.
 */
export function VerificationPill({
  identityStatus,
  verification,
  tier,
  compact = false,
}: {
  identityStatus: string | null | undefined;
  verification: string | null | undefined;
  tier: "studio" | "pro" | "verified" | "free" | null | undefined;
  compact?: boolean;
}) {
  const isVerified = identityStatus === "approved" && verification === "verified";
  const showTier = isVerified && (tier === "pro" || tier === "studio");

  const padding = compact ? "px-2 py-0.5" : "px-2 py-0.5";
  const text = compact ? "text-[10px]" : "text-[10px]";

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {isVerified ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 ${padding} ${text} font-bold uppercase tracking-wider text-emerald-700`}
        >
          <BadgeCheck className="h-3 w-3" />
          REPs Verified
        </span>
      ) : (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-reps-stone bg-reps-warm-white ${padding} ${text} font-bold uppercase tracking-wider text-reps-muted-light`}
        >
          Unverified
        </span>
      )}
      {showTier && (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-reps-orange/15 ${padding} ${text} font-bold uppercase tracking-wider text-reps-orange ring-1 ring-reps-orange/25`}
        >
          <Sparkles className="h-3 w-3" />
          {tier === "studio" ? "Studio" : "Pro"}
        </span>
      )}
    </span>
  );
}
