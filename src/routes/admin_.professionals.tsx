import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  ExternalLink,
  Filter,
  Flag,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Star,
  TrendingUp,
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
} from "@/lib/admin/professionals.functions";
import { startImpersonation } from "@/lib/admin/impersonation.functions";
import { sendProfessionalInvite } from "@/lib/admin/invites.functions";

export const Route = createFileRoute("/admin_/professionals")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminProfessionalsPage,
});

const TABS: { label: string; value: AdminProTab }[] = [
  { label: "All", value: "all" },
  { label: "Verified", value: "verified" },
  { label: "Unverified", value: "pending" },
  { label: "Flagged", value: "flagged" },
  { label: "Suspended", value: "suspended" },
  { label: "Recently joined", value: "recent" },
];

const SORT_OPTIONS: { value: AdminProSort; label: string; defaultDir: SortDir }[] = [
  { value: "joined", label: "Joined", defaultDir: "desc" },
  { value: "name", label: "Name", defaultDir: "asc" },
  { value: "plan", label: "Plan value", defaultDir: "desc" },
  { value: "mrr", label: "Plan MRR", defaultDir: "desc" },
  { value: "rating", label: "Rating", defaultDir: "desc" },
  { value: "clients", label: "Clients", defaultDir: "desc" },
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

const PLAN_OPTIONS: { value: "free" | "verified" | "pro" | "studio"; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "verified", label: "Verified" },
  { value: "pro", label: "Pro" },
  { value: "studio", label: "Studio" },
];

const STATUS_LABEL: Record<AdminProRow["status"], string> = {
  verified: "Verified",
  pending: "Unverified",
  flagged: "Flagged",
  suspended: "Suspended",
  admin: "Admin",
};

function statusClass(s: AdminProRow["status"]) {
  switch (s) {
    case "verified":    return "bg-emerald-500/15 text-emerald-300";
    case "pending":     return "bg-reps-orange-soft text-reps-orange";
    case "flagged":     return "bg-red-500/15 text-red-400";
    case "suspended":   return "bg-amber-500/15 text-amber-300";
    case "admin":       return "bg-violet-500/15 text-violet-300";
  }
}

const PLAN_LABEL: Record<AdminProRow["plan"], string> = {
  free: "Free", verified: "Verified", pro: "Pro", studio: "Studio",
};

