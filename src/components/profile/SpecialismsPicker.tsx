import * as React from "react";
import {
  MAX_SPECIALISMS,
  getSpecialismsForProfession,
} from "@/lib/specialisms";
import type { ProfessionSlug } from "@/lib/professions";

/**
 * Shared profession-scoped specialisms chip picker.
 *
 * Each profession unlocks its own catalogue. Pass `profession` so the
 * picker only renders relevant specialisms; when null, shows an empty
 * state asking the user to set their profession first.
 *
 * Used by both the Public Profile editor (section 05) and the
 * Services page (`/dashboard/services`) so they stay in sync.
 */
export function SpecialismsPicker({
  values,
  onChange,
  profession,
  max = MAX_SPECIALISMS,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  profession: ProfessionSlug | null;
  max?: number;
}) {
  const options = React.useMemo(
    () => getSpecialismsForProfession(profession),
    [profession],
  );
  const atMax = values.length >= max;

  if (!profession) {
    return (
      <div className="rounded-[12px] border border-dashed border-reps-border bg-reps-ink/40 p-4 text-[12px] text-white/55">
        Set your profession above to unlock specialisms.
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-reps-border bg-reps-ink/40 p-4 text-[12px] text-white/55">
        No specialisms available for this profession yet.
      </div>
    );
  }

  const toggle = (slug: string) => {
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
        {options.map((s) => {
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
