import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
} from "@/components/ui/field";
import {
  ACADEMY_PROVIDERS,
  DELIVERY_LABELS,
  LEVEL_LABELS,
  PROFESSION_LABELS,
  type AcademyDelivery,
  type AcademyLevel,
  type AcademyProfession,
} from "@/lib/training-academy";

export type AcademyFilterState = {
  query: string;
  profession: AcademyProfession | "all";
  level: AcademyLevel | "all";
  delivery: AcademyDelivery | "all";
  cpdMin: "any" | "5" | "10" | "20";
  providers: string[];
  ofqualOnly: boolean;
};

export const DEFAULT_FILTERS: AcademyFilterState = {
  query: "",
  profession: "all",
  level: "all",
  delivery: "all",
  cpdMin: "any",
  providers: [],
  ofqualOnly: false,
};

export function isDefaultFilters(v: AcademyFilterState) {
  return (
    v.query === "" &&
    v.profession === "all" &&
    v.level === "all" &&
    v.delivery === "all" &&
    v.cpdMin === "any" &&
    v.providers.length === 0 &&
    v.ofqualOnly === false
  );
}

interface Props {
  value: AcademyFilterState;
  onChange: (next: AcademyFilterState) => void;
}

export function AcademyFilterRail({ value, onChange }: Props) {
  const patch = (partial: Partial<AcademyFilterState>) =>
    onChange({ ...value, ...partial });

  const toggleProvider = (slug: string, checked: boolean) => {
    const next = checked
      ? [...value.providers, slug]
      : value.providers.filter((p) => p !== slug);
    patch({ providers: next });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Profession */}
      <FieldSet>
        <FieldLegend className="text-[12px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
          Profession
        </FieldLegend>
        <RadioGroup
          value={value.profession}
          onValueChange={(v) =>
            patch({ profession: v as AcademyFilterState["profession"] })
          }
          className="mt-2 flex flex-col gap-2"
        >
          <RadioRow id="prof-all" value="all" label="All professions" />
          {(Object.keys(PROFESSION_LABELS) as AcademyProfession[]).map((k) => (
            <RadioRow key={k} id={`prof-${k}`} value={k} label={PROFESSION_LABELS[k]} />
          ))}
        </RadioGroup>
      </FieldSet>

      <Separator />

      {/* Level */}
      <FieldSet>
        <FieldLegend className="text-[12px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
          Level
        </FieldLegend>
        <RadioGroup
          value={value.level}
          onValueChange={(v) => patch({ level: v as AcademyFilterState["level"] })}
          className="mt-2 flex flex-col gap-2"
        >
          <RadioRow id="lvl-all" value="all" label="All levels" />
          {(Object.keys(LEVEL_LABELS) as AcademyLevel[]).map((k) => (
            <RadioRow key={k} id={`lvl-${k}`} value={k} label={LEVEL_LABELS[k]} />
          ))}
        </RadioGroup>
      </FieldSet>

      <Separator />

      {/* Delivery */}
      <FieldSet>
        <FieldLegend className="text-[12px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
          Delivery
        </FieldLegend>
        <RadioGroup
          value={value.delivery}
          onValueChange={(v) =>
            patch({ delivery: v as AcademyFilterState["delivery"] })
          }
          className="mt-2 flex flex-col gap-2"
        >
          <RadioRow id="del-all" value="all" label="Any delivery" />
          {(Object.keys(DELIVERY_LABELS) as AcademyDelivery[]).map((k) => (
            <RadioRow key={k} id={`del-${k}`} value={k} label={DELIVERY_LABELS[k]} />
          ))}
        </RadioGroup>
      </FieldSet>

      <Separator />

      {/* CPD points */}
      <FieldSet>
        <FieldLegend className="text-[12px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
          CPD points
        </FieldLegend>
        <RadioGroup
          value={value.cpdMin}
          onValueChange={(v) => patch({ cpdMin: v as AcademyFilterState["cpdMin"] })}
          className="mt-2 flex flex-col gap-2"
        >
          <RadioRow id="cpd-any" value="any" label="Any" />
          <RadioRow id="cpd-5" value="5" label="5+ points" />
          <RadioRow id="cpd-10" value="10" label="10+ points" />
          <RadioRow id="cpd-20" value="20" label="20+ points" />
        </RadioGroup>
      </FieldSet>

      <Separator />

      {/* Ofqual */}
      <FieldSet>
        <FieldLegend className="text-[12px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
          Regulation
        </FieldLegend>
        <Field orientation="horizontal" className="mt-3">
          <Checkbox
            id="ofqual-only"
            checked={value.ofqualOnly}
            onCheckedChange={(c) => patch({ ofqualOnly: c === true })}
          />
          <Label htmlFor="ofqual-only" className="text-[13.5px] font-normal text-reps-charcoal">
            Ofqual-regulated only
          </Label>
        </Field>
      </FieldSet>

      <Separator />

      {/* Provider */}
      <FieldSet>
        <FieldLegend className="text-[12px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
          Training provider
        </FieldLegend>
        <FieldGroup className="mt-2 gap-2">
          {ACADEMY_PROVIDERS.map((p) => {
            const id = `prov-${p.slug}`;
            const checked = value.providers.includes(p.slug);
            return (
              <Field key={p.slug} orientation="horizontal">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(c) => toggleProvider(p.slug, c === true)}
                />
                <Label htmlFor={id} className="text-[13.5px] font-normal text-reps-charcoal">
                  {p.name}
                </Label>
              </Field>
            );
          })}
        </FieldGroup>
      </FieldSet>

      {!isDefaultFilters(value) ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="h-10 justify-start rounded-[10px] px-3 text-[13px] font-semibold text-reps-charcoal hover:bg-reps-stone/40 shadow-none"
        >
          <X data-icon="inline-start" />
          Reset all filters
        </Button>
      ) : null}
    </div>
  );
}

function RadioRow({ id, value, label }: { id: string; value: string; label: string }) {
  return (
    <Field orientation="horizontal">
      <RadioGroupItem id={id} value={value} />
      <Label htmlFor={id} className="text-[13.5px] font-normal text-reps-charcoal">
        {label}
      </Label>
    </Field>
  );
}
