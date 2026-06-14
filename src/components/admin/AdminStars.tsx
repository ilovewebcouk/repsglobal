import { Star } from "lucide-react";

export function AdminStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.round(value)
              ? "fill-reps-orange text-reps-orange"
              : "text-white/20"
          }`}
        />
      ))}
    </span>
  );
}
