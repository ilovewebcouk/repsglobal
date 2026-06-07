import { createFileRoute } from "@tanstack/react-router";
import { RepsCredentialSeal } from "@/components/brand/RepsCredentialSeal";

export const Route = createFileRoute("/seal-preview")({
  head: () => ({
    meta: [
      { title: "Seal preview — REPs" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SealPreviewPage,
});

function SealPreviewPage() {
  return (
    <div className="min-h-screen bg-reps-ivory text-reps-charcoal">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="mb-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
            Internal · sandbox
          </p>
          <h1 className="mt-2 font-display text-[34px] font-bold leading-tight">
            REPs Credential Seal — preview
          </h1>
          <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-reps-muted-light">
            One example: Level 3 Personal Trainer, REPs Registered, Est. 2002.
            Rendered at three sizes on both light and dark backgrounds to
            judge legibility of the curved text and ring weights.
          </p>
        </header>

        {/* Light variant */}
        <section className="rounded-[22px] border border-reps-stone bg-reps-warm-white p-10">
          <h2 className="font-display text-[18px] font-semibold">Dark variant on ivory</h2>
          <p className="mt-1 text-[13px] text-reps-muted-light">
            Default. Ink on ivory — the credential mark.
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-12">
            <figure className="flex flex-col items-center gap-3">
              <RepsCredentialSeal qualification="Level 3 Personal Trainer" size={96} />
              <figcaption className="text-[11px] uppercase tracking-wider text-reps-muted-light">
                96 px · badge
              </figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-3">
              <RepsCredentialSeal qualification="Level 3 Personal Trainer" size={160} />
              <figcaption className="text-[11px] uppercase tracking-wider text-reps-muted-light">
                160 px · profile
              </figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-3">
              <RepsCredentialSeal qualification="Level 3 Personal Trainer" size={320} />
              <figcaption className="text-[11px] uppercase tracking-wider text-reps-muted-light">
                320 px · hero
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Inverse variant */}
        <section className="mt-8 rounded-[22px] border border-reps-border bg-reps-ink p-10">
          <h2 className="font-display text-[18px] font-semibold text-reps-text">
            Inverse variant on ink
          </h2>
          <p className="mt-1 text-[13px] text-reps-muted">
            Ivory on ink — for dark sections, footers, embroidery references.
          </p>
          <div className="mt-8 flex flex-wrap items-end gap-12">
            <figure className="flex flex-col items-center gap-3">
              <RepsCredentialSeal
                qualification="Level 3 Personal Trainer"
                variant="inverse"
                size={96}
              />
              <figcaption className="text-[11px] uppercase tracking-wider text-reps-muted">
                96 px · badge
              </figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-3">
              <RepsCredentialSeal
                qualification="Level 3 Personal Trainer"
                variant="inverse"
                size={160}
              />
              <figcaption className="text-[11px] uppercase tracking-wider text-reps-muted">
                160 px · profile
              </figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-3">
              <RepsCredentialSeal
                qualification="Level 3 Personal Trainer"
                variant="inverse"
                size={320}
              />
              <figcaption className="text-[11px] uppercase tracking-wider text-reps-muted">
                320 px · hero
              </figcaption>
            </figure>
          </div>
        </section>
      </div>
    </div>
  );
}
