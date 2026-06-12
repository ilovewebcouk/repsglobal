import * as React from "react";
import { Check, Plus, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { LANGUAGES, MAX_LANGUAGES } from "@/lib/languages";

type Props = {
  values: string[];
  onChange: (next: string[]) => void;
};

export function LanguagePicker({ values, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const atMax = values.length >= MAX_LANGUAGES;

  const toggle = (lang: string) => {
    if (values.includes(lang)) {
      onChange(values.filter((v) => v !== lang));
      return;
    }
    if (atMax) return;
    onChange([...values, lang]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-reps-orange-border bg-reps-orange-soft pl-3 pr-2 text-[12px] font-semibold text-reps-orange"
          >
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="flex h-5 w-5 items-center justify-center rounded-full text-reps-orange/70 hover:bg-reps-orange/10 hover:text-reps-orange"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={atMax}
              className={
                "inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed px-3 text-[12px] font-semibold transition-colors " +
                (atMax
                  ? "cursor-not-allowed border-reps-border text-white/30"
                  : "border-reps-border bg-reps-ink text-white/70 hover:border-reps-orange-border hover:text-white")
              }
            >
              <Plus className="h-3.5 w-3.5" />
              {values.length === 0 ? "Add language" : "Add another"}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[260px] rounded-[12px] border-reps-border bg-reps-panel p-0"
          >
            <Command className="bg-transparent">
              <CommandInput placeholder="Search languages…" className="text-[13px]" />
              <CommandList>
                <CommandEmpty className="py-4 text-[12px] text-white/55">
                  No matches.
                </CommandEmpty>
                <CommandGroup>
                  {LANGUAGES.map((lang) => {
                    const selected = values.includes(lang);
                    const disabled = !selected && atMax;
                    return (
                      <CommandItem
                        key={lang}
                        value={lang}
                        disabled={disabled}
                        onSelect={() => {
                          toggle(lang);
                        }}
                        className="flex items-center justify-between gap-2 text-[13px]"
                      >
                        <span>{lang}</span>
                        {selected ? (
                          <Check className="h-3.5 w-3.5 text-reps-orange" />
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-[11px] text-white/45">
        {values.length} / {MAX_LANGUAGES} selected
        {atMax ? " · max reached" : ""}
      </p>
    </div>
  );
}
