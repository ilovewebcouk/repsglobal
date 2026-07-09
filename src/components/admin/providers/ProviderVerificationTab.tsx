import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ExternalLink, ShieldCheck } from "lucide-react";

import { getProviderRegulatedPermissions } from "@/lib/admin/providers.functions";
import { Skeleton } from "@/components/ui/skeleton";

const PANEL = "rounded-[18px] border border-reps-border bg-reps-panel/40 p-5";

export function ProviderVerificationTab({ userId }: { userId: string }) {
  const fetchPerms = useServerFn(getProviderRegulatedPermissions);
  const q = useQuery({
    queryKey: ["admin-provider-perms", userId],
    queryFn: () => fetchPerms({ data: { user_id: userId } }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className={PANEL}>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-reps-orange" />
          <div>
            <h3 className="text-[15px] font-semibold text-white">
              Verification is read-only here
            </h3>
            <p className="mt-1 text-[13px] text-white/60">
              Provider verification is handled through the regulated permissions workflow.
              Approving evidence there fires the trigger that assigns the REPs member ID and
              flips verified status. Admin override is intentionally not exposed on this page.
            </p>
            <Link
              to="/admin/verification"
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange hover:underline"
            >
              Open verification queue <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className={PANEL}>
        <h3 className="mb-3 text-[15px] font-semibold text-white">Regulated permissions</h3>
        {q.isLoading ? (
          <Skeleton className="h-24 w-full bg-reps-panel/60" />
        ) : (q.data?.rows ?? []).length === 0 ? (
          <div className="text-[13px] text-white/55">
            No regulated permissions submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-wide text-white/50">
                <tr>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Evidence type</th>
                  <th className="py-2 pr-3">Ofqual #</th>
                  <th className="py-2 pr-3">Reviewed</th>
                  <th className="py-2 pr-3">Admin note</th>
                </tr>
              </thead>
              <tbody>
                {(q.data?.rows ?? []).map((r: Record<string, unknown>) => (
                  <tr key={String(r.id)} className="border-t border-reps-border/70">
                    <td className="py-2 pr-3">
                      <StatusBadge status={String(r.status ?? "")} />
                    </td>
                    <td className="py-2 pr-3 text-white/75">{String(r.evidence_type ?? "—")}</td>
                    <td className="py-2 pr-3 font-mono text-white/70">
                      {String(r.ofqual_number ?? "—")}
                    </td>
                    <td className="py-2 pr-3 text-white/55">
                      {r.reviewed_at
                        ? new Date(String(r.reviewed_at)).toLocaleDateString("en-GB")
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-white/70">{String(r.admin_note ?? "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "approved"
      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
      : status === "rejected"
      ? "border-red-400/30 bg-red-500/15 text-red-300"
      : "border-reps-border bg-reps-panel/60 text-white/70";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {status || "—"}
    </span>
  );
}
