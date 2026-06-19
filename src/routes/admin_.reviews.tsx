import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Flag, MessageSquare, Star, ThumbsUp } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import {
  adminApproveReview,
  adminListFlagged,
  adminRemoveReview,
  adminReviewKpis,
} from "@/lib/reviews/reviews.functions";

export const Route = createFileRoute("/admin_/reviews")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminReviewsPage,
});

function Stars({ n }: { n: number }) {
  return (
    <span className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < n ? "fill-reps-orange text-reps-orange" : "text-white/20"}`}
        />
      ))}
    </span>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function AdminReviewsPage() {
  const qc = useQueryClient();

  const { data: kpis } = useQuery({
    queryKey: ["admin-review-kpis"],
    queryFn: () => adminReviewKpis(),
    staleTime: 30_000,
  });
  const { data: flagged = [] } = useQuery({
    queryKey: ["admin-flagged-reviews"],
    queryFn: () => adminListFlagged(),
    staleTime: 15_000,
  });

  const approve = useMutation({
    mutationFn: (id: string) => adminApproveReview({ data: { id } }),
    onSuccess: () => {
      toast.success("Review approved");
      qc.invalidateQueries({ queryKey: ["admin-flagged-reviews"] });
      qc.invalidateQueries({ queryKey: ["admin-review-kpis"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't approve"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminRemoveReview({ data: { id } }),
    onSuccess: () => {
      toast.success("Review removed");
      qc.invalidateQueries({ queryKey: ["admin-flagged-reviews"] });
      qc.invalidateQueries({ queryKey: ["admin-review-kpis"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't remove"),
  });

  const KPIS = [
    { label: "Avg. platform rating", value: kpis ? kpis.avg_rating.toFixed(2) : "—", icon: Star },
    { label: "Reviews (30d)", value: kpis ? kpis.reviews_30d.toLocaleString() : "—", icon: MessageSquare },
    { label: "Flagged", value: kpis ? String(kpis.flagged) : "—", icon: Flag },
    { label: "Auto-approved", value: kpis ? `${kpis.auto_approved_pct}%` : "—", icon: ThumbsUp },
  ];

  const DIST = kpis?.distribution ?? [
    { stars: 5, pct: 0, count: 0 },
    { stars: 4, pct: 0, count: 0 },
    { stars: 3, pct: 0, count: 0 },
    { stars: 2, pct: 0, count: 0 },
    { stars: 1, pct: 0, count: 0 },
  ];

  return (
    <DashboardShell
      role="admin"
      active="Reviews"
      title="Reviews moderation"
      subtitle="Approve, remove, and escalate reviews flagged by professionals or the trust system."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <PCard key={k.label}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-white/55">{k.label}</div>
                <div className="mt-1 font-display text-[26px] font-bold text-white">{k.value}</div>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <k.icon className="h-4 w-4" />
              </span>
            </div>
          </PCard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PPanel className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
            <div>
              <h2 className="font-display text-[16px] font-bold text-white">Flagged for review</h2>
              <p className="text-[12px] text-white/55">
                {flagged.length} item{flagged.length === 1 ? "" : "s"} awaiting moderation
              </p>
            </div>
          </div>
          {flagged.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[14px] font-semibold text-white">No flagged reviews</p>
              <p className="mt-1 text-[12px] text-white/55">When pros or the trust system flag a review, it appears here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-reps-border">
              {flagged.map((f) => (
                <li key={f.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
                      {initials(f.professional_name ?? "?")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {f.professional_slug ? (
                          <Link
                            to="/pro/$slug"
                            params={{ slug: f.professional_slug }}
                            className="font-semibold text-white hover:text-reps-orange"
                          >
                            {f.professional_name ?? "Professional"}
                          </Link>
                        ) : (
                          <span className="font-semibold text-white">{f.professional_name ?? "Professional"}</span>
                        )}
                        <Stars n={f.rating} />
                        <span className="text-[11px] text-white/45">
                          · {f.client_name} · {timeAgo(f.flagged_at ?? f.created_at)}
                        </span>
                      </div>
                      {f.title && <p className="mt-1 text-[13px] font-semibold text-white/90">{f.title}</p>}
                      <p className="mt-1 text-[13px] text-white/75">"{f.body}"</p>
                      {f.flag_reason && (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                          <AlertTriangle className="h-3 w-3" /> {f.flag_reason}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => approve.mutate(f.id)}
                        disabled={approve.isPending}
                        className="h-8 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Remove this review? Clients won't see it on the public profile.")) {
                            remove.mutate(f.id);
                          }
                        }}
                        disabled={remove.isPending}
                        className="h-8 rounded-[10px] border border-reps-border px-3 text-[12px] font-semibold text-white/75 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PPanel>

        <div className="space-y-6">
          <PPanel>
            <div className="border-b border-reps-border px-5 py-4">
              <h3 className="font-display text-[15px] font-bold text-white">Rating distribution</h3>
              <p className="text-[12px] text-white/55">
                Last 30 days · {kpis ? kpis.reviews_30d.toLocaleString() : 0} reviews
              </p>
            </div>
            <div className="space-y-2 p-5">
              {DIST.map((d) => (
                <div key={d.stars} className="flex items-center gap-3 text-[12px]">
                  <span className="w-3 text-white/65">{d.stars}</span>
                  <Star className="h-3 w-3 fill-reps-orange text-reps-orange" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-reps-ink">
                    <div className="h-full bg-reps-orange" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="w-12 text-right text-white/55">{d.count}</span>
                </div>
              ))}
            </div>
          </PPanel>

          <PCard>
            <h3 className="font-display text-[15px] font-bold text-white">Trust system</h3>
            <ul className="mt-3 space-y-2 text-[12px] text-white/70">
              <li className="flex justify-between">
                <span>Pro-flagged queue</span>
                <span className="font-semibold text-emerald-300">Live</span>
              </li>
              <li className="flex justify-between">
                <span>Auto-publish</span>
                <span className="font-semibold text-white">Request links</span>
              </li>
              <li className="flex justify-between">
                <span>Profanity / promo filter</span>
                <span className="font-semibold text-white/50">Planned</span>
              </li>
            </ul>
          </PCard>
        </div>
      </div>
    </DashboardShell>
  );
}
