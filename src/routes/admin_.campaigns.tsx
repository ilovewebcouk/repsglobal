import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { PencilLine } from "lucide-react";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PPanel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { ComposeDialog, type ComposeInitialDraft } from "@/components/admin/campaigns/ComposeDialog";
import { CampaignsList } from "@/components/admin/campaigns/CampaignsList";
import { useQueryClient } from "@tanstack/react-query";

// `?compose=1&to=user@example.com&name=Katie+Gibbs&inbox=pros` opens the
// composer pre-seeded with a single direct recipient. Used by Member 360's
// "Send email" action so admin outreach always lands in /admin/campaigns
// (tracked end-to-end) instead of a local mail client via `mailto:`.
const ComposeSearch = z.object({
  compose: z.union([z.literal("1"), z.literal("true")]).optional(),
  to: z.string().email().optional(),
  name: z.string().optional(),
  inbox: z.enum(["support", "pros", "partners", "press"]).optional(),
});

export const Route = createFileRoute("/admin_/campaigns")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  validateSearch: (s) => ComposeSearch.parse(s),
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
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [composeOpen, setComposeOpen] = useState(false);
  const [initialDraft, setInitialDraft] = useState<ComposeInitialDraft | null>(null);
  const qc = useQueryClient();

  // Auto-open the composer when launched from Member 360 ("Send email").
  // We strip the search params after seeding so a back-nav / refresh
  // doesn't keep reopening the dialog.
  useEffect(() => {
    if (!search.compose || !search.to) return;
    setInitialDraft({
      inbox: search.inbox ?? "pros",
      mode: "direct",
      subject: "",
      body: "",
      format: "text",
      recipients: [{ email: search.to, name: search.name ?? null }],
    });
    setComposeOpen(true);
    void navigate({ search: {}, replace: true });
  }, [search.compose, search.to, search.name, search.inbox, navigate]);

  const refetch = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "support", "campaigns"] });
  };


  return (
    <DashboardShell
      role="admin"
      active="Campaigns"
      title="Campaigns"
      subtitle="Broadcast to a tier or send to specific trainers. Save drafts, schedule for later, and resend to failed recipients."
      actions={
        <Button
          size="sm"
          onClick={() => {
            setInitialDraft(null);
            setComposeOpen(true);
          }}
          className="bg-reps-orange text-white hover:bg-reps-orange/90 h-8"
        >
          <PencilLine className="size-3.5" />
          New campaign
        </Button>
      }
    >
      <PPanel className="mt-2 p-0">
        <CampaignsList
          onEditDraft={(draft) => {
            setInitialDraft(draft);
            setComposeOpen(true);
          }}
        />
      </PPanel>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={(v) => {
          setComposeOpen(v);
          if (!v) setInitialDraft(null);
        }}
        initialDraft={initialDraft}
        onSent={refetch}
        onSavedDraft={refetch}
      />
    </DashboardShell>
  );
}
