import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Flag,
  MessageSquare,
  Pencil,
  Search,
  Star,
  ThumbsUp,
  Trash2,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
} from "lucide-react";


import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  clearReviewReply,
  createReviewRequest,
  flagReview,
  getMyReviewKpis,
  listMyReviewRequests,
  listMyReviews,
  replyToReview,
  thankReview,
  type ReviewDTO,
  type ReviewRequestRow,
} from "@/lib/reviews/reviews.functions";

function Stars({ n, size = "sm" }: { n: number; size?: "sm" | "lg" }) {
  const s = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${s} ${i < n ? "fill-reps-orange text-reps-orange" : "text-white/20"}`} />
      ))}
    </span>
  );
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "C"
  );
}

function formatDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d < 1) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  return new Date(iso).toLocaleDateString();
}

type ReviewTab = "all" | "approved" | "pending" | "removed";
type RequestTab = "all" | "sent" | "opened" | "submitted" | "expired";

function TabCount({ n, active }: { n: number; active: boolean }) {
  if (n <= 0) return null;
  return (
    <span
      className={`ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
        active
          ? "bg-reps-orange/20 text-reps-orange"
          : "bg-white/10 text-white/65"
      }`}
    >
      {n}
    </span>
  );
}

function ReviewsPage() {
  const qc = useQueryClient();
  const tier = useTrainerTier();
  const shellTier = (tier === "verified" || tier === "pro" || tier === "studio" ? tier : "verified") as
    | "verified"
    | "pro"
    | "studio";

  const { data: reviews = [] } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: () => listMyReviews(),
    staleTime: 30_000,
  });
  const { data: kpis } = useQuery({
    queryKey: ["my-review-kpis"],
    queryFn: () => getMyReviewKpis(),
    staleTime: 30_000,
  });
  const { data: requests = [] } = useQuery({
    queryKey: ["my-review-requests"],
    queryFn: () => listMyReviewRequests(),
    staleTime: 30_000,
  });

  const [tab, setTab] = React.useState<ReviewTab>("all");
  const [requestTab, setRequestTab] = React.useState<RequestTab>("all");
  const [search, setSearch] = React.useState("");

  const thank = useMutation({
    mutationFn: (id: string) => thankReview({ data: { id } }),
    onSuccess: () => {
      toast.success("Thank-you sent");
      qc.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't send"),
  });

  const flag = useMutation({
    mutationFn: (id: string) => flagReview({ data: { id, reason: "Flagged by professional" } }),
    onSuccess: () => {
      toast.success("Flagged for admin review");
      qc.invalidateQueries({ queryKey: ["my-reviews"] });
      qc.invalidateQueries({ queryKey: ["my-review-kpis"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't flag"),
  });

  // ── derived buckets ────────────────────────────────────────────────────
  const approved = React.useMemo(
    () => reviews.filter((r) => (r.moderation_status ?? "approved") === "approved"),
    [reviews],
  );
  const pending = React.useMemo(
    () => reviews.filter((r) => (r.moderation_status ?? "approved") === "pending"),
    [reviews],
  );
  const removed = React.useMemo(
    () => reviews.filter((r) => (r.moderation_status ?? "approved") === "removed"),
    [reviews],
  );

  const counts = {
    all: approved.length + pending.length,
    approved: approved.length,
    pending: pending.length,
    removed: removed.length,
  };

  const tabRows = React.useMemo<ReviewDTO[]>(() => {
    switch (tab) {
      case "approved":
        return approved;
      case "pending":
        return pending;
      case "removed":
        return removed;
      case "all":
      default:
        return [...approved, ...pending].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }
  }, [tab, approved, pending, removed]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return tabRows;
    const q = search.toLowerCase();
    return tabRows.filter(
      (r) =>
        r.client_name.toLowerCase().includes(q) ||
        (r.title ?? "").toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q),
    );
  }, [tabRows, search]);

  // ── request status filtering ───────────────────────────────────────────
  const requestCounts = React.useMemo(() => {
    const c = { all: requests.length, sent: 0, opened: 0, submitted: 0, expired: 0 };
    for (const r of requests) {
      if (r.status === "sent") c.sent++;
      else if (r.status === "opened") c.opened++;
      else if (r.status === "submitted") c.submitted++;
      else if (r.status === "expired") c.expired++;
    }
    return c;
  }, [requests]);
  const filteredRequests = React.useMemo(() => {
    if (requestTab === "all") return requests;
    return requests.filter((r) => r.status === requestTab);
  }, [requests, requestTab]);

  const kpiTiles = [
    {
      label: "Overall rating",
      value: kpis ? kpis.avg_rating.toFixed(1) : "—",
      delta: kpis ? `${kpis.review_count} review${kpis.review_count === 1 ? "" : "s"}` : "",
      tone: "neutral" as const,
    },
    {
      label: "Last 30 days",
      value: kpis ? `+${kpis.last_30d_count}` : "—",
      delta: kpis && kpis.last_30d_count > 0 ? `Avg ${kpis.last_30d_avg.toFixed(1)}★` : "None yet",
      tone: kpis && kpis.last_30d_count > 0 ? ("up" as const) : ("neutral" as const),
    },
    {
      label: "Pending",
      value: String(counts.pending),
      delta: counts.pending > 0 ? "With REPS" : "None",
      tone: "neutral" as const,
    },
    {
      label: "Removed",
      value: String(counts.removed),
      delta: counts.removed > 0 ? "Hidden from profile" : "None",
      tone: "neutral" as const,
    },
  ];

  const tabsConfig: { value: ReviewTab; label: string; count: number }[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "approved", label: "Approved", count: counts.approved },
    { value: "pending", label: "Pending", count: counts.pending },
    { value: "removed", label: "Removed", count: counts.removed },
  ];

  const emptyCopy: Record<ReviewTab, { title: string; sub: string }> = {
    all: {
      title: "No reviews yet",
      sub: "Use \"Request a review\" to email a past client a one-click link.",
    },
    approved: {
      title: "No approved reviews yet",
      sub:
        counts.pending > 0
          ? `${counts.pending} waiting on REPS approval.`
          : "Once a client submits a review and REPS approves it, you'll see it here.",
    },
    pending: {
      title: "Nothing waiting on REPS approval",
      sub: "New reviews appear here while we run our checks. Usually within a few hours.",
    },
    removed: {
      title: "No removed reviews",
      sub: "Your feed is clean.",
    },
  };

  return (
    <DashboardShell
      role="trainer"
      tier={shellTier}
      active="Reviews"
      title="Reviews"
      subtitle="Your public reviews, rating breakdown and review requests."
      actions={<HeaderActions />}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpiTiles.map((k) => (
          <PCard key={k.label} className="!p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{k.label}</div>
            <div className="mt-2 font-display text-[26px] font-bold leading-none text-white">{k.value}</div>
            <div
              className={`mt-2 text-[11px] font-medium ${
                k.tone === "up" ? "text-emerald-300" : "text-white/55"
              }`}
            >
              {k.delta}
            </div>
          </PCard>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT — reviews feed */}
        <div className="space-y-6 xl:col-span-8">
          <PPanel>
            {/* Header: title + search */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-reps-border px-5 py-4 sm:flex sm:flex-wrap sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold text-white">Reviews</h3>
                <p className="mt-0.5 text-[12px] text-white/55">
                  {counts.approved} live on profile · {counts.pending} pending · {counts.removed} removed
                </p>
              </div>
              <div className="flex h-9 shrink-0 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">
                <Search className="h-3.5 w-3.5" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-[140px] bg-transparent text-white placeholder:text-white/40 focus:outline-none sm:w-[180px]"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={(v) => setTab(v as ReviewTab)}>
              <div className="border-b border-reps-border px-3 py-2.5 sm:px-5">
                <div className="-mx-1 overflow-x-auto">
                  <TabsList className="mx-1 inline-flex h-9 w-auto bg-reps-ink/60 p-1">
                    {tabsConfig.map((t) => (
                      <TabsTrigger
                        key={t.value}
                        value={t.value}
                        className="h-7 rounded-[8px] px-2.5 text-[12px] font-semibold text-white/65 data-[state=active]:bg-reps-panel data-[state=active]:text-white data-[state=active]:shadow-none"
                      >
                        {t.label}
                        <TabCount n={t.count} active={tab === t.value} />
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>

              {tabsConfig.map((t) => (
                <TabsContent key={t.value} value={t.value} className="mt-0">
                  {t.value === "pending" && counts.pending > 0 && (
                    <div className="flex items-start gap-2 border-b border-reps-border bg-reps-panel-soft/40 px-5 py-3 text-[12px] text-white/70">
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/55" />
                      <p>
                        Waiting on REPS approval. Replies unlock once approved.
                        Usually within a few hours.
                      </p>
                    </div>
                  )}
                  {t.value === "removed" && counts.removed > 0 && (
                    <div className="flex items-start gap-2 border-b border-reps-border bg-reps-panel-soft/40 px-5 py-3 text-[12px] text-white/70">
                      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/55" />
                      <p>
                        Removed reviews are hidden from your public profile. Reply to the REPS email
                        if you'd like us to take another look.
                      </p>
                    </div>
                  )}

                  {filtered.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <p className="text-[14px] font-semibold text-white">
                        {search.trim() ? "No matches" : emptyCopy[t.value].title}
                      </p>
                      <p className="mt-1 text-[12px] text-white/55">
                        {search.trim()
                          ? `No reviews in this tab match "${search.trim()}".`
                          : emptyCopy[t.value].sub}
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-reps-border/60">
                      {filtered.map((r) => {
                        const status = (r.moderation_status ?? "approved") as
                          | "approved"
                          | "pending"
                          | "removed";
                        return (
                          <li key={r.id} className="px-5 py-5">
                            {status === "removed" ? (
                              <RemovedRow review={r} />
                            ) : (
                              <ApprovedOrPendingRow
                                review={r}
                                status={status}
                                onThank={(id) => thank.mutate(id)}
                                onFlag={(id) => flag.mutate(id)}
                                thankPending={thank.isPending}
                                flagPending={flag.isPending}
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </PPanel>

          {/* Sent requests */}
          <PPanel>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-reps-border px-5 py-4 sm:flex sm:flex-wrap sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-[14px] font-semibold text-white">Sent requests</h3>
                <p className="mt-0.5 text-[12px] text-white/55">
                  {requestCounts.all} sent · {requestCounts.submitted} submitted
                  {requestCounts.expired > 0 ? ` · ${requestCounts.expired} expired` : ""}
                </p>
              </div>
              <RequestReviewDialog
                trigger={
                  <button
                    type="button"
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80 hover:text-white"
                  >
                    <Mail className="h-3.5 w-3.5" /> Send another
                  </button>
                }
              />
            </div>

            {requestCounts.all > 0 && (
              <Tabs value={requestTab} onValueChange={(v) => setRequestTab(v as RequestTab)}>
                <div className="border-b border-reps-border px-3 py-2.5 sm:px-5">
                  <div className="-mx-1 overflow-x-auto">
                    <TabsList className="mx-1 inline-flex h-9 w-auto bg-reps-ink/60 p-1">
                      {([
                        { v: "all" as const, label: "All", n: requestCounts.all },
                        { v: "sent" as const, label: "Sent", n: requestCounts.sent },
                        { v: "opened" as const, label: "Opened", n: requestCounts.opened },
                        { v: "submitted" as const, label: "Submitted", n: requestCounts.submitted },
                        { v: "expired" as const, label: "Expired", n: requestCounts.expired },
                      ]).map((t) => (
                        <TabsTrigger
                          key={t.v}
                          value={t.v}
                          className="h-7 rounded-[8px] px-2.5 text-[12px] font-semibold text-white/65 data-[state=active]:bg-reps-panel data-[state=active]:text-white data-[state=active]:shadow-none"
                        >
                          {t.label}
                          <TabCount n={t.n} active={requestTab === t.v} />
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>
              </Tabs>
            )}

            {requestCounts.all === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[13px] font-semibold text-white">No requests sent yet</p>
                <p className="mt-1 text-[12px] text-white/55">
                  Use "Request a review" to email a client a one-click link.
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[13px] font-semibold text-white">No {requestTab} requests</p>
                <p className="mt-1 text-[12px] text-white/55">Try a different filter.</p>
              </div>
            ) : (
              <ul
                className={`divide-y divide-reps-border/60 ${
                  filteredRequests.length > 8 ? "max-h-[420px] overflow-y-auto" : ""
                }`}
              >
                {filteredRequests.map((r: ReviewRequestRow) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-white">
                        {r.client_name || r.client_email}
                      </p>
                      <p className="truncate text-[11px] text-white/55">
                        {r.client_email} · sent {formatDate(r.sent_at)}
                        {r.service_label ? ` · ${r.service_label}` : ""}
                      </p>
                    </div>
                    <StatusPill status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </PPanel>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 xl:col-span-4">
          <PCard>
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-white">Rating breakdown</h3>
              <span className="font-display text-[28px] font-bold text-white">
                {kpis ? kpis.avg_rating.toFixed(1) : "—"}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-white/55">
              <Stars n={Math.round(kpis?.avg_rating ?? 0)} size="lg" /> from{" "}
              {kpis?.review_count ?? 0} review{kpis?.review_count === 1 ? "" : "s"}
            </div>
            <div className="mt-4 space-y-2">
              {(kpis?.breakdown ?? [
                { stars: 5, count: 0, pct: 0 },
                { stars: 4, count: 0, pct: 0 },
                { stars: 3, count: 0, pct: 0 },
                { stars: 2, count: 0, pct: 0 },
                { stars: 1, count: 0, pct: 0 },
              ]).map((b) => (
                <div key={b.stars} className="flex items-center gap-3 text-[12px]">
                  <span className="w-6 text-white/65">{b.stars}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-reps-panel-soft">
                    <div className="h-full rounded-full bg-reps-orange" style={{ width: `${b.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-white/65">{b.count}</span>
                </div>
              ))}
            </div>
          </PCard>

          <PCard>
            <h3 className="text-[14px] font-semibold text-white">How reviews work</h3>
            <ul className="mt-3 space-y-2 text-[12px] text-white/70">
              <li>Email a past client a one-click review link.</li>
              <li>They rate you 1–5 stars and write a short review — no login.</li>
              <li>Approved reviews publish to your REPS profile instantly.</li>
              <li>Flag anything suspicious — REPS admin reviews every flag.</li>
            </ul>
          </PCard>
        </div>
      </div>
    </DashboardShell>
  );
}

