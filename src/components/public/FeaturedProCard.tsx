import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, ChevronRight, MapPin, Star } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type FeaturedPro = {
  name: string;
  /** Short value-prop line — overrides the generic role label when present. */
  valueProp?: string | null;
  /** Fallback role label (e.g. "Personal Trainer") when valueProp is empty. */
  role: string;
  city: string;
  rating: number;
  reviews: number;
  /** Years of experience — used as proof when reviews === 0. */
  yearsExperience?: number | null;
  /** Starting session price in major units (e.g. 65 → "From £65"). */
  fromPrice?: number | null;
  priceCurrency?: string | null;
  mode: "In-person" | "Online" | "In-person & Online";
  tags: string[];
  /** Required: every featured pro must have a real headshot. No monograms, no stock. */
  image: string;
};

/** Convert kebab-case specialism slugs into sentence-case chip text. */
function humaniseTag(slug: string): string {
  // Acronyms / known caps
  const upper = new Set(["pt", "hiit", "sc"]);
  // Specific overrides for readability
  const overrides: Record<string, string> = {
    "pre-post-natal": "Pre/post-natal",
    "rehab-return-to-training": "Rehab",
    "rehab-injury": "Rehab",
    "hybrid-training": "Hybrid",
    "hybrid-functional": "Hybrid",
    "fat-loss": "Fat loss",
    "strength-training": "Strength",
    "muscle-gain": "Muscle gain",
    "posture-back-pain": "Posture & back",
    "sports-performance": "Performance",
    "habit-lifestyle": "Lifestyle",
    "weight-management": "Weight loss",
    "nutrition-coaching": "Nutrition",
    "over-50s": "Over 50s",
  };
  if (overrides[slug]) return overrides[slug];
  return slug
    .split("-")
    .map((w, i) =>
      upper.has(w) ? w.toUpperCase() : i === 0 ? w[0].toUpperCase() + w.slice(1) : w,
    )
    .join(" ");
}

function formatPrice(amount: number, currency: string): string {
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "";
  return `${symbol}${Math.round(amount)}`;
}

/**
 * Shared featured-professional card used by /professions/$profession
 * and /in/$location. Marketplace-tier composition:
 * - 4:5 portrait headshot, top-anchored crop, hover scale
 * - Verified pill + Save button overlaid on photo with scrim
 * - Rating-or-experience glass pill bottom-left of photo (always shows ONE proof)
 * - 18px display name, value-prop subtitle (2-line clamp), location + price row
 * - Sentence-case specialism chips (max 2 + overflow)
 * - Ghost CTA that fills brand orange on hover
 * - Equal heights guaranteed via flex column + mt-auto on CTA block
 *
 * Locked tokens: 18px card radius, 10px button radius, flat button (no shadow),
 * brand-orange via token. Verified pill = identity-approved status — the only
 * place green is allowed per status-colors memory.
 */
export function FeaturedProCard({ pro }: { pro: FeaturedPro }) {
  const slug = pro.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const hasReviews = pro.reviews > 0;
  const hasYears = !hasReviews && typeof pro.yearsExperience === "number" && pro.yearsExperience > 0;
  const subtitle = pro.valueProp?.trim() || pro.role;
  const remainingTags = Math.max(0, pro.tags.length - 2);
  const priceLabel =
    typeof pro.fromPrice === "number" && pro.fromPrice > 0
      ? `From ${formatPrice(pro.fromPrice, pro.priceCurrency ?? "GBP")}`
      : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white transition duration-300 focus-within:border-reps-orange hover:-translate-y-0.5 hover:border-reps-orange">
      {/* Photo */}
      <div className="relative overflow-hidden">
        <div className="aspect-[4/5] w-full overflow-hidden">
          <img
            src={pro.image}
            alt={pro.name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>

        {/* Top + bottom scrims for legible overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />

        <span className="absolute left-3 top-3 inline-flex h-5 items-center gap-1 rounded-full bg-reps-green/95 px-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.45)]">
          <BadgeCheck className="h-3 w-3" /> Verified
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Save"
              onClick={(e) => e.stopPropagation()}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-reps-black/45 text-white backdrop-blur-sm transition hover:bg-reps-orange"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-reps-black text-white">Save</TooltipContent>
        </Tooltip>

        {/* Proof pill — rating if any, otherwise years of experience */}
        {hasReviews ? (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
            <span>{pro.rating.toFixed(1)}</span>
            <span className="text-white/75">({pro.reviews})</span>
          </div>
        ) : hasYears ? (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            <span>{pro.yearsExperience}+ yrs experience</span>
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-display text-[18px] font-bold leading-tight text-reps-charcoal">
          {pro.name}
        </h3>
        <p className="mt-1 line-clamp-2 min-h-[36px] text-[13px] leading-snug text-reps-muted-dark">
          {subtitle}
        </p>

        {/* Location + price */}
        <div className="mt-2.5 flex items-center gap-2 text-[12.5px] text-reps-muted-dark">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-reps-muted-light" />
            <span className="truncate">{pro.city || "Online"}</span>
          </span>
          {priceLabel ? (
            <>
              <span aria-hidden className="text-reps-muted-light">·</span>
              <span className="shrink-0 font-semibold text-reps-charcoal">{priceLabel}</span>
            </>
          ) : null}
        </div>

        {/* Tags — single row, max 2, sentence case, +N overflow */}
        <div className="mt-3 flex min-h-[26px] flex-wrap items-center gap-1.5">
          {pro.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-full border border-reps-stone bg-transparent px-2 py-0.5 text-[10.5px] font-medium text-reps-muted-dark"
            >
              {humaniseTag(t)}
            </span>
          ))}
          {remainingTags > 0 ? (
            <span className="text-[10.5px] font-medium text-reps-muted-light">
              +{remainingTags}
            </span>
          ) : null}
        </div>

        {/* Ghost CTA — orange fill on hover. mt-auto pins to equal-height bottom. */}
        <Link
          to="/pro/$slug"
          params={{ slug }}
          className="mt-auto inline-flex h-10 w-full items-center justify-center gap-1 rounded-[10px] border border-reps-stone bg-transparent text-[13px] font-semibold text-reps-charcoal shadow-none transition group-hover:border-reps-orange group-hover:bg-reps-orange group-hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange focus-visible:ring-offset-2"
        >
          View profile
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
