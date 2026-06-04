import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

export function LegalShell({
  eyebrow,
  title,
  lastUpdated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-reps-warm-white text-reps-charcoal">
      <div className="bg-reps-ink text-reps-text">
        <PublicHeader variant="solid" />
        <div className="mx-auto max-w-[1320px] px-6 pb-14 pt-10 lg:px-10">
          <span className="inline-flex items-center rounded-full bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-orange">
            {eyebrow}
          </span>
          <h1 className="mt-4 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.02em] text-white lg:text-[52px]">
            {title}
          </h1>
          <p className="mt-4 max-w-[760px] text-[15px] leading-relaxed text-white/70">{intro}</p>
          <p className="mt-5 text-[12px] uppercase tracking-[0.08em] text-white/45">
            Last updated · {lastUpdated}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1320px] gap-12 px-6 py-16 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-10">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <div className="rounded-[18px] border border-reps-stone bg-white p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
              On this page
            </div>
            <ul className="mt-3 space-y-2">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block text-[13px] leading-snug text-reps-charcoal hover:text-reps-orange"
                  >
                    <span className="mr-2 text-reps-muted-light">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="min-w-0">
          <div className="space-y-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-[14px] font-semibold text-reps-orange">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-[24px] font-bold leading-tight text-reps-charcoal">
                    {s.title}
                  </h2>
                </div>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-reps-charcoal/85">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>

      <PublicFooter />
    </div>
  );
}
