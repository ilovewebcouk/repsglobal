import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getEmailStats,
  listEmailLog,
  getEmailTemplates,
  getEmailHistory,
  listSuppressions,
} from "@/lib/ops/email-ops.functions";

const rangeEnum = z.enum(["24h", "7d", "30d"]);
const statusEnum = z.enum(["all", "sent", "failed", "dlq", "suppressed", "bounced", "pending"]);
const search = z.object({
  range: fallback(rangeEnum, "7d").default("7d"),
  template: fallback(z.string(), "").default(""),
  status: fallback(statusEnum, "all").default("all"),
  q: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(0), 0).default(0),
});

export const Route = createFileRoute("/admin_/ops/email")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  validateSearch: zodValidator(search),
  head: () => ({ meta: [{ title: "Email operations — REPS Ops" }] }),
  component: EmailOpsPage,
});

const PAGE_SIZE = 50;

function rangeToDates(r: "24h" | "7d" | "30d") {
  const ms = r === "24h" ? 86400_000 : r === "7d" ? 7 * 86400_000 : 30 * 86400_000;
  const to = new Date().toISOString();
  const from = new Date(Date.now() - ms).toISOString();
  return { from, to };
}

function EmailOpsPage() {
  const { range, template, status, q, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { from, to } = useMemo(() => rangeToDates(range), [range]);

  const statsFn = useServerFn(getEmailStats);
  const listFn = useServerFn(listEmailLog);
  const tmplFn = useServerFn(getEmailTemplates);
  const supFn = useServerFn(listSuppressions);

  const args = useMemo(() => ({
    from, to,
    template: template || null,
    status: status === "all" ? null : status,
  }), [from, to, template, status]);

  const statsQ = useQuery({
    queryKey: ["email-stats", args],
    queryFn: () => statsFn({ data: args }),
    refetchInterval: 60_000,
  });
  const tmplQ = useQuery({ queryKey: ["email-templates"], queryFn: () => tmplFn() });
  const logQ = useQuery({
    queryKey: ["email-log", args, q, page],
    queryFn: () => listFn({ data: { ...args, q: q || null, limit: PAGE_SIZE, offset: page * PAGE_SIZE } }),
  });
  const supQ = useQuery({ queryKey: ["email-suppressions"], queryFn: () => supFn({ data: { limit: 20, offset: 0 } }) });

  const [openMsg, setOpenMsg] = useState<string | null>(null);

  const stats = statsQ.data;

  function setSearch(patch: Partial<z.infer<typeof search>>) {
    void navigate({ search: (s: z.infer<typeof search>) => ({ ...s, ...patch, page: 0 }) });
  }

  return (
    <DashboardShell role="admin" active="Operations" title="Email operations" subtitle="Lifecycle for every email REPS sends.">
      <div className="space-y-6 p-6">
        <OpsSubNav />
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-reps-border bg-reps-panel/40 p-3">
          <div className="flex gap-1">
            {(["24h", "7d", "30d"] as const).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "default" : "outline"}
                onClick={() => setSearch({ range: r })}
              >{r}</Button>
            ))}
          </div>
          <Select value={template || "__all"} onValueChange={(v) => setSearch({ template: v === "__all" ? "" : v })}>
            <SelectTrigger className="w-[220px] bg-reps-ink/40"><SelectValue placeholder="All templates" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All templates</SelectItem>
              {(tmplQ.data ?? []).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setSearch({ status: v as typeof status })}>
            <SelectTrigger className="w-[140px] bg-reps-ink/40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="dlq">DLQ</SelectItem>
              <SelectItem value="suppressed">Suppressed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={q}
            onChange={(e) => setSearch({ q: e.target.value })}
            placeholder="Search recipient, template, message id…"
            className="max-w-xs bg-reps-ink/40"
          />
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Stat label="Total" v={stats?.total ?? 0} />
          <Stat label="Sent" v={stats?.sent ?? 0} tone="green" />
          <Stat label="Failed" v={stats?.failed ?? 0} tone={(stats?.failed ?? 0) > 0 ? "red" : undefined} />
          <Stat label="DLQ" v={stats?.dlq ?? 0} tone={(stats?.dlq ?? 0) > 0 ? "red" : undefined} />
          <Stat label="Suppressed" v={stats?.suppressed ?? 0} tone={(stats?.suppressed ?? 0) > 0 ? "amber" : undefined} />
          <Stat label="Bounced" v={stats?.bounced ?? 0} tone={(stats?.bounced ?? 0) > 0 ? "amber" : undefined} />
          <Stat label="Queue · tx" v={stats?.queue_transactional ?? 0} />
          <Stat label="Queue · auth" v={stats?.queue_auth ?? 0} />
          <Stat label="Pending" v={stats?.pending ?? 0} />
          <Stat label="Suppression list" v={stats?.suppression_total ?? 0} />
        </div>

        {/* Log */}
        <div className="rounded-[16px] border border-reps-border bg-reps-panel/40">
          <div className="border-b border-reps-border px-3 py-2 text-xs uppercase tracking-wide text-reps-text/60">
            Email log · one row per message_id (latest status)
          </div>
          <table className="w-full text-sm">
            <thead className="bg-reps-ink/40 text-left text-xs uppercase tracking-wide text-reps-text/60">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Template</th>
                <th className="px-3 py-2">Recipient</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-reps-border/60">
              {(logQ.data?.rows ?? []).map((r) => (
                <tr key={r.message_id} className="cursor-pointer hover:bg-reps-panel/40" onClick={() => setOpenMsg(r.message_id)}>
                  <td className="px-3 py-2 text-reps-text/80">{new Date(r.created_at).toLocaleString("en-GB")}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.template_name ?? "—"}</td>
                  <td className="px-3 py-2">{r.recipient_email ?? "—"}</td>
                  <td className="px-3 py-2"><StatusBadge s={r.status} /></td>
                  <td className="px-3 py-2 text-xs text-rose-200/80 line-clamp-1">{r.error_message ?? ""}</td>
                </tr>
              ))}
              {logQ.data && logQ.data.rows.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-reps-text/60">No emails match these filters.</td></tr>
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between gap-2 border-t border-reps-border px-3 py-2 text-xs text-reps-text/60">
            <span>{logQ.data ? `${logQ.data.total.toLocaleString()} match${logQ.data.total === 1 ? "" : "es"}` : "…"}</span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => navigate({ search: (s: z.infer<typeof search>) => ({ ...s, page: Math.max(0, s.page - 1) }) })}>Prev</Button>
              <Button size="sm" variant="outline" disabled={!logQ.data || (page + 1) * PAGE_SIZE >= logQ.data.total} onClick={() => navigate({ search: (s: z.infer<typeof search>) => ({ ...s, page: s.page + 1 }) })}>Next</Button>
            </div>
          </div>
        </div>

        {/* Suppression list (top 20) */}
        <div className="rounded-[16px] border border-reps-border bg-reps-panel/40">
          <div className="flex items-center justify-between border-b border-reps-border px-3 py-2 text-xs uppercase tracking-wide text-reps-text/60">
            <span>Recent suppressions</span>
            <span>{supQ.data ? `${supQ.data.total.toLocaleString()} total` : ""}</span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-reps-border/60">
              {(supQ.data?.rows ?? []).map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2">{s.email}</td>
                  <td className="px-3 py-2 text-xs text-reps-text/60">{s.reason ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-reps-text/60">{new Date(s.created_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
              {supQ.data && supQ.data.rows.length === 0 && (
                <tr><td className="px-3 py-6 text-center text-reps-text/60">No suppressed addresses.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message lifecycle drawer */}
      <Sheet open={openMsg != null} onOpenChange={(v) => !v && setOpenMsg(null)}>
        <SheetContent side="right" className="w-full max-w-xl overflow-y-auto bg-reps-ink text-reps-fg">
          <SheetHeader>
            <SheetTitle>Email lifecycle</SheetTitle>
            <SheetDescription className="font-mono text-xs">{openMsg ?? ""}</SheetDescription>
          </SheetHeader>
          {openMsg && <Lifecycle messageId={openMsg} />}
        </SheetContent>
      </Sheet>
    </DashboardShell>
  );
}

function Lifecycle({ messageId }: { messageId: string }) {
  const fn = useServerFn(getEmailHistory);
  const q = useQuery({ queryKey: ["email-history", messageId], queryFn: () => fn({ data: { message_id: messageId } }) });
  if (q.isLoading) return <div className="p-4 text-reps-text/60">Loading…</div>;
  if (q.error) return <div className="p-4 text-rose-300">{(q.error as Error).message}</div>;
  return (
    <ol className="ml-2 mt-4 border-l border-reps-border/60">
      {(q.data ?? []).map((r) => (
        <li key={r.id} className="relative pl-4 py-2">
          <span className="absolute -left-[5px] top-3 size-2 rounded-full bg-reps-orange" />
          <div className="flex items-baseline gap-2">
            <span className="text-xs tabular-nums text-reps-text/60">{new Date(r.created_at).toLocaleString("en-GB")}</span>
            <StatusBadge s={r.status} />
            <span className="font-mono text-xs text-reps-text/70">{r.template_name ?? ""}</span>
          </div>
          <div className="mt-0.5 text-sm">{r.recipient_email}</div>
          {r.error_message && <div className="mt-1 text-xs text-rose-200/80">{r.error_message}</div>}
        </li>
      ))}
    </ol>
  );
}

function Stat({ label, v, tone }: { label: string; v: number; tone?: "green" | "amber" | "red" }) {
  const cls = tone === "red"
    ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
    : tone === "amber"
    ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
    : tone === "green"
    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
    : "border-reps-border bg-reps-panel/40 text-reps-fg";
  return (
    <div className={`rounded-[16px] border p-3 ${cls}`}>
      <div className="text-xs uppercase tracking-wide opacity-75">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{v.toLocaleString()}</div>
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  if (s === "sent") return <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-400/40">sent</Badge>;
  if (s === "dlq" || s === "failed") return <Badge variant="destructive">{s}</Badge>;
  if (s === "suppressed" || s === "bounced" || s === "complained") return <Badge className="bg-amber-500/20 text-amber-100 border-amber-400/40">{s}</Badge>;
  return <Badge variant="outline">{s}</Badge>;
}
