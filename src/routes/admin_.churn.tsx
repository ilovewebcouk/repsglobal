import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, MailWarning, RotateCcw, Moon, ShieldCheck } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  churnLifecycleKpis,
  listChurnLifecycle,
} from "@/lib/churn/lifecycle.functions";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export const Route = createFileRoute("/admin_/churn")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Churn recovery — REPS Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminChurnPage,
});

type Stage = "active" | "at_risk" | "grace" | "lapsed" | "recovered" | "dormant";

const STAGE_META: Record<Stage, {
  label: string;
  sub: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  active:    { label: "Active",    sub: "Paying and current",                       badge: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300", icon: ShieldCheck },
  at_risk:   { label: "At risk",   sub: "Renewal due ≤14d or first failed charge",  badge: "border-amber-400/30 bg-amber-500/15 text-amber-300",       icon: AlertTriangle },
  grace:     { label: "Grace",     sub: "Retrying card · still active",             badge: "border-orange-400/30 bg-orange-500/15 text-orange-300",    icon: Clock },
  lapsed:    { label: "Lapsed",    sub: "Payment failed — entitlement ended",       badge: "border-red-400/30 bg-red-500/15 text-red-300",             icon: MailWarning },
  recovered: { label: "Recovered", sub: "Came back after a failed payment",         badge: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300", icon: RotateCcw },
  dormant:   { label: "Dormant",   sub: "Cancelled long-term, no activity",         badge: "border-zinc-400/30 bg-zinc-500/15 text-zinc-300",          icon: Moon },
};

const TILE_STAGES: Stage[] = ["at_risk", "grace", "lapsed", "recovered", "dormant"];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function AdminChurnPage() {
  const kpiFn = useServerFn(churnLifecycleKpis);
  const listFn = useServerFn(listChurnLifecycle);
  const [stage, setStage] = useState<Stage | "all">("all");

  const kpis = useQuery({ queryKey: ["admin", "churn", "kpis"], queryFn: () => kpiFn() });
  const rows = useQuery({
    queryKey: ["admin", "churn", "rows", stage],
    queryFn: () => listFn({ data: { stage: stage === "all" ? undefined : stage, limit: 200 } }),
  });

  const k = kpis.data ?? { active: 0, at_risk: 0, grace: 0, lapsed: 0, recovered: 0, dormant: 0 };
  const rowsData = rows.data ?? [];

  return (
    <DashboardShell
      role="admin"
      active="Churn"
      title="Churn recovery"
      subtitle="Lifecycle stages, renewal nudges, and win-back tracking across all paid members."
    >
      <TooltipProvider delayDuration={150}>
        <div className="space-y-6">
          {/* KPI tiles */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {TILE_STAGES.map((s) => {
              const meta = STAGE_META[s];
              const Icon = meta.icon;
              return (
                <Card key={s} className="border-reps-border bg-reps-panel">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                        {meta.label}
                      </CardDescription>
                      <Icon className="size-4 text-white/45" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="font-display text-[28px] leading-none">
                      {kpis.isLoading ? <Skeleton className="h-7 w-10" /> : (k[s] ?? 0)}
                    </div>
                    <p className="mt-2 text-[11px] text-white/55">{meta.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Lifecycle events */}
          <Card className="border-reps-border bg-reps-panel">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-[18px]">Lifecycle events</CardTitle>
                  <CardDescription className="text-white/55">
                    Latest stage transitions across all paid members.
                  </CardDescription>
                </div>
                <Select value={stage} onValueChange={(v) => setStage(v as Stage | "all")}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {(Object.keys(STAGE_META) as Stage[]).map((s) => (
                      <SelectItem key={s} value={s}>{STAGE_META[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <Separator className="bg-reps-border" />
            <CardContent className="pt-0">
              {rows.isLoading ? (
                <div className="flex flex-col gap-2 py-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : rowsData.length === 0 ? (
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><ShieldCheck /></EmptyMedia>
                    <EmptyTitle>No churn events</EmptyTitle>
                    <EmptyDescription>
                      No members match this stage filter yet.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-reps-border hover:bg-transparent">
                      <TableHead>Pro</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Entered</TableHead>
                      <TableHead>Last nudge</TableHead>
                      <TableHead className="text-right">Nudges</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rowsData.map((r) => {
                      const meta = STAGE_META[r.stage as Stage];
                      return (
                        <TableRow key={r.id} className="border-reps-border/50">
                          <TableCell className="font-medium">
                            {r.pro_name ?? <span className="text-white/45">—</span>}
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className={meta.badge}>
                                  {meta.label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>{meta.sub}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="max-w-[360px] truncate text-white/70">
                            {r.reason ?? "—"}
                          </TableCell>
                          <TableCell className="text-white/55">{formatDate(r.entered_at)}</TableCell>
                          <TableCell className="text-white/55">
                            {r.last_nudge_at ? (
                              formatDate(r.last_nudge_at)
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-white/45">—</span>
                                </TooltipTrigger>
                                <TooltipContent>No nudge sent yet</TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-white/70">{r.nudge_count}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>
    </DashboardShell>
  );
}
