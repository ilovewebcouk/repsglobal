import * as React from "react";
import { MAX_SPECIALISMS, SPECIALISMS, type SpecialismSlug } from "@/lib/specialisms";

/**
 * Shared specialisms chip picker.
 * Used by both the Public Profile editor (section 05) and the new
 * Services page (`/dashboard/services`) so they stay in sync.
 */
export function SpecialismsPicker({
  values,
  onChange,
  max = MAX_SPECIALISMS,
}: {
  values: SpecialismSlug[];
  onChange: (next: SpecialismSlug[]) => void;
  max?: number;
}) {
  const atMax = values.length >= max;
  const toggle = (slug: SpecialismSlug) => {
    if (values.includes(slug)) {
      onChange(values.filter((v) => v !== slug));
      return;
    }
    if (atMax) return;
    onChange([...values, slug]);
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {SPECIALISMS.map((s) => {
          const active = values.includes(s.slug);
          const disabled = !active && atMax;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => toggle(s.slug)}
              disabled={disabled}
              aria-pressed={active}
              className={
                "h-9 rounded-full border px-3.5 text-[12px] font-semibold transition-colors " +
                (active
                  ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange"
                  : disabled
                    ? "border-reps-border bg-reps-ink text-white/30"
                    : "border-reps-border bg-reps-ink text-white/70 hover:text-white")
              }
            >
              {active ? <span className="mr-1.5">✓</span> : null}
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-white/45">
        {values.length} / {max} selected
        {atMax ? " · max reached" : ""}
      </p>
    </div>
  );
}
