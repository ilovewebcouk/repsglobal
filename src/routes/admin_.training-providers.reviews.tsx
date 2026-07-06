import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  Flag,
  FileSearch,
  Trash2,
  RotateCcw,
  Star,
  ExternalLink,
} from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listAdminProviderReviews,
  moderateProviderReview,
} from "@/lib/training-providers.functions";

export const Route = createFileRoute("/admin_/training-providers/reviews")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminProviderReviewsPage,
});

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "flagged", label: "Flagged" },
  { value: "evidence_requested", label: "Evidence" },
  { value: "pending_email", label: "Pending email" },
  { value: "removed", label: "Removed" },
];

function statusBadge(status: string) {
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

function AdminProviderReviewsPage() {
  const [status, setStatus] = React.useState("all");
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "provider-reviews", status],
    queryFn: () => listAdminProviderReviews({ data: { status } }),
  });

  const mut = useMutation({
    mutationFn: (input: {
      reviewId: string;
      action: "flag" | "request_evidence" | "remove" | "restore";
      reason?: string;
      notes?: string;
    }) => moderateProviderReview({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "provider-reviews"] });
      toast.success("Updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Action failed"),
  });

  return (
    <DashboardShell
      role="admin"
      active="Training Providers"
      title="Provider reviews"
      subtitle="Moderation queue for training-provider reviews."
    >
      <div className="space-y-6">
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList>
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <PCard className="p-4">
          {isLoading ? (
            <div className="p-8 text-center text-white/50">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-white/50">Nothing here.</div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <ReviewRow key={r.id} r={r} onAction={(input) => mut.mutate(input)} />
              ))}
            </div>
          )}
        </PCard>
      </div>
    </DashboardShell>
  );
}

function ReviewRow({
  r,
  onAction,
}: {
  r: any;
  onAction: (i: {
    reviewId: string;
    action: "flag" | "request_evidence" | "remove" | "restore";
    reason?: string;
    notes?: string;
  }) => void;
}) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < r.rating
                      ? "fill-reps-orange text-reps-orange"
                      : "text-white/20"
                  }`}
                />
              ))}
            </div>
            {statusBadge(r.status)}
            {r.verification_source === "verified" && (
              <Badge className="rounded-full border-emerald-400/30 bg-emerald-500/15 text-emerald-300 text-[10px]">
                <BadgeCheck className="mr-1 h-3 w-3" /> Verified
              </Badge>
            )}
            {r.organisation && (
              <Link
                to="/providers/$slug"
                params={{ slug: r.organisation.slug }}
                target="_blank"
                className="text-xs text-white/60 hover:text-reps-orange inline-flex items-center gap-1"
              >
                {r.organisation.name} <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
          {r.title && (
            <h3 className="mt-2 text-white font-medium">{r.title}</h3>
          )}
          <p className="mt-1 text-sm text-white/70 whitespace-pre-line">
            {r.body}
          </p>
          <div className="mt-2 text-xs text-white/45">
            {r.author_display_name} · {new Date(r.created_at).toLocaleString()}
            {r.removed_reason ? ` · removed: ${r.removed_reason}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {r.status !== "removed" && r.status !== "pending_email" && (
            <>
              <ActionDialog
                trigger={
                  <Button size="sm" variant="outline" className="rounded-[10px]">
                    <Flag className="mr-1 h-3.5 w-3.5" /> Flag
                  </Button>
                }
                title="Flag review"
                onSubmit={(reason, notes) =>
                  onAction({ reviewId: r.id, action: "flag", reason, notes })
                }
              />
              <ActionDialog
                trigger={
                  <Button size="sm" variant="outline" className="rounded-[10px]">
                    <FileSearch className="mr-1 h-3.5 w-3.5" /> Request evidence
                  </Button>
                }
                title="Request evidence"
                onSubmit={(reason, notes) =>
                  onAction({
                    reviewId: r.id,
                    action: "request_evidence",
                    reason,
                    notes,
                  })
                }
              />
              <ActionDialog
                trigger={
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-[10px] border-red-400/30 text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                  </Button>
                }
                title="Remove review"
                requireReason
                onSubmit={(reason, notes) =>
                  onAction({ reviewId: r.id, action: "remove", reason, notes })
                }
              />
            </>
          )}
          {r.status === "removed" && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-[10px]"
              onClick={() =>
                onAction({ reviewId: r.id, action: "restore" })
              }
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restore
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionDialog({
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
            <label className="text-xs text-white/60">Reason</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Short public reason"
              className="rounded-[12px] mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-white/60">Internal notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="rounded-[12px] mt-1"
            />
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
