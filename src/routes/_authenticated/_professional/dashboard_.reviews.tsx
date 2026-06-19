import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Flag,
  Reply,
  Search,
  Star,
  ThumbsUp,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import {
  createReviewRequest,
  flagReview,
  getMyReviewKpis,
  listMyReviewRequests,
  listMyReviews,
  respondToReview,
  thankReview,
  type ReviewDTO,
} from "@/lib/reviews/reviews.functions";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — REPS Professional" },
      { name: "description", content: "Public reviews, rating breakdown and request-a-review for your REPS profile." },
      { property: "og:title", content: "Reviews — REPS Professional" },
      { property: "og:description", content: "Reviews and response composer." },
      { property: "og:url", content: "/dashboard/reviews" },
    ],
    links: [{ rel: "canonical", href: "/dashboard/reviews" }],
  }),
  component: ReviewsPage,
});

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

  const [replyOpen, setReplyOpen] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "5" | "4" | "awaiting">("all");
  const [search, setSearch] = React.useState("");

  const respond = useMutation({
    mutationFn: (vars: { id: string; response: string }) => respondToReview({ data: vars }),
    onSuccess: () => {
      toast.success("Reply published");
      setReplyOpen(null);
      setReplyText("");
      qc.invalidateQueries({ queryKey: ["my-reviews"] });
      qc.invalidateQueries({ queryKey: ["my-review-kpis"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't publish reply"),
  });

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

  const filtered = React.useMemo(() => {
    let rows: ReviewDTO[] = reviews;
    if (filter === "5") rows = rows.filter((r) => r.rating === 5);
    else if (filter === "4") rows = rows.filter((r) => r.rating === 4);
    else if (filter === "awaiting") rows = rows.filter((r) => !r.response);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.client_name.toLowerCase().includes(q) ||
          (r.title ?? "").toLowerCase().includes(q) ||
          r.body.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [reviews, filter, search]);

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
      label: "Response rate",
      value: kpis ? `${kpis.response_rate}%` : "—",
      delta: kpis && kpis.response_rate >= 80 ? "Strong" : "Room to improve",
      tone: kpis && kpis.response_rate >= 80 ? ("up" as const) : ("warn" as const),
    },
    {
      label: "Awaiting reply",
      value: kpis ? String(kpis.awaiting_reply) : "—",
      delta: kpis && kpis.awaiting_reply > 0 ? "Action needed" : "All caught up",
      tone: kpis && kpis.awaiting_reply > 0 ? ("warn" as const) : ("neutral" as const),
    },
    {
      label: "Flagged",
      value: kpis ? String(kpis.flagged) : "—",
      delta: kpis && kpis.flagged > 0 ? "In admin queue" : "None",
      tone: kpis && kpis.flagged > 0 ? ("down" as const) : ("neutral" as const),
    },
  ];

  return (
    <DashboardShell
      role="trainer"
      tier={shellTier}
      active="Reviews"
      title="Reviews"
      subtitle="Your public reviews, response composer and review requests."
      actions={<HeaderActions />}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpiTiles.map((k) => (
          <PCard key={k.label} className="!p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{k.label}</div>
            <div className="mt-2 font-display text-[26px] font-bold leading-none text-white">{k.value}</div>
            <div
              className={`mt-2 text-[11px] font-medium ${
                k.tone === "up"
                  ? "text-emerald-300"
                  : k.tone === "warn"
                    ? "text-reps-orange"
                    : k.tone === "down"
                      ? "text-rose-300"
                      : "text-white/55"
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
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <h3 className="text-[14px] font-semibold text-white">All reviews</h3>
              <div className="flex items-center gap-2">
                <div className="flex h-9 items-center gap-2 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] text-white/55">
                  <Search className="h-3.5 w-3.5" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="w-[160px] bg-transparent text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
                {(
                  [
                    { k: "all" as const, label: "All" },
                    { k: "5" as const, label: "5★" },
                    { k: "4" as const, label: "4★" },
                    { k: "awaiting" as const, label: "Awaiting reply" },
                  ]
                ).map((c) => (
                  <button
                    key={c.k}
                    type="button"
                    onClick={() => setFilter(c.k)}
                    className={`h-9 rounded-full border px-3 text-[12px] font-semibold ${
                      filter === c.k
                        ? "border-reps-orange-border bg-reps-orange-soft text-reps-orange"
                        : "border-reps-border bg-reps-panel-soft text-white/65 hover:text-white"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-[14px] font-semibold text-white">No reviews yet</p>
                <p className="mt-1 text-[12px] text-white/55">
                  Use "Request a review" to email a past client a one-click link.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-reps-border/60">
                {filtered.map((r) => (
                  <li key={r.id} className="px-5 py-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
                        {initials(r.client_name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-semibold text-white">{r.client_name}</span>
                          {!r.response && (
                            <span className="flex h-5 items-center rounded-full bg-amber-500/12 px-2 text-[10px] font-semibold text-amber-300">
                              Awaiting reply
                            </span>
                          )}
                          <span className="text-[11px] text-white/45">· {formatDate(r.created_at)}</span>
                        </div>
                        <div className="mt-1.5">
                          <Stars n={r.rating} />
                        </div>
                        {r.title && <p className="mt-2 text-[13px] font-semibold text-white">{r.title}</p>}
                        <p className="mt-2 text-[13px] leading-relaxed text-white/80">{r.body}</p>
                        {r.response && (
                          <div className="mt-3 rounded-[12px] border border-reps-border bg-reps-panel-soft p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
                              Your reply
                            </div>
                            <p className="mt-1 text-[13px] text-white/85">{r.response}</p>
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {!r.response && replyOpen !== r.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setReplyOpen(r.id);
                                setReplyText("");
                              }}
                              className="flex h-8 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                            >
                              <Reply className="h-3.5 w-3.5" /> Reply
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => thank.mutate(r.id)}
                            disabled={thank.isPending}
                            className="flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80 shadow-none hover:text-white disabled:opacity-50"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" /> Thank
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Flag this review for admin moderation?")) flag.mutate(r.id);
                            }}
                            disabled={flag.isPending}
                            className="flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/60 shadow-none hover:text-white disabled:opacity-50"
                          >
                            <Flag className="h-3.5 w-3.5" /> Flag
                          </button>
                        </div>

                        {!r.response && replyOpen === r.id && (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={3}
                              maxLength={2000}
                              placeholder="Write a thoughtful, professional reply…"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => respond.mutate({ id: r.id, response: replyText })}
                                disabled={respond.isPending || replyText.trim().length < 1}
                                className="h-8 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white hover:bg-reps-orange-hover"
                              >
                                Publish reply
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReplyOpen(null);
                                  setReplyText("");
                                }}
                                className="h-8 rounded-[10px] border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PPanel>

          {/* Sent requests */}
          <PPanel>
            <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
              <div>
                <h3 className="text-[14px] font-semibold text-white">Sent requests</h3>
                <p className="mt-0.5 text-[12px] text-white/55">
                  Review links you've emailed in the last 90 days.
                </p>
              </div>
              <RequestReviewDialog
                trigger={
                  <button
                    type="button"
                    className="flex h-8 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12px] font-semibold text-white/80 hover:text-white"
                  >
                    <Mail className="h-3.5 w-3.5" /> Send another
                  </button>
                }
              />
            </div>
            {requests.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[13px] font-semibold text-white">No requests sent yet</p>
                <p className="mt-1 text-[12px] text-white/55">
                  Use "Request a review" to email a client a one-click link.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-reps-border/60">
                {requests.map((r: ReviewRequestRow) => (
                  <li key={r.id} className="flex items-center justify-between px-5 py-3">
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

function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <a
        href="/dashboard/profile"
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
