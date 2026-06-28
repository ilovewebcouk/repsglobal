import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteTimeInfo } from "@/lib/admin/site-time.functions";
import { useEffect, useState } from "react";

function fmt(d: string | null | undefined, tz?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-GB", {
      timeZone: tz,
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return d;
  }
}

function countdown(target: string | null | undefined): string {
  if (!target) return "—";
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return "due now";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
}

export function SiteTimePanel() {
  const fn = useServerFn(getSiteTimeInfo);
  const q = useQuery({ queryKey: ["site-time"], queryFn: () => fn(), refetchInterval: 30_000 });
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const d = q.data;

  return (
    <div className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-white/55">Site time</div>
          <div className="font-display text-[15px] font-semibold text-white">Server clock & next payment runs</div>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
          {d?.tz_abbrev ?? "—"}
        </span>
      </div>

      {!d ? (
        <div className="mt-4 text-sm text-white/55">Loading…</div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Row label="UK local now (Europe/London)" value={fmt(d.utc_now, "Europe/London")} />
          <Row label="Server UTC now" value={fmt(d.utc_now, "UTC")} />
          <Row
            label="Next legacy renewal run"
            value={`${fmt(d.next_renewal_run, "Europe/London")} · ${countdown(d.next_renewal_run)}`}
            sub="Target 00:15 London (DST-safe)"
          />
          <Row
            label="Next lifecycle / churn run"
            value={`${fmt(d.next_lifecycle_run, "Europe/London")} · ${countdown(d.next_lifecycle_run)}`}
            sub="Target 00:30 London (DST-safe)"
          />
          <Row
            label="Last legacy renewal run"
            value={fmt(d.last_renewal_run, "Europe/London")}
            tone={d.last_renewal_run ? "ok" : "warn"}
          />
          <Row
            label="Last lifecycle / churn run"
            value={fmt(d.last_lifecycle_run, "Europe/London")}
            tone={d.last_lifecycle_run ? "ok" : "warn"}
          />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-[12px] border border-reps-border bg-reps-ink/30 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-white/55">{label}</div>
      <div
        className={`mt-1 font-mono text-[13px] tabular-nums ${
          tone === "warn" ? "text-amber-200" : tone === "ok" ? "text-emerald-200" : "text-white"
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-white/45">{sub}</div>}
    </div>
  );
}
