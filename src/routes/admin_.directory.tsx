import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { requireRole } from "@/lib/route-gates";
import { AlertTriangle, Globe2, RefreshCcw, Sparkles, Star } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PCard, PPanel } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDirectoryHealth } from "@/lib/directory/featured.functions";

export const Route = createFileRoute("/admin_/directory")({
  ssr: false,
  beforeLoad: requireRole(["admin"]),
  head: () => ({
    meta: [
      { title: "Directory health — REPS Admin" },
      { name: "description", content: "Monitor public directory completeness, broken links and featured rotation." },
      { property: "og:title", content: "Directory health — REPS Admin" },
      { property: "og:description", content: "Public directory health and featured-pro rotation." },
    ],
  }),
  component: AdminDirectory,
});

const PROFESSION_LABELS: Record<string, string> = {
  "personal-trainer": "Personal Trainer",
  "pilates-instructor": "Pilates",
  "strength-coach": "S&C Coach",
  "nutritionist": "Nutritionist",
  "online-coach": "Online Coach",
  "yoga-teacher": "Yoga",
  "group-exercise-instructor": "Group Ex",
  "fitness-instructor": "Fitness Instructor",
};

function AdminDirectory() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useQuery({
    queryKey: ["admin-directory-health"],
    queryFn: () => getDirectoryHealth(),
    staleTime: 60_000,
  });

  const subtitle = data
    ? `${data.kpis.live_listings.toLocaleString()} live listings${
        data.kpis.completeness_pct != null ? ` · ${data.kpis.completeness_pct}% completeness average` : ""
      }`
    : "Loading…";

  const kpis = data
    ? [
        { label: "Live listings", value: data.kpis.live_listings.toLocaleString(), delta: "Currently published" },
        {
          label: "Completeness",
          value: data.kpis.completeness_pct != null ? `${data.kpis.completeness_pct}%` : "—",
          delta: "Avg quality score (max 100)",
        },
        {
          label: "Broken links",
          value: data.kpis.broken_links == null ? "—" : data.kpis.broken_links.toLocaleString(),
          delta: "Crawler ships in a later release",
        },
        {
          label: "Featured slots",
          value: `${data.kpis.featured_slots.filled} / ${data.kpis.featured_slots.capacity}`,
          delta: data.backfill_active
            ? `Backfill active · ${data.paid_total} paid pro${data.paid_total === 1 ? "" : "s"} live`
            : `${data.paid_total} paid pros in rotation`,
        },
      ]
    : Array.from({ length: 4 }).map(() => ({ label: "—", value: "—", delta: "" }));

  return (
    <DashboardShell role="admin" active="Directory" title="Directory health" subtitle={subtitle}>
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <PCard key={k.label}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45">{k.label}</div>
            <div className="mt-2 font-display text-[28px] font-bold text-white">{k.value}</div>
            <div className="mt-1 text-[12px] text-white/55">{k.delta}</div>
          </PCard>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PPanel className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[16px] font-semibold text-white">Listings needing attention</h2>
            <Link
              to="/admin/professionals"
              className="text-[12px] font-semibold text-reps-orange hover:underline"
            >
              View all
            </Link>
          </div>
          {isPending ? (
            <p className="mt-4 text-[13px] text-white/55">Loading directory health…</p>
          ) : isError || !data ? (
            <p className="mt-4 text-[13px] text-rose-300">Couldn't load directory health.</p>
          ) : data.needs_attention.length === 0 ? (
            <p className="mt-4 text-[13px] text-white/55">No incomplete profiles — every published pro is in good shape.</p>
          ) : (
            <table className="mt-4 w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.06em] text-white/45">
                  <th className="py-2 font-semibold">Professional</th>
                  <th className="py-2 font-semibold">Issue</th>
                  <th className="py-2 font-semibold">Completeness</th>
                  <th className="py-2 font-semibold">Last edit</th>
                </tr>
              </thead>
              <tbody>
                {data.needs_attention.map((r) => (
                  <tr key={r.id} className="border-t border-reps-border/60 text-white/80">
                    <td className="py-3 font-semibold text-white">
                      {r.slug ? (
                        <Link to="/pro/$slug" params={{ slug: r.slug }} className="hover:text-reps-orange">
                          {r.name}
                        </Link>
                      ) : (
                        r.name
                      )}
                    </td>
                    <td className="py-3 text-white/65">{r.issue}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-reps-ink">
                          <div className="h-full rounded-full bg-reps-orange" style={{ width: `${r.completeness_pct}%` }} />
                        </div>
                        <span className="text-[12px] text-white/55">{r.completeness_pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-white/55">{r.last_edit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </PPanel>

        <div className="space-y-6">
          <PPanel className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Star className="h-4 w-4 text-reps-orange" />
                <h2 className="font-display text-[16px] font-semibold">Featured rotation</h2>
              </div>
              <button
                type="button"
                onClick={() => qc.invalidateQueries({ queryKey: ["admin-directory-health"] })}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/70 hover:text-white"
                aria-label="Refresh featured rotation"
              >
                <RefreshCcw className="h-3 w-3" />
                Refresh
              </button>
            </div>
            <p className="mt-1 text-[11px] text-white/45">
              Auto-rotated daily.{" "}
              {data?.backfill_active
                ? "Avatar-backfill on until 6+ paid pros are live."
                : "Paid pros only (Verified / Pro / Studio)."}
            </p>
            {data && data.featured_rotation.length > 0 ? (
              <ul className="mt-4 space-y-2 text-[13px]">
                {data.featured_rotation.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-[10px] border border-reps-border bg-reps-ink px-3 py-2 text-white/80"
                  >
                    <Link to="/pro/$slug" params={{ slug: p.slug }} className="truncate hover:text-reps-orange">
                      <span className="font-semibold text-white">{p.name}</span>
                      <span className="ml-1 text-white/55">
                        — {PROFESSION_LABELS[p.role] ?? p.role}
                        {p.city ? ` · ${p.city}` : ""}
                      </span>
                    </Link>
                    {p.is_paid ? (
                      <Badge className="rounded-full border border-reps-orange/40 bg-reps-orange/15 px-2 py-0 text-[10px] font-semibold uppercase tracking-wider text-reps-orange">
                        {p.tier}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full border-white/15 px-2 py-0 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                        Backfill
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[13px] text-white/55">No featured pros yet.</p>
            )}
          </PPanel>

          <PCard>
            <div className="flex items-center gap-2 text-white">
              <Globe2 className="h-4 w-4 text-reps-orange" />
              <h3 className="font-display text-[14px] font-semibold">Geographic coverage</h3>
            </div>
            {data && data.geographic_coverage.length > 0 ? (
              <ul className="mt-3 space-y-2 text-[13px] text-white/75">
                {data.geographic_coverage.map((c) => (
                  <li key={c.city} className="flex items-center justify-between">
                    <span>{c.city}</span>
                    <span className="font-semibold text-white">{c.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[12px] text-white/55">No city data yet.</p>
            )}
          </PCard>

          <PCard className="border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-white/70">
              <AlertTriangle className="h-4 w-4 text-white/55" />
              <h3 className="font-display text-[14px] font-semibold">Crawl alerts</h3>
            </div>
            <p className="mt-2 text-[12px] text-white/55">
              Link crawler ships in a later release. This panel will surface outbound-link failures once it goes live.
            </p>
            <Button disabled className="mt-3 h-9 rounded-[10px] bg-white/5 text-[12px] font-semibold text-white/40 hover:bg-white/5">
              <Sparkles className="mr-1.5 h-3 w-3" />
              Re-run crawl
            </Button>
          </PCard>
        </div>
      </div>
    </DashboardShell>
  );
}
