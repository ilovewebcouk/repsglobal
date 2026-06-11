import * as React from "react";

const TOOLS = [
  "Trainerize",
  "Calendly",
  "Stripe Billing",
  "MyFitnessPal",
  "Mailchimp",
  "your CRM",
];

export function ReplacesStrip() {
  return (
    <div className="rounded-[22px] border border-reps-border bg-reps-panel p-8 lg:p-10">
      <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="shrink-0">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
            One platform
          </span>
          <h3 className="mt-1 font-display text-[22px] font-bold leading-tight text-white lg:text-[26px]">
            REPS replaces<span className="text-reps-orange">.</span>
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {TOOLS.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-reps-border bg-reps-ink px-3.5 py-1.5 text-[13px] font-medium text-white/55 line-through decoration-reps-orange/70 decoration-[1.5px] underline-offset-2"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-5 text-[13px] text-white/55 lg:max-w-[640px]">
        Stop paying six subscriptions to do one job. Bookings, payments, programmes,
        nutrition, follow-ups and your CRM — one record, one login, one bill.
      </p>
    </div>
  );
}
