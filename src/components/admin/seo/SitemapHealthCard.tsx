import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, RefreshCw, ShieldAlert, Upload } from "lucide-react";

import { PCard } from "@/components/dashboard/primitives";
import { DashboardButton as Button } from "@/components/dashboard/ui/button";
import { getSitemapHealth, resubmitSitemap } from "@/lib/seo/sitemap-health.functions";

function relTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}

export function SitemapHealthCard() {
  const qc = useQueryClient();
  const getHealth = useServerFn(getSitemapHealth);
  const health = useQuery({
    queryKey: ["seo-sitemap-health"],
    queryFn: () => getHealth({ data: {} }),
    staleTime: 60_000,
  });

  const resubmit = useServerFn(resubmitSitemap);
  const resubmitMut = useMutation({
    mutationFn: () => resubmit({ data: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seo-sitemap-health"] }),
  });

  const h = health.data;

  return (
    <PCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">
            Sitemap health
          </div>
          <div className="mt-1 text-[12px] text-white/55">
            <code className="text-white/70">/sitemap.xml</code> as Google sees it
          </div>
        </div>
        {h && <StatusPill status={h.status} />}
      </div>

      {health.isPending ? (
        <div className="mt-4 flex items-center gap-2 text-[13px] text-white/55">
          <Loader2 className="size-3.5 animate-spin" /> Asking Google…
        </div>
      ) : health.isError ? (
        <div className="mt-4 rounded-[10px] border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
          Couldn't reach Search Console.
        </div>
      ) : h ? (
        <div className="mt-4 space-y-3 text-[12px] text-white/75">
          <Row label="Last fetched by Google" value={relTime(h.lastDownloaded)} />
          <Row label="First submitted" value={relTime(h.lastSubmitted)} />
          <Row label="URLs Google saw" value={h.submitted ? `${h.submitted} submitted · ${h.indexed} indexed` : "—"} />
          {(h.errors > 0 || h.warnings > 0) && (
            <div className="flex items-center gap-2 rounded-[8px] border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[12px] text-amber-200">
              <ShieldAlert className="size-3.5" />
              {h.errors > 0 && <span>{h.errors} error{h.errors === 1 ? "" : "s"}</span>}
              {h.errors > 0 && h.warnings > 0 && <span>·</span>}
              {h.warnings > 0 && <span>{h.warnings} warning{h.warnings === 1 ? "" : "s"}</span>}
            </div>
          )}
          {h.message && (
            <div className="text-[11px] text-white/55">{h.message}</div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              variant="subtle"
              size="sm"
              onClick={() => resubmitMut.mutate()}
              disabled={resubmitMut.isPending}
            >
              {resubmitMut.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : h.status === "not_submitted" ? (
                <Upload className="size-3.5" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              <span>
                {h.status === "not_submitted" ? "Register with Google" : "Resubmit sitemap"}
              </span>
            </Button>
            <a
              href={`https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent("https://repsuk.org/")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-[8px] border border-reps-border bg-reps-ink px-2.5 py-1.5 text-[12px] font-semibold text-white/75 transition hover:text-white"
            >
              <ExternalLink className="size-3.5" /> Open in GSC
            </a>
            {resubmitMut.isSuccess && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
                <CheckCircle2 className="size-3" /> Submitted
              </span>
            )}
            {resubmitMut.isError && (
              <span className="inline-flex items-center gap-1 text-[11px] text-rose-300">
                <AlertTriangle className="size-3" /> Failed
              </span>
            )}
          </div>
        </div>
      ) : null}
    </PCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/55">{label}</span>
      <span className="text-white/85">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: "healthy" | "warnings" | "errors" | "not_submitted" | "unavailable" }) {
  if (status === "healthy") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[6px] border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
        <CheckCircle2 className="size-3" /> Healthy
      </span>
    );
  }
  if (status === "warnings") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[6px] border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
        <ShieldAlert className="size-3" /> Warnings
      </span>
    );
  }
  if (status === "errors") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[6px] border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
        <AlertTriangle className="size-3" /> Errors
      </span>
    );
  }
  if (status === "not_submitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-[6px] border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/60">
        Not submitted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-[6px] border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/60">
      Unavailable
    </span>
  );
}
