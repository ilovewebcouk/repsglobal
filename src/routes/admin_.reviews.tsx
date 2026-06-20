import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Flag,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useReviewsUnread } from "@/hooks/useReviewsUnread";
import {
  adminListReviews,
  adminModerateReview,
  adminReviewKpis,
  type AdminReviewRow,
  type AiFlags,
} from "@/lib/reviews/reviews.functions";
import { RemoveReviewDialog } from "@/components/admin/RemoveReviewDialog";

export const Route = createFileRoute("/admin_/reviews")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminReviewsPage,
});

type Tab = "pending" | "approved" | "removed" | "all";

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

function VerdictPill({ verdict, flags }: { verdict: AdminReviewRow["ai_verdict"]; flags: AiFlags | null }) {
  if (!verdict) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/45">
        <Sparkles className="h-3 w-3" /> AI: pending
      </span>
    );
  }
  const tone =
    verdict === "clean"
      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
      : verdict === "warning"
        ? "border-amber-400/30 bg-amber-500/15 text-amber-300"
        : "border-red-500/30 bg-red-500/15 text-red-300";
  const flagList = flags ? Object.entries(flags).filter(([, v]) => v?.hit) : [];
  const label = verdict === "clean" ? "AI: clean" : verdict === "warning" ? "AI: warning" : "AI: suspect";
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone}`}
          >
            <Sparkles className="h-3 w-3" /> {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-[11px]">
          {flagList.length === 0 ? (
            <p>No issues detected.</p>
          ) : (
            <ul className="space-y-1">
              {flagList.map(([key, v]) => (
                <li key={key}>
                  <span className="font-semibold capitalize">{key.replace("_", " ")}:</span>{" "}
                  {v.reason}
                </li>
              ))}
            </ul>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AdminReviewsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = React.useState<Tab>("pending");
  const { markAllRead } = useReviewsUnread();

  // Mark notifications as read when admin views the page.
  React.useEffect(() => {
    void markAllRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: kpis } = useQuery({
    queryKey: ["admin", "reviews", "kpis"],
    queryFn: () => adminReviewKpis(),
    staleTime: 30_000,
  });

  const { data: rows = [] } = useQuery({
    queryKey: ["admin", "reviews", "queue", tab],
    queryFn: () => adminListReviews({ data: { tab } }),
    staleTime: 15_000,
  });

  const moderate = useMutation({
    mutationFn: (vars: {
      id: string;
      action: "approve" | "remove";
      note?: string;
      category?: string;
      internal_note?: string;
      notify?: boolean;
    }) => adminModerateReview({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(vars.action === "approve" ? "Review approved" : "Review removed");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      qc.invalidateQueries({ queryKey: ["reviews", "notifications"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Couldn't update review"),
  });

  const KPIS = [
    { label: "Pending", value: kpis?.pending ?? "—", icon: ShieldAlert },
    { label: "Approved (30d)", value: kpis?.approved_30d ?? "—", icon: CheckCircle2 },
    { label: "Removed (30d)", value: kpis?.removed_30d ?? "—", icon: Trash2 },
    { label: "Suspect", value: kpis?.suspect ?? "—", icon: Flag },
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
      subtitle="Every review goes through admin approval. AI pre-screens for profanity, promo, PII, fake signals and duplicate submissions — you make the final call."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <PCard key={k.label}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] text-white/55">{k.label}</div>
                <div className="mt-1 font-display text-[26px] font-bold text-white">
                  {k.value}
                </div>
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
              <h2 className="font-display text-[16px] font-bold text-white">Moderation queue</h2>
              <p className="text-[12px] text-white/55">
                {rows.length} item{rows.length === 1 ? "" : "s"} · {tab}
              </p>
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList className="h-8 bg-reps-ink/60">
                <TabsTrigger value="pending" className="h-7 text-[11px]">Pending</TabsTrigger>
                <TabsTrigger value="approved" className="h-7 text-[11px]">Approved</TabsTrigger>
                <TabsTrigger value="removed" className="h-7 text-[11px]">Removed</TabsTrigger>
                <TabsTrigger value="all" className="h-7 text-[11px]">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {rows.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[14px] font-semibold text-white">Queue is clear</p>
              <p className="mt-1 text-[12px] text-white/55">
                When new reviews come in they'll appear here for approval.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-reps-border">
              {rows.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
                      {initials(r.professional_name ?? "?")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {r.professional_slug ? (
                          <Link
                            to="/pro/$slug"
                            params={{ slug: r.professional_slug }}
                            className="font-semibold text-white hover:text-reps-orange"
                          >
                            {r.professional_name ?? "Professional"}
                          </Link>
                        ) : (
                          <span className="font-semibold text-white">
                            {r.professional_name ?? "Professional"}
                          </span>
                        )}
                        <Stars n={r.rating} />
                        <VerdictPill verdict={r.ai_verdict} flags={r.ai_flags} />
                        <Badge className="border-reps-border bg-white/5 text-[10px] capitalize text-white/55">
                          {r.moderation_status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-white/45">
                        {r.client_name} · {r.client_email ?? "no email"} ·{" "}
                        {r.submitter_ip ?? "no ip"} · {timeAgo(r.created_at)}
                      </p>
                      {r.title && (
                        <p className="mt-1 text-[13px] font-semibold text-white/90">{r.title}</p>
                      )}
                      <p className="mt-1 text-[13px] text-white/75">"{r.body}"</p>
                      {r.response && (
                        <div className="mt-2 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft/30 px-3 py-2">
                          <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-wider text-reps-orange">
                            <MessageSquare className="h-3 w-3" /> Trainer reply
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/85">
                            {r.response}
                          </p>
                          <p className="mt-1 text-[10.5px] text-white/45">
                            Replied {timeAgo(r.responded_at)}
                            {r.response_edited_at ? ` · edited ${timeAgo(r.response_edited_at)}` : ""}
                            {r.response_notified_at ? " · client notified" : " · client not notified"}
                          </p>
                        </div>
                      )}
                      {r.moderation_status === "removed" && r.removal_reason && (
                        <div className="mt-2 rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2">
                          <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-wider text-red-300">
                            <Trash2 className="h-3 w-3" /> Removed
                            {r.removal_category ? ` · ${r.removal_category}` : ""}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/85">
                            {r.removal_reason}
                          </p>
                          <p className="mt-1 text-[10.5px] text-white/45">
                            {r.removal_notified_at ? "Trainer emailed" : "Trainer not emailed"}
                            {r.removal_internal_note ? ` · internal: ${r.removal_internal_note}` : ""}
                          </p>
                        </div>
                      )}
                      {r.ai_flags && r.ai_verdict !== "clean" && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Object.entries(r.ai_flags)
                            .filter(([, v]) => v?.hit)
                            .map(([key, v]) => (
                              <span
                                key={key}
                                className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                <span className="capitalize">{key.replace("_", " ")}</span>: {v.reason}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    {r.moderation_status === "pending" ? (
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => moderate.mutate({ id: r.id, action: "approve" })}
                          disabled={moderate.isPending}
                          className="h-8 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white hover:bg-reps-orange-hover"
                        >
                          Approve
                        </Button>
                        <RemoveReviewDialog
                          reviewId={r.id}
                          isPending={moderate.isPending}
                          onConfirm={(vars) =>
                            moderate.mutate({
                              id: r.id,
                              action: "remove",
                              note: vars.note,
                              category: vars.category,
                              internal_note: vars.internalNote,
                              notify: vars.notify,
                            })
                          }
                          trigger={
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-[10px] border-reps-border bg-transparent px-3 text-[12px] font-semibold text-white/75 hover:bg-white/5 hover:text-white"
                            >
                              Remove
                            </Button>
                          }
                        />
                      </div>
                    ) : null}
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
                <span>Admin approval required</span>
                <span className="font-semibold text-emerald-300">Live</span>
              </li>
              <li className="flex justify-between">
                <span>AI profanity / promo / PII scan</span>
                <span className="font-semibold text-emerald-300">Live</span>
              </li>
              <li className="flex justify-between">
                <span>IP + email dedupe signals</span>
                <span className="font-semibold text-emerald-300">Live</span>
              </li>
              <li className="flex justify-between">
                <span>Bell + sidebar notifications</span>
                <span className="font-semibold text-emerald-300">Live</span>
              </li>
              <li className="flex items-center justify-between gap-2 text-white/55">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> AI never auto-rejects
                </span>
                <span className="font-semibold">By design</span>
              </li>
            </ul>
          </PCard>
        </div>
      </div>
    </DashboardShell>
  );
}
