import { TrendingDown, TrendingUp } from "lucide-react";

export function Delta({
  value,
  positive = true,
}: {
  value: string;
  positive?: boolean;
}) {
  const Icon = positive ? TrendingUp : TrendingDown;
  const color = positive ? "text-reps-green" : "text-reps-red";
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${color}`}>
      <Icon className="h-3 w-3" /> {value}
    </span>
  );
}
