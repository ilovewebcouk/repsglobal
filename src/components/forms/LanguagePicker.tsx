import * as React from "react";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, MAX_LANGUAGES } from "@/lib/languages";

type Props = {
  values: string[];
  onChange: (next: string[]) => void;
};

/**
 * Inline slot picker — up to MAX_LANGUAGES.
 * Filled slots show as solid pills with a clear (×) button.
 * Empty slots render a dashed ghost slot that becomes an inline shadcn Select.
 */
export function LanguagePicker({ values, onChange }: Props) {
  const remaining = MAX_LANGUAGES - values.length;
  // Show one ghost slot at a time (the next-to-fill one).
  const showGhost = remaining > 0;

  const setAt = (idx: number, lang: string) => {
    if (values.includes(lang)) return;
    const next = [...values];
    next[idx] = lang;
    onChange(next);
  };

  const removeAt = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {values.map((v, idx) => (
          <span
            key={`${v}-${idx}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-reps-orange-border bg-reps-orange-soft pl-3.5 pr-1.5 text-[12.5px] font-semibold text-reps-orange"
          >
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={() => removeAt(idx)}
              className="flex size-6 items-center justify-center rounded-full text-reps-orange/70 hover:bg-reps-orange/15 hover:text-reps-orange"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        {showGhost ? (
          <GhostSlot
            key={`ghost-${values.length}`}
            taken={values}
            isFirst={values.length === 0}
            onPick={(lang) => setAt(values.length, lang)}
          />
        ) : null}
      </div>
      <p className="text-[11px] text-white/45">
        {values.length} / {MAX_LANGUAGES} selected
        {!showGhost ? " · max reached" : ""}
      </p>
    </div>
  );
}

function GhostSlot({
  taken,
  isFirst,
  onPick,
}: {
  taken: string[];
  isFirst: boolean;
  onPick: (lang: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const available = LANGUAGES.filter((l) => !taken.includes(l));

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value=""
      onValueChange={(v) => {
        if (v) onPick(v);
      }}
    >
      <SelectTrigger
        className="h-9 w-auto gap-1.5 rounded-full border border-dashed border-reps-border bg-transparent pl-3 pr-3 text-[12.5px] font-semibold text-white/60 hover:border-reps-orange-border/60 hover:text-white focus:ring-0 focus:ring-offset-0 data-[state=open]:border-reps-orange-border data-[state=open]:text-white [&>svg:last-child]:hidden"
        aria-label={isFirst ? "Add language" : "Add another language"}
      >
        <Plus className="size-3.5" />
        <SelectValue placeholder={isFirst ? "Add language" : "Add another"} />
      </SelectTrigger>
      <SelectContent className="max-h-[280px] min-w-[200px] rounded-[12px] border-reps-border bg-reps-panel">
        {available.map((lang) => (
          <SelectItem key={lang} value={lang} className="text-[13px]">
            {lang}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
