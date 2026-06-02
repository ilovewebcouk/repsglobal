import { FAQ } from "./pricing-data";

export function PricingFAQ() {
  return (
    <div>
      <h2 className="font-display text-[28px] font-bold text-white">Frequently asked</h2>
      <div className="mt-8 divide-y divide-reps-border overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
        {FAQ.map((item) => (
          <details key={item.q} className="group px-6 py-5 [&_summary]:list-none">
            <summary className="flex cursor-pointer items-start justify-between gap-4 text-[15px] font-semibold text-white">
              {item.q}
              <span className="text-reps-orange transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-[13px] leading-relaxed text-white/65">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
