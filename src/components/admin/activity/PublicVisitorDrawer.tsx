// Phase UI-2 — Public Visitor Drawer.
// Uses getPublicVisitorDetail. Raw IP hidden by default; reveal calls
// revealVisitorIp (audit-first). Admin-only route surface.

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Copy, MapPin, Monitor, Clock, Route as RouteIcon, Shield, AlertTriangle } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getPublicVisitorDetail, revealVisitorIp } from "@/lib/activity/live-visitors.functions";

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function duration(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return "—";
  const s = Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export interface PublicVisitorDrawerProps {
  journeyId: string | null;
  onClose: () => void;
}

export function PublicVisitorDrawer({ journeyId, onClose }: PublicVisitorDrawerProps) {
  const runDetail = useServerFn(getPublicVisitorDetail);
  const runReveal = useServerFn(revealVisitorIp);

  const q = useQuery({
    queryKey: ["public-visitor-detail", journeyId],
    queryFn: () => runDetail({ data: { journey_id: journeyId! } }),
    enabled: !!journeyId,
    staleTime: 5_000,
  });

  const [revealOpen, setRevealOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [revealed, setRevealed] = useState<{ ip: string; audit_id: string } | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  const detail = q.data;
  const latestObs = detail?.observations[0];

  async function doReveal() {
    if (!latestObs || reason.trim().length < 8) {
      setRevealError("Reason must be at least 8 characters.");
      return;
    }
    setRevealing(true);
    setRevealError(null);
    try {
      const r = await runReveal({ data: { observation_id: latestObs.id, reason: reason.trim() } });
      setRevealed({ ip: r.raw_ip as string, audit_id: r.audit_id });
      setRevealOpen(false);
    } catch (e) {
      setRevealError(e instanceof Error ? e.message : "Reveal failed");
    } finally {
      setRevealing(false);
    }
  }

  function resetOnClose(open: boolean) {
    if (!open) {
      setReason(""); setRevealed(null); setRevealError(null); setRevealOpen(false);
      onClose();
    }
  }

  return (
    <Sheet open={!!journeyId} onOpenChange={resetOnClose}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l border-reps-border bg-reps-ink p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-reps-border p-5 text-left">
          <SheetTitle className="flex items-center gap-2 text-[16px] font-semibold text-white">
            <Shield className="h-4 w-4 text-blue-300" /> Public visitor
          </SheetTitle>
          <p className="text-[11.5px] text-white/55">
            Supabase live · masked by default · reveal is audited
          </p>
        </SheetHeader>

        {q.isLoading && !detail ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : q.error ? (
          <div className="p-5 text-[12px] text-red-300">Failed to load: {(q.error as Error).message}</div>
        ) : !detail ? null : (
          <div className="space-y-4 p-5">
            {/* Identity */}
            <Section title="Identity" icon={<Shield className="h-3.5 w-3.5" />}>
              <KV label="Session">
                <code className="text-[11px] text-white/80">{detail.journey.session_id ?? "—"}</code>
              </KV>
              <KV label="PostHog distinct">
                <code className="text-[11px] text-white/80">{detail.journey.posthog_distinct_id ?? "—"}</code>
              </KV>
              <KV label="Linked member">
                {detail.member ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Badge className="bg-orange-500/20 text-orange-100 hover:bg-orange-500/30">Member</Badge>
                    <span className="text-white/90">{detail.member.display_name ?? detail.member.email}</span>
                  </span>
                ) : <span className="text-white/50">Anonymous</span>}
              </KV>
            </Section>

            {/* IP */}
            <Section title="IP address" icon={<Shield className="h-3.5 w-3.5" />}>
              <KV label="Masked IP">
                <code className="text-[12px] text-white">{latestObs?.masked_ip ?? "—"}</code>
              </KV>
              <KV label="IP hash">
                <code className="truncate text-[10.5px] text-white/60">{latestObs?.ip_hash ?? "—"}</code>
              </KV>
              <div className="pt-1">
                {revealed ? (
                  <div className="rounded-[10px] border border-amber-500/40 bg-amber-500/10 p-2.5">
                    <div className="flex items-center gap-2 text-[11px] text-amber-100">
                      <AlertTriangle className="h-3.5 w-3.5" /> Raw IP revealed & audited
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="rounded bg-black/40 px-2 py-1 font-mono text-[13px] text-white">{revealed.ip}</code>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(revealed.ip)}
                        className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-1 text-[10px] text-white/50">Audit ID: <code>{revealed.audit_id}</code></div>
                  </div>
                ) : !revealOpen ? (
                  <Button
                    size="sm" variant="outline"
                    disabled={!latestObs}
                    onClick={() => setRevealOpen(true)}
                    className="gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                  >
                    <Eye className="h-3.5 w-3.5" /> Reveal full IP
                  </Button>
                ) : (
                  <div className="space-y-2 rounded-[10px] border border-reps-border bg-white/[0.03] p-3">
                    <div className="text-[11px] font-medium text-white/80">Reason for reveal (required, audited)</div>
                    <Textarea
                      value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. abuse investigation ticket #1234"
                      rows={3} className="text-[12px]"
                    />
                    {revealError ? <div className="text-[11px] text-red-300">{revealError}</div> : null}
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={doReveal} disabled={revealing || reason.trim().length < 8}
                        className="bg-amber-500 text-black hover:bg-amber-400">
                        {revealing ? "Revealing…" : "Confirm reveal"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setRevealOpen(false); setReason(""); setRevealError(null); }}>
                        <EyeOff className="mr-1 h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Location */}
            <Section title="Location" icon={<MapPin className="h-3.5 w-3.5" />}>
              <KV label="City / Region / Country">
                <span className="text-white/90">
                  {[latestObs?.city, latestObs?.region, latestObs?.country_code].filter(Boolean).join(", ") || "—"}
                </span>
              </KV>
              <KV label="Coordinates">
                <span className="text-white/80">
                  {latestObs?.latitude != null && latestObs?.longitude != null
                    ? `${latestObs.latitude.toFixed(3)}, ${latestObs.longitude.toFixed(3)}` : "—"}
                </span>
              </KV>
              <KV label="Timezone">{latestObs?.timezone ?? "—"}</KV>
              <KV label="ASN / Org">{[latestObs?.asn, latestObs?.org].filter(Boolean).join(" · ") || "—"}</KV>
              <KV label="Source / Confidence">
                <span className="text-white/70">
                  {latestObs?.location_source ?? "—"}
                  {latestObs?.location_confidence != null ? ` · ${latestObs.location_confidence}` : ""}
                </span>
              </KV>
            </Section>

            {/* Device */}
            <Section title="Device" icon={<Monitor className="h-3.5 w-3.5" />}>
              <KV label="User agent">
                <code className="break-all text-[10.5px] text-white/70">{latestObs?.user_agent ?? "—"}</code>
              </KV>
            </Section>

            {/* Journey */}
            <Section title="Journey" icon={<RouteIcon className="h-3.5 w-3.5" />}>
              <KV label="Entry path"><code className="text-[11px] text-white/85">{detail.journey.entry_path ?? "—"}</code></KV>
              <KV label="Latest path"><code className="text-[11px] text-white/85">{detail.journey.latest_path ?? "—"}</code></KV>
              <KV label="Latest event"><code className="text-[11px] text-white/85">{detail.journey.latest_event ?? "—"}</code></KV>
              <KV label="Pages / Events">
                <span className="text-white/85 tabular-nums">
                  {detail.journey.page_count ?? 0} / {detail.journey.event_count ?? 0}
                </span>
              </KV>
              {Array.isArray(detail.journey.path_history) && detail.journey.path_history.length > 0 ? (
                <div className="pt-1">
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-white/45">Full path history</div>
                  <ol className="max-h-56 space-y-1 overflow-y-auto rounded-[8px] border border-reps-border/60 bg-black/20 p-2">
                    {(detail.journey.path_history as Array<{ path?: string; at?: string; event?: string }>).map((h, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 text-[10.5px]">
                        <code className="truncate text-white/80">{h.path ?? "—"}</code>
                        <span className="shrink-0 text-white/40">{h.at ? new Date(h.at).toLocaleTimeString() : ""}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </Section>

            {/* Conversions */}
            {detail.conversions.length > 0 ? (
              <Section title="Conversions" icon={<Shield className="h-3.5 w-3.5 text-emerald-300" />}>
                <ul className="space-y-1">
                  {(detail.conversions as Array<{ id: string; event_kind: string; path?: string | null; occurred_at: string }>).map((c) => (
                    <li key={c.id} className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1.5">
                        <Badge className="bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30">{c.event_kind}</Badge>
                        <code className="text-white/70">{c.path ?? ""}</code>
                      </span>
                      <span className="text-white/40">{fmt(c.occurred_at)}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {/* Timing */}
            <Section title="Timing" icon={<Clock className="h-3.5 w-3.5" />}>
              <KV label="First seen">{fmt(detail.journey.first_seen_at)}</KV>
              <KV label="Last seen">{fmt(detail.journey.last_seen_at)}</KV>
              <KV label="Session duration">{duration(detail.journey.first_seen_at, detail.journey.last_seen_at)}</KV>
            </Section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[12px] border border-reps-border bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/55">
        {icon} {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[11.5px]">
      <span className="shrink-0 text-white/50">{label}</span>
      <span className="min-w-0 text-right">{children}</span>
    </div>
  );
}
