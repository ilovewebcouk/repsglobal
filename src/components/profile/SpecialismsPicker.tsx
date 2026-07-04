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
 * Used by both the Public Profile editor (section 05) and the Website
 * editor (`/dashboard/website#specialisms`) so they stay in sync.
 */
export function SpecialismsPicker({
  values,
  onChange,
  profession,
  max = MAX_SPECIALISMS,
  hideCounter = false,
  sortSelectedFirst = false,
  onOverCapAttempt,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  profession: ProfessionSlug | null;
  max?: number;
  /** Hide the built-in "N / max selected" footer (host renders its own). */
  hideCounter?: boolean;
  /** Split into "Selected" and "Available" rows, selected on top. */
  sortSelectedFirst?: boolean;
  /** Called when the user taps a chip while already at the cap. */
  onOverCapAttempt?: () => void;
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
    if (atMax) {
      onOverCapAttempt?.();
      return;
    }
    onChange([...values, slug]);
  };

  const chipClass = (active: boolean, disabled: boolean) =>
    "h-9 rounded-full border px-3.5 text-[12px] font-semibold transition-colors " +
    (active
      ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange"
      : disabled
        ? "border-reps-border bg-reps-ink text-white/30"
        : "border-reps-border bg-reps-ink text-white/70 hover:text-white");

  if (sortSelectedFirst) {
    const selected = options.filter((s) => values.includes(s.slug));
    const available = options.filter((s) => !values.includes(s.slug));
    return (
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Selected
            <span className="rounded-full bg-reps-orange-soft px-2 py-0.5 text-[10px] font-bold text-reps-orange">
              {values.length} / {max}
            </span>
          </div>
          {selected.length ? (
            <div className="flex flex-wrap gap-2">
              {selected.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => toggle(s.slug)}
                  aria-pressed
                  title="Tap to remove"
                  className={chipClass(true, false)}
                >
                  <span className="mr-1.5">✓</span>
                  {s.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-reps-border bg-reps-ink/40 px-3 py-2 text-[12px] text-white/55">
              None yet — tap a chip below to add (up to {max}).
            </div>
          )}
        </div>
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
            Available
          </div>
          <div className="flex flex-wrap gap-2">
            {available.map((s) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => toggle(s.slug)}
                disabled={atMax}
                aria-pressed={false}
                title={atMax ? `You can pick up to ${max}` : "Tap to add"}
                className={chipClass(false, atMax)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {!hideCounter && (
          <p className="text-[11px] text-white/45">
            {values.length} / {max} selected
            {atMax ? " · max reached" : ""}
          </p>
        )}
      </div>
    );
  }

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
              className={chipClass(active, disabled)}
            >
              {active ? <span className="mr-1.5">✓</span> : null}
              {s.label}
            </button>
          );
        })}
      </div>
      {!hideCounter && (
        <p className="text-[11px] text-white/45">
          {values.length} / {max} selected
          {atMax ? " · max reached" : ""}
        </p>
      )}
    </div>
  );
}
