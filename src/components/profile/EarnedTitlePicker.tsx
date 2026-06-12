import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { myUnlockedTitles, setPrimaryTitle } from "@/lib/cpd/titles.functions";

/**
 * Profile editor "Profession" control.
 *
 * Replaces the legacy free-pick <Select>. Profession on REPs is earned
 * from approved qualifications — pros can only choose from titles they've
 * unlocked. Locked titles are shown as ghosted options to make the
 * upgrade path obvious.
 */
export function EarnedTitlePicker() {
  const qc = useQueryClient();
  const fetchTitles = useServerFn(myUnlockedTitles);
  const setPrimary = useServerFn(setPrimaryTitle);

  const { data, isLoading } = useQuery({
    queryKey: ["my-unlocked-titles"],
    queryFn: () => fetchTitles(),
  });

  const change = useMutation({
    mutationFn: (slug: string) => setPrimary({ data: { title_slug: slug } }),
    onSuccess: () => {
      toast.success("Primary title updated.");
      void qc.invalidateQueries({ queryKey: ["my-unlocked-titles"] });
      void qc.invalidateQueries({ queryKey: ["dashboard-profile"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) {
    return <div className="h-10 animate-pulse rounded-[12px] bg-reps-panel-soft" />;
  }

  const unlocked = data?.unlocked ?? [];
  const locked = data?.locked ?? [];
  const primarySlug =
    data?.primary_title_slug ?? unlocked.find((t) => t.is_primary)?.title_slug ?? null;

  if (unlocked.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-reps-border bg-reps-panel-soft p-3 text-[12px] text-white/70">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-3.5 w-3.5 text-reps-orange" />
          <span className="font-semibold">No title yet</span>
        </div>
        <p className="mt-1 text-white/55">
          Your professional title is earned from an approved qualification.
        </p>
        <Link
          to="/dashboard/cpd"
          className="mt-2 inline-flex h-8 items-center rounded-[10px] bg-reps-orange px-3 text-[12px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
        >
          Upload a qualification
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        {unlocked.map((t) => {
          const isActive = primarySlug === t.title_slug;
          return (
            <button
              key={t.title_slug}
              type="button"
              disabled={change.isPending || isActive}
              onClick={() => change.mutate(t.title_slug)}
              className={
                "flex items-center justify-between rounded-[10px] border px-3 py-2 text-left text-[13px] transition-colors " +
                (isActive
                  ? "border-reps-orange-border bg-reps-orange-soft text-white"
                  : "border-reps-border bg-reps-ink text-white/80 hover:text-white")
              }
            >
              <span className="flex items-center gap-2">
                {isActive ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-reps-orange" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-reps-border" />
                )}
                {t.label}
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            </button>
          );
        })}
      </div>

      {locked.length > 0 ? (
        <details className="rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[12px]">
          <summary className="flex cursor-pointer items-center justify-between text-white/70 marker:hidden">
            <span className="flex items-center gap-2">
              <Lock className="h-3 w-3" />
              Want a different title?
            </span>
            <span className="text-white/40">{locked.length} more available</span>
          </summary>
          <ul className="mt-2 space-y-1.5">
            {locked.map((t) => (
              <li key={t.title_slug} className="flex items-start gap-2 text-white/65">
                <Lock className="mt-0.5 h-3 w-3 shrink-0 text-white/35" />
                <span>
                  <span className="font-semibold text-white/85">{t.label}</span>
                  <span className="text-white/50"> — {t.earnedBy}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link
            to="/dashboard/cpd"
            className="mt-3 inline-flex h-7 items-center rounded-[8px] border border-reps-border bg-reps-ink px-2.5 text-[11.5px] font-semibold text-white/80 hover:text-white"
          >
            Open Education & CPD →
          </Link>
        </details>
      ) : null}
    </div>
  );
}