function ApprovedOrPendingRow({
  review: r,
  status,
  onThank,
  onFlag,
  thankPending,
  flagPending,
}: {
  review: ReviewDTO;
  status: "approved" | "pending";
  onThank: (id: string) => void;
  onFlag: (id: string) => void;
  thankPending: boolean;
  flagPending: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
        {initials(r.client_name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-white">{r.client_name}</span>
          {status === "pending" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              <Clock className="h-2.5 w-2.5" /> Pending
            </span>
          )}
          <span className="text-[11px] text-white/45">· {formatDate(r.created_at)}</span>
        </div>
        <div className="mt-1.5">
          <Stars n={r.rating} />
        </div>
        {r.title && <p className="mt-2 text-[13px] font-semibold text-white">{r.title}</p>}
        <p className="mt-2 text-[13px] leading-relaxed text-white/80">{r.body}</p>
        {status === "approved" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onThank(r.id)}
              disabled={thankPending}
              className="flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80 shadow-none hover:text-white disabled:opacity-50"
            >
              <ThumbsUp className="h-3.5 w-3.5" /> Thank
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Flag this review for admin moderation?")) onFlag(r.id);
              }}
              disabled={flagPending}
              className="flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/60 shadow-none hover:text-white disabled:opacity-50"
            >
              <Flag className="h-3.5 w-3.5" /> Flag
            </button>
          </div>
        )}
        <ReplyBlock review={r} />
      </div>
    </div>
  );
}

