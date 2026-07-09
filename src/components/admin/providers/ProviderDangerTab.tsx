import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, EyeOff, Eye, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  suspendProvider,
  republishProvider,
  closeProvider,
} from "@/lib/admin/providers.functions";

const PANEL = "rounded-[18px] border border-reps-border bg-reps-panel/40 p-5";

export function ProviderDangerTab({
  userId,
  snapshot,
}: {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: { professional: Record<string, any> };
}) {
  const suspended = snapshot.professional.suspended_at != null;
  const published = snapshot.professional.is_published as boolean;

  return (
    <div className="flex flex-col gap-4">
      <div className={PANEL}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
          <div>
            <h3 className="text-[15px] font-semibold text-white">Danger zone</h3>
            <p className="mt-1 text-[13px] text-white/60">
              Every action here is audited. Suspend hides the public page but preserves the
              account. Close cancels the membership, removes public visibility, deletes the
              account, and may affect CPD courses/accreditation data connected to this provider.
            </p>
          </div>
        </div>
      </div>

      <div className={PANEL}>
        <h3 className="mb-3 text-[15px] font-semibold text-white">Visibility</h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[13px] text-white/70">
            Currently:{" "}
            {suspended ? (
              <span className="text-red-300">Suspended</span>
            ) : published ? (
              <span className="text-emerald-300">Published</span>
            ) : (
              <span className="text-white/55">Hidden</span>
            )}
          </div>
          <div className="ml-auto flex gap-2">
            {suspended || !published ? (
              <RepublishButton userId={userId} />
            ) : (
              <SuspendButton userId={userId} />
            )}
          </div>
        </div>
      </div>

      <div className={PANEL}>
        <h3 className="mb-3 text-[15px] font-semibold text-white">Close provider account</h3>
        <p className="mb-3 text-[13px] text-white/60">
          Runs the canonical close-membership pipeline: hide profile, cancel Stripe
          subscriptions, erase PII + storage, delete auth user, audit + ops alert.
        </p>
        <CloseButton userId={userId} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SuspendButton({ userId }: { userId: string }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const suspend = useServerFn(suspendProvider);
  const qc = useQueryClient();

  async function submit() {
    if (busy || !reason.trim()) return;
    setBusy(true);
    try {
      await suspend({ data: { user_id: userId, reason: reason.trim() } });
      toast.success("Provider suspended");
      await qc.invalidateQueries({ queryKey: ["admin-provider-360", userId] });
      setOpen(false);
      setReason("");
    } catch (e) {
      toast.error((e as Error).message ?? "Suspend failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="rounded-[10px] border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-red-100"
      >
        <EyeOff data-icon="inline-start" /> Suspend
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="border-reps-border bg-reps-ink text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend provider</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Hides the public /t/&lt;slug&gt; page. Reversible via Republish. Does not cancel
              billing or delete the account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label>Reason (required)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy || !reason.trim()} onClick={submit}>
              {busy ? "Suspending…" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RepublishButton({ userId }: { userId: string }) {
  const [busy, setBusy] = React.useState(false);
  const republish = useServerFn(republishProvider);
  const qc = useQueryClient();

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      await republish({ data: { user_id: userId, reason: null } });
      toast.success("Provider republished");
      await qc.invalidateQueries({ queryKey: ["admin-provider-360", userId] });
    } catch (e) {
      toast.error((e as Error).message ?? "Republish failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={submit}
      disabled={busy}
      className="rounded-[10px] border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100"
    >
      <Eye data-icon="inline-start" /> {busy ? "Republishing…" : "Republish"}
    </Button>
  );
}

function CloseButton({ userId }: { userId: string }) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const close = useServerFn(closeProvider);

  async function submit() {
    if (busy || !reason.trim()) return;
    setBusy(true);
    try {
      await close({
        data: { user_id: userId, reason: reason.trim(), notes: notes.trim() || null },
      });
      toast.success("Provider closed");
      // Navigate away — record no longer exists.
      window.location.assign("/admin/providers");
    } catch (e) {
      toast.error((e as Error).message ?? "Close failed");
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        className="rounded-[10px]"
      >
        <Trash2 data-icon="inline-start" /> Close provider account
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="border-reps-border bg-reps-ink text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Close training provider</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Closing this provider will cancel the membership, remove public visibility,
              delete the account, and may affect CPD courses/accreditation data connected to
              this provider. This is not reversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Reason (required)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy || !reason.trim()} onClick={submit}>
              {busy ? "Closing…" : "Close and delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
