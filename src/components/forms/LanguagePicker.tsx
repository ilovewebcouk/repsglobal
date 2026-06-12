import * as React from "react";
import { Check, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES, MAX_LANGUAGES } from "@/lib/languages";

// Top-pinned popular languages — covers >80% of trainers globally.
const POPULAR = [
  "English",
  "Spanish",
  "French",
  "German",
  "Arabic",
  "Mandarin",
  "Portuguese",
  "Polish",
] as const;

type Props = {
  values: string[];
  onChange: (next: string[]) => void;
};

/**
 * Inline slot picker — up to MAX_LANGUAGES.
 * Filled slots = solid orange pills with × to clear.
 * Empty slot = dashed ghost pill that opens an inline dark Select.
 */
export function LanguagePicker({ values, onChange }: Props) {
  const remaining = MAX_LANGUAGES - values.length;
  const showGhost = remaining > 0;

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
            onPick={(lang) => onChange([...values, lang])}
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

const itemClass =
  "text-white/85 text-[13px] data-[highlighted]:bg-white/8 data-[highlighted]:text-white data-[state=checked]:text-reps-orange focus:bg-white/8 focus:text-white";

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

  const availablePopular = POPULAR.filter((l) => !taken.includes(l));
  const availableRest = LANGUAGES
    .filter((l) => !taken.includes(l) && !POPULAR.includes(l as (typeof POPULAR)[number]))
    .slice()
    .sort((a, b) => a.localeCompare(b));

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
        className="h-9 w-auto gap-1.5 rounded-full border border-dashed border-reps-border bg-transparent pl-3 pr-3 text-[12.5px] font-semibold text-white/60 shadow-none hover:border-reps-orange-border/60 hover:text-white focus:ring-0 focus:ring-offset-0 data-[state=open]:border-reps-orange-border data-[state=open]:text-white [&>svg:last-child]:hidden"
        aria-label={isFirst ? "Add language" : "Add another language"}
      >
        <Plus className="size-3.5" />
        <SelectValue placeholder={isFirst ? "Add language" : "Add another"} />
      </SelectTrigger>
      <SelectContent
        className="max-h-[300px] min-w-[220px] rounded-[12px] border border-reps-border bg-reps-panel p-1 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
      >
        {availablePopular.length > 0 ? (
          <SelectGroup>
            {availablePopular.map((lang) => (
              <LanguageRow key={lang} value={lang} />
            ))}
          </SelectGroup>
        ) : null}
        {availablePopular.length > 0 && availableRest.length > 0 ? (
          <SelectSeparator className="bg-white/10" />
        ) : null}
        {availableRest.length > 0 ? (
          <SelectGroup>
            {availableRest.map((lang) => (
              <LanguageRow key={lang} value={lang} />
            ))}
          </SelectGroup>
        ) : null}
      </SelectContent>
    </Select>
  );
}

function LanguageRow({ value }: { value: string }) {
  return (
    <SelectItem
      value={value}
      className={itemClass + " [&_svg]:text-reps-orange"}
    >
      {value}
    </SelectItem>
  );
}
