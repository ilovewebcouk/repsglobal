import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, ChevronRight, MapPin, Star } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type FeaturedPro = {
  name: string;
  role: string;
  city: string;
  rating: number;
  reviews: number;
  mode: "In-person" | "Online" | "In-person & Online";
  tags: string[];
  /** Required: every featured pro must have a real headshot. No monograms, no stock. */
  image: string;
};

/**
 * Shared featured-professional card used by /professions/$profession
 * and /in/$location. Portrait headshot (4:5), Verified pill with scrim,
 * dominant name, quiet outlined tag chips, premium CTA.
 *
 * Locked: 18px card radius, 10px button radius, flat button (no shadow),
 * brand-orange via token. Verified pill = identity-approved status, not
 * decorative — the only place green is allowed in this card.
 */
export function FeaturedProCard({ pro }: { pro: FeaturedPro }) {
  const slug = pro.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const hasReviews = pro.reviews > 0;
  const modeShort =
    pro.mode === "In-person & Online" ? "Hybrid" : pro.mode === "Online" ? "Online" : "In-person";
  const modeGlyph = pro.mode === "In-person & Online" ? "◐" : pro.mode === "Online" ? "●" : "○";

  return (
    <article className="group overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white transition duration-300 focus-within:border-reps-orange hover:-translate-y-0.5 hover:border-reps-orange">
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
        {/* Top scrim so badge + bookmark stay legible on bright photos */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/35 to-transparent" />

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
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="truncate font-display text-[18px] font-bold leading-tight text-reps-charcoal">
          {pro.name}
        </h3>
        <p className="mt-0.5 truncate text-[12px] text-reps-muted-light">{pro.role}</p>

        {hasReviews ? (
          <div className="mt-1.5 flex items-center gap-1 text-[12px]">
            <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
            <span className="font-semibold text-reps-charcoal">{pro.rating.toFixed(1)}</span>
            <span className="text-reps-muted-light">
              · {pro.reviews} {pro.reviews === 1 ? "review" : "reviews"}
            </span>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-2 text-[12.5px]">
          <span className="flex min-w-0 items-center gap-1 text-reps-charcoal">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-reps-muted-light" />
            <span className="truncate">{pro.city}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-reps-stone bg-reps-ivory/60 px-2 py-0.5 text-[10.5px] font-medium text-reps-muted-dark">
            <span aria-hidden className="text-reps-orange">{modeGlyph}</span>
            {modeShort}
          </span>
        </div>

        {pro.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {pro.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-full border border-reps-stone bg-transparent px-2 py-0.5 text-[10.5px] font-medium text-reps-muted-dark"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <Link
          to="/pro/$slug"
          params={{ slug }}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1 rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white shadow-none transition hover:bg-reps-orange-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange focus-visible:ring-offset-2"
        >
          View profile
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
