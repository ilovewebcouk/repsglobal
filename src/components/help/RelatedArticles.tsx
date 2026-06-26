import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { HelpArticle } from "@/content/help/types";

export function RelatedArticles({ items }: { items: HelpArticle[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-14">
      <h2 className="font-display text-[20px] font-semibold tracking-tight text-white">
        Related articles
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((a) => (
          <li key={a.slug}>
            <Link
              to="/help/$category/$slug"
              params={{ category: a.category, slug: a.slug }}
              className="group flex items-start justify-between gap-4 rounded-[16px] border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
            >
              <div className="min-w-0">
                <p className="text-[14.5px] font-semibold text-white">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-[13px] text-white/65">{a.summary}</p>
              </div>
              <ArrowUpRight className="size-4 shrink-0 text-white/40 transition-colors group-hover:text-white" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