function planClass(p: AdminProRow["plan"]) {
  switch (p) {
    case "verified": return "bg-emerald-500/15 text-emerald-300";
    case "pro":      return "bg-reps-orange-soft text-reps-orange";
    case "studio":   return "bg-violet-500/15 text-violet-300";
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

function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function AdminProfessionalsPage() {
  const [tab, setTab] = React.useState<AdminProTab>("all");
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState<AdminProSort>("joined");
  const [dir, setDir] = React.useState<SortDir>("desc");
  const [filters, setFilters] = React.useState<AdminProFilters>({});
  const debouncedSearch = useDebounced(search, 300);
  const pageSize = 25;

  React.useEffect(() => { setPage(1); }, [tab, debouncedSearch, sort, dir, filters]);

  const kpisFn = useServerFn(getAdminProfessionalsKpis);
  const listFn = useServerFn(listAdminProfessionals);

  const kpisQ = useQuery({
    queryKey: ["admin-pros-kpis"],
    queryFn: () => kpisFn(),
    staleTime: 60_000,
  });

  const listQ = useQuery({
    queryKey: ["admin-pros-list", tab, page, debouncedSearch, sort, dir, filters],
    queryFn: () => listFn({ data: { tab, page, pageSize, q: debouncedSearch, sort, dir, filters } }),
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

  const kpis = [
    {
      label: "Active professionals",
      value: kpisQ.data ? kpisQ.data.activeCount.toLocaleString() : "—",
      delta: kpisQ.data ? `${kpisQ.data.newSignups30.toLocaleString()} this month` : "",
      icon: Users,
    },
    {
      label: "Verified",
      value: kpisQ.data ? kpisQ.data.verifiedCount.toLocaleString() : "—",
      delta: kpisQ.data ? `${kpisQ.data.verifiedPct.toFixed(1)}% of base` : "",
      icon: ShieldCheck,
    },
    {
      label: "Avg. rating",
      value: kpisQ.data?.avgRating ? kpisQ.data.avgRating.toFixed(2) : "—",
      delta: "Last 12 months", icon: Star,
    },
    {
      label: "New signups (30d)",
      value: kpisQ.data ? kpisQ.data.newSignups30.toLocaleString() : "—",
      delta: kpisQ.data?.newSignupsDeltaPct != null
        ? `${kpisQ.data.newSignupsDeltaPct >= 0 ? "+" : ""}${kpisQ.data.newSignupsDeltaPct.toFixed(1)}% vs prev`
        : "",
      icon: TrendingUp,
    },
  ];

  return (
    <DashboardShell
      role="admin"
      active="Professionals"
      title="Professionals"
      subtitle="Manage the full register of REPS professionals."
      search={dashSearch}
      actions={<InviteButton />}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <PCard key={k.label}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[12px] text-white/55">{k.label}</div>
                <div className="mt-1 font-display text-[26px] font-bold text-white">{k.value}</div>
                <div className="mt-1 text-[11px] text-white/55">{k.delta}</div>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                <k.icon className="h-4 w-4" />
              </span>
            </div>
          </PCard>
        ))}
      </div>

      <PPanel className="mt-6">
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
                <th className="px-5 py-3 font-semibold">Professional</th>
                <th className="px-3 py-3 font-semibold">Location</th>
                <th className="px-3 py-3 font-semibold">Profession</th>
                <th className="px-3 py-3 font-semibold">Plan</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Rating</th>
                <th className="px-3 py-3 font-semibold">Clients</th>
                <th className="px-3 py-3 font-semibold">Plan MRR</th>
                <th className="px-3 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {listQ.isLoading && !listQ.data ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-white/55">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-white/55">No professionals match.</td></tr>
              ) : rows.map((r) => (
                <ProRow key={r.id} row={r} />
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

  function togglePlan(p: "free" | "verified" | "pro" | "studio") {
    setDraft(d => {
      const set = new Set(d.plans ?? []);
      if (set.has(p)) set.delete(p); else set.add(p);
      return { ...d, plans: Array.from(set) };
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
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [plan, setPlan] = React.useState<"verified" | "pro">("pro");
  const inviteFn = useServerFn(sendProfessionalInvite);
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: (vars: { email: string; full_name?: string; plan: "verified" | "pro" }) =>
      inviteFn({ data: vars }),
    onSuccess: (res: { email: string }) => {
      toast.success(`Invite sent to ${res.email}`);
      setEmail(""); setFullName("");
      qc.invalidateQueries({ queryKey: ["admin-pros-list"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to send invite"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover">
          <Plus className="h-4 w-4" /> Invite professional
        </button>
      </DialogTrigger>
      <DialogContent className="border-reps-border bg-reps-panel text-white sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-white">Invite a professional</DialogTitle>
          <DialogDescription className="text-white/55">
            We'll email them a signup link. They'll land on pricing with your suggested plan pre-selected.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div>
            <Label htmlFor="invite-email" className="text-white/75">Email <span className="text-reps-orange">*</span></Label>
            <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="trainer@example.com"
              className="mt-1 h-10 rounded-[10px] border-white/15 bg-white/[0.04] text-white placeholder:text-white/30" />
          </div>
          <div>
            <Label htmlFor="invite-name" className="text-white/75">Full name (optional)</Label>
            <Input id="invite-name" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Sam Jones"
              className="mt-1 h-10 rounded-[10px] border-white/15 bg-white/[0.04] text-white placeholder:text-white/30" />
          </div>
          <div>
            <Label className="text-white/75">Suggest plan</Label>
            <div className="mt-1 flex gap-2">
              <button onClick={() => setPlan("verified")}
                className={plan === "verified"
                  ? "flex-1 rounded-[10px] border border-reps-orange bg-reps-orange-soft px-3 py-2 text-left text-[12px] font-semibold text-reps-orange"
                  : "flex-1 rounded-[10px] border border-reps-border px-3 py-2 text-left text-[12px] font-medium text-white/70 hover:text-white"}>
                Verified <span className="font-normal text-white/55">£99/yr</span>
              </button>
              <button onClick={() => setPlan("pro")}
                className={plan === "pro"
                  ? "flex-1 rounded-[10px] border border-reps-orange bg-reps-orange-soft px-3 py-2 text-left text-[12px] font-semibold text-reps-orange"
                  : "flex-1 rounded-[10px] border border-reps-border px-3 py-2 text-left text-[12px] font-medium text-white/70 hover:text-white"}>
                Pro Founding <span className="font-normal text-white/55">£59/mo</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          <Button
            disabled={m.isPending || !email}
            onClick={() => m.mutate({ email, full_name: fullName || undefined, plan })}
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

function ProRow({ row }: { row: AdminProRow }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const startFn = useServerFn(startImpersonation);
  const suspendFn = useServerFn(setProfessionalSuspension);
  const flagFn = useServerFn(setProfessionalFlag);
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

  const initials = initialsFromName(row.name);
  const isSuspended = row.status === "suspended";
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
      <td className="px-3 py-3 text-white/75">{row.location ?? "—"}</td>
      <td className="px-3 py-3">
        {row.profession ? (
          <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/75">
            {row.profession}
          </span>
        ) : <span className="text-white/45">—</span>}
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${planClass(row.plan)}`}>
          {PLAN_LABEL[row.plan]}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
          {row.status === "verified" && <CheckCircle2 className="h-3 w-3" />}
          {STATUS_LABEL[row.status]}
        </span>
      </td>
      <td className="px-3 py-3 text-white/75">{row.rating ?? "—"}</td>
      <td className="px-3 py-3 text-white/75">{row.clients}</td>
      <td className="px-3 py-3 text-white/75">{gbp(row.planMrrPence)}</td>
      <td className="px-3 py-3 text-white/55">{joinedLabel(row.joined)}</td>
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

            {slug && slug !== "—" ? (
              <>
                <DropdownMenuSeparator className="bg-reps-border" />
                <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                  Public surfaces
                </DropdownMenuLabel>
                <DropdownMenuItem asChild className="cursor-pointer rounded-[6px] focus:bg-white/5 focus:text-white">
                  <Link to="/pro/$slug" params={{ slug }} target="_blank">
                    <ExternalLink className="h-4 w-4" /> View public profile
                  </Link>
                </DropdownMenuItem>
                {(row.plan === "pro" || row.plan === "studio") ? (
                  <DropdownMenuItem asChild className="cursor-pointer rounded-[6px] focus:bg-white/5 focus:text-white">
                    <Link to="/c/$slug" params={{ slug }} target="_blank">
                      <ExternalLink className="h-4 w-4" /> View shop-front
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
                <Play className="h-4 w-4" /> Reinstate professional
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); setSuspendOpen(true); }}
                className="cursor-pointer rounded-[6px] text-amber-300 focus:bg-amber-500/10 focus:text-amber-200"
              >
                <Pause className="h-4 w-4" /> Suspend professional…
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); flagM.mutate(!isFlagged); }}
              disabled={flagM.isPending}
              className="cursor-pointer rounded-[6px] focus:bg-white/5 focus:text-white"
            >
              <Flag className="h-4 w-4" /> {isFlagged ? "Clear flag" : "Mark as flagged"}
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
          <DialogTitle className="text-white">Suspend {name}?</DialogTitle>
          <DialogDescription className="text-white/55">
            Their profile will be removed from the public directory. They'll receive an email with the reason below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2 text-left">
          <Label htmlFor="suspend-reason" className="text-white/75">Reason <span className="text-reps-orange">*</span></Label>
          <Textarea
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. Profile content under review pending verification of qualifications."
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
            {pending ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Suspending…</> : "Suspend & notify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
