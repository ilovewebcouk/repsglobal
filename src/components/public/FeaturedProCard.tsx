import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, Laptop, MapPin, Star } from "lucide-react";

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
 * and /in/$location. Locked vertical layout: image-top, Verified pill,
 * Save tooltip, rating row (only when reviews > 0), city + mode row,
 * two tag chips, full-width CTA.
 */
export function FeaturedProCard({ pro }: { pro: FeaturedPro }) {
  const slug = pro.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const hasReviews = pro.reviews > 0;
  return (
    <article className="overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white transition hover:-translate-y-0.5 hover:border-reps-orange">
      <div className="relative">
        <img src={pro.image} alt={pro.name} className="h-44 w-full object-cover" loading="lazy" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-reps-green/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          <BadgeCheck className="h-3 w-3" /> Verified
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Save"
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-reps-warm-white/90 text-reps-charcoal hover:text-reps-orange"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-reps-black text-white">Save</TooltipContent>
        </Tooltip>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-[16px] font-bold leading-tight text-reps-charcoal">{pro.name}</h3>
            <p className="text-[12px] text-reps-muted-light">{pro.role}</p>
          </div>
          {hasReviews ? (
            <div className="flex shrink-0 items-center gap-1 text-[12px]">
              <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
              <span className="font-semibold text-reps-orange">{pro.rating.toFixed(1)}</span>
              <span className="text-reps-muted-light">({pro.reviews})</span>
            </div>
          ) : null}
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11.5px] text-reps-muted-light">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {pro.city}</span>
          <span className="flex items-center gap-1"><Laptop className="h-3 w-3" /> {pro.mode}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {pro.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-reps-ivory px-2 py-0.5 text-[10.5px] font-medium text-reps-charcoal">{t}</span>
          ))}
        </div>
        <Link
          to="/pro/$slug"
          params={{ slug }}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
        >
          View Profile
        </Link>
      </div>
    </article>
  );
}
