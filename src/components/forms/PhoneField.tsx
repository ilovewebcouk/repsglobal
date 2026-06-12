import * as React from "react";
import PhoneInput, {
  type Country,
  type Value,
} from "react-phone-number-input/input";
import flags from "react-phone-number-input/flags";
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Dark-theme international phone field for the REPS dashboard.
 *
 * - Stores E.164 strings (e.g. "+447911123456") via `onChange`.
 * - Country picker uses shadcn Select for theme consistency.
 * - The phone input itself uses react-phone-number-input's controlled
 *   <PhoneInput /> from the `/input` entry point (no library CSS imported).
 */

export type PhoneFieldProps = {
  value: string;
  onChange: (next: string) => void;
  defaultCountry?: Country;
  invalid?: boolean;
  placeholder?: string;
  id?: string;
};

// Memoised, sorted country list with calling codes pre-resolved.
const COUNTRY_OPTIONS = (() => {
  const list = getCountries().map((c) => ({
    code: c as Country,
    name: (en as Record<string, string>)[c] ?? c,
    dial: `+${getCountryCallingCode(c as Country)}`,
  }));
  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
})();

export function PhoneField({
  value,
  onChange,
  defaultCountry = "GB",
  invalid,
  placeholder = "07911 123456",
  id,
}: PhoneFieldProps) {
  const [country, setCountry] = React.useState<Country>(defaultCountry);

  const FlagFor = flags[country];

  return (
    <div
      className={cn(
        "flex h-10 items-center gap-2 rounded-[12px] border bg-reps-ink pl-2 pr-3 text-[13px] text-white transition-colors",
        invalid
          ? "border-red-400/60"
          : "border-reps-border focus-within:border-white/25",
      )}
    >
      <Select
        value={country}
        onValueChange={(v) => setCountry(v as Country)}
      >
        <SelectTrigger
          aria-label="Country"
          className="h-8 w-auto gap-1.5 rounded-[8px] border-0 bg-transparent px-2 py-0 text-[12px] font-medium text-white/85 shadow-none hover:bg-white/5 focus:ring-0 data-[state=open]:bg-white/10 [&>svg:last-child]:opacity-60"
        >
          {FlagFor ? (
            <span className="inline-flex h-3.5 w-5 overflow-hidden rounded-[2px]">
              <FlagFor title={country} />
            </span>
          ) : null}
          <span className="tabular-nums text-white/70">
            +{getCountryCallingCode(country)}
          </span>
        </SelectTrigger>
        <SelectContent className="max-h-[320px] w-[280px]">
          {COUNTRY_OPTIONS.map((c) => {
            const F = flags[c.code];
            return (
              <SelectItem key={c.code} value={c.code} className="text-[13px]">
                <span className="flex items-center gap-2">
                  {F ? (
                    <span className="inline-flex h-3.5 w-5 overflow-hidden rounded-[2px]">
                      <F title={c.code} />
                    </span>
                  ) : null}
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="tabular-nums text-white/55">{c.dial}</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <span aria-hidden className="h-5 w-px bg-reps-border" />

      <PhoneInput
        id={id}
        country={country}
        international={false}
        value={(value || undefined) as Value | undefined}
        onChange={(v) => onChange((v as string | undefined) ?? "")}
        placeholder={placeholder}
        autoComplete="tel-national"
        aria-invalid={invalid || undefined}
        className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/35 focus:outline-none"
      />
    </div>
  );
}

export { isValidPhoneNumber };
