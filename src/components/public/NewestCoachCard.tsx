import { Link } from "@tanstack/react-router";
import { Star, ShieldCheck } from "lucide-react";

export type NewestCoach = {
  name: string;
  role: string;
  city: string;
  mode: "In-person" | "Online" | "In-person & Online";
  image: string;
  slug: string;
  rating: number | null;
  reviews: number;
};

/**
 * Photo-led register tile for the home "Newest coaches" section.
 * Portrait aspect, verified pill overlay, star chip, quiet trust microline,
 * hover CTA. The whole card is the link.
 */
export function NewestCoachCard({ pro }: { pro: NewestCoach }) {
  // Collapse long city strings ("Johnstone North, Kilbarchan…") to first segment.
  const shortCity = (pro.city ?? "").split(/[,&]/)[0].trim() || pro.city;

  return (
    <Link
      to="/c/$slug"
      params={{ slug: pro.slug }}
      className="group flex h-full flex-col rounded-[18px] focus:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-warm-white"
    >
      {/* Photo well */}
      <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded-[18px] bg-reps-stone/40">
        <img
          src={pro.image}
          alt={pro.name}
          loading="lazy"
          className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {/* Verified pill */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
          <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2.5} />
          Verified
        </span>

        {/* Hover CTA */}
        <div className="pointer-events-none absolute inset-0 flex items-end p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-t from-reps-charcoal/55 via-transparent to-transparent" />
          <span className="relative w-full translate-y-1 rounded-[10px] bg-reps-orange py-2.5 text-center text-[13px] font-semibold text-white shadow-lg transition-transform duration-200 group-hover:translate-y-0">
            View profile →
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="space-y-1.5 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-display text-[15.5px] font-bold leading-tight text-reps-charcoal">
            {pro.name}
          </h3>
          {pro.rating != null && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-[6px] bg-reps-ivory px-1.5 py-0.5"
              aria-label={`Rated ${pro.rating.toFixed(1)} out of 5 from ${pro.reviews} reviews`}
            >
              <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
              <span className="text-[11px] font-bold text-reps-charcoal">
                {pro.rating.toFixed(1)}
              </span>
            </span>
          )}
        </div>
        <p className="truncate text-[12.5px] text-reps-muted-light">{pro.role}</p>
        <p className="flex items-center gap-2 text-[11.5px] text-reps-muted-light">
          <span className="truncate">{shortCity}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">Insured · CPD</span>
        </p>
      </div>
    </Link>
  );
}
