import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PPanel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  previewExpiredBdCleanup,
  executeExpiredBdCleanup,
} from "@/lib/admin/batch-cleanup.functions";

export const Route = createFileRoute("/admin_/cleanup")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Cleanup — REPS Admin" },
      { name: "description", content: "Batch cleanup of expired BD legacy accounts." },
    ],
  }),
  component: AdminCleanupPage,
});

type PreviewRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  bd_next_due_date: string | null;
};

function AdminCleanupPage() {
  const runPreview = useServerFn(previewExpiredBdCleanup);
  const runExecute = useServerFn(executeExpiredBdCleanup);

  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [result, setResult] = useState<{ deleted: number; failed: Array<{ user_id: string; error: string }> } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await runPreview();
      setRows(res.rows);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load preview");
    } finally {
      setLoading(false);
    }
  };

  const execute = async () => {
    setExecuting(true);
    try {
      const res = await runExecute({ data: { confirm: "DELETE" } });
      setResult({ deleted: res.deleted, failed: res.failed });
      toast.success(`Deleted ${res.deleted} accounts (${res.failed.length} failed)`);
      setConfirmOpen(false);
      setConfirmText("");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Cleanup failed");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Cleanup — expired BD legacy accounts</h1>
          <p className="mt-2 text-sm text-white/70">
            Hard-delete every confirmed professional that has no live Stripe subscription, is not
            an admin/demo, and is not in the honoured BD grace window. Cascades through profiles,
            professionals, reviews, etc. Email contact is archived to <code>mailing_list_contacts</code> first.
          </p>
        </div>

        <PPanel className="p-4">
          <div className="flex items-center justify-between gap-3">
            <Button onClick={load} disabled={loading} variant="secondary">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {rows === null ? "Load preview" : "Refresh preview"}
            </Button>
            {rows && rows.length > 0 ? (
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={executing}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                <Trash2 className="size-4" />
                Delete {rows.length} accounts
              </Button>
            ) : null}
          </div>
        </PPanel>

        {result ? (
          <PPanel className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-emerald-400" />
              <div className="text-sm">
                <div className="font-medium text-white">Last run: {result.deleted} deleted</div>
                {result.failed.length > 0 ? (
                  <div className="mt-2 text-white/70">
                    <div>Failed ({result.failed.length}):</div>
                    <ul className="mt-1 list-disc pl-5">
                      {result.failed.map((f) => (
                        <li key={f.user_id}>
                          <code className="text-xs">{f.user_id}</code> — {f.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </PPanel>
        ) : null}

        {rows ? (
          <PPanel className="overflow-hidden">
            <div className="px-4 py-3 text-sm font-medium text-white/80">
              {rows.length} accounts queued for deletion
            </div>
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-reps-panel/80 backdrop-blur">
                  <tr className="text-left text-xs uppercase tracking-wide text-white/55">
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">BD next due</th>
                    <th className="px-4 py-2">User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.user_id} className="border-t border-reps-border/40">
                      <td className="px-4 py-2 text-white">{r.email ?? "—"}</td>
                      <td className="px-4 py-2 text-white/80">{r.full_name ?? "—"}</td>
                      <td className="px-4 py-2 text-white/70">{r.bd_next_due_date ?? "—"}</td>
                      <td className="px-4 py-2 text-xs text-white/40">{r.user_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PPanel>
        ) : null}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {rows?.length ?? 0} accounts?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the auth users and cascades through every linked table
              (profiles, professionals, reviews, etc.). Email contacts are archived first. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm">Type <code>DELETE</code> to confirm</Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={executing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== "DELETE" || executing}
              onClick={(e) => {
                e.preventDefault();
                void execute();
              }}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              {executing ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
