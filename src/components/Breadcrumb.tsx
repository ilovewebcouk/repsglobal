import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  to?: string;
  params?: Record<string, string>;
};

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

/**
 * Shared breadcrumb (light surface).
 * Style matches /professions/$profession: 12px, muted, chevron separators,
 * final crumb is the current page (no link, charcoal medium weight).
 */
export function Breadcrumb({ items, className }: Props) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1.5 text-[12px] text-reps-muted-light",
        className,
      )}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {isLast || !item.to ? (
              <span
                aria-current={isLast ? "page" : undefined}
                className={isLast ? "font-medium text-reps-charcoal" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                params={item.params as never}
                className="hover:text-reps-charcoal transition-colors"
              >
                {item.label}
              </Link>
            )}
            {!isLast && <ChevronRight className="h-3 w-3" aria-hidden />}
          </Fragment>
        );
      })}
    </nav>
  );
}
