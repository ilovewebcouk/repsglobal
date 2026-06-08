import anytimeFitness from "@/assets/venues/anytime_fitness.svg.asset.json";
import davidLloyd from "@/assets/venues/david_lloyd.svg.asset.json";
import energieFitness from "@/assets/venues/energie_fitness.svg.asset.json";
import everyoneActive from "@/assets/venues/everyone_active.svg.asset.json";
import fitnessFirst from "@/assets/venues/fitness_first.svg.asset.json";
import nuffieldHealth from "@/assets/venues/nuffield_health.svg.asset.json";
import pureGym from "@/assets/venues/puregym.svg.asset.json";
import theGymGroup from "@/assets/venues/the_gym_group.svg.asset.json";
import thirdSpace from "@/assets/venues/third_space.svg.asset.json";
import virginActive from "@/assets/venues/virgin_active.svg.asset.json";

/**
 * Gym-venue marquee — same structure as PressMarquee but renders gym brand
 * logos as monochrome silhouettes (brightness/invert + opacity) so the
 * coloured source SVGs read the same as the press wordmark treatment.
 *
 * Used on /cpd in place of the editorial "As featured in" marquee.
 */

type Venue = { key: string; src: string; alt: string; widthClass: string };

const VENUES: Venue[] = [
  { key: "puregym", src: pureGym.url, alt: "PureGym", widthClass: "w-24 sm:w-28 lg:w-32" },
  { key: "virgin-active", src: virginActive.url, alt: "Virgin Active", widthClass: "w-24 sm:w-28 lg:w-32" },
  { key: "david-lloyd", src: davidLloyd.url, alt: "David Lloyd", widthClass: "w-28 sm:w-32 lg:w-36" },
  { key: "nuffield-health", src: nuffieldHealth.url, alt: "Nuffield Health", widthClass: "w-28 sm:w-32 lg:w-36" },
  { key: "the-gym-group", src: theGymGroup.url, alt: "The Gym Group", widthClass: "w-16 sm:w-20 lg:w-24" },
  { key: "anytime-fitness", src: anytimeFitness.url, alt: "Anytime Fitness", widthClass: "w-28 sm:w-32 lg:w-36" },
  { key: "fitness-first", src: fitnessFirst.url, alt: "Fitness First", widthClass: "w-24 sm:w-28 lg:w-32" },
  { key: "third-space", src: thirdSpace.url, alt: "Third Space", widthClass: "w-28 sm:w-32 lg:w-36" },
  { key: "everyone-active", src: everyoneActive.url, alt: "Everyone Active", widthClass: "w-16 sm:w-20 lg:w-24" },
  { key: "energie-fitness", src: energieFitness.url, alt: "énergie Fitness", widthClass: "w-32 sm:w-36 lg:w-40" },
];

export function VenueMarquee() {
  return (
    <section className="relative bg-reps-ink py-14 lg:py-20">
      <p className="text-center text-[10.5px] font-semibold uppercase tracking-[0.32em] text-white/45">
        Where you'll find our trainers
      </p>

      <div className="mx-auto mt-9 max-w-7xl lg:mt-11">
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0, black 2.5rem, black calc(100% - 2.5rem), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, black 2.5rem, black calc(100% - 2.5rem), transparent 100%)",
          }}
        >
          <div className="venue-marquee-track flex w-max items-center gap-12 pl-12 sm:gap-16 sm:pl-16 lg:gap-24 lg:pl-24">
            {[...VENUES, ...VENUES].map((v, i) => (
              <img
                key={`${v.key}-${i}`}
                src={v.src}
                alt={v.alt}
                loading="lazy"
                className={`h-6 shrink-0 object-contain opacity-55 sm:h-7 lg:h-8 ${v.widthClass}`}
                style={{ filter: "brightness(0) invert(1)" }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .venue-marquee-track {
          animation: marquee 42s linear infinite;
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
