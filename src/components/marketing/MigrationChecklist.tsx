import type { MigrationStep } from "@/data/competitor-editorial";

export function MigrationChecklist({
  competitorName,
  steps,
}: {
  competitorName: string;
  steps: MigrationStep[];
}) {
  return (
    <div className="rounded-[22px] border border-reps-border bg-reps-panel p-6 lg:p-10">
      <div className="max-w-[760px]">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
          The migration guide
        </span>
        <h2 className="mt-2 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
          Move from {competitorName} to REPs in a weekend.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-white/65">
          You don&apos;t have to rebuild everything. Five steps, one weekend,
          zero client downtime. Run both platforms in parallel for the first
          week as a safety net.
        </p>
      </div>

      <ol className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))]">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="flex flex-col rounded-[18px] border border-reps-border bg-reps-ink p-5"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-reps-orange text-[12px] font-bold text-white">
              {i + 1}
            </span>
            <h3 className="mt-3 font-display text-[15px] font-bold text-white">
              {s.title}
            </h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/65">
              {s.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
