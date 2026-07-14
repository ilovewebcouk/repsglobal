import type { ReactNode } from "react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalLayoutProps {
  eyebrow?: string;
  title: string;
  lede: string;
  lastUpdated: string;
  sections: LegalSection[];
}

/**
 * Shared shell for /privacy, /terms, /cookies and any future legal page.
 * Operator-editable plain JSX content — no Markdown, no dangerouslySetInnerHTML.
 */
export function LegalLayout({
  eyebrow = "Legal",
  title,
  lede,
  lastUpdated,
  sections,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <PublicHeader variant="solid" />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-reps-border">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_15%,rgba(255,122,0,0.08),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-[1320px] px-6 pt-16 pb-12 lg:px-10 lg:pt-20 lg:pb-16">
          <span className="inline-flex items-center rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
            {eyebrow}
          </span>
          <h1 className="mt-5 font-display text-[36px] font-bold leading-[1.05] tracking-[-0.01em] text-white lg:text-[52px]">
            {title}
          </h1>
          <p className="mt-4 max-w-[760px] text-[16px] leading-relaxed text-white/75">
            {lede}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[18px] border border-reps-border bg-reps-panel/60 px-5 py-4 text-[13px] text-white/70">
            <span>
              <span className="font-semibold text-white">Last updated:</span>{" "}
              {lastUpdated}
            </span>
            <span className="hidden h-3 w-px bg-white/15 sm:inline-block" />
            <span>
              Maintained by REPs. Contact{" "}
              <a
                href="mailto:support@repsuk.org"
                className="font-semibold text-reps-orange hover:underline"
              >
                support@repsuk.org
              </a>
              . Governing law: England & Wales.
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-reps-panel/15">
        <div className="mx-auto grid max-w-[1320px] gap-12 px-6 py-16 lg:grid-cols-[260px_1fr] lg:px-10 lg:py-20">
          {/* ToC */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              On this page
            </p>
            <nav className="mt-4 flex flex-col gap-2 border-l border-reps-border pl-4">
              {sections.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-[13.5px] text-white/70 transition-colors hover:text-reps-orange"
                >
                  <span className="mr-2 text-white/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Prose */}
          <div className="max-w-[760px]">
            <ol className="space-y-12">
              {sections.map((s, i) => (
                <li key={s.id} id={s.id} className="scroll-mt-24">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-[14px] font-semibold text-reps-orange">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h2 className="font-display text-[24px] font-bold leading-tight text-white lg:text-[28px]">
                      {s.title}
                    </h2>
                  </div>
                  <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-white/75 [&_a]:text-reps-orange [&_a]:underline-offset-4 hover:[&_a]:underline [&_strong]:text-white [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5">
                    {s.body}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
