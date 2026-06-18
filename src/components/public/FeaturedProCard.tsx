import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bookmark, Laptop, MapPin, Star } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VerificationPill } from "@/components/directory/VerificationPill";
import { formatSpecialismLabel } from "@/lib/format";

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
 * Featured-professional card. Vertical orientation (per locked /in/$location),
 * but built from the same visual system as the directory ProCard
 * (find-a-professional.tsx) — same pill stack, same meta row, same Save
 * button, same tag chips. The card version of a directory profile.
 */
export function FeaturedProCard({ pro }: { pro: FeaturedPro }) {
  const slug = pro.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  // Static demo entries pre-date the pill wiring — default them to verified
  // so the locked demo grid still renders the emerald REPs Verified pill.
  const identityStatus = pro.identityStatus ?? "approved";
  const verification = pro.verification ?? "verified";
  const tier = pro.tier ?? "verified";

  const [saved, setSaved] = useState(false);

  // Shorten the combined mode label so "Covent Garden + In-person + Online"
  // never wraps on standard card widths.
  const modeLabel = pro.mode === "In-person & Online" ? "In-person + Online" : pro.mode;

  return (
    <article className="group relative overflow-hidden rounded-[18px] border border-reps-stone bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-30px_rgba(15,15,15,0.22)] sm:p-5">
      {/* Photo tile — square, directory-style 16px inner radius */}
      <div className="relative">
        <img
          src={pro.image}
          alt={`${pro.name} — ${pro.role}`}
          className="aspect-square w-full rounded-[16px] object-cover object-[center_15%]"
          loading="lazy"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={saved ? "Saved" : "Save"}
              aria-pressed={saved}
              onClick={() => setSaved((v) => !v)}
              className={`absolute right-2 top-2 rounded-full border bg-white p-2 transition-colors ${
                saved
                  ? "border-reps-orange text-reps-orange"
                  : "border-reps-stone text-reps-muted-light hover:border-reps-orange hover:text-reps-orange"
              }`}
            >
              <Bookmark
                className={`h-4 w-4 ${saved ? "fill-reps-orange" : ""}`}
                strokeWidth={2.25}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={6} className="bg-reps-black text-white">
            {saved ? "Saved" : "Save"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Name + inline pills — mirror of directory desktop heading */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-[17px] font-bold leading-tight text-reps-charcoal">
          {pro.name}
        </h3>
        <VerificationPill
          identityStatus={identityStatus}
          verification={verification}
          tier={tier}
          compact
        />
      </div>
      <div className="mt-0.5 text-[12.5px] text-reps-muted-light">{pro.role}</div>

      {/* Meta row — mirror of directory ProCard */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-reps-muted-light">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {pro.city}
        </span>
        <span className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
          <span className="font-semibold text-reps-orange">{pro.rating.toFixed(1)}</span>
          <span>({pro.reviews})</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Laptop className="h-3.5 w-3.5" />
          {modeLabel}
        </span>
      </div>

      {/* Tag chips — directory styling + humanised labels */}
      <div className="mt-2.5 flex min-h-[40px] flex-wrap gap-1.5">
        {pro.tags.slice(0, 2).map((t) => (
          <span
            key={t}
            className="rounded-full border border-reps-stone bg-reps-ivory px-2 py-0.5 text-[11px] font-medium text-reps-charcoal"
          >
            {formatSpecialismLabel(t)}
          </span>
        ))}
      </div>

      <Link
        to="/pro/$slug"
        params={{ slug }}
        className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
      >
        View Profile
      </Link>
    </article>
  );
}
