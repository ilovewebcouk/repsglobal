import { PRESS_WORDMARKS } from "./PressWordmarks";

/**
 * Press wordmark marquee — continuous R→L scroll, edges fade to ink via mask.
 * Animation reuses the global `animate-marquee` keyframe (translateX 0 → -50%),
 * so the duplicated track loops seamlessly. Respects prefers-reduced-motion.
 *
 * Each wordmark is a typographic credit (not the publication's protected logo),
 * rendered as inline SVG using `currentColor`, so the track's text color tints
 * every mark uniformly.
 */
export function PressMarquee() {
  return (
    <section className="relative bg-reps-ink py-14 lg:py-20">
      <p className="text-center text-[10.5px] font-semibold uppercase tracking-[0.32em] text-white/45">
        As featured in
      </p>

      <div className="mx-auto mt-9 max-w-7xl lg:mt-11">
        <div
          className="relative overflow-hidden"
          style={{
            // Soft edge fades — narrow enough not to clip the leading wordmark.
            maskImage:
              "linear-gradient(to right, transparent 0, black 4rem, black calc(100% - 4rem), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, black 4rem, black calc(100% - 4rem), transparent 100%)",
          }}
        >
          <div className="press-marquee-track flex w-max items-center gap-16 pl-16 text-white/55 lg:gap-24 lg:pl-24">
            {[...PRESS_WORDMARKS, ...PRESS_WORDMARKS].map(
              ({ key, Mark, widthClass }, i) => (
                <Mark
                  key={`${key}-${i}`}
                  className={`h-7 shrink-0 lg:h-8 ${widthClass}`}
                />
              ),
            )}
          </div>
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
