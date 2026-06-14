import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useTrainerTier } from "@/lib/dashboard/useTrainerTier";

import {
  listMyEnquiries,
  getEnquiryStats,
  type EnquiryDTO,
  updateEnquiryStatus,
} from "@/lib/enquiries/enquiries.functions";
import { EnquiryStatStrip } from "@/components/enquiries/EnquiryStatStrip";
import { EnquiryList, type EnquiryTab } from "@/components/enquiries/EnquiryList";
import { EnquiryDetailPane } from "@/components/enquiries/EnquiryDetailPane";
import { UpgradeNudge } from "@/components/enquiries/UpgradeNudge";

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/enquiries")({
  beforeLoad: ({ context }) => {
    // Pro/Studio see the full Leads pipeline instead.
    const tier = (context as { trainerTier?: string }).trainerTier;
    if (tier === "pro" || tier === "studio") throw redirect({ to: "/dashboard/leads" });
  },
  head: () => ({
    meta: [
      { title: "Enquiries — REPS Professional" },
      { name: "description", content: "Every enquiry from your REPs profile, in one focused inbox." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EnquiriesInboxPage,
});

function EnquiriesInboxPage() {
  const tier = useTrainerTier();
  const qc = useQueryClient();

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["enquiries"],
    queryFn: () => listMyEnquiries(),
    staleTime: 30_000,
  });
  const { data: stats } = useQuery({
    queryKey: ["enquiry-stats"],
    queryFn: () => getEnquiryStats(),
    staleTime: 60_000,
  });

  const [tab, setTab] = React.useState<EnquiryTab>("all");
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedId && enquiries.length) setSelectedId(enquiries[0].id);
  }, [enquiries, selectedId]);

  const selected: EnquiryDTO | null = enquiries.find((e) => e.id === selectedId) ?? null;

  // Mark as read on open
  React.useEffect(() => {
    if (selected && selected.status === "new") {
      updateEnquiryStatus({ data: { id: selected.id, status: "read" } })
        .then(() => qc.invalidateQueries({ queryKey: ["enquiries"] }))
        .catch(() => {});
    }
  }, [selected, qc]);

  return (
    <DashboardShell role="trainer" tier={tier} active="Enquiries" title="Enquiries" subtitle="Your inbox">
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display text-[28px] font-bold text-white">Enquiries</h1>
          <p className="mt-1 text-[13.5px] text-white/55">
            Every enquiry from your REPs profile, in one focused inbox.
          </p>
        </div>

        <EnquiryStatStrip stats={stats} />

        {isLoading ? (
          <div className="rounded-[18px] border border-reps-border bg-reps-panel px-5 py-10 text-center text-[13px] text-white/55">
            Loading enquiries…
          </div>
        ) : enquiries.length === 0 ? (
          <div className="rounded-[18px] border border-reps-border bg-reps-panel px-6 py-14 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-reps-panel-soft">
              <Inbox className="size-5 text-white/55" />
            </div>
            <h2 className="mt-4 font-display text-[17px] font-bold text-white">No enquiries yet</h2>
            <p className="mx-auto mt-1 max-w-[440px] text-[13px] text-white/55">
              When someone enquires through your REPs profile, it'll land here. You'll also get an email.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:min-h-[640px]">
            <EnquiryList
              enquiries={enquiries}
              selectedId={selectedId}
              onSelect={setSelectedId}
              tab={tab}
              onTabChange={setTab}
              search={search}
              onSearchChange={setSearch}
            />
            {selected ? (
              <EnquiryDetailPane enquiry={selected} />
            ) : (
              <div className="rounded-[18px] border border-reps-border bg-reps-panel px-6 py-14 text-center text-[13px] text-white/55">
                Select an enquiry to see details
              </div>
            )}
          </div>
        )}

        <UpgradeNudge />
      </div>
    </DashboardShell>
  );
}
