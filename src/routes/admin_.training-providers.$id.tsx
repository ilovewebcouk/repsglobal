import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ExternalLink,
  Mail,
  Plus,
  Trash2,
  GraduationCap,
  Star,
  BadgeCheck,
  CheckCircle2,
  Flag,
  FileSearch,
  RotateCcw,
  Copy,
  Building2,
} from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { initialsFromName } from "@/lib/initials";
import {
  getOrganisation,
  updateOrganisation,
  setOrganisationPublished,
  upsertCourse,
  deleteCourse,
  listAdminProviderReviews,
  moderateProviderReview,
} from "@/lib/training-providers.functions";

export const Route = createFileRoute("/admin_/training-providers/$id")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminTrainingProviderDetailPage,
});

const PANEL = "rounded-[18px] border border-reps-border bg-reps-panel/40";
const PANEL_HEADER = "px-5 pt-5 pb-3";
const PANEL_BODY = "px-5 pb-5";
const PANEL_TITLE = "text-[15px] font-semibold text-white";
const PANEL_DESC = "mt-1 text-[13px] text-white/55";
const LABEL = "text-[11px] uppercase tracking-wide text-white/50";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

function AdminTrainingProviderDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const key = ["admin", "training-provider", id];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => getOrganisation({ data: { id } }),
  });

  const org = data?.org;
  const courses = data?.courses ?? [];
  const subscription = data?.subscription ?? null;

  return (
    <DashboardShell
      role="admin"
      active="Training Providers"
      title={org?.name ?? "Training provider"}
      subtitle="Training provider workbench"
    >
      <StickyHeader
        id={id}
        org={org}
        subscription={subscription}
        loading={isLoading}
        onChanged={() => qc.invalidateQueries({ queryKey: key })}
      />

      <div className="mt-5">
        <Tabs defaultValue="overview" className="flex flex-col gap-5">
          <TabsList className="flex h-10 w-full flex-wrap justify-start gap-1 rounded-[12px] border border-reps-border bg-reps-panel/40 p-1">
            <TabsTrigger value="overview" className="rounded-[10px] data-[state=active]:bg-reps-panel data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-[10px] data-[state=active]:bg-reps-panel data-[state=active]:text-white">Subscription</TabsTrigger>
            <TabsTrigger value="courses" className="rounded-[10px] data-[state=active]:bg-reps-panel data-[state=active]:text-white">Courses ({courses.length})</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-[10px] data-[state=active]:bg-reps-panel data-[state=active]:text-white">Reviews</TabsTrigger>
            <TabsTrigger value="details" className="rounded-[10px] data-[state=active]:bg-reps-panel data-[state=active]:text-white">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {org ? (
              <OverviewPane org={org} subscription={subscription} courses={courses} id={id} />
            ) : (
              <PaneSkeleton />
            )}
          </TabsContent>

          <TabsContent value="subscription">
            {org ? (
              <SubscriptionPane org={org} subscription={subscription} />
            ) : (
              <PaneSkeleton />
            )}
          </TabsContent>

          <TabsContent value="courses">
            {org ? (
              <CoursesTab
                orgId={id}
                courses={courses}
                onChange={() => qc.invalidateQueries({ queryKey: key })}
              />
            ) : (
              <PaneSkeleton />
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsPane organisationId={id} />
          </TabsContent>

          <TabsContent value="details">
            {org ? (
              <DetailsForm
                org={org}
                onSaved={() => qc.invalidateQueries({ queryKey: key })}
              />
            ) : (
              <PaneSkeleton />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}

function PaneSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-56 rounded-[18px] bg-reps-panel/40" />
      <Skeleton className="h-56 rounded-[18px] bg-reps-panel/40" />
    </div>
  );
}

/* ─────────────────── Sticky Header (matches Member 360) ─────────────────── */

function StickyHeader({
  id,
  org,
  subscription,
  loading,
  onChanged,
}: {
  id: string;
  org: any | undefined;
  subscription: any | null;
  loading: boolean;
  onChanged: () => void;
}) {
  if (loading || !org) {
    return (
      <div className="sticky top-0 z-20 -mx-6 border-b border-reps-border bg-reps-ink/85 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Skeleton className="size-14 rounded-full bg-reps-panel/60" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-48 bg-reps-panel/60" />
            <Skeleton className="h-4 w-72 bg-reps-panel/60" />
          </div>
        </div>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    active: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    draft: "border-reps-border bg-reps-panel/60 text-white/65",
    suspended: "border-amber-400/30 bg-amber-500/15 text-amber-300",
    cancelled: "border-red-400/30 bg-red-500/15 text-red-300",
  };

  return (
    <div className="sticky top-0 z-20 -mx-6 border-b border-reps-border bg-reps-ink/85 px-6 py-4 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-14 ring-1 ring-reps-border">
          {org.logo_url && <AvatarImage src={org.logo_url} alt={org.name} />}
          <AvatarFallback className="bg-reps-orange/15 text-base font-semibold text-reps-orange">
            {initialsFromName(org.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h2 className="truncate text-lg font-semibold text-white">{org.name}</h2>
            <span className="truncate text-sm text-white/55">@{org.slug}</span>
          </div>
          <div className="truncate text-[13px] text-white/45">
            {org.contact_email ?? "no contact email on file"}
            {org.city ? ` · ${org.city}${org.country ? `, ${org.country}` : ""}` : ""}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", statusColor[org.status] ?? statusColor.draft)}>
              {org.status}
            </span>
            {org.membership_number && (
              <span className="inline-flex items-center rounded-full border border-reps-orange-border bg-reps-orange/10 px-2 py-0.5 text-[11px] font-semibold text-reps-orange">
                #{org.membership_number}
              </span>
            )}
            {org.published_at ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Published
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-reps-border bg-reps-panel/60 px-2 py-0.5 text-[11px] font-semibold text-white/65">
                Unpublished
              </span>
            )}
            {subscription?.tier && (
              <span className="inline-flex items-center rounded-full border border-reps-border bg-reps-panel/60 px-2 py-0.5 text-[11px] font-semibold text-white/75 capitalize">
                {String(subscription.tier).replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {org.published_at && (
            <Button asChild size="sm" className="h-9 rounded-[10px] bg-reps-orange text-white shadow-none hover:bg-reps-orange-hover">
              <Link to="/providers/$slug" params={{ slug: org.slug }} target="_blank" rel="noreferrer">
                <ExternalLink data-icon="inline-start" /> View website
              </Link>
            </Button>
          )}
          {org.contact_email && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-9 rounded-[10px] border-reps-border bg-white/5 text-white shadow-none hover:bg-reps-panel-soft hover:text-white"
            >
              <Link
                to="/admin/campaigns"
                search={{ compose: "1", to: org.contact_email, name: org.name, inbox: "pros" }}
              >
                <Mail data-icon="inline-start" /> Send email
              </Link>
            </Button>
          )}
          <PublishToggle id={id} published={!!org.published_at} onDone={onChanged} />
        </div>
      </div>
    </div>
  );
}

function PublishToggle({
  id,
  published,
  onDone,
}: {
  id: string;
  published: boolean;
  onDone: () => void;
}) {
  const mut = useMutation({
    mutationFn: (v: boolean) => setOrganisationPublished({ data: { id, published: v } }),
    onSuccess: (_, v) => {
      toast.success(v ? "Website published" : "Website unpublished");
      onDone();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  return (
    <Button
      size="sm"
      onClick={() => mut.mutate(!published)}
      disabled={mut.isPending}
      variant="outline"
      className={
        published
          ? "h-9 rounded-[10px] border-reps-border bg-white/5 text-white shadow-none hover:bg-reps-panel-soft"
          : "h-9 rounded-[10px] bg-reps-orange text-white shadow-none hover:bg-reps-orange-hover border-transparent"
      }
    >
      {published ? "Unpublish" : "Publish website"}
    </Button>
  );
}

/* ─────────────────── Overview ─────────────────── */

function PanelHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className={PANEL_HEADER}>
      <h3 className={PANEL_TITLE}>{title}</h3>
      {description && <p className={PANEL_DESC}>{description}</p>}
    </div>
  );
}

function OverviewPane({
  org,
  subscription,
  courses,
  id,
}: {
  org: any;
  subscription: any | null;
  courses: any[];
  id: string;
}) {
  const accredited = courses.filter((c) => c.status === "accredited").length;
  const pending = courses.filter((c) => c.status === "pending").length;

  const reviewQuery = useQuery({
    queryKey: ["admin", "provider-reviews", "overview", id],
    queryFn: () => listAdminProviderReviews({ data: { organisationId: id } }),
  });
  const reviews = reviewQuery.data ?? [];
  const published = reviews.filter((r) => r.status === "published");
  const avg = published.length
    ? published.reduce((a, r) => a + r.rating, 0) / published.length
    : null;

  const stats: { label: string; value: React.ReactNode; sub?: string }[] = [
    { label: "Accredited courses", value: accredited, sub: pending ? `${pending} pending` : undefined },
    { label: "Reviews", value: published.length, sub: avg != null ? `${avg.toFixed(1)} ★ avg` : "no reviews yet" },
    { label: "Membership", value: org.membership_number ? `#${org.membership_number}` : "—" },
    { label: "Plan", value: subscription?.tier ? String(subscription.tier).replace(/_/g, " ") : "—", sub: subscription?.status ?? undefined },
    { label: "Renewal", value: fmtDate(subscription?.current_period_end) },
    { label: "Joined", value: fmtDate(org.created_at) },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={PANEL}>
        <PanelHeader title="Snapshot" description="The 30-second read on this provider." />
        <div className={PANEL_BODY}>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-1 rounded-[12px] border border-reps-border/60 bg-reps-panel/60 px-3 py-2.5">
                <span className={LABEL}>{s.label}</span>
                <span className="text-sm font-medium text-white capitalize">{s.value}</span>
                {s.sub && <span className="text-[11px] text-white/45">{s.sub}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={PANEL}>
        <PanelHeader title="Contact information" />
        <div className={cn(PANEL_BODY, "grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-sm")}>
          <InfoRow label="Legal name" value={org.legal_name} />
          <InfoRow label="Website" value={org.website_url} href={org.website_url ?? undefined} />
          <InfoRow label="Email" value={org.contact_email} href={org.contact_email ? `mailto:${org.contact_email}` : undefined} />
          <InfoRow label="Phone" value={org.contact_phone} />
          <InfoRow label="City" value={org.city} />
          <InfoRow label="Country" value={org.country} />
          <InfoRow label="Companies House" value={org.companies_house_number} />
          <InfoRow label="Public slug" value={org.slug ? `/${org.slug}` : null} />
        </div>
      </section>

      <section className={PANEL}>
        <PanelHeader title="Identifiers" description="Cross-reference into Stripe and the database." />
        <div className={cn(PANEL_BODY, "flex flex-col gap-2")}>
          <IdRow label="Organisation id" value={org.id} />
          <IdRow
            label="Stripe customer"
            value={org.stripe_customer_id}
            href={org.stripe_customer_id ? `https://dashboard.stripe.com/customers/${org.stripe_customer_id}` : undefined}
          />
          <IdRow
            label="Stripe subscription"
            value={subscription?.stripe_subscription_id ?? null}
            href={subscription?.stripe_subscription_id ? `https://dashboard.stripe.com/subscriptions/${subscription.stripe_subscription_id}` : undefined}
          />
        </div>
      </section>

      <section className={PANEL}>
        <PanelHeader title="Recent reviews" description={reviewQuery.isLoading ? "Loading…" : `${published.length} published`} />
        <div className={PANEL_BODY}>
          {reviews.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-white/15 py-8 text-center text-white/50 text-sm">
              No reviews yet.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {reviews.slice(0, 3).map((r) => (
                <li key={r.id} className="rounded-[12px] border border-reps-border/60 bg-reps-panel/60 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-reps-orange text-reps-orange" : "text-white/20"}`} />
                      ))}
                    </div>
                    <span className="text-[11px] text-white/50">{r.author_display_name}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-white/40">{r.status.replace(/_/g, " ")}</span>
                  </div>
                  {r.title && <div className="mt-1 text-sm text-white">{r.title}</div>}
                  <p className="mt-0.5 text-[12.5px] text-white/60 line-clamp-2">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value, href }: { label: string; value?: string | null; href?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={LABEL}>{label}</span>
      {value ? (
        href ? (
          <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="truncate text-sm text-white hover:text-reps-orange">
            {value}
          </a>
        ) : (
          <span className="truncate text-sm text-white">{value}</span>
        )
      ) : (
        <span className="text-sm text-white/40">—</span>
      )}
    </div>
  );
}

function IdRow({ label, value, href }: { label: string; value: string | null; href?: string }) {
  const chipClass = "rounded-[8px] bg-reps-panel-soft/70 px-2 py-1 font-mono text-[11.5px] text-reps-orange hover:bg-reps-panel-soft";
  const copy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => toast.success("Copied"));
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] px-1 py-1.5">
      <span className={LABEL}>{label}</span>
      <div className="flex items-center gap-1.5">
        {value ? (
          href ? (
            <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={chipClass}>
              {value}
            </a>
          ) : (
            <span className={chipClass}>{value}</span>
          )
        ) : (
          <span className="text-xs text-white/40">—</span>
        )}
        {value && (
          <button type="button" onClick={copy} className="rounded-[8px] p-1 text-white/40 hover:bg-reps-panel-soft/60 hover:text-white/80" aria-label="Copy">
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Subscription pane ─────────────────── */

function SubscriptionPane({ org, subscription }: { org: any; subscription: any | null }) {
  return (
    <section className={PANEL}>
      <PanelHeader title="Stripe subscription" description="Attached from the Stripe customer on creation." />
      <div className={cn(PANEL_BODY, "grid grid-cols-1 gap-3 md:grid-cols-2 text-sm")}>
        <IdRow
          label="Stripe customer"
          value={org.stripe_customer_id}
          href={org.stripe_customer_id ? `https://dashboard.stripe.com/customers/${org.stripe_customer_id}` : undefined}
        />
        {subscription ? (
          <>
            <InfoRow label="Tier" value={String(subscription.tier).replace(/_/g, " ")} />
            <InfoRow label="Status" value={subscription.status} />
            <IdRow
              label="Subscription id"
              value={subscription.stripe_subscription_id}
              href={subscription.stripe_subscription_id ? `https://dashboard.stripe.com/subscriptions/${subscription.stripe_subscription_id}` : undefined}
            />
            <InfoRow label="Current period end" value={fmtDate(subscription.current_period_end)} />
            <InfoRow label="Cancel at period end" value={subscription.cancel_at_period_end ? "Yes" : "No"} />
            <InfoRow label="Environment" value={subscription.environment} />
          </>
        ) : (
          <div className="col-span-2 rounded-[12px] border border-dashed border-white/15 p-4 text-white/60">
            No subscription attached. Membership will not auto-renew.
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────── Reviews (per-provider) ─────────────────── */

const REVIEW_STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "flagged", label: "Flagged" },
  { value: "evidence_requested", label: "Evidence" },
  { value: "pending_email", label: "Pending email" },
  { value: "removed", label: "Removed" },
];

function reviewStatusBadge(status: string) {
  const map: Record<string, string> = {
    published: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    flagged: "border-amber-400/30 bg-amber-500/15 text-amber-300",
    evidence_requested: "border-amber-400/30 bg-amber-500/15 text-amber-300",
    pending_email: "border-white/15 bg-white/5 text-white/70",
    removed: "border-red-400/30 bg-red-500/15 text-red-300",
  };
  return (
    <Badge className={`${map[status] ?? map.pending_email} rounded-full`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function ReviewsPane({ organisationId }: { organisationId: string }) {
  const [status, setStatus] = React.useState("all");
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "provider-reviews", organisationId, status],
    queryFn: () => listAdminProviderReviews({ data: { status, organisationId } }),
  });

  const mut = useMutation({
    mutationFn: (input: { reviewId: string; action: "flag" | "request_evidence" | "remove" | "restore"; reason?: string; notes?: string }) =>
      moderateProviderReview({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "provider-reviews"] });
      qc.invalidateQueries({ queryKey: ["admin", "training-provider", organisationId] });
      toast.success("Updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Action failed"),
  });

  return (
    <section className={PANEL}>
      <div className={cn(PANEL_HEADER, "flex flex-wrap items-center justify-between gap-3")}>
        <div>
          <h3 className={PANEL_TITLE}>Reviews</h3>
          <p className={PANEL_DESC}>Moderate reviews left for this provider.</p>
        </div>
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList className="rounded-[10px] bg-reps-panel/60">
            {REVIEW_STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="rounded-[8px] text-xs data-[state=active]:bg-reps-panel">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className={PANEL_BODY}>
        {isLoading ? (
          <div className="py-8 text-center text-white/50 text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-white/15 py-10 text-center text-white/50 text-sm">
            Nothing here.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-[14px] border border-reps-border/60 bg-reps-panel/60 p-4">
                <div className="flex flex-wrap items-start gap-3 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-reps-orange text-reps-orange" : "text-white/20"}`} />
                        ))}
                      </div>
                      {reviewStatusBadge(r.status)}
                      {r.verification_source === "verified" && (
                        <Badge className="rounded-full border-emerald-400/30 bg-emerald-500/15 text-emerald-300 text-[10px]">
                          <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                        </Badge>
                      )}
                    </div>
                    {r.title && <h4 className="mt-2 text-white font-medium">{r.title}</h4>}
                    <p className="mt-1 text-sm text-white/70 whitespace-pre-line">{r.body}</p>
                    <div className="mt-2 text-xs text-white/45">
                      {r.author_display_name} · {new Date(r.created_at).toLocaleString()}
                      {r.removed_reason ? ` · removed: ${r.removed_reason}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.status !== "removed" && r.status !== "pending_email" && (
                      <>
                        <ReviewActionDialog
                          trigger={<Button size="sm" variant="outline" className="rounded-[10px]"><Flag className="mr-1 h-3.5 w-3.5" /> Flag</Button>}
                          title="Flag review"
                          onSubmit={(reason, notes) => mut.mutate({ reviewId: r.id, action: "flag", reason, notes })}
                        />
                        <ReviewActionDialog
                          trigger={<Button size="sm" variant="outline" className="rounded-[10px]"><FileSearch className="mr-1 h-3.5 w-3.5" /> Evidence</Button>}
                          title="Request evidence"
                          onSubmit={(reason, notes) => mut.mutate({ reviewId: r.id, action: "request_evidence", reason, notes })}
                        />
                        <ReviewActionDialog
                          trigger={
                            <Button size="sm" variant="outline" className="rounded-[10px] border-red-400/30 text-red-300 hover:bg-red-500/10">
                              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                            </Button>
                          }
                          title="Remove review"
                          requireReason
                          onSubmit={(reason, notes) => mut.mutate({ reviewId: r.id, action: "remove", reason, notes })}
                        />
                      </>
                    )}
                    {r.status === "removed" && (
                      <Button size="sm" variant="outline" className="rounded-[10px]" onClick={() => mut.mutate({ reviewId: r.id, action: "restore" })}>
                        <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restore
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewActionDialog({
  trigger,
  title,
  requireReason,
  onSubmit,
}: {
  trigger: React.ReactNode;
  title: string;
  requireReason?: boolean;
  onSubmit: (reason: string, notes: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [notes, setNotes] = React.useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-white/60">Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="rounded-[12px] mt-1" />
          </div>
          <div>
            <Label className="text-xs text-white/60">Internal notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded-[12px] mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={requireReason && !reason.trim()}
            className="rounded-[10px] bg-reps-orange hover:bg-reps-orange-hover text-white shadow-none"
            onClick={() => {
              onSubmit(reason.trim(), notes.trim());
              setOpen(false);
              setReason("");
              setNotes("");
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────── Details form ─────────────────── */

function DetailsForm({ org, onSaved }: { org: any; onSaved: () => void }) {
  const [form, setForm] = React.useState({
    name: org.name ?? "",
    slug: org.slug ?? "",
    legal_name: org.legal_name ?? "",
    membership_number: org.membership_number ?? "",
    website_url: org.website_url ?? "",
    contact_email: org.contact_email ?? "",
    contact_phone: org.contact_phone ?? "",
    city: org.city ?? "",
    country: org.country ?? "",
    companies_house_number: org.companies_house_number ?? "",
    logo_url: org.logo_url ?? "",
    cover_url: org.cover_url ?? "",
    about_md: org.about_md ?? "",
    status: (org.status ?? "draft") as "draft" | "active" | "suspended" | "cancelled",
  });

  const mut = useMutation({
    mutationFn: () =>
      updateOrganisation({
        data: {
          id: org.id,
          patch: Object.fromEntries(
            Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]),
          ) as any,
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const F = (k: keyof typeof form) => ({
    value: (form[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value })),
  });

  return (
    <section className={cn(PANEL, "p-6 space-y-5")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Display name"><Input {...F("name")} className="rounded-[12px]" /></FormField>
        <FormField label="Slug (URL)"><Input {...F("slug")} className="rounded-[12px]" /></FormField>
        <FormField label="Legal name"><Input {...F("legal_name")} className="rounded-[12px]" /></FormField>
        <FormField label="REPs membership number"><Input {...F("membership_number")} placeholder="e.g. TP-2026-014" className="rounded-[12px]" /></FormField>
        <FormField label="Website URL"><Input {...F("website_url")} placeholder="https://…" className="rounded-[12px]" /></FormField>
        <FormField label="Contact email"><Input {...F("contact_email")} className="rounded-[12px]" /></FormField>
        <FormField label="Contact phone"><Input {...F("contact_phone")} className="rounded-[12px]" /></FormField>
        <FormField label="Companies House #"><Input {...F("companies_house_number")} className="rounded-[12px]" /></FormField>
        <FormField label="City"><Input {...F("city")} className="rounded-[12px]" /></FormField>
        <FormField label="Country"><Input {...F("country")} className="rounded-[12px]" /></FormField>
        <FormField label="Logo URL"><Input {...F("logo_url")} className="rounded-[12px]" /></FormField>
        <FormField label="Cover image URL"><Input {...F("cover_url")} className="rounded-[12px]" /></FormField>
      </div>
      <FormField label="About (markdown supported)">
        <Textarea {...F("about_md")} rows={8} className="rounded-[12px] font-mono text-sm" />
      </FormField>
      <FormField label="Status">
        <Select value={form.status} onValueChange={(v) => setForm((s) => ({ ...s, status: v as any }))}>
          <SelectTrigger className="rounded-[12px] max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <div className="flex justify-end">
        <Button
          onClick={() => mut.mutate()}
          disabled={mut.isPending}
          className="rounded-[10px] bg-reps-orange text-white shadow-none hover:bg-reps-orange-hover"
        >
          {mut.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </section>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-white/60">{label}</Label>
      {children}
    </div>
  );
}

/* ─────────────────── Courses tab ─────────────────── */

function CoursesTab({
  orgId,
  courses,
  onChange,
}: {
  orgId: string;
  courses: any[];
  onChange: () => void;
}) {
  const [editing, setEditing] = React.useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const del = useMutation({
    mutationFn: (id: string) => deleteCourse({ data: { id } }),
    onSuccess: () => {
      toast.success("Course deleted");
      onChange();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <section className={cn(PANEL, "p-6 space-y-4")}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl text-white">Accredited courses</h3>
          <p className="text-sm text-white/60">
            Each accredited course shows on the provider's website with a REPs badge and course id.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditing(null)}
              className="rounded-[10px] bg-reps-orange text-white shadow-none hover:bg-reps-orange-hover"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add course
            </Button>
          </DialogTrigger>
          <CourseDialog
            orgId={orgId}
            course={editing}
            onDone={() => {
              setDialogOpen(false);
              setEditing(null);
              onChange();
            }}
          />
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-white/15 py-12 text-center text-white/50">
          <GraduationCap className="mx-auto h-8 w-8 text-white/30" />
          <div className="mt-2">No courses yet.</div>
        </div>
      ) : (
        <div className="divide-y divide-white/5 rounded-[16px] border border-white/10">
          {courses.map((c) => (
            <div key={c.id} className="p-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white">{c.title}</span>
                  <Badge
                    className={
                      c.status === "accredited"
                        ? "rounded-full border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                        : c.status === "rejected"
                          ? "rounded-full border-red-400/30 bg-red-500/15 text-red-300"
                          : "rounded-full border-white/15 bg-white/5 text-white/70"
                    }
                  >
                    {c.status}
                  </Badge>
                  {c.reps_course_id && (
                    <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-white/70">
                      {c.reps_course_id}
                    </code>
                  )}
                </div>
                {c.summary && <p className="mt-1 text-sm text-white/60 line-clamp-2">{c.summary}</p>}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
                  {c.level && <span>Level {c.level}</span>}
                  {c.duration_hours && <span>{c.duration_hours}h</span>}
                  {c.delivery_mode && <span className="capitalize">{String(c.delivery_mode).replace("_", " ")}</span>}
                  {c.price_from && <span>from £{c.price_from}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-[10px] border-white/15 bg-white/5 text-white shadow-none hover:bg-white/10"
                  onClick={() => {
                    setEditing(c);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="rounded-[10px] border-red-400/30 bg-red-500/10 text-red-300 shadow-none hover:bg-red-500/20"
                  onClick={() => {
                    if (confirm(`Delete "${c.title}"?`)) del.mutate(c.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CourseDialog({
  orgId,
  course,
  onDone,
}: {
  orgId: string;
  course: any | null;
  onDone: () => void;
}) {
  const [form, setForm] = React.useState(() => ({
    title: course?.title ?? "",
    slug: course?.slug ?? "",
    reps_course_id: course?.reps_course_id ?? "",
    summary: course?.summary ?? "",
    description_md: course?.description_md ?? "",
    level: course?.level ?? "",
    duration_hours: course?.duration_hours ?? "",
    delivery_mode: (course?.delivery_mode ?? "") as "" | "in_person" | "online" | "blended",
    price_from: course?.price_from ?? "",
    external_url: course?.external_url ?? "",
    status: (course?.status ?? "pending") as "pending" | "accredited" | "rejected" | "expired",
    expires_at: (course?.expires_at ?? "").slice(0, 10),
  }));

  React.useEffect(() => {
    setForm({
      title: course?.title ?? "",
      slug: course?.slug ?? "",
      reps_course_id: course?.reps_course_id ?? "",
      summary: course?.summary ?? "",
      description_md: course?.description_md ?? "",
      level: course?.level ?? "",
      duration_hours: course?.duration_hours ?? "",
      delivery_mode: (course?.delivery_mode ?? "") as any,
      price_from: course?.price_from ?? "",
      external_url: course?.external_url ?? "",
      status: (course?.status ?? "pending") as any,
      expires_at: (course?.expires_at ?? "").slice(0, 10),
    });
  }, [course]);

  const mut = useMutation({
    mutationFn: () =>
      upsertCourse({
        data: {
          id: course?.id,
          organisation_id: orgId,
          title: form.title.trim(),
          slug: form.slug.trim() || undefined,
          reps_course_id: form.reps_course_id.trim() || null,
          summary: form.summary.trim() || null,
          description_md: form.description_md.trim() || null,
          level: form.level.trim() || null,
          duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
          delivery_mode: (form.delivery_mode || null) as any,
          price_from: form.price_from ? Number(form.price_from) : null,
          external_url: form.external_url.trim() || null,
          status: form.status,
          expires_at: form.expires_at ? form.expires_at : null,
        },
      }),
    onSuccess: () => {
      toast.success(course ? "Course updated" : "Course added");
      onDone();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{course ? "Edit course" : "Add course"}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-[12px]" /></FormField>
        <FormField label="REPs course id"><Input value={form.reps_course_id} onChange={(e) => setForm({ ...form, reps_course_id: e.target.value })} placeholder="e.g. REPS-L3-PT-014" className="rounded-[12px]" /></FormField>
        <FormField label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from title" className="rounded-[12px]" /></FormField>
        <FormField label="Level"><Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="e.g. 3" className="rounded-[12px]" /></FormField>
        <FormField label="Duration (hours)"><Input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} className="rounded-[12px]" /></FormField>
        <FormField label="Delivery mode">
          <Select value={form.delivery_mode || "unset"} onValueChange={(v) => setForm({ ...form, delivery_mode: v === "unset" ? "" : (v as any) })}>
            <SelectTrigger className="rounded-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">—</SelectItem>
              <SelectItem value="in_person">In person</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="blended">Blended</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Price from (£)"><Input type="number" value={form.price_from} onChange={(e) => setForm({ ...form, price_from: e.target.value })} className="rounded-[12px]" /></FormField>
        <FormField label="External URL (enquire / apply)"><Input value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} placeholder="https://…" className="rounded-[12px]" /></FormField>
        <FormField label="Status">
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
            <SelectTrigger className="rounded-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accredited">Accredited</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Accreditation expires"><Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="rounded-[12px]" /></FormField>
      </div>
      <FormField label="Summary (1–2 sentences)">
        <Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} className="rounded-[12px]" />
      </FormField>
      <FormField label="Description (markdown)">
        <Textarea value={form.description_md} onChange={(e) => setForm({ ...form, description_md: e.target.value })} rows={5} className="rounded-[12px] font-mono text-sm" />
      </FormField>
      <DialogFooter>
        <Button
          disabled={!form.title.trim() || mut.isPending}
          onClick={() => mut.mutate()}
          className="rounded-[10px] bg-reps-orange text-white shadow-none hover:bg-reps-orange-hover"
        >
          {mut.isPending ? "Saving…" : "Save course"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
