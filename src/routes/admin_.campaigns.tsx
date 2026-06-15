import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PencilLine } from "lucide-react";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PPanel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { ComposeDialog } from "@/components/admin/campaigns/ComposeDialog";
import { CampaignsList } from "@/components/admin/campaigns/CampaignsList";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/admin_/campaigns")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Campaigns — REPS Admin" },
      {
        name: "description",
        content:
          "Send broadcasts and direct outreach to REPs trainers. Each campaign is tracked end-to-end.",
      },
    ],
  }),
  component: AdminCampaigns,
});

function AdminCampaigns() {
  const [composeOpen, setComposeOpen] = useState(false);
  const qc = useQueryClient();

  return (
    <DashboardShell
      role="admin"
      active="Campaigns"
      title="Campaigns"
      subtitle="Broadcast to a tier or send to specific trainers. Replies become real support tickets."
      actions={
        <Button
          size="sm"
          onClick={() => setComposeOpen(true)}
          className="bg-reps-orange text-black hover:bg-reps-orange/90 h-8"
        >
          <PencilLine className="size-3.5" />
          New campaign
        </Button>
      }
    >
      <PPanel className="mt-2 p-0">
        <CampaignsList />
      </PPanel>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onSent={() => {
          void qc.invalidateQueries({ queryKey: ["admin", "support", "campaigns"] });
        }}
      />
    </DashboardShell>
  );
}
