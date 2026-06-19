import { Link } from "@tanstack/react-router";
import { Bookmark, Laptop, MapPin, Star } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VerificationPill } from "@/components/directory/VerificationPill";

export type FeaturedPro = {
  name: string;
  role: string;
  city: string;
  rating: number;
  reviews: number;
  mode: "In-person" | "Online" | "In-person & Online";
  tags: string[];
  image: string;
  /** Identity/verification + tier — feeds the shared VerificationPill. */
  identityStatus?: string | null;
  verification?: string | null;
  tier?: "studio" | "pro" | "verified" | "free" | null;
};

/**
 * Shared featured-professional card used by /professions/$profession
 * and /in/$location. Locked vertical layout: image-top, Verified pill,
 * Save tooltip, rating row, city + mode row, two tag chips, full-width CTA.
 */
export function FeaturedProCard({ pro }: { pro: FeaturedPro }) {
  const slug = pro.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  // Static demo entries pre-date the pill wiring — default them to verified
  // so the locked demo grid still renders an emerald REPs Verified pill.
  const identityStatus = pro.identityStatus ?? "approved";
  const verification = pro.verification ?? "verified";
  const tier = pro.tier ?? "verified";
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white">
      <div className="relative">
        {/* Avatars on cards are already AI-cropped at upload time (square,
            face-box centred). No per-card crop hack — render as-is. */}
        <img src={pro.image} alt={pro.name} className="aspect-square w-full object-cover" loading="lazy" />

        <div className="absolute left-3 top-3">
          <VerificationPill
            identityStatus={identityStatus}
            verification={verification}
            compact
            variant="onImage"
          />
        </div>

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
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-[16px] font-bold leading-tight text-reps-charcoal">{pro.name}</h3>
            <p className="text-[12px] text-reps-muted-light">{pro.role}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[12px]">
            <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
            <span className="font-semibold text-reps-orange">{pro.rating.toFixed(1)}</span>
            <span className="text-reps-muted-light">({pro.reviews})</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11.5px] text-reps-muted-light">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {pro.city}</span>
          <span className="flex items-center gap-1"><Laptop className="h-3 w-3" /> {pro.mode === "In-person & Online" ? "Hybrid" : pro.mode}</span>
        </div>
        <div className="mt-3 mb-3 flex flex-wrap gap-1">
          {pro.tags.map((t) => (
            <span key={t} className="rounded-full bg-reps-ivory px-2 py-0.5 text-[10.5px] font-medium text-reps-charcoal">{t}</span>
          ))}
        </div>
        <Link
          to="/pro/$slug"
          params={{ slug }}
          className="mt-auto inline-flex h-9 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
        >
          View Profile
        </Link>
      </div>
    </article>
  );
}