function RemovedRow({ review: r }: { review: ReviewDTO }) {
  return (
    <div className="flex items-start gap-3 opacity-90">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-[12px] font-semibold text-white/45">
        {initials(r.client_name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-white/75 line-through">{r.client_name}</span>
          <Stars n={r.rating} />
          <span className="text-[11px] text-white/45">
            · removed {r.moderated_at ? formatDate(r.moderated_at) : ""}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] italic leading-relaxed text-white/55">
          "{r.body}"
        </p>
        <div className="mt-2 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft/40 px-3 py-2">
          <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-wider text-reps-orange">
            <MessageSquare className="h-3 w-3" /> Reason from REPS
            {r.removal_category ? ` · ${r.removal_category}` : ""}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/90">
            {r.removal_reason?.trim()
              ? r.removal_reason
              : "This review was removed by REPS moderation. No detailed reason was recorded at the time."}
          </p>
          <p className="mt-1 text-[10.5px] text-white/45">
            Reply to the REPS email if you'd like us to take another look.
          </p>
        </div>
      </div>
    </div>
  );
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <a
        href="/dashboard/website"
        className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] font-semibold text-white/80 hover:text-white"
      >
        <ArrowUpRight className="h-4 w-4" />
        View public profile
      </a>
      <RequestReviewDialog
        trigger={
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
          >
            <Mail className="h-4 w-4" />
            Request a review
          </button>
        }
      />
    </div>
  );
}

