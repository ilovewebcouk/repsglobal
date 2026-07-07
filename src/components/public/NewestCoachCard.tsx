import { Link } from "@tanstack/react-router";
import { ShieldCheck, MapPin, Users, Star, Sparkles } from "lucide-react";

export type NewestCoach = {
  name: string;
  role: string;
  city: string;
  mode: "In-person" | "Online" | "In-person & Online";
  image: string;
  slug: string;
  rating: number | null;
  reviews: number;
  verified: boolean;
};

const MODE_LABEL: Record<NewestCoach["mode"], string> = {
  "In-person": "In-person",
  Online: "Online",
  "In-person & Online": "Blended",
};

/**
 * Coach card for the home "Newest coaches" wall.
 * Structure mirrors the training-provider tile: bordered white card,
 * media well at top, REPS Verified strip + name + role, footer meta row.
 */
export function NewestCoachCard({ pro }: { pro: NewestCoach }) {
  const shortCity = (pro.city ?? "").split(/[,&]/)[0].trim() || pro.city;
  return (
    <Link
      to="/c/$slug"
      params={{ slug: pro.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-black/10 bg-white transition-all hover:-translate-y-0.5 hover:border-black/25 hover:shadow-[0_12px_28px_-16px_rgba(0,0,0,0.25)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden border-b border-black/[0.06] bg-[#f7f6f2]">
        <img
          src={pro.image}
          alt={pro.name}
          loading="lazy"
          className="h-full w-full object-cover object-top"
        />
        {pro.rating != null && (
          <span
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-[8px] bg-white/95 px-1.5 py-0.5 shadow-sm backdrop-blur"
            aria-label={`Rated ${pro.rating.toFixed(1)} out of 5 from ${pro.reviews} reviews`}
          >
            <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
            <span className="text-[11px] font-bold text-black">
              {pro.rating.toFixed(1)}
            </span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {pro.verified ? (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.2} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              REPS Verified
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-black/45" strokeWidth={2.2} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/55">
              New member
            </span>
          </div>
        )}
        <h3 className="font-display text-[17px] font-bold leading-tight text-black group-hover:text-[#E96F00]">
          {pro.name}
        </h3>
        {pro.role ? (
          <p className="line-clamp-2 text-[13px] text-black/60">{pro.role}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-[12.5px] text-black/60">
          {shortCity ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2} />
              {shortCity}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            {MODE_LABEL[pro.mode]}
          </span>
        </div>
      </div>
    </Link>
  );
}
