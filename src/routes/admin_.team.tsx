import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PPanel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { listAdmins, grantAdmin, revokeAdmin, type AdminTeamRow } from "@/lib/admin/team.functions";

export const Route = createFileRoute("/admin_/team")({
  ssr: false,
  beforeLoad: requireRole(['admin']),
  head: () => ({
    meta: [
      { title: "Admin team — REPS Admin" },
      { name: "description", content: "Grant and revoke admin access to the REPS platform." },
    ],
  }),
  component: AdminTeamPage,
});

function AdminTeamPage() {
  const runList = useServerFn(listAdmins);
  const runGrant = useServerFn(grantAdmin);
  const runRevoke = useServerFn(revokeAdmin);

  const [rows, setRows] = useState<AdminTeamRow[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmRow, setConfirmRow] = useState<AdminTeamRow | null>(null);

  async function refresh() {
    try {
      const data = await runList();
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load admins");
    }
  }
  useEffect(() => { void refresh(); }, []);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await runGrant({ data: { email: email.trim() } });
      toast.success(
        res?.invited
          ? `Invite sent to ${email.trim()}. They'll become an admin as soon as they accept.`
          : `${email.trim()} is now an admin.`,
      );
      setEmail("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not grant admin");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(row: AdminTeamRow) {
    setBusy(true);
    try {
      await runRevoke({ data: { userId: row.userId } });
      toast.success(`Removed admin access from ${row.fullName ?? row.email ?? "user"}.`);
      setConfirmRow(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not revoke admin");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell role="admin" active="Team" title="Admin team" subtitle="Grant or revoke platform admin access">
      <TooltipProvider>
        <div className="space-y-6">
          <PPanel className="p-6">
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-reps-orange" />
              <h2 className="font-display text-[16px] font-semibold text-white">Grant admin</h2>
            </div>
            <p className="mt-1 text-[13px] text-white/65">
              Enter their email. If they don't have a REPS account yet, we'll send them an invite to set a password.
            </p>
            <form onSubmit={handleGrant} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className="sm:max-w-sm"
              />
              <Button type="submit" disabled={busy || !email.trim()}>
                {busy ? "Granting…" : "Grant admin"}
              </Button>
            </form>
          </PPanel>

          <PPanel className="p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-300" />
              <h2 className="font-display text-[16px] font-semibold text-white">Current admins</h2>
              <Badge variant="secondary" className="ml-2">{rows?.length ?? 0}</Badge>
            </div>

            <div className="mt-4 overflow-hidden rounded-[12px] border border-reps-border">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-reps-ink/60 text-[11px] uppercase tracking-wide text-white/55">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Admin</th>
                    <th className="px-4 py-2.5 font-medium">Email</th>
                    <th className="px-4 py-2.5 font-medium">Admin since</th>
                    <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows === null ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-white/55">Loading…</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-white/55">No admins yet.</td></tr>
                  ) : rows.map((r) => (
                    <tr key={r.userId} className="border-t border-reps-border/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.avatarUrl ? (
                            <img src={r.avatarUrl} alt="" className="size-8 rounded-full object-cover" />
                          ) : (
                            <div className="flex size-8 items-center justify-center rounded-full bg-reps-orange-soft text-[12px] font-semibold text-reps-orange">
                              {(r.fullName ?? r.email ?? "?").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-white">{r.fullName ?? "—"}</div>
                            {r.isSelf ? <div className="text-[11px] text-white/55">You</div> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/80">{r.email ?? "—"}</td>
                      <td className="px-4 py-3 text-white/65">
                        {r.grantedAt ? new Date(r.grantedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.isSelf ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button
                                  size="sm"
                                  disabled
                                  className="border border-red-500/20 bg-red-500/5 text-red-300/60"
                                >
                                  <Trash2 className="size-3.5" />
                                  Remove
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>You can't remove your own admin access — ask another admin.</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setConfirmRow(r)}
                            className="border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                          >
                            <Trash2 className="size-3.5" />
                            Remove
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PPanel>
        </div>

        <AlertDialog open={!!confirmRow} onOpenChange={(o) => !o && setConfirmRow(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove admin access?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmRow?.fullName ?? confirmRow?.email ?? "This user"} will lose access to every <code>/admin</code> page immediately. Their REPS account stays active.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy}
                onClick={(e) => { e.preventDefault(); if (confirmRow) void handleRevoke(confirmRow); }}
              >
                {busy ? "Removing…" : "Remove admin"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TooltipProvider>
    </DashboardShell>
  );
}