function RequestReviewDialog({ trigger }: { trigger: React.ReactNode }) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [service, setService] = React.useState("");

  const create = useMutation({
    mutationFn: () =>
      createReviewRequest({
        data: {
          client_email: email.trim(),
          client_name: name.trim() || undefined,
          service_label: service.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Review request emailed");
      qc.invalidateQueries({ queryKey: ["my-review-requests"] });
      setOpen(false);
      setEmail("");
      setName("");
      setService("");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't send request"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a review</DialogTitle>
          <DialogDescription>
            We'll email this person a one-click link to leave a review on your REPS profile. Links expire after 90 days.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!create.isPending && email.trim()) create.mutate();
          }}
        >
          <div>
            <Label htmlFor="rr-email">Client email</Label>
            <Input
              id="rr-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="rr-name">
              Client name <span className="text-white/45">(optional)</span>
            </Label>
            <Input
              id="rr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              maxLength={120}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="rr-service">
              What was the service? <span className="text-white/45">(optional)</span>
            </Label>
            <Input
              id="rr-service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="1:1 Strength Coaching"
              maxLength={120}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-[10px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={create.isPending || !email.trim()}
              className="rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange-hover"
            >
              {create.isPending ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; Icon: typeof Clock; tone: string }> = {
    sent: { label: "Sent", Icon: Clock, tone: "border-white/20 bg-white/5 text-white/70" },
    opened: { label: "Opened", Icon: Mail, tone: "border-sky-400/30 bg-sky-500/15 text-sky-300" },
    submitted: {
      label: "Submitted",
      Icon: CheckCircle2,
      tone: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    },
    expired: { label: "Expired", Icon: XCircle, tone: "border-rose-400/30 bg-rose-500/15 text-rose-300" },
  };
  const m = map[status] ?? map.sent;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider ${m.tone}`}
    >
      <m.Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function ReplyBlock({ review }: { review: ReviewDTO }) {
  const qc = useQueryClient();
  const existing = review.response ?? null;
  const isApproved = (review.moderation_status ?? "approved") === "approved";
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(existing ?? "");

  React.useEffect(() => {
    setDraft(existing ?? "");
  }, [existing]);

  const save = useMutation({
    mutationFn: (text: string) =>
      replyToReview({ data: { review_id: review.id, response: text } }),
    onSuccess: () => {
      toast.success(existing ? "Reply updated" : "Reply sent");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Couldn't save reply"),
  });

  const clear = useMutation({
    mutationFn: () => clearReviewReply({ data: { review_id: review.id } }),
    onSuccess: () => {
      toast.success("Reply removed");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Couldn't remove reply"),
  });

  if (!isApproved && !existing) {
    return (
      <p className="mt-3 text-[11px] text-white/40">
        Reply available once this review is approved by REPS.
      </p>
    );
  }

  // Show stored reply (read mode)
  if (existing && !editing) {
    return (
      <div className="mt-3 rounded-[12px] border border-reps-orange-border bg-reps-orange-soft/40 px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-reps-orange">
            Your reply
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex h-7 items-center gap-1 rounded-[8px] border border-reps-border bg-reps-panel-soft px-2 text-[11px] font-semibold text-white/80 hover:text-white"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete your reply?")) clear.mutate();
              }}
              disabled={clear.isPending}
              className="flex h-7 items-center gap-1 rounded-[8px] border border-reps-border bg-reps-panel-soft px-2 text-[11px] font-semibold text-white/60 hover:text-white disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-white/85">
          {existing}
        </p>
        <p className="mt-2 text-[11px] text-white/45">
          Replied {fmtDateTime(review.responded_at)}
          {review.response_edited_at ? ` · edited ${fmtDateTime(review.response_edited_at)}` : ""}
          {review.response_notified_at ? " · client notified" : ""}
        </p>
      </div>
    );
  }

  // Composer (new reply or edit)
  if (editing || (!existing && (draft || false))) {
    const len = draft.length;
    const tooShort = len < 1;
    const tooLong = len > 1000;
    return (
      <div className="mt-3 rounded-[12px] border border-reps-border bg-reps-panel-soft/60 px-3.5 py-3">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
          {existing ? "Edit your reply" : "Reply to this review"}
        </Label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 1100))}
          rows={4}
          placeholder="Thanks for the kind words…"
          className="mt-2 w-full rounded-[10px] border border-reps-border bg-reps-ink px-3 py-2 text-[13px] leading-relaxed text-white placeholder:text-white/35 focus:border-reps-orange focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className={`text-[11px] ${tooLong ? "text-rose-300" : "text-white/45"}`}>
            {len} / 1000
            {!existing && (
              <span className="ml-2 text-white/40">
                · We'll email your client a one-off notification.
              </span>
            )}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(false);
                setDraft(existing ?? "");
              }}
              className="h-8 rounded-[10px] border-reps-border bg-transparent px-3 text-[12px] font-semibold text-white/70 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => save.mutate(draft.trim())}
              disabled={save.isPending || tooShort || tooLong}
              className="h-8 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-50"
            >
              {existing ? "Save changes" : "Send reply"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No reply yet — collapsed trigger
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-orange-border bg-reps-orange-soft px-3 text-[12px] font-semibold text-reps-orange hover:bg-reps-orange-soft/80"
      >
        <MessageSquare className="h-3.5 w-3.5" /> Reply to this review
      </button>
    </div>
  );
}
