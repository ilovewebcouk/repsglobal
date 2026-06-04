const LOGOS = [
  "The Times",
  "BBC Sport",
  "Men's Health",
  "Women's Fitness",
  "Runner's World",
  "GQ",
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

      <div className="mx-auto mt-8 max-w-7xl px-6 lg:mt-10 lg:px-8">
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          }}
        >
          <div className="press-marquee-track flex w-max items-center gap-16 lg:gap-24">
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="shrink-0 whitespace-nowrap text-[14px] font-semibold uppercase tracking-[0.18em] text-white/70 lg:text-[15px]"
              >
                {name}
              </span>
            ))}
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
