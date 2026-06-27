import { useNavigate } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERIOD_OPTIONS, type PeriodKey } from "@/lib/admin/overview-period";

export function PeriodSelector({ value }: { value: PeriodKey }) {
  const navigate = useNavigate({ from: "/admin" });
  return (
    <Select
      value={value}
      onValueChange={(v) =>
        navigate({
          search: (prev) => ({ ...(prev as object), period: v as PeriodKey }),
        })
      }
    >
      <SelectTrigger
        size="sm"
        className="h-8 w-[160px] rounded-[8px] border-reps-border bg-reps-panel-soft text-[12px] font-semibold text-white/80 shadow-none"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-[12px]">
        {PERIOD_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-[13px]">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
