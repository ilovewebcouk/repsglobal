import { Link } from "@tanstack/react-router";
import { Bookmark, Laptop, MapPin, Star } from "lucide-react";

import { VerificationPill } from "@/components/directory/VerificationPill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type FeaturedPro = {
  name: string;
  /** Short value-prop / blurb line shown under the meta row. */
  valueProp?: string | null;
  /** Generic role label (e.g. "Personal Trainer"). */
  role: string;
  city: string;
  rating: number;
  reviews: number;
  /** Used as proof when reviews === 0. */
  yearsExperience?: number | null;
  mode: "In-person" | "Online" | "In-person & Online";
  tags: string[];
  /** Required: every featured pro must have a real headshot. */
  image: string;
  /** Verification status — drives the REPs Verified / Unverified pill. */
  identityStatus?: string | null;
  verification?: string | null;
  /** Tier — drives the Pro / Studio chip alongside the verified pill. */
  tier?: "studio" | "pro" | "verified" | "free" | null;
  // Kept on the type so existing call sites don't break — not rendered.
  fromPrice?: number | null;
  priceCurrency?: string | null;
};

/** Convert kebab-case specialism slugs into sentence-case chip text. */
function humaniseTag(slug: string): string {
  const upper = new Set(["pt", "hiit", "sc"]);
  const overrides: Record<string, string> = {
    "pre-post-natal": "Pre & Post-Natal",
    "rehab-return-to-training": "Rehab & Return-to-Training",
    "rehab-injury": "Rehab",
    "hybrid-training": "Hybrid Training",
    "hybrid-functional": "Hybrid",
    "fat-loss": "Fat Loss",
    "strength-training": "Strength",
    "muscle-gain": "Muscle Gain",
    "posture-back-pain": "Posture & Back",
    "sports-performance": "Athletic Performance",
    "habit-lifestyle": "Habit & Lifestyle",
    "weight-management": "Weight Loss",
    "nutrition-coaching": "Nutrition",
    "over-50s": "Over 50s",
  };
  if (overrides[slug]) return overrides[slug];
  return slug
    .split("-")
    .map((w) => (upper.has(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Featured-professional card. Card-shaped clone of the horizontal directory
 * result row: same pills (REPs Verified + tier), same MapPin/Star/Laptop meta
 * row, same ivory specialism chips, same flat orange "View profile" CTA, same
 * white circular Save button. No price, no glass overlays, no ghost CTA.
 */
export function FeaturedProCard({ pro }: { pro: FeaturedPro }) {
  const slug = pro.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const hasReviews = pro.reviews > 0;
  const hasYears =
    !hasReviews && typeof pro.yearsExperience === "number" && pro.yearsExperience > 0;
  const remainingTags = Math.max(0, pro.tags.length - 2);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-reps-stone bg-white transition duration-300 focus-within:border-reps-orange hover:-translate-y-0.5 hover:border-reps-orange">
      {/* Photo */}
      <div className="relative overflow-hidden">
        <div className="aspect-[4/5] w-full overflow-hidden bg-reps-warm-white">
          <img
            src={pro.image}
            alt={pro.name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>

        {/* Save — matches directory card exactly */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Save"
              onClick={(e) => e.stopPropagation()}
              className="absolute right-3 top-3 rounded-full border border-reps-stone bg-white p-2 text-reps-muted-light shadow-none transition-colors hover:border-reps-orange hover:text-reps-orange"
            >
              <Bookmark className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={6} className="bg-reps-black text-white">
            Save
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Body — mirrors the directory result card */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-display text-[18px] font-bold leading-tight text-reps-charcoal">
            {pro.name}
          </h3>
          <VerificationPill
            identityStatus={pro.identityStatus ?? "approved"}
            verification={pro.verification ?? "verified"}
            tier={pro.tier ?? "verified"}
          />
        </div>

        <div className="mt-0.5 text-[12.5px] text-reps-muted-light">{pro.role}</div>

        {/* Meta row: location · rating/years · mode */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-reps-muted-light">
          {pro.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {pro.city}
            </span>
          )}
          {hasReviews ? (
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
              <span className="font-semibold text-reps-orange">{pro.rating.toFixed(1)}</span>
              <span>({pro.reviews})</span>
            </span>
          ) : hasYears ? (
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
              <span className="font-semibold text-reps-charcoal">
                {pro.yearsExperience}+ yrs
              </span>
            </span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <Laptop className="h-3.5 w-3.5" />
            {pro.mode}
          </span>
        </div>

        {pro.valueProp && (
          <p className="mt-2 line-clamp-2 min-h-[36px] text-[13px] leading-snug text-reps-charcoal/80">
            {pro.valueProp}
          </p>
        )}

        {/* Tags */}
        {pro.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {pro.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-full border border-reps-stone bg-reps-ivory px-2 py-0.5 text-[11px] font-medium text-reps-charcoal"
              >
                {humaniseTag(t)}
              </span>
            ))}
            {remainingTags > 0 && (
              <span className="text-[11px] font-medium text-reps-muted-light">
                +{remainingTags}
              </span>
            )}
          </div>
        )}

        {/* Solid orange CTA — same as directory desktop button */}
        <Link
          to="/pro/$slug"
          params={{ slug }}
          className="mt-auto inline-flex w-full items-center justify-center rounded-[10px] bg-reps-orange px-5 py-2.5 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange focus-visible:ring-offset-2"
        >
          View profile
        </Link>
      </div>
    </article>
  );
}
