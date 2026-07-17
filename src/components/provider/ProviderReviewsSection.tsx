import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Star, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { listProviderReviewsPage } from "@/lib/reviews/reviews.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = { slug: string };

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < rating
              ? "h-3.5 w-3.5 fill-[#FF7A00] text-[#FF7A00]"
              : "h-3.5 w-3.5 text-black/20"
          }
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function buildPager(total: number, current: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function ProviderReviewsSection({ slug }: Props) {
  const [page, setPage] = useState(1);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [sort, setSort] = useState<"recent" | "highest" | "lowest">("recent");

  const fetchPage = useServerFn(listProviderReviewsPage);
  const { data, isLoading } = useQuery({
    queryKey: ["provider-reviews-page", slug, page, courseId, sort],
    queryFn: () =>
      fetchPage({
        data: { slug, page, course_id: courseId, sort },
      }),
    placeholderData: (prev) => prev,
  });

  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 0;
  const courses = data?.courses ?? [];

  return (
    <article
      id="learner-reviews"
      className="scroll-mt-28 rounded-[22px] border border-black/10 bg-white p-6 lg:p-8"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-[22px] font-bold text-black lg:text-[26px]">
            Verified learner reviews
          </h2>
          <p className="mt-1 text-[13px] text-black/60">
            {total === 0
              ? "Certificate-verified reviews from learners appear here once published."
              : `${total} ${total === 1 ? "review" : "reviews"}${
                  courses.length > 0
                    ? ` across ${courses.length} ${courses.length === 1 ? "course" : "courses"}`
                    : ""
                } · certificate-verified`}
          </p>
        </div>

        {total > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {courses.length > 0 ? (
              <Select
                value={courseId ?? "all"}
                onValueChange={(v) => {
                  setCourseId(v === "all" ? null : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-[220px] rounded-[12px] border-black/15 bg-white text-[13px]">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.course_id} value={c.course_id}>
                      {c.course_title} ({c.review_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v as "recent" | "highest" | "lowest");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-[12px] border-black/15 bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="highest">Highest rated</SelectItem>
                <SelectItem value="lowest">Lowest rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </header>

      {/* List */}
      <div className="mt-6 space-y-4">
        {isLoading && reviews.length === 0 ? (
          <div className="flex min-h-[160px] items-center justify-center rounded-[18px] border border-dashed border-black/15 text-[13px] text-black/50">
            Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex min-h-[160px] items-center justify-center rounded-[18px] border border-dashed border-black/15 px-6 text-center">
            <p className="text-[13.5px] text-black/60">
              No reviews yet. Verified learner reviews appear here after a certificate is
              printed.
            </p>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-[18px] border border-black/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <StarRow rating={r.rating} />
                  <span className="text-[13px] font-semibold text-black">
                    {r.reviewer_name ?? "Learner"}
                  </span>
                </div>
                <span className="text-[12px] text-black/50">
                  {formatDate(r.published_at)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {r.course_title ? (
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-[#f2f1ec] px-2 py-0.5 text-[11px] font-semibold text-black/70">
                    {r.course_title}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <BadgeCheck className="h-3 w-3" strokeWidth={2.4} />
                  Verified learner
                </span>
              </div>

              {r.title ? (
                <p className="mt-3 text-[14px] font-semibold text-black">{r.title}</p>
              ) : null}
              <p className="mt-2 whitespace-pre-line text-[13.5px] leading-[1.6] text-black/75">
                {r.body}
              </p>

              {r.response ? (
                <div className="mt-4 rounded-[14px] border border-black/10 bg-[#f7f6f2] p-4">
                  <p className="text-[11.5px] font-bold uppercase tracking-wide text-black/55">
                    Provider response
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-[13px] leading-[1.55] text-black/75">
                    {r.response}
                  </p>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Pager */}
      {totalPages > 1 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px] text-black/55">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/10 bg-white text-black/60 transition-colors hover:bg-[#f7f6f2] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            {buildPager(totalPages, page).map((p, i) =>
              p === "…" ? (
                <span key={`e-${i}`} className="px-1 text-[13px] text-black/40">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={
                    p === page
                      ? "inline-flex h-9 min-w-9 items-center justify-center rounded-[10px] border border-[#FF7A00] bg-[#FF7A00] px-2 text-[13px] font-semibold text-white"
                      : "inline-flex h-9 min-w-9 items-center justify-center rounded-[10px] border border-black/10 bg-white px-2 text-[13px] font-semibold text-black/70 hover:bg-[#f7f6f2]"
                  }
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/10 bg-white text-black/60 transition-colors hover:bg-[#f7f6f2] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
