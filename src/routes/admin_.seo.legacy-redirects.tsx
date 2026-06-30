import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import Papa from "papaparse";
import { Loader2, Upload, CheckCircle2, AlertTriangle } from "lucide-react";

import { requireRole } from "@/lib/route-gates";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import {
  importLegacyRedirectsCsv,
  getLegacyCoverageStats,
  rechainLegacyRedirects,
} from "@/lib/seo/legacy-redirects.functions";

export const Route = createFileRoute("/admin_/seo/legacy-redirects")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  component: LegacyRedirectsPage,
});

type ParsedRow = { source: string; destination: string };

function findColumn(headers: string[], options: string[]): string | null {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const opt of options) {
    const i = lower.indexOf(opt);
    if (i !== -1) return headers[i]!;
  }
  return null;
}

function LegacyRedirectsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; dropped: number; resolved: number } | null>(null);

  const statsFn = useServerFn(getLegacyCoverageStats);
  const stats = useQuery({
    queryKey: ["legacy-redirects-stats"],
    queryFn: () => statsFn(),
  });

  const importFn = useServerFn(importLegacyRedirectsCsv);
  const importMut = useMutation({
    mutationFn: (rows: ParsedRow[]) => importFn({ data: { rows, replace: true } }),
    onSuccess: (res) => {
      setImportResult({ imported: res.imported, dropped: res.dropped, resolved: res.resolved });
      qc.invalidateQueries({ queryKey: ["legacy-redirects-stats"] });
    },
  });

  const rechainFn = useServerFn(rechainLegacyRedirects);
  const [rechainResult, setRechainResult] = useState<{ scanned: number; resolved: number; newlyResolved: number } | null>(null);
  const rechainMut = useMutation({
    mutationFn: () => rechainFn(),
    onSuccess: (res) => {
      setRechainResult({ scanned: res.scanned, resolved: res.resolved, newlyResolved: res.newlyResolved });
      qc.invalidateQueries({ queryKey: ["legacy-redirects-stats"] });
    },
  });

  function onFile(file: File) {
    setParseError(null);
    setImportResult(null);
    setParsed(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        if (headers.length === 0) {
          setParseError("CSV has no header row.");
          return;
        }
        const sourceCol = findColumn(headers, [
          "source url",
          "source",
          "source_url",
          "from",
          "from url",
          "old url",
          "old",
        ]);
        const destCol = findColumn(headers, [
          "destination url",
          "destination",
          "destination_url",
          "to",
          "to url",
          "new url",
          "new",
          "target",
          "target url",
        ]);
        if (!sourceCol || !destCol) {
          setParseError(
            `Couldn't find Source/Destination columns. Headers found: ${headers.join(", ")}`,
          );
          return;
        }
        const rows: ParsedRow[] = [];
        for (const r of result.data) {
          const s = (r[sourceCol] ?? "").toString().trim();
          const d = (r[destCol] ?? "").toString().trim();
          if (s && d) rows.push({ source: s, destination: d });
        }
        if (rows.length === 0) {
          setParseError("No usable rows in CSV.");
          return;
        }
        setParsed(rows);
      },
      error: (err) => setParseError(err.message),
    });
  }

  return (
    <DashboardShell
      role="admin"
      active="Settings"
      title="Legacy 301 redirects"
      subtitle="Import BD redirect rules so legacy URLs map to current pros (or 410 cleanly)."
    >
      <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6">
        <PCard>
          <div className="px-5 py-4">
            <h2 className="text-[15px] font-semibold text-white">Legacy 301 redirects</h2>
            <p className="mt-1 text-[12.5px] text-white/60">
              Import the redirect rules exported from the old website. Source paths from{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[11.5px]">legacy.repsuk.org</code>{" "}
              get matched against current professionals and served as 301s. Unmatched
              rows return 410 Gone so Google can deindex cleanly.
            </p>
          </div>
        </PCard>

        {/* Stats */}
        <PPanel>
          <div className="px-5 py-4">
            <h3 className="text-[13.5px] font-semibold text-white">Current coverage</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-4">
            <StatTile label="Rules imported" value={stats.data?.total ?? "—"} />
            <StatTile
              label="Resolves to live pro"
              value={stats.data?.resolved ?? "—"}
              tone="ok"
            />
            <StatTile label="Returns 410 Gone" value={stats.data?.gone ?? "—"} tone="warn" />
            <StatTile
              label="Last import"
              value={
                stats.data?.lastImportedAt
                  ? new Date(stats.data.lastImportedAt).toLocaleString()
                  : "—"
              }
            />
          </div>
          {stats.data?.byKind && Object.keys(stats.data.byKind).length > 0 && (
            <div className="border-t border-reps-border px-5 py-3">
              <div className="flex flex-wrap gap-2 text-[11.5px] text-white/60">
                {Object.entries(stats.data.byKind).map(([kind, count]) => (
                  <span
                    key={kind}
                    className="rounded-full border border-reps-border bg-reps-panel-soft px-2.5 py-0.5"
                  >
                    {kind}: <span className="font-semibold text-white">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </PPanel>

        {/* Import */}
        <PPanel>
          <div className="px-5 py-4">
            <h3 className="text-[13.5px] font-semibold text-white">Import CSV</h3>
            <p className="mt-1 text-[12px] text-white/55">
              Expects columns named <strong>Source URL</strong> and <strong>Destination URL</strong>{" "}
              (or any common variants — "From"/"To", "Source"/"Target", etc).
              Re-importing replaces the entire table.
            </p>
          </div>
          <div className="space-y-3 px-5 pb-5">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
              className="block w-full text-[12.5px] text-white/80 file:mr-3 file:rounded-[10px] file:border-0 file:bg-reps-orange file:px-4 file:py-2 file:text-[12.5px] file:font-semibold file:text-white hover:file:bg-reps-orange-hover"
            />

            {parseError && (
              <div className="flex items-start gap-2 rounded-[10px] border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[12.5px] text-rose-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {parsed && !importResult && (
              <div className="rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-3">
                <p className="text-[12.5px] text-white/80">
                  Parsed <strong className="text-white">{parsed.length.toLocaleString()}</strong> rows.
                  Sample:
                </p>
                <ul className="mt-2 space-y-1 font-mono text-[11.5px] text-white/60">
                  {parsed.slice(0, 3).map((r, i) => (
                    <li key={i} className="truncate">
                      {r.source} → {r.destination}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => importMut.mutate(parsed)}
                    disabled={importMut.isPending}
                  >
                    {importMut.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing…
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" /> Import {parsed.length.toLocaleString()} rules
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setParsed(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {importResult && (
              <div className="flex items-start gap-2 rounded-[10px] border border-emerald-400/30 bg-emerald-500/10 px-3 py-3 text-[12.5px] text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Import complete</div>
                  <div className="mt-0.5 text-emerald-200/80">
                    {importResult.imported.toLocaleString()} imported ·{" "}
                    {importResult.resolved.toLocaleString()} resolve to a live pro ·{" "}
                    {importResult.dropped.toLocaleString()} dropped (empty / self-loops).
                  </div>
                </div>
              </div>
            )}

            {importMut.isError && (
              <div className="flex items-start gap-2 rounded-[10px] border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[12.5px] text-rose-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{(importMut.error as Error).message}</span>
              </div>
            )}
          </div>
        </PPanel>
      </div>
    </DashboardShell>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "ok" | "warn";
}) {
  const toneClass =
    tone === "ok" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : "text-white";
  return (
    <div className="rounded-[14px] border border-reps-border bg-reps-panel-soft px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-white/45">{label}</div>
      <div className={`mt-1 text-[20px] font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
