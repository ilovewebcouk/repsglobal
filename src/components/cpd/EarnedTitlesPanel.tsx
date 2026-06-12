import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PPanel } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { myUnlockedTitles, setPrimaryTitle } from "@/lib/cpd/titles.functions";
import { TITLES } from "@/lib/cpd/titles-catalog";

function tierStyle(tier: 1 | 2 | 3): { label: string; cls: string } {
  if (tier === 1) return { label: "Registered", cls: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300" };
  if (tier === 2) return { label: "Advanced", cls: "border-reps-orange-border bg-reps-orange-soft text-reps-orange" };
  return { label: "Practitioner", cls: "border-reps-border bg-reps-panel-soft text-white/70" };
}

export function EarnedTitlesPanel() {
  const qc = useQueryClient();
  const fetchTitles = useServerFn(myUnlockedTitles);
  const setPrimary = useServerFn(setPrimaryTitle);
  const [picking, setPicking] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-unlocked-titles"],
    queryFn: () => fetchTitles(),
  });

  const change = useMutation({
    mutationFn: (slug: string) => setPrimary({ data: { title_slug: slug } }),
    onSuccess: () => {
      toast.success("Primary title updated.");
      setPicking(false);
      void qc.invalidateQueries({ queryKey: ["my-unlocked-titles"] });
      void qc.invalidateQueries({ queryKey: ["dashboard-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const unlocked = data?.unlocked ?? [];
  const locked = data?.locked ?? [];
  const primarySlug = data?.primary_title_slug ?? unlocked.find((t) => t.is_primary)?.title_slug ?? null;
  const primary = unlocked.find((t) => t.title_slug === primarySlug) ?? unlocked[0] ?? null;
  const otherEarned = unlocked.filter((t) => t.title_slug !== primary?.title_slug);

  return (
    <PPanel>
      <div className="flex items-start justify-between gap-3 border-b border-reps-border px-5 py-4">
        <div>
          <h3 className="text-[14px] font-semibold text-white">Titles unlocked</h3>
          <p className="mt-0.5 text-[12px] text-white/55">
            On REPs, your professional title is earned from your qualifications — never self-claimed.
          </p>
        </div>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex h-7 items-center gap-1 rounded-full border border-reps-border bg-reps-panel-soft px-2.5 text-[11px] font-semibold text-white/65">
                <ShieldCheck className="h-3 w-3" /> How it works
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-[12px] leading-relaxed">
              When you upload a qualification, REPs checks it against the awarding body and (where regulated) the public register, then unlocks the titles you've earned. Sensitive titles (Registered Nutritionist, ASCC, Registered Dietitian) require an extra register check.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="h-20 animate-pulse rounded-[12px] bg-reps-panel-soft" />
        ) : unlocked.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-reps-border bg-reps-panel-soft p-5 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-reps-orange" />
            <div className="mt-2 text-[13px] font-semibold text-white">No titles yet</div>
            <p className="mx-auto mt-1 max-w-md text-[12px] text-white/55">
              Upload your highest qualification to unlock your first professional title.
              You'll see the titles you've earned light up here.
            </p>
          </div>
        ) : (
          <>
            {/* Primary title card */}
            {primary ? (
              <div className="flex flex-wrap items-start gap-3 rounded-[12px] border border-emerald-400/25 bg-emerald-500/8 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-500/15 text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-white">{primary.label}</span>
                    <span className={`inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-semibold ${tierStyle(primary.tier).cls}`}>
                      {tierStyle(primary.tier).label}
                    </span>
                    <Badge variant="outline" className="border-reps-orange-border bg-reps-orange-soft text-reps-orange">
                      Primary title
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-white/65">
                    {TITLES.find((t) => t.slug === primary.title_slug)?.description}
                  </p>
                </div>
                {unlocked.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[12px] text-white/70 hover:text-white"
                    onClick={() => setPicking((p) => !p)}
                  >
                    {picking ? "Cancel" : "Change"}
                  </Button>
                ) : null}
              </div>
            ) : null}

            {/* Picker */}
            {picking && unlocked.length > 1 ? (
              <div className="mt-3 rounded-[12px] border border-reps-border bg-reps-panel-soft p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/55">
                  Choose your headline title
                </div>
                <div className="flex flex-col gap-1.5">
                  {unlocked.map((t) => (
                    <button
                      key={t.title_slug}
                      type="button"
                      disabled={change.isPending}
                      onClick={() => change.mutate(t.title_slug)}
                      className={
                        "flex items-center justify-between rounded-[10px] border px-3 py-2 text-left text-[13px] transition-colors " +
                        (t.title_slug === primary?.title_slug
                          ? "border-reps-orange-border bg-reps-orange-soft text-white"
                          : "border-reps-border bg-reps-ink text-white/80 hover:text-white")
                      }
                    >
                      <span className="flex items-center gap-2">
                        {t.title_slug === primary?.title_slug ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-reps-orange" />
                        ) : (
                          <span className="h-3.5 w-3.5 rounded-full border border-reps-border" />
                        )}
                        {t.label}
                      </span>
                      <span className={`inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-semibold ${tierStyle(t.tier).cls}`}>
                        {tierStyle(t.tier).label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Other earned titles */}
            {otherEarned.length > 0 ? (
              <div className="mt-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                  Also qualified
                </div>
                <div className="flex flex-wrap gap-2">
                  {otherEarned.map((t) => (
                    <span
                      key={t.title_slug}
                      className="inline-flex h-7 items-center gap-1.5 rounded-full border border-reps-border bg-reps-panel-soft px-2.5 text-[11.5px] font-medium text-white/75"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Locked roadmap */}
            {locked.length > 0 ? (
              <div className="mt-5 border-t border-reps-border pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                    Locked — what these need
                  </div>
                  <span className="text-[11px] text-white/35">{locked.length} more available</span>
                </div>
                <ul className="grid grid-cols-1 gap-1.5">
                  {locked.map((t) => (
                    <li
                      key={t.title_slug}
                      className="flex items-start gap-3 rounded-[10px] border border-reps-border bg-reps-ink px-3 py-2"
                    >
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12.5px] font-semibold text-white/85">{t.label}</span>
                          <span className={`inline-flex h-4.5 items-center rounded-full border px-2 text-[10px] font-semibold ${tierStyle(t.tier).cls}`}>
                            {tierStyle(t.tier).label}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-white/55">{t.earnedBy}</div>
                      </div>
                      <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-white/30" />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </PPanel>
  );
}
