import { Delta } from "./Delta";

export function StatTile({
  label,
  value,
  delta,
  positive = true,
}: {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-white/55">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-[16px] font-bold leading-none text-white">
          {value}
        </span>
        <Delta value={delta} positive={positive} />
      </div>
    </div>
  );
}
