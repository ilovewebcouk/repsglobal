import { Link } from "@tanstack/react-router";
import { VENUES } from "./VenueWordmarks";

/**
 * "Where you'll find our trainers" — ivory marketplace credibility band.
 *
 * Mirrors PressMarquee's continuous R→L scroll mechanic so the rhythm of the
 * page feels familiar, but lives on the warm marketplace surface (not the
 * dark editorial one) to signal "supply & proximity" instead of "press".
 *
 * Each wordmark is a Link to /find-a-professional?venue={slug}, turning the
 * strip into a navigation surface — clients clicking PureGym immediately get
 * REPs professionals who train at PureGym.
 *
 * Legal hygiene: REPs professionals are independent — they are not partners
 * of the gyms shown. The sub-line states this explicitly.
 */
export function VenueStrip() {
  return (
    <section className="relative bg-reps-warm-white py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-10">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-reps-orange">
          Where you'll find our trainers
        </p>
        <h2 className="mt-3 font-display text-[22px] font-bold leading-tight text-reps-charcoal sm:text-[26px] lg:text-[30px]">
          REPs professionals coach clients at gyms worldwide.
        </h2>
        <p className="mx-auto mt-2 max-w-[520px] text-[12.5px] leading-relaxed text-reps-muted-light">
          Independent REPs-verified professionals — not affiliated with the gyms shown.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-7xl lg:mt-12">
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0, black 4rem, black calc(100% - 4rem), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, black 4rem, black calc(100% - 4rem), transparent 100%)",
          }}
        >
          <div className="venue-marquee-track flex w-max items-center gap-16 pl-16 text-reps-charcoal/70 lg:gap-24 lg:pl-24">
            {[...VENUES, ...VENUES].map(({ key, slug, label, Mark, widthClass }, i) => (
              <Link
                key={`${key}-${i}`}
                to="/find-a-professional"
                search={{ venue: slug } as never}
                aria-label={`Find REPs professionals at ${label}`}
                className="shrink-0 transition-colors hover:text-reps-orange focus:text-reps-orange focus:outline-none"
              >
                <Mark className={`h-7 lg:h-8 ${widthClass}`} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .venue-marquee-track {
          animation: marquee 46s linear infinite;
        }
        .venue-marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .venue-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
