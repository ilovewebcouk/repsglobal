import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard } from "@/components/dashboard/primitives";
import {
  CheckCircle2,
  EyeOff,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  applyShellDraft,
  dismissSeedShell,
  generateShellDraft,
  listSeedShells,
  type SeedShell,
} from "@/lib/admin/seed-shells.functions";

export const Route = createFileRoute("/admin_/seed-shells")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: AdminSeedShellsPage,
});

type Draft = { headline: string; bio: string };

function AdminSeedShellsPage() {
  const listFn = useServerFn(listSeedShells);
  const generateFn = useServerFn(generateShellDraft);
  const applyFn = useServerFn(applyShellDraft);
  const dismissFn = useServerFn(dismissSeedShell);
  const qc = useQueryClient();

  const [offset, setOffset] = useState(0);
  const limit = 50;
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<Record<string, string>>({});

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "seed-shells", offset, limit],
    queryFn: () => listFn({ data: { limit, offset } }),
  });

  const setBusyFor = (id: string, label: string | null) =>
    setBusy((b) => {
      const next = { ...b };
      if (label) next[id] = label;
      else delete next[id];
      return next;
    });

  const genMut = useMutation({
    mutationFn: (user_id: string) => generateFn({ data: { user_id } }),
  });
  const applyMut = useMutation({
    mutationFn: (vars: { user_id: string; headline: string; bio: string }) =>
      applyFn({ data: vars }),
  });
  const dismissMut = useMutation({
    mutationFn: (user_id: string) => dismissFn({ data: { user_id } }),
  });

  async function handleGenerate(row: SeedShell) {
    try {
      setBusyFor(row.user_id, "Generating…");
      const res = await genMut.mutateAsync(row.user_id);
      setDrafts((d) => ({ ...d, [row.user_id]: res }));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyFor(row.user_id, null);
    }
  }

  async function handleApply(row: SeedShell) {
    const d = drafts[row.user_id];
    if (!d) return;
    try {
      setBusyFor(row.user_id, "Publishing…");
      await applyMut.mutateAsync({
        user_id: row.user_id,
        headline: d.headline,
        bio: d.bio,
      });
      setDrafts((all) => {
        const next = { ...all };
        delete next[row.user_id];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["admin", "seed-shells"] });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyFor(row.user_id, null);
    }
  }

  async function handleDismiss(row: SeedShell) {
    if (!confirm(`Hide ${row.full_name} from public directory?`)) return;
    try {
      setBusyFor(row.user_id, "Hiding…");
      await dismissMut.mutateAsync(row.user_id);
      qc.invalidateQueries({ queryKey: ["admin", "seed-shells"] });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyFor(row.user_id, null);
    }
  }

  const rows = data?.rows ?? [];
  const stats = data?.stats;

  return (
    <DashboardShell
      role="admin"
      active="Seed shells"
      title="Seed shells recovery"
      subtitle="Bring migrated profiles with no bio or photo back into the public directory. AI drafts a neutral placeholder for your review."
      actions={
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex h-10 items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel px-4 text-[13px] font-semibold text-white/85 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />{" "}
          Refresh
        </button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="Thin profiles (total)" value={stats?.total_thin} />
          <StatTile
            label="Currently public (no bio)"
            value={stats?.total_thin_published}
            tone="warn"
          />
          <StatTile
            label="Hidden"
            value={stats?.total_thin_hidden}
            tone="muted"
          />
        </div>

        <PCard className="overflow-hidden">
          <div className="border-b border-reps-border px-5 py-3 text-[13px] font-semibold text-white/85">
            Queue
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 px-5 py-8 text-[13px] text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-8 text-[13px] text-white/60">
              No thin profiles remaining 🎉
            </div>
          ) : (
            <ul className="divide-y divide-reps-border">
              {rows.map((row) => {
                const draft = drafts[row.user_id];
                const busyLabel = busy[row.user_id];
                return (
                  <li key={row.user_id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[14px] font-semibold text-white">
                          {row.full_name}
                        </div>
                        <div className="mt-0.5 text-[12px] text-white/55">
                          {[row.city, row.country].filter(Boolean).join(" · ") ||
                            "Location unknown"}
                          {row.bd_member_id != null
                            ? ` · BD #${row.bd_member_id}`
                            : ""}
                          {row.has_avatar ? " · has photo" : " · monogram"}
                          {row.is_published ? "" : " · hidden"}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleGenerate(row)}
                          disabled={!!busyLabel}
                          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12px] font-semibold text-white/85 disabled:opacity-50"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {draft ? "Regenerate" : "Generate draft"}
                        </button>
                        {draft && (
                          <button
                            onClick={() => handleApply(row)}
                            disabled={!!busyLabel}
                            className="flex h-9 items-center gap-1.5 rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(row)}
                          disabled={!!busyLabel || !row.is_published}
                          className="flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel px-3 text-[12px] font-semibold text-white/70 disabled:opacity-50"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                          Hide
                        </button>
                      </div>
                    </div>

                    {busyLabel && (
                      <div className="mt-2 flex items-center gap-2 text-[12px] text-white/55">
                        <Loader2 className="h-3 w-3 animate-spin" />{" "}
                        {busyLabel}
                      </div>
                    )}

                    {draft && (
                      <div className="mt-3 space-y-2">
                        <label className="block text-[11px] uppercase tracking-wide text-white/55">
                          Headline
                        </label>
                        <input
                          value={draft.headline}
                          onChange={(e) =>
                            setDrafts((d) => ({
                              ...d,
                              [row.user_id]: {
                                ...draft,
                                headline: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-[10px] border border-reps-border bg-reps-panel px-3 py-2 text-[13px] text-white outline-none focus:border-reps-orange"
                        />
                        <label className="block text-[11px] uppercase tracking-wide text-white/55">
                          Bio
                        </label>
                        <textarea
                          value={draft.bio}
                          rows={5}
                          onChange={(e) =>
                            setDrafts((d) => ({
                              ...d,
                              [row.user_id]: {
                                ...draft,
                                bio: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-[10px] border border-reps-border bg-reps-panel px-3 py-2 text-[13px] text-white outline-none focus:border-reps-orange"
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-reps-border px-5 py-3 text-[12px] text-white/60">
            <span>
              Showing {offset + 1}–{offset + rows.length} of{" "}
              {stats?.total_thin ?? "…"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="rounded-[8px] border border-reps-border bg-reps-panel px-3 py-1.5 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={rows.length < limit}
                className="rounded-[8px] border border-reps-border bg-reps-panel px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </PCard>
      </div>
    </DashboardShell>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | undefined;
  tone?: "default" | "warn" | "muted";
}) {
  const accent =
    tone === "warn"
      ? "text-reps-orange"
      : tone === "muted"
        ? "text-white/55"
        : "text-white";
  return (
    <PCard className="px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-white/55">
        {label}
      </div>
      <div className={`mt-1 text-[22px] font-semibold ${accent}`}>
        {value ?? "—"}
      </div>
    </PCard>
  );
}
