import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { requireRole } from "@/lib/route-gates";
import {
  CheckCircle2,
  Download,
  Eye,
  ExternalLink,
  Filter,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import * as React from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

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
import { initialsFromName } from "@/lib/initials";
import {
  getAdminProfessionalsKpis,
  listAdminProfessionals,
  type AdminProRow,
  type AdminProTab,
} from "@/lib/admin/professionals.functions";
import { startImpersonation } from "@/lib/admin/impersonation.functions";

export const Route = createFileRoute("/admin_/professionals")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminProfessionalsPage,
});

const TABS: { label: string; value: AdminProTab }[] = [
  { label: "All", value: "all" },
  { label: "Verified", value: "verified" },
  { label: "Pending", value: "pending" },
  { label: "Flagged", value: "flagged" },
  { label: "Suspended", value: "suspended" },
  { label: "Recently joined", value: "recent" },
];

function statusClass(s: AdminProRow["status"]) {
  switch (s) {
    case "verified":    return "bg-emerald-500/15 text-emerald-300";
    case "pending":     return "bg-reps-orange-soft text-reps-orange";
    case "flagged":     return "bg-red-500/15 text-red-400";
    case "suspended":   return "bg-amber-500/15 text-amber-300";
    case "unpublished": return "bg-white/10 text-white/65";
  }
}

const PLAN_LABEL: Record<AdminProRow["plan"], string> = {
  free: "Free",
  verified: "Verified",
  pro: "Pro",
  studio: "Studio",
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
  const debouncedSearch = useDebounced(search, 300);
  const pageSize = 25;

  React.useEffect(() => { setPage(1); }, [tab, debouncedSearch]);

  const kpisFn = useServerFn(getAdminProfessionalsKpis);
  const listFn = useServerFn(listAdminProfessionals);

  const kpisQ = useQuery({
    queryKey: ["admin-pros-kpis"],
    queryFn: () => kpisFn(),
    staleTime: 60_000,
  });

  const listQ = useQuery({
    queryKey: ["admin-pros-list", tab, page, debouncedSearch],
    queryFn: () => listFn({ data: { tab, page, pageSize, q: debouncedSearch } }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const dashSearch: DashboardSearch = {
    value: search,
    onChange: setSearch,
    placeholder: "Search professionals, members, leads…",
  };

  const rows = listQ.data?.rows ?? [];
  const total = listQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showTo = Math.min(page * pageSize, total);

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
      delta: "Last 12 months",
      icon: Star,
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
      actions={
        <button className="hidden h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-hover sm:flex">
          <Plus className="h-4 w-4" /> Invite professional
        </button>
      }
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
            <button disabled className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border px-3 text-[12px] font-medium text-white/55">
              <Filter className="h-3.5 w-3.5" /> Filters
            </button>
            <button disabled className="flex h-9 items-center gap-2 rounded-[10px] border border-reps-border px-3 text-[12px] font-medium text-white/55">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        </div>

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

function ProRow({ row }: { row: AdminProRow }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const startFn = useServerFn(startImpersonation);
  const [busy, setBusy] = React.useState(false);

  async function handleViewAs() {
    if (busy) return;
    setBusy(true);
    try {
      await startFn({ data: { professional_id: row.id } });
      await qc.invalidateQueries({ queryKey: ["impersonation-status"] });
      navigate({ to: "/dashboard" });
    } catch (e) {
      console.error("startImpersonation failed", e);
      setBusy(false);
    }
  }

  const initials = initialsFromName(row.name);

  return (
    <tr className="border-b border-reps-border/60 last:border-b-0">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 rounded-full">
            {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-reps-panel-soft text-[11px] text-white/55">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-white">{row.name}</div>
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
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${statusClass(row.status)}`}>
          {row.status === "verified" && <CheckCircle2 className="h-3 w-3" />}
          {row.status}
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-white/45">
              View as
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={handleViewAs} disabled={busy}>
              <Eye className="h-4 w-4" /> Open their dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-white/45">
              Public surfaces
            </DropdownMenuLabel>
            {row.handle !== "—" ? (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/pro/$slug" params={{ slug: row.handle.replace(/^@/, "") }} target="_blank">
                    <ExternalLink className="h-4 w-4" /> View public profile
                  </Link>
                </DropdownMenuItem>
                {(row.plan === "pro" || row.plan === "studio") ? (
                  <DropdownMenuItem asChild>
                    <Link to="/c/$slug" params={{ slug: row.handle.replace(/^@/, "") }} target="_blank">
                      <ExternalLink className="h-4 w-4" /> View shop-front
                    </Link>
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
