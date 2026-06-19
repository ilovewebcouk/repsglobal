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
  /** AI-cropped headshot from the profile, or null to render a Monogram fallback. */
  image: string | null;
  /** Identity/verification + tier — feeds the shared VerificationPill. */
  identityStatus?: string | null;
  verification?: string | null;
  tier?: "studio" | "pro" | "verified" | "free" | null;
};

/**
 * Initials fallback that fills the square card image slot when a pro has no
 * AI-cropped headshot yet. Deterministic hue per name so the same person
 * always renders the same colour. Never substitutes a stock photo.
 */
function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function hueFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const band = h % 2;
  return band === 0 ? 30 + ((h >>> 8) % 25) : 200 + ((h >>> 8) % 30);
}

/**
 * Shared featured-professional card used by /professions/$profession
 * and /in/$location. Locked vertical layout: image-top, Verified pill,
 * Save tooltip, rating row, city + mode row, tag chips, full-width CTA.
 */
export function FeaturedProCard({ pro }: { pro: FeaturedPro }) {
  const slug = pro.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  // Static demo entries pre-date the pill wiring — default them to verified
  // so the locked demo grid still renders an emerald REPs Verified pill.
  const identityStatus = pro.identityStatus ?? "approved";
  const verification = pro.verification ?? "verified";
  const hue = hueFor(pro.name);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white">
      <div className="relative">
        {pro.image ? (
          <img src={pro.image} alt={pro.name} className="aspect-square w-full object-cover object-top" loading="lazy" />
        ) : (
          <div
            aria-hidden
            className="flex aspect-square w-full select-none items-center justify-center font-display font-bold tracking-tight"
            style={{
              backgroundColor: `hsl(${hue} 22% 92%)`,
              color: `hsl(${hue} 35% 32%)`,
              fontSize: "64px",
            }}
          >
            {initialsFor(pro.name)}
          </div>
        )}
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
