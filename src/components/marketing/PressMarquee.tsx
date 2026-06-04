import bbcSport from "@/assets/press/bbc-sport.svg.asset.json";
import gq from "@/assets/press/gq.svg.asset.json";
import mensHealth from "@/assets/press/mens-health.svg.asset.json";
import runnersWorld from "@/assets/press/runners-world.svg.asset.json";
import theTimes from "@/assets/press/the-times.svg.asset.json";
import womensFitness from "@/assets/press/womens-fitness.svg.asset.json";

const LOGOS = [
  { name: "The Times", url: theTimes.url },
  { name: "BBC Sport", url: bbcSport.url },
  { name: "Men's Health", url: mensHealth.url },
  { name: "Women's Fitness", url: womensFitness.url },
  { name: "Runner's World", url: runnersWorld.url },
  { name: "GQ", url: gq.url },
];

/**
 * Press wordmark marquee — continuous R→L scroll, edges fade to ink via mask.
 * Animation reuses the global `animate-marquee` utility (translateX 0 → -50%),
 * so the duplicated track loops seamlessly. Respects prefers-reduced-motion.
 */
export function PressMarquee() {
  return (
    <section className="relative bg-reps-ink py-14 lg:py-20">
      <p className="text-center text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/45">
        As featured in
      </p>

      <div
        className="relative mt-8 overflow-hidden lg:mt-10"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div className="press-marquee-track flex w-max items-center gap-16 lg:gap-24">
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <img
              key={`${logo.name}-${i}`}
              src={logo.url}
              alt={logo.name}
              className="h-7 w-auto shrink-0 opacity-70 brightness-0 invert lg:h-8"
              loading="lazy"
            />
          ))}
        </div>
      </div>

      <style>{`
        .press-marquee-track {
          animation: marquee 42s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .press-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
