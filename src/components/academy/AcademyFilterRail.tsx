import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FieldGroup, Field } from "@/components/ui/field";
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

/**
 * Facet rail rendered as an accordion so it fits inside a sticky sidebar
 * without overflowing the viewport. Profession + Level open by default —
 * they're the two facets most people reach for first.
 */
export function AcademyFilterRail({ value, onChange }: Props) {
  const patch = (partial: Partial<AcademyFilterState>) =>
    onChange({ ...value, ...partial });

  const toggleProvider = (slug: string, checked: boolean) => {
    const next = checked
      ? [...value.providers, slug]
      : value.providers.filter((p) => p !== slug);
    patch({ providers: next });
  };

  // Count of active (non-default) selections per section, for the badge.
  const counts = {
    profession: value.profession !== "all" ? 1 : 0,
    level: value.level !== "all" ? 1 : 0,
    delivery: value.delivery !== "all" ? 1 : 0,
    cpd: value.cpdMin !== "any" ? 1 : 0,
    regulation: value.ofqualOnly ? 1 : 0,
    provider: value.providers.length,
  };

  return (
    <div className="flex flex-col">
      <Accordion
        type="multiple"
        defaultValue={["profession", "level"]}
        className="w-full"
      >
        <AcademySection id="profession" title="Profession" count={counts.profession}>
          <RadioGroup
            value={value.profession}
            onValueChange={(v) =>
              patch({ profession: v as AcademyFilterState["profession"] })
            }
            className="flex flex-col gap-2"
          >
            <RadioRow id="prof-all" value="all" label="All professions" />
            {(Object.keys(PROFESSION_LABELS) as AcademyProfession[]).map((k) => (
              <RadioRow key={k} id={`prof-${k}`} value={k} label={PROFESSION_LABELS[k]} />
            ))}
          </RadioGroup>
        </AcademySection>

        <AcademySection id="level" title="Level" count={counts.level}>
          <RadioGroup
            value={value.level}
            onValueChange={(v) => patch({ level: v as AcademyFilterState["level"] })}
            className="flex flex-col gap-2"
          >
            <RadioRow id="lvl-all" value="all" label="All levels" />
            {(Object.keys(LEVEL_LABELS) as AcademyLevel[]).map((k) => (
              <RadioRow key={k} id={`lvl-${k}`} value={k} label={LEVEL_LABELS[k]} />
            ))}
          </RadioGroup>
        </AcademySection>

        <AcademySection id="delivery" title="Delivery" count={counts.delivery}>
          <RadioGroup
            value={value.delivery}
            onValueChange={(v) =>
              patch({ delivery: v as AcademyFilterState["delivery"] })
            }
            className="flex flex-col gap-2"
          >
            <RadioRow id="del-all" value="all" label="Any delivery" />
            {(Object.keys(DELIVERY_LABELS) as AcademyDelivery[]).map((k) => (
              <RadioRow key={k} id={`del-${k}`} value={k} label={DELIVERY_LABELS[k]} />
            ))}
          </RadioGroup>
        </AcademySection>

        <AcademySection id="cpd" title="CPD points" count={counts.cpd}>
          <RadioGroup
            value={value.cpdMin}
            onValueChange={(v) => patch({ cpdMin: v as AcademyFilterState["cpdMin"] })}
            className="flex flex-col gap-2"
          >
            <RadioRow id="cpd-any" value="any" label="Any" />
            <RadioRow id="cpd-5" value="5" label="5+ points" />
            <RadioRow id="cpd-10" value="10" label="10+ points" />
            <RadioRow id="cpd-20" value="20" label="20+ points" />
          </RadioGroup>
        </AcademySection>

        <AcademySection id="regulation" title="Regulation" count={counts.regulation}>
          <Field orientation="horizontal">
            <Checkbox
              id="ofqual-only"
              checked={value.ofqualOnly}
              onCheckedChange={(c) => patch({ ofqualOnly: c === true })}
            />
            <Label
              htmlFor="ofqual-only"
              className="text-[13.5px] font-normal text-reps-charcoal"
            >
              Ofqual-regulated only
            </Label>
          </Field>
        </AcademySection>

        <AcademySection id="provider" title="Training provider" count={counts.provider}>
          <FieldGroup className="gap-2">
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
        </AcademySection>
      </Accordion>

      {!isDefaultFilters(value) ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="mt-4 h-10 justify-start rounded-[10px] px-3 text-[13px] font-semibold text-reps-charcoal hover:bg-reps-stone/40 shadow-none"
        >
          <X data-icon="inline-start" />
          Reset all filters
        </Button>
      ) : null}
    </div>
  );
}

function AcademySection({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={id} className="border-black/10">
      <AccordionTrigger className="py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light hover:no-underline">
        <span className="flex items-center gap-2">
          {title}
          {count > 0 ? (
            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF7A00] px-1.5 text-[10.5px] font-bold text-white">
              {count}
            </span>
          ) : null}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-4">{children}</AccordionContent>
    </AccordionItem>
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
