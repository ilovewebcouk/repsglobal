import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  provider: string | "all";
};

export const DEFAULT_FILTERS: AcademyFilterState = {
  query: "",
  profession: "all",
  level: "all",
  delivery: "all",
  cpdMin: "any",
  provider: "all",
};

interface AcademyFiltersProps {
  value: AcademyFilterState;
  onChange: (next: AcademyFilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export function AcademyFilters({
  value,
  onChange,
  totalCount,
  filteredCount,
}: AcademyFiltersProps) {
  const patch = (partial: Partial<AcademyFilterState>) =>
    onChange({ ...value, ...partial });
  const isDefault =
    value.query === "" &&
    value.profession === "all" &&
    value.level === "all" &&
    value.delivery === "all" &&
    value.cpdMin === "any" &&
    value.provider === "all";

  return (
    <div className="sticky top-[72px] z-30 border-b border-reps-border bg-reps-ink/95 backdrop-blur">
      <div className="mx-auto max-w-[1320px] px-6 py-4 lg:px-10">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))_auto]">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              value={value.query}
              onChange={(e) => patch({ query: e.target.value })}
              placeholder="Search courses…"
              className="h-11 rounded-[12px] border-reps-border bg-reps-panel/50 pl-9 text-[13.5px] text-white placeholder:text-white/40"
            />
          </div>

          <Select
            value={value.profession}
            onValueChange={(v) =>
              patch({ profession: v as AcademyFilterState["profession"] })
            }
          >
            <SelectTrigger className="h-11 rounded-[12px] border-reps-border bg-reps-panel/50 text-[13.5px] text-white">
              <SelectValue placeholder="Profession" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All professions</SelectItem>
                {(Object.keys(PROFESSION_LABELS) as AcademyProfession[]).map(
                  (k) => (
                    <SelectItem key={k} value={k}>
                      {PROFESSION_LABELS[k]}
                    </SelectItem>
                  ),
                )}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={value.level}
            onValueChange={(v) =>
              patch({ level: v as AcademyFilterState["level"] })
            }
          >
            <SelectTrigger className="h-11 rounded-[12px] border-reps-border bg-reps-panel/50 text-[13.5px] text-white">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All levels</SelectItem>
                {(Object.keys(LEVEL_LABELS) as AcademyLevel[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {LEVEL_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={value.delivery}
            onValueChange={(v) =>
              patch({ delivery: v as AcademyFilterState["delivery"] })
            }
          >
            <SelectTrigger className="h-11 rounded-[12px] border-reps-border bg-reps-panel/50 text-[13.5px] text-white">
              <SelectValue placeholder="Delivery" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Any delivery</SelectItem>
                {(Object.keys(DELIVERY_LABELS) as AcademyDelivery[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {DELIVERY_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={value.cpdMin}
            onValueChange={(v) =>
              patch({ cpdMin: v as AcademyFilterState["cpdMin"] })
            }
          >
            <SelectTrigger className="h-11 rounded-[12px] border-reps-border bg-reps-panel/50 text-[13.5px] text-white">
              <SelectValue placeholder="CPD points" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="any">Any CPD points</SelectItem>
                <SelectItem value="5">5+ CPD points</SelectItem>
                <SelectItem value="10">10+ CPD points</SelectItem>
                <SelectItem value="20">20+ CPD points</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={value.provider}
            onValueChange={(v) => patch({ provider: v })}
          >
            <SelectTrigger className="h-11 rounded-[12px] border-reps-border bg-reps-panel/50 text-[13.5px] text-white">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All providers</SelectItem>
                {ACADEMY_PROVIDERS.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            disabled={isDefault}
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="h-11 rounded-[10px] px-4 text-[13px] font-semibold text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <X data-icon="inline-start" />
            Reset
          </Button>
        </div>

        <p className="mt-3 text-[12px] text-white/55">
          Showing{" "}
          <span className="font-semibold text-white/85">{filteredCount}</span>{" "}
          of {totalCount} endorsed courses
        </p>
      </div>
    </div>
  );
}
