/**
 * <TimeAgo iso="..." /> — Sub-pass 0e.
 *
 * Renders relative time (`5m`, `3h`, `2d`) with a full date + HH:MM tooltip
 * via shadcn Tooltip. Semantic `<time dateTime>` for SEO/a11y.
 */

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { absoluteDateTime, relativeTime } from "@/lib/verification/format-time";

export function TimeAgo({
  iso,
  suffix = " ago",
  className,
}: {
  iso: string | null | undefined;
  suffix?: string;
  className?: string;
}) {
  if (!iso) return <span className={className}>—</span>;
  const abs = absoluteDateTime(iso);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time dateTime={iso} className={className}>
          {relativeTime(iso)}
          {suffix}
        </time>
      </TooltipTrigger>
      <TooltipContent>{abs}</TooltipContent>
    </Tooltip>
  );
}
