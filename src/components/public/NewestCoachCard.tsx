import { Laptop, MapPin, Star } from "lucide-react";

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
 * Card for the home "Newest coaches on REPS" rail. Deliberately stripped:
 * no Verified pill (they haven't verified yet) and no Save button (the
 * intent is discovery, not shortlist-building).
 */
export function NewestCoachCard({ pro }: { pro: NewestCoach }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white">
      <div className="relative">
        <img
          src={pro.image}
          alt={pro.name}
          className="aspect-square w-full object-cover object-top"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-[16px] font-bold leading-tight text-reps-charcoal">{pro.name}</h3>
            <p className="text-[12px] text-reps-muted-light">{pro.role}</p>
          </div>
          {pro.reviews > 0 && pro.rating !== null && (
            <div className="flex shrink-0 items-center gap-1 text-[12px]">
              <Star className="h-3.5 w-3.5 fill-reps-orange text-reps-orange" />
              <span className="font-semibold text-reps-orange">{pro.rating.toFixed(1)}</span>
              <span className="text-reps-muted-light">({pro.reviews})</span>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11.5px] text-reps-muted-light">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {pro.city}</span>
          <span className="flex items-center gap-1"><Laptop className="h-3 w-3" /> {pro.mode === "In-person & Online" ? "Hybrid" : pro.mode}</span>
        </div>
        <a
          href={`/c/${pro.slug}`}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-dark"
        >
          View profile
        </a>
      </div>
    </article>
  );
}
