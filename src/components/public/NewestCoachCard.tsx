import { Link } from "@tanstack/react-router";

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
 * Face-first tile for the home "Newest coaches" wall.
 * Deliberately stripped so 16 units read as a wall of real people, not
 * a spec sheet: no Verified pill, no Save, no rating chip, no CTA button.
 * The whole tile is the link.
 */
export function NewestCoachCard({ pro }: { pro: NewestCoach }) {
  const meta = [pro.role, pro.city].filter(Boolean).join(" · ");
  return (
    <Link
      to="/c/$slug"
      params={{ slug: pro.slug }}
      className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="relative">
        <img
          src={pro.image}
          alt={pro.name}
          className="aspect-square w-full object-cover object-top"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col px-3 py-2.5">
        <h3 className="truncate font-display text-[15px] font-bold leading-tight text-reps-charcoal">
          {pro.name}
        </h3>
        <p className="mt-0.5 truncate text-[12px] text-reps-muted-light">{meta}</p>
      </div>
    </Link>
  );
}
