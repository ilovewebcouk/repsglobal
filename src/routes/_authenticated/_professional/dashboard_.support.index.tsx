import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { LifeBuoy, Plus, MessageSquare, ArrowRight, Loader2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listMyTickets, type MyTicketRow } from "@/lib/support/my-tickets.functions";

export const Route = createFileRoute(
  "/_authenticated/_professional/dashboard_/support/",
)({
  head: () => ({
    meta: [
      { title: "Support — REPS Professional" },
      { name: "description", content: "Get help from the REPS team." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SupportListPage,
});

const STATUS_LABEL: Record<MyTicketRow["status"], string> = {
  new: "New",
  open: "Open",
  pending: "Waiting on you",
  solved: "Solved",
  closed: "Closed",
  spam: "Spam",
  trash: "Trash",
};

const STATUS_TONE: Record<MyTicketRow["status"], string> = {
  new: "bg-reps-orange/15 text-reps-orange border-reps-orange-border",
  open: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  solved: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  closed: "bg-white/10 text-white/55 border-white/15",
  spam: "bg-reps-red/15 text-reps-red border-reps-red/30",
  trash: "bg-white/5 text-white/40 border-white/10",
};

function formatWhen(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function SupportListPage() {
  const tier = useTrainerTier();
  const listFn = useServerFn(listMyTickets);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["my-support-tickets"],
    queryFn: () => listFn(),
  });

  return (
    <DashboardShell
      role="trainer"
      tier={tier}
      active="Support"
      title="Support"
      subtitle="Talk to the REPS team. We typically reply within one working day."
      actions={
        <Button asChild className="h-9 rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange/90">
          <Link to="/dashboard/support/new">
            <Plus className="mr-2 h-4 w-4" data-icon /> New ticket
          </Link>
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-[920px]">
        <PCard className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-white/55">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-3 rounded-full border border-reps-border bg-reps-panel/40 p-3">
                <LifeBuoy className="h-5 w-5 text-reps-orange" data-icon />
              </div>
              <p className="font-display text-[18px] font-bold text-white">
                No support tickets yet
              </p>
              <p className="mt-2 max-w-[360px] text-[14px] text-white/55">
                Need help with your account, verification, billing or anything
                else? Open a ticket and we’ll get back to you fast.
              </p>
              <Button
                asChild
                className="mt-5 h-9 rounded-[10px] bg-reps-orange text-white hover:bg-reps-orange/90"
              >
                <Link to="/dashboard/support/new">
                  <Plus className="mr-2 h-4 w-4" data-icon /> Open a ticket
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-reps-border/60">
              {tickets.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/dashboard/support/$id"
                    params={{ id: t.id }}
                    className="group flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-reps-panel-soft/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_TONE[t.status]}`}
                        >
                          {STATUS_LABEL[t.status]}
                        </Badge>
                        <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                          {t.ticket_number}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-[15px] font-semibold text-white">
                        {t.subject}
                      </p>
                      <p className="mt-1 text-[12.5px] text-white/50">
                        Last update {formatWhen(t.last_message_at ?? t.created_at)}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 h-4 w-4 shrink-0 text-white/30 transition group-hover:text-white/70"
                      data-icon
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </PCard>

        <p className="mt-4 flex items-center gap-2 text-[12.5px] text-white/45">
          <MessageSquare className="h-3.5 w-3.5" data-icon /> You can also email
          support@repsuk.org — replies land in this inbox.
        </p>
      </div>
    </DashboardShell>
  );
}
