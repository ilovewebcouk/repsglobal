// Support ticket → "Close this member's account" card.
//
// Rendered inside the support ticket sheet. Looks up the requester by email
// and, if they're a REPS member, surfaces a one-click destructive flow that
// calls the same `cancelAndDeleteMember` server fn used by Member 360 — so
// behaviour can't diverge between surfaces.
//
// Visible only to admins (the whole /admin/support route is admin-gated).

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, UserX, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  findMemberByEmail,
  cancelAndDeleteMember,
} from "@/lib/admin/billing-actions.functions";

interface Props {
  requesterEmail: string | null | undefined;
  /** Called after successful close so the parent ticket list can refresh. */
  onClosed?: () => void;
}

export function MemberCancelCard({ requesterEmail, onClosed }: Props) {
  const findFn = useServerFn(findMemberByEmail);
  const closeFn = useServerFn(cancelAndDeleteMember);

  const email = (requesterEmail ?? "").trim();
  const query = useQuery({
    queryKey: ["support-member-lookup", email.toLowerCase()],
    queryFn: () => findFn({ data: { email } }),
    enabled: !!email && email.includes("@"),
    staleTime: 60_000,
  });

  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [typedName, setTypedName] = useState("");
  const [pending, setPending] = useState(false);

  if (!email) return null;
  if (query.isLoading) {
    return (
      <div className="rounded-[12px] border border-reps-border/60 bg-white/[0.02] px-3 py-2 text-[12px] text-white/55">
        Looking up the requester…
      </div>
    );
  }
  if (!query.data || query.data.found === false) {
    return (
      <div className="rounded-[12px] border border-reps-border/60 bg-white/[0.02] px-3 py-2 text-[12px] text-white/55">
        This requester isn't a REPS member account ({email}). No close-account
        action available.
      </div>
    );
  }

  const member = query.data;
  const displayName = member.full_name ?? email;
  const nameMatches =
    typedName.trim().toLowerCase() === displayName.trim().toLowerCase();

  const run = async () => {
    setPending(true);
    try {
      const res = await closeFn({
        data: {
          user_id: member.user_id,
          reason: "member_request",
          notes: notes.trim() || "Closed from support ticket",
        },
      });
      toast.success(
        res.emailSent
          ? "Account closed. Confirmation email sent."
          : "Account closed. (Confirmation email skipped.)",
      );
      setOpen(false);
      onClosed?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not close account");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="rounded-[12px] border border-reps-border/60 bg-white/[0.02] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/55">
              <ShieldAlert className="h-3 w-3" /> Member account
            </div>
            <div className="mt-1 truncate text-[13px] font-semibold text-white">
              {displayName}
            </div>
            <div className="mt-0.5 text-[11.5px] text-white/55">
              {member.has_active_subscription
                ? `Active${member.tier ? ` · ${member.tier}` : ""} subscription on file`
                : "No active subscription"}
            </div>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 shrink-0 rounded-[10px] border-reps-border bg-white/5 text-white hover:bg-reps-panel-soft hover:text-white"
          >
            <Link to="/admin/members/$userId" params={{ userId: member.user_id }}>
              <ExternalLink data-icon="inline-start" /> Open Member 360
            </Link>
          </Button>
        </div>

        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            className="h-8 rounded-[10px] border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:text-rose-100"
          >
            <UserX data-icon="inline-start" /> Close this member's account
          </Button>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={(o) => !o && !pending && setOpen(false)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Close {displayName}'s account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cancels any Stripe subscription, removes the public profile,
              sends a confirmation email, and deletes the account. The email
              is archived to the mailing list so we can contact them later.
              This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3 py-1">
            <div>
              <Label htmlFor="support-close-notes" className="text-[12.5px] text-foreground/70">
                Notes (saved to audit log)
              </Label>
              <Textarea
                id="support-close-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Member asked us to close their account in this ticket."
                className="mt-1 min-h-[72px]"
                disabled={pending}
              />
            </div>
            <div>
              <Label htmlFor="support-close-confirm" className="text-[12.5px] text-foreground/70">
                Type{""}
                <span className="font-semibold text-foreground">{displayName}</span>{""}
                to confirm
              </Label>

              <Input
                id="support-close-confirm"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                className="mt-1"
                disabled={pending}
                autoComplete="off"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending || !nameMatches}
              onClick={(e) => {
                e.preventDefault();
                run();
              }}
              className="bg-rose-600 text-white hover:bg-rose-500"
            >
              {pending ? "Closing…" : "Close account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
