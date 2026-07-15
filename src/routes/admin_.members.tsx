import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CreditCard,
  Eye,
  ExternalLink,
  Filter,
  Flag,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingUp,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import * as React from "react";
import { useQuery, useQueryClient, keepPreviousData, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { DashboardShell, type DashboardSearch } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { timeAgo } from "@/lib/format/relative-time";


// Clicking a pro's name in the list opens their Member 360 workbench.
// The tooltip still surfaces the underlying user_id for ops/debugging,
// but the previous copy-to-clipboard interaction was replaced — Member
// 360 is the canonical drill-in for every admin action on a member.
function NameWithIdTooltip({ id, name }: { id: string; name: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/admin/members/$userId"
          params={{ userId: id }}
          className="text-left font-semibold text-white hover:text-reps-orange"
        >
          {name}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-mono text-[11px]">
        {id}
      </TooltipContent>
    </Tooltip>
  );
}

// Tiny inline sparkline (12-pt monthly series). No deps.
function Sparkline({ values }: { values: number[] }) {
  if (!values.length) return <div className="h-7 w-full" />;
  const w = 120, h = 28, pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const stepX = (w - pad * 2) / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (h - pad * 2) * (1 - (v - min) / range);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lastX = pad + (values.length - 1) * stepX;
  const lastY = pad + (h - pad * 2) * (1 - (values[values.length - 1] - min) / range);
  const areaPath = `M ${pts[0]} L ${pts.join("L")} L ${lastX.toFixed(1)},${h - pad} L ${pad},${h - pad} Z`;
  const linePath = `M ${pts.join("L")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" preserveAspectRatio="none">
      <path d={areaPath} fill="rgb(255 122 0 / 0.12)" />
      <path d={linePath} fill="none" stroke="rgb(255 122 0)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r="2" fill="rgb(255 122 0)" />
    </svg>
  );
}



import { initialsFromName } from "@/lib/initials";
import {
  getAdminProfessionalsKpis,
  listAdminProfessionals,
  setProfessionalSuspension,
  setProfessionalFlag,
  
  type AdminProRow,
  type AdminProTab,
  type AdminProSort,
  type SortDir,
  type AdminProFilters,
  type AdminProSegment,
} from "@/lib/admin/professionals.functions";
import { startImpersonation } from "@/lib/admin/impersonation.functions";
import { setTrainingProviderPlan } from "@/lib/admin/set-training-provider-plan.functions";
import { sendProfessionalInvite } from "@/lib/admin/invites.functions";
import { createProvider } from "@/lib/admin/providers.functions";

type ProfessionalsSearch = { plan?: "free" | "paid" };

export const Route = createFileRoute("/admin_/members")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  validateSearch: (search: Record<string, unknown>): ProfessionalsSearch => {
    const plan = search.plan;
    if (plan === "free" || plan === "paid") return { plan };
    return {};
  },
  component: AdminProfessionalsPage,
});


const TABS: { label: string; value: AdminProTab }[] = [
  { label: "All", value: "all" },
  { label: "Verified", value: "verified" },
  { label: "Unverified", value: "pending" },
  { label: "Payment failed", value: "payment_failed" },
  { label: "Suspended", value: "suspended" },
];

const SORT_OPTIONS: { value: AdminProSort; label: string; defaultDir: SortDir }[] = [
  { value: "joined", label: "Joined", defaultDir: "desc" },
  { value: "name", label: "Name", defaultDir: "asc" },
  { value: "plan", label: "Plan value", defaultDir: "desc" },
  { value: "mrr", label: "Plan MRR", defaultDir: "desc" },
  { value: "lifetimeValue", label: "Lifetime value", defaultDir: "desc" },
  { value: "renewalDate", label: "Renewal date", defaultDir: "desc" },
];

const PROFESSION_OPTIONS = [
  { slug: "personal-trainer", label: "Personal Trainer" },
  { slug: "fitness-instructor", label: "Fitness Instructor" },
  { slug: "group-fitness-instructor", label: "Group Ex" },
  { slug: "strength-coach", label: "S&C Coach" },
  { slug: "nutritionist", label: "Nutritionist" },
  { slug: "pilates-instructor", label: "Pilates" },
  { slug: "yoga-teacher", label: "Yoga" },
];

// "Free" is intentionally absent — every active REPs member must be on a
// paid Stripe sub. Legacy free / BD-window accounts are deleted, not filtered.
const PLAN_OPTIONS: { value: 'verified' | 'pro' | 'studio'; label: string }[] = [
  { value: "verified", label: "Core" },
  { value: "pro", label: "Pro" },
  { value: "studio", label: "Studio" },
];

const STATUS_LABEL: Record<AdminProRow["status"], string> = {
  verified: "Verified",
  pending: "Unverified",
  flagged: "Flagged",
  suspended: "Suspended",
};

function statusClass(s: AdminProRow["status"]) {
  switch (s) {
    case "verified":    return "bg-emerald-500/15 text-emerald-300";
    case "pending":     return "bg-reps-orange-soft text-reps-orange";
    case "flagged":     return "bg-red-500/15 text-red-400";
    case "suspended":   return "bg-amber-500/15 text-amber-300";
  }
}

const BILLING_LABEL: Record<Exclude<AdminProRow["billingState"], "ok">, string> = {
  payment_failed: "Payment failed",
  renewal_due: "Renewal due",
};

function billingClass(b: Exclude<AdminProRow["billingState"], "ok">) {
  switch (b) {
    case "payment_failed": return "bg-red-500/15 text-red-400";
    case "renewal_due":    return "bg-amber-500/15 text-amber-300";
  }
}


const PLAN_LABEL: Record<AdminProRow["plan"] | 'training_provider', string> = {
  free: "Free", verified: "Core", pro: "Pro", studio: "Studio", training_provider: "Training Provider",
};

function planClass(p: AdminProRow["plan"] | 'training_provider') {
  switch (p) {
    case "verified": return "bg-emerald-500/15 text-emerald-300";
    case "pro":      return "bg-reps-orange-soft text-reps-orange";
    case "studio":   return "bg-violet-500/15 text-violet-300";
    case "training_provider": return "bg-sky-500/15 text-sky-300";
    case "free":     return "bg-white/10 text-white/65";
  }
}

function gbp(pence: number) {
  if (!pence) return "—";
  const v = pence / 100;
  return "£" + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function joinedLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function renewalLabel(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function AdminProfessionalsPage() {
  const searchParams = Route.useSearch();
  const [segment, setSegment] = React.useState<AdminProSegment>("professionals");
  const [tab, setTab] = React.useState<AdminProTab>("all");
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<AdminProSort>("joined");
  const [dir, setDir] = React.useState<SortDir>("desc");
  const [filters, setFilters] = React.useState<AdminProFilters>(() => {
    if (searchParams.plan === "free") return { plans: ["free"] };
    if (searchParams.plan === "paid") return { plans: ["verified", "pro", "studio"] };
    return {};
  });

  // Sync filters when navigating with a ?plan= search param (re-entry to route)
  React.useEffect(() => {
    if (searchParams.plan === "free") {
      setFilters((f) => ({ ...f, plans: ["free"] }));
      setTab("all");
    } else if (searchParams.plan === "paid") {
      setFilters((f) => ({ ...f, plans: ["verified", "pro", "studio"] }));
      setTab("all");
    }
  }, [searchParams.plan]);

  const debouncedSearch = useDebounced(search, 300);
  const pageSize = 25;

  React.useEffect(() => { setPage(1); }, [segment, tab, debouncedSearch, sort, dir, filters]);


  const kpisFn = useServerFn(getAdminProfessionalsKpis);
  const listFn = useServerFn(listAdminProfessionals);

  const kpisQ = useQuery({
    queryKey: ["admin-pros-kpis"],
    queryFn: () => kpisFn(),
    staleTime: 60_000,
  });

  const listQ = useQuery({
    queryKey: ["admin-pros-list", segment, tab, page, debouncedSearch, sort, dir, filters],
    queryFn: () => listFn({ data: { segment, tab, page, pageSize, q: debouncedSearch, sort, dir, filters } }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const dashSearch: DashboardSearch = {
    value: search, onChange: setSearch,
    placeholder: "Search professionals, members, leads…",
  };

  const rows = listQ.data?.rows ?? [];
  const total = listQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showTo = Math.min(page * pageSize, total);

  const activeFilterCount =
    (filters.plans?.length ?? 0) +
    (filters.professions?.length ?? 0) +
    (filters.hasAvatar !== undefined ? 1 : 0);

  const series = kpisQ.data?.series;
  const kpis = [
    {
      label: "Active Professionals",
      value: kpisQ.data ? kpisQ.data.activeCount.toLocaleString() : "—",
      delta: "All confirmed pros on a paid Stripe sub",
      icon: Users,
      series: series?.active,
    },
    {
      label: "Verified Professionals",
      value: kpisQ.data ? kpisQ.data.verifiedCount.toLocaleString() : "—",
      delta: kpisQ.data
        ? `${kpisQ.data.verifiedCount.toLocaleString()} of ${kpisQ.data.activeCount.toLocaleString()} active`
        : "",
      icon: ShieldCheck,
      series: series?.verified,
    },
    {
      label: "Paid Professionals",
      value: kpisQ.data ? kpisQ.data.paidCount.toLocaleString() : "—",
      delta: "With active paid entitlement — matches /admin M1",
      icon: CreditCard,
      series: series?.paid,
    },
    {
      label: "New signups (30d)",
      value: kpisQ.data ? kpisQ.data.newSignups30.toLocaleString() : "—",
      delta: kpisQ.data?.newSignupsDeltaPct != null
        ? `${kpisQ.data.newSignupsDeltaPct >= 0 ? "+" : ""}${kpisQ.data.newSignupsDeltaPct.toFixed(1)}% vs prev 30d`
        : "",
      icon: TrendingUp,
      series: series?.newSignups,
    },
  ];

  return (
    <DashboardShell
      role="admin"
      active="Members"
      title="Members"
      subtitle="The full register of REPS members — professionals and training providers."
      search={dashSearch}
      actions={<InviteButton />}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const last = k.series && k.series.length ? k.series[k.series.length - 1] : null;
          const prev = k.series && k.series.length > 1 ? k.series[k.series.length - 2] : null;
          const monDelta = last != null && prev != null && prev > 0
            ? ((last - prev) / prev) * 100
            : null;
          const monDeltaTone =
            monDelta == null ? "text-white/45"
            : monDelta > 0 ? "text-emerald-300"
            : monDelta < 0 ? "text-red-400"
            : "text-white/45";
          return (
            <PCard key={k.label}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12px] text-white/55">{k.label}</div>
                  <div className="mt-1 font-display text-[26px] font-bold text-white">{k.value}</div>
                  <div className="mt-1 text-[11px] text-white/55">{k.delta}</div>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <k.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <Sparkline values={k.series ?? []} />
                <span className={`shrink-0 text-[11px] font-semibold tabular-nums ${monDeltaTone}`}>
                  {monDelta == null
                    ? "—"
                    : `${monDelta >= 0 ? "+" : ""}${monDelta.toFixed(1)}% MoM`}
                </span>
              </div>
            </PCard>
          );
        })}
      </div>

      <PPanel className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-reps-border px-5 py-3">
          <div className="inline-flex rounded-full border border-reps-border bg-reps-ink/40 p-1">
            {([
              { value: "professionals", label: "Professionals" },
              { value: "providers", label: "Training Providers" },
            ] as const).map((s) => {
              const active = s.value === segment;
              return (
                <button
                  key={s.value}
                  onClick={() => { setSegment(s.value); if (s.value === "providers") setTab("all"); }}
                  className={
                    active
                      ? "h-8 rounded-full bg-reps-orange px-4 text-[12px] font-semibold text-white"
                      : "h-8 rounded-full px-4 text-[12px] font-medium text-white/65 hover:text-white"
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          {segment === "providers" ? (
            <div className="flex items-center gap-2">
              <SortControl sort={sort} dir={dir} onChange={(s, d) => { setSort(s); setDir(d); }} />
              <FiltersSheet value={filters} onChange={setFilters} count={activeFilterCount} />
            </div>
          ) : null}
        </div>
        {segment === "professionals" ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-reps-border px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              {TABS.map((t) => {
                const active = t.value === tab;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTab(t.value)}
                    className={
                      active
                        ? "h-8 rounded-full bg-reps-orange-soft px-3 text-[12px] font-semibold text-reps-orange"
                        : "h-8 rounded-full border border-reps-border px-3 text-[12px] font-medium text-white/65 hover:text-white"
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <SortControl sort={sort} dir={dir} onChange={(s, d) => { setSort(s); setDir(d); }} />
              <FiltersSheet value={filters} onChange={setFilters} count={activeFilterCount} />
            </div>
          </div>
        ) : null}


        {activeFilterCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-reps-border px-5 py-3">
            {(filters.plans ?? []).map(p => (
              <FilterChip key={`plan-${p}`} label={`Plan: ${PLAN_LABEL[p]}`} onClear={() =>
                setFilters(f => ({ ...f, plans: f.plans?.filter(x => x !== p) }))} />
            ))}
            {(filters.professions ?? []).map(p => (
              <FilterChip key={`prof-${p}`} label={`Profession: ${PROFESSION_OPTIONS.find(o => o.slug === p)?.label ?? p}`} onClear={() =>
                setFilters(f => ({ ...f, professions: f.professions?.filter(x => x !== p) }))} />
            ))}
            {filters.hasAvatar !== undefined ? (
              <FilterChip label={filters.hasAvatar ? "Has avatar" : "No avatar"} onClear={() =>
                setFilters(f => ({ ...f, hasAvatar: undefined }))} />
            ) : null}
            <button onClick={() => setFilters({})}
              className="ml-1 text-[12px] font-medium text-white/55 underline-offset-4 hover:text-white hover:underline">
              Clear all
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-reps-border text-left text-[11px] uppercase tracking-wider text-white/45">
                <th className="px-5 py-3 font-semibold">{segment === "providers" ? "Provider" : "Professional"}</th>
                {segment === "providers" ? (
                  <>
                    <th className="px-3 py-3 font-semibold">Last logged in</th>
                    <th className="px-3 py-3 font-semibold">Courses</th>
                    <th className="px-3 py-3 font-semibold">Verified pros</th>
                    <th className="px-3 py-3 font-semibold">Plan</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Renewal date</th>
                    <th className="px-3 py-3 font-semibold">Joined</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-3 font-semibold">Profession</th>
                    <th className="px-3 py-3 font-semibold">Plan</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Lifetime value</th>
                    <th className="px-3 py-3 font-semibold">Renewal date</th>
                    <th className="px-3 py-3 font-semibold">Plan MRR</th>
                    <th className="px-3 py-3 font-semibold">Joined</th>
                  </>
                )}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {listQ.isLoading && !listQ.data ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-white/55">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-white/55">No {segment === "providers" ? "training providers" : "professionals"} match.</td></tr>
              ) : rows.map((r) => (
                <ProRow key={r.id} row={r} segment={segment} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-reps-border px-5 py-3 text-[12px] text-white/55">
          <span>Showing {showFrom.toLocaleString()}–{showTo.toLocaleString()} of {total.toLocaleString()}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 rounded-[8px] border border-reps-border px-3 text-white/70 disabled:opacity-40"
            >Previous</button>
            <span className="flex h-8 items-center px-2 text-white/70">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 rounded-[8px] border border-reps-border px-3 text-white/70 disabled:opacity-40"
            >Next</button>
          </div>
        </div>
      </PPanel>
    </DashboardShell>
  );
}

// ---------- Sort control ----------

function SortControl({
  sort, dir, onChange,
}: { sort: AdminProSort; dir: SortDir; onChange: (s: AdminProSort, d: SortDir) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Select
        value={sort}
        onValueChange={(v) => {
          const opt = SORT_OPTIONS.find(o => o.value === (v as AdminProSort));
          onChange(v as AdminProSort, opt?.defaultDir ?? "desc");
        }}
      >
        <SelectTrigger className="h-9 w-[150px] rounded-[10px] border border-reps-border bg-transparent text-[12px] font-medium text-white/80">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent className="border-reps-border bg-reps-panel text-white/85">
          {SORT_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value} className="text-[13px] focus:bg-white/5 focus:text-white">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        onClick={() => onChange(sort, dir === "asc" ? "desc" : "asc")}
        title={dir === "asc" ? "Ascending" : "Descending"}
        className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-reps-border text-white/70 hover:text-white"
      >
        {dir === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ---------- Filters sheet ----------

function FiltersSheet({
  value, onChange, count,
}: { value: AdminProFilters; onChange: (v: AdminProFilters) => void; count: number }) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<AdminProFilters>(value);
  React.useEffect(() => { if (open) setDraft(value); }, [open, value]);

  function togglePlan(p: "verified" | "pro" | "studio") {
    setDraft(d => {
      const set = new Set(d.plans ?? []);
      if (set.has(p)) set.delete(p); else set.add(p);
      return { ...d, plans: Array.from(set) as AdminProFilters['plans'] };
    });
  }
  function toggleProf(p: string) {
    setDraft(d => {
      const set = new Set(d.professions ?? []);
      if (set.has(p)) set.delete(p); else set.add(p);
      return { ...d, professions: Array.from(set) };
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative flex h-9 items-center gap-2 rounded-[10px] border border-reps-border px-3 text-[12px] font-medium text-white/70 hover:text-white">
          <Filter className="h-3.5 w-3.5" /> Filters
          {count > 0 ? (
            <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-reps-orange px-1 text-[10px] font-bold text-white">{count}</span>
          ) : null}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-md border-l border-reps-border bg-reps-panel text-white">
        <SheetHeader>
          <SheetTitle className="text-white">Filter professionals</SheetTitle>
          <SheetDescription className="text-white/55">
            Narrow the register. Filters combine with the active tab.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
          <div>
            <Label className="mb-2 block text-[12px] uppercase tracking-wider text-white/55">Plan</Label>
            <div className="flex flex-wrap gap-2">
              {PLAN_OPTIONS.map(o => {
                const active = draft.plans?.includes(o.value);
                return (
                  <button key={o.value} onClick={() => togglePlan(o.value)}
                    className={active
                      ? "h-8 rounded-full bg-reps-orange-soft px-3 text-[12px] font-semibold text-reps-orange"
                      : "h-8 rounded-full border border-reps-border px-3 text-[12px] font-medium text-white/65 hover:text-white"}>
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-[12px] uppercase tracking-wider text-white/55">Profession</Label>
            <div className="flex flex-wrap gap-2">
              {PROFESSION_OPTIONS.map(o => {
                const active = draft.professions?.includes(o.slug);
                return (
                  <button key={o.slug} onClick={() => toggleProf(o.slug)}
                    className={active
                      ? "h-8 rounded-full bg-reps-orange-soft px-3 text-[12px] font-semibold text-reps-orange"
                      : "h-8 rounded-full border border-reps-border px-3 text-[12px] font-medium text-white/65 hover:text-white"}>
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-[12px] uppercase tracking-wider text-white/55">Photo</Label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-[13px] text-white/80">
                <Checkbox
                  checked={draft.hasAvatar === true}
                  onCheckedChange={(v) => setDraft(d => ({ ...d, hasAvatar: v ? true : undefined }))}
                /> Has profile photo
              </label>
              <label className="ml-4 flex items-center gap-2 text-[13px] text-white/80">
                <Checkbox
                  checked={draft.hasAvatar === false}
                  onCheckedChange={(v) => setDraft(d => ({ ...d, hasAvatar: v ? false : undefined }))}
                /> Missing photo
              </label>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="ghost" onClick={() => { setDraft({}); }}>Clear</Button>
          <Button onClick={() => { onChange(draft); setOpen(false); }}
            className="bg-reps-orange text-white hover:bg-reps-orange-hover">
            Apply filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/75">
      {label}
      <button onClick={onClear} className="ml-0.5 text-white/55 hover:text-white">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ---------- Invite professional ----------

function InviteButton() {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<"individual" | "training_provider">("individual");
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [plan, setPlan] = React.useState<"verified" | "pro">("pro");
  const inviteFn = useServerFn(sendProfessionalInvite);
  const createProviderFn = useServerFn(createProvider);
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: async () => {
      if (type === "training_provider") {
        return createProviderFn({
          data: {
            email: email.trim(),
            name: fullName.trim(),
            website: website.trim() || null,
            note: null,
          },
        });
      }
      return inviteFn({ data: { email, full_name: fullName || undefined, plan } });
    },
    onSuccess: () => {
      toast.success(
        type === "training_provider"
          ? `Provider invite sent to ${email}`
          : `Invite sent to ${email}`,
      );
      setEmail(""); setFullName(""); setWebsite("");
      qc.invalidateQueries({ queryKey: ["admin-pros-list"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to send invite"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover">
          <Plus className="h-4 w-4" /> Invite member
        </button>
      </DialogTrigger>
      <DialogContent className="border-reps-border bg-reps-panel text-white sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-white">Invite a member</DialogTitle>
          <DialogDescription className="text-white/55">
            We'll email them a signup link. Choose the account type — individual professionals go to pricing, training providers land pre-seeded as an organisation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div>
            <Label className="text-white/75">Account type</Label>
            <div className="mt-1 flex gap-2">
              <button onClick={() => setType("individual")}
                className={type === "individual"
                  ? "flex-1 rounded-[10px] border border-reps-orange bg-reps-orange-soft px-3 py-2 text-left text-[12px] font-semibold text-reps-orange"
                  : "flex-1 rounded-[10px] border border-reps-border px-3 py-2 text-left text-[12px] font-medium text-white/70 hover:text-white"}>
                Individual professional
              </button>
              <button onClick={() => setType("training_provider")}
                className={type === "training_provider"
                  ? "flex-1 rounded-[10px] border border-reps-orange bg-reps-orange-soft px-3 py-2 text-left text-[12px] font-semibold text-reps-orange"
                  : "flex-1 rounded-[10px] border border-reps-border px-3 py-2 text-left text-[12px] font-medium text-white/70 hover:text-white"}>
                Training provider
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="invite-email" className="text-white/75">Email <span className="text-reps-orange">*</span></Label>
            <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={type === "training_provider" ? "contact@provider.com" : "trainer@example.com"}
              className="mt-1 h-10 rounded-[10px] border-white/15 bg-white/[0.04] text-white placeholder:text-white/30" />
          </div>
          <div>
            <Label htmlFor="invite-name" className="text-white/75">
              {type === "training_provider" ? "Provider name" : "Full name (optional)"}
              {type === "training_provider" && <span className="text-reps-orange"> *</span>}
            </Label>
            <Input id="invite-name" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder={type === "training_provider" ? "Northline Academy" : "Sam Jones"}
              className="mt-1 h-10 rounded-[10px] border-white/15 bg-white/[0.04] text-white placeholder:text-white/30" />
          </div>
          {type === "training_provider" ? (
            <div>
              <Label htmlFor="invite-website" className="text-white/75">Website (optional)</Label>
              <Input id="invite-website" value={website} onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://…"
                className="mt-1 h-10 rounded-[10px] border-white/15 bg-white/[0.04] text-white placeholder:text-white/30" />
            </div>
          ) : (
            <div>
              <Label className="text-white/75">Suggest plan</Label>
              <div className="mt-1 flex gap-2">
                <button onClick={() => setPlan("verified")}
                  className={plan === "verified"
                    ? "flex-1 rounded-[10px] border border-reps-orange bg-reps-orange-soft px-3 py-2 text-left text-[12px] font-semibold text-reps-orange"
                    : "flex-1 rounded-[10px] border border-reps-border px-3 py-2 text-left text-[12px] font-medium text-white/70 hover:text-white"}>
                  Core <span className="font-normal text-white/55">£34/yr</span>
                </button>
                <button onClick={() => setPlan("pro")}
                  className={plan === "pro"
                    ? "flex-1 rounded-[10px] border border-reps-orange bg-reps-orange-soft px-3 py-2 text-left text-[12px] font-semibold text-reps-orange"
                    : "flex-1 rounded-[10px] border border-reps-border px-3 py-2 text-left text-[12px] font-medium text-white/70 hover:text-white"}>
                  Pro Founding <span className="font-normal text-white/55">£59/mo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          <Button
            disabled={m.isPending || !email || (type === "training_provider" && !fullName.trim())}
            onClick={() => m.mutate()}
            className="bg-reps-orange text-white hover:bg-reps-orange-hover"
          >
            {m.isPending ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Sending…</> : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Row ----------

function ProRow({ row, segment }: { row: AdminProRow; segment: AdminProSegment }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const startFn = useServerFn(startImpersonation);
  const suspendFn = useServerFn(setProfessionalSuspension);
  const flagFn = useServerFn(setProfessionalFlag);
  const setTpFn = useServerFn(setTrainingProviderPlan);
  
  const [busy, setBusy] = React.useState(false);
  const [suspendOpen, setSuspendOpen] = React.useState(false);

  async function handleViewAs() {
    if (busy) return;
    setBusy(true);
    try {
      await startFn({ data: { professional_id: row.id } });
      await qc.invalidateQueries({ queryKey: ["impersonation-status"] });
      navigate({ to: "/dashboard" });
    } catch (e) {
      console.error("startImpersonation failed", e);
      toast.error("Could not start view-as session");
      setBusy(false);
    }
  }

  const flagM = useMutation({
    mutationFn: (flagged: boolean) => flagFn({ data: { professional_id: row.id, flagged } }),
    onSuccess: () => {
      toast.success(row.status === "flagged" ? "Flag cleared" : "Professional flagged");
      qc.invalidateQueries({ queryKey: ["admin-pros-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendM = useMutation({
    mutationFn: (vars: { suspended: boolean; reason?: string }) =>
      suspendFn({ data: { professional_id: row.id, ...vars } }),
    onSuccess: (_res, vars) => {
      toast.success(vars.suspended ? `Suspended — ${row.name} notified by email` : `${row.name} reinstated`);
      qc.invalidateQueries({ queryKey: ["admin-pros-list"] });
      setSuspendOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setTpM = useMutation({
    mutationFn: () => setTpFn({ data: { professional_id: row.id } }),
    onSuccess: () => {
      toast.success(`${row.name} set to Training Provider plan`);
      qc.invalidateQueries({ queryKey: ["admin-pros-list"] });
      qc.invalidateQueries({ queryKey: ["impersonation-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });




  // Cancel-sub and delete-member are owned by Member 360 (Phase 6 — single
  // destructive-action surface). The dropdown links there.


  const initials = initialsFromName(row.name);
  const isSuspended = Boolean(row.suspendedAt);
  const isFlagged = row.status === "flagged";
  const slug = row.handle.replace(/^@/, "");

  return (
    <tr className="border-b border-reps-border/60 last:border-b-0">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 rounded-full">
            {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-reps-panel-soft text-[11px] text-white/55">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <NameWithIdTooltip id={row.id} name={row.name} />
            <div className="text-[11px] text-white/50">{row.handle}</div>
          </div>
        </div>
      </td>

      {segment === "providers" ? (
        <>
          <td className="px-3 py-3 text-white/75">{row.lastLoginAt ? <span title={new Date(row.lastLoginAt).toLocaleString()}>{timeAgo(row.lastLoginAt)}</span> : <span className="text-white/45">Never</span>}</td>
          <td className="px-3 py-3 text-white/75 tabular-nums">{row.coursesCount ?? 0}</td>
          <td className="px-3 py-3 text-white/45">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help underline decoration-dotted underline-offset-2">—</span>
              </TooltipTrigger>
              <TooltipContent side="top">Wired once course + pro-link tables land</TooltipContent>
            </Tooltip>
          </td>
          <td className="px-3 py-3">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${planClass('training_provider')}`}>
              {PLAN_LABEL.training_provider}
            </span>
          </td>
          <td className="px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {row.isTrial && (
                <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                  Trial{row.trialDaysLeft != null ? ` · ${row.trialDaysLeft}d left` : ""}
                </span>
              )}
              {row.billingState !== "ok" && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${billingClass(row.billingState)}`}>
                  {BILLING_LABEL[row.billingState]}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                {row.status === "verified" && <CheckCircle2 className="h-3 w-3" />}
                {STATUS_LABEL[row.status]}
              </span>
            </div>
          </td>
          <td className="px-3 py-3 text-white/75">{renewalLabel(row.renewalDate)}</td>
          <td className="px-3 py-3 text-white/55">{joinedLabel(row.joined)}</td>
        </>
      ) : (
        <>
          <td className="px-3 py-3">
            {row.profession ? (
              <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/75">
                {row.profession}
              </span>
            ) : <span className="text-white/45">—</span>}
          </td>
          <td className="px-3 py-3">
            {row.isTrial ? (
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-400/30">
                Trial{row.trialDaysLeft != null ? ` · ${row.trialDaysLeft}d left` : ""}
              </span>
            ) : (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${planClass(row.plan)}`}>
                {PLAN_LABEL[row.plan]}
              </span>
            )}
          </td>
          <td className="px-3 py-3">
            <div className="flex flex-wrap items-center gap-1">
              {row.billingState !== "ok" && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${billingClass(row.billingState)}`}
                  title={
                    row.billingState === "payment_failed"
                      ? "Stripe subscription is past due / unpaid — recovery in progress."
                      : "BD renewal date has arrived; awaiting nightly renewal cron."
                  }
                >
                  {BILLING_LABEL[row.billingState]}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                {row.status === "verified" && <CheckCircle2 className="h-3 w-3" />}
                {STATUS_LABEL[row.status]}
              </span>
            </div>
          </td>
          <td className="px-3 py-3 text-white/75">{row.lifetimeValuePence ? gbp(row.lifetimeValuePence) : "—"}</td>
          <td className="px-3 py-3 text-white/75">
            <span className="inline-flex items-center gap-1.5">
              {renewalLabel(row.renewalDate)}
              {row.renewalDateSource === "bd" && row.renewalDate && (
                <span
                  className="rounded-[6px] border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55"
                  title="Imported renewal date — will switch to Stripe once a subscription is created"
                >
                  Imported
                </span>
              )}
            </span>
          </td>
          <td className="px-3 py-3 text-white/75">{gbp(row.planMrrPence)}</td>
          <td className="px-3 py-3 text-white/55">{joinedLabel(row.joined)}</td>
        </>
      )}
      <td className="px-5 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 hover:bg-reps-ink hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 border border-reps-border bg-reps-panel p-1 text-white/85 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]"
          >
            <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
              View as
            </DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); handleViewAs(); }}
              disabled={busy}
              className="cursor-pointer rounded-[6px] text-reps-orange focus:bg-reps-orange-soft focus:text-reps-orange"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Open their dashboard
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-reps-border" />
            <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
              Forensics
            </DropdownMenuLabel>
            <DropdownMenuItem asChild className="cursor-pointer rounded-[6px] focus:bg-white/5 focus:text-white">
              <Link to="/admin/members/$userId" params={{ userId: row.id }}>
                <UserIcon className="h-4 w-4" /> Open Member 360
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-[6px] focus:bg-white/5 focus:text-white">
              <Link to="/admin/members/$userId" params={{ userId: row.id }}>
                <Activity className="h-4 w-4" /> Open timeline
              </Link>
            </DropdownMenuItem>


            {slug && slug !== "—" ? (
              <>
                <DropdownMenuSeparator className="bg-reps-border" />
                <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                  Public surfaces
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer rounded-[6px] focus:bg-white/5 focus:text-white">
                  <Link to="/c/$slug" params={{ slug }} target="_blank">
                    <ExternalLink className="h-4 w-4" /> View public profile
                  </Link>
                </DropdownMenuItem>
                {(row.plan === "pro" || row.plan === "studio") ? (
                  <DropdownMenuItem asChild className="cursor-pointer rounded-[6px] focus:bg-white/5 focus:text-white">
                    <Link to="/c/$slug" params={{ slug }} target="_blank">
                      <ExternalLink className="h-4 w-4" /> View website
                    </Link>
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : null}

            <DropdownMenuSeparator className="bg-reps-border" />
            <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
              Moderation
            </DropdownMenuLabel>
            {isSuspended ? (
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); suspendM.mutate({ suspended: false }); }}
                disabled={suspendM.isPending}
                className="cursor-pointer rounded-[6px] focus:bg-white/5 focus:text-white"
              >
                <Play className="h-4 w-4" /> Restore to verified
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); setSuspendOpen(true); }}
                className="cursor-pointer rounded-[6px] text-amber-300 focus:bg-amber-500/10 focus:text-amber-200"
              >
                <Pause className="h-4 w-4" /> Mark as unverified…
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); flagM.mutate(!isFlagged); }}
              disabled={flagM.isPending}
              className="cursor-pointer rounded-[6px] focus:bg-white/5 focus:text-white"
            >
              <Flag className="h-4 w-4" /> {isFlagged ? "Clear flag" : "Mark as flagged"}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-reps-border" />
            <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
              QA
            </DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setTpM.mutate(); }}
              disabled={setTpM.isPending || row.plan === "training_provider"}
              className="cursor-pointer rounded-[6px] focus:bg-white/5 focus:text-white"
            >
              {setTpM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
              {row.plan === "training_provider" ? "Already Training Provider" : "Set plan → Training Provider"}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-reps-border" />
            <DropdownMenuItem asChild className="cursor-pointer rounded-[6px] text-white/60 focus:bg-white/5 focus:text-white">
              <Link to="/admin/members/$userId" params={{ userId: row.id }}>
                <CreditCard className="h-4 w-4" /> Billing & deletion (Member 360)
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SuspendDialog
          open={suspendOpen}
          onOpenChange={setSuspendOpen}
          name={row.name}
          pending={suspendM.isPending}
          onConfirm={(reason) => suspendM.mutate({ suspended: true, reason })}
        />

      </td>
    </tr>
  );
}

function SuspendDialog({
  open, onOpenChange, name, pending, onConfirm,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  name: string; pending: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");
  React.useEffect(() => { if (!open) setReason(""); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-reps-border bg-reps-panel text-white sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-white">Mark {name} as Unverified?</DialogTitle>
          <DialogDescription className="text-white/55">
            Their public profile stays live — REPs doesn't hide professionals once
            they're on the register. The Verified badge will be removed and they'll
            receive an email with the reason below. They can re-verify at any time.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2 text-left">
          <Label htmlFor="suspend-reason" className="text-white/75">Reason <span className="text-reps-orange">*</span></Label>
          <Textarea
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. Profile content under review pending re-check of qualifications."
            className="rounded-[10px] border-white/15 bg-white/[0.04] text-white placeholder:text-white/30"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={pending || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="bg-amber-500 text-black hover:bg-amber-400"
          >
            {pending ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Updating…</> : "Mark unverified & notify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel, confirmTone, pending, onConfirm, requireTypedConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone: "amber" | "red";
  pending: boolean;
  onConfirm: (reason: string | undefined) => void;
  requireTypedConfirm?: string;
}) {
  const [reason, setReason] = React.useState("");
  const [typed, setTyped] = React.useState("");
  React.useEffect(() => { if (!open) { setReason(""); setTyped(""); } }, [open]);

  const typedOk = !requireTypedConfirm || typed.trim() === requireTypedConfirm;
  const toneClass = confirmTone === "red"
    ? "bg-red-500 text-white hover:bg-red-400"
    : "bg-amber-500 text-black hover:bg-amber-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-reps-border bg-reps-panel text-white sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-white/55">{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2 text-left">
          <div>
            <Label htmlFor="confirm-reason" className="text-white/75">Internal reason (optional)</Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Cancellation requested via support ticket #1234."
              className="mt-1 rounded-[10px] border-white/15 bg-white/[0.04] text-white placeholder:text-white/30"
            />
          </div>
          {requireTypedConfirm ? (
            <div>
              <Label htmlFor="confirm-phrase" className="text-white/75">
                Type <span className="font-mono text-reps-orange">{requireTypedConfirm}</span> to confirm
              </Label>
              <Input
                id="confirm-phrase"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="mt-1 h-10 rounded-[10px] border-white/15 bg-white/[0.04] text-white placeholder:text-white/30"
              />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button
            disabled={pending || !typedOk}
            onClick={() => onConfirm(reason.trim() || undefined)}
            className={toneClass}
          >
            {pending ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Working…</> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
