import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { requireRole } from "@/lib/route-gates";
import { Button } from "@/components/ui/button";
import { exportPrivateStorage } from "@/lib/admin/export-storage.functions";

export const Route = createFileRoute("/_authenticated/admin_/export-storage")({
  beforeLoad: requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Export private storage — Admin" }] }),
  component: ExportStoragePage,
});

function ExportStoragePage() {
  const run = useServerFn(exportPrivateStorage);
  const [state, setState] = React.useState<
    | { status: "idle" }
    | { status: "running" }
    | { status: "done"; count: number; errors: number }
    | { status: "error"; message: string }
  >({ status: "idle" });

  async function handleExport() {
    setState({ status: "running" });
    try {
      const res = await run();
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reps-private-storage-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState({ status: "done", count: res.count, errors: res.errors.length });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Export failed",
      });
    }
  }

  return (
    <div className="min-h-screen bg-reps-ink px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl space-y-4 rounded-[16px] border border-reps-border bg-reps-panel p-6">
        <h1 className="font-display text-[22px] font-semibold">Export private storage</h1>
        <div className="text-[13px] text-white/70 space-y-2">
          <p>
            Enumerates <strong>certificate-templates, certificates, course-accreditations, identity-docs, insurance-docs, provider-review-evidence, support-attachments, verification-docs</strong> and produces a JSON manifest containing a 7-day signed URL for every object.
          </p>
          <p>
            Hand the JSON to the Replit agent — a small script fetches each <code>signed_url</code> and re-uploads it to the equivalent bucket on the destination. No service keys are shared.
          </p>
          <p className="text-amber-300/80">
            URLs expire in 7 days. The file contains PII — treat it as confidential and delete it once migration is complete.
          </p>
        </div>

        <Button onClick={handleExport} disabled={state.status === "running"}>
          {state.status === "running" ? "Generating…" : "Generate export"}
        </Button>

        {state.status === "done" && (
          <p className="text-[13px] text-emerald-300">
            Exported {state.count} files. {state.errors > 0 ? `${state.errors} error(s) — see the "errors" array in the JSON.` : "No errors."}
          </p>
        )}
        {state.status === "error" && (
          <p className="text-[13px] text-rose-300">{state.message}</p>
        )}
      </div>
    </div>
  );
}
