import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, EyeOff, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { myUnlockedTitles, setDisplayTitles } from "@/lib/cpd/titles.functions";

/**
 * Profile editor "Profession" control.
 *
 * Pros pick up to TWO titles to show on their profile: a Primary and an
 * optional Secondary. Titles are earned from approved qualifications.
 *
 * Supersession: when a pro holds a higher-tier title that covers a lower one
 * (e.g. Personal Trainer covers Fitness Instructor), the covered title is
 * still kept in their grants but is hidden from the selectable list. We show
 * the hidden titles in a small "Covered by your higher qualification" note so
 * the pro knows nothing was lost.
 */
export function EarnedTitlePicker() {
  const qc = useQueryClient();
  const fetchTitles = useServerFn(myUnlockedTitles);
  const setDisplay = useServerFn(setDisplayTitles);

  const { data, isLoading } = useQuery({
    queryKey: ["my-unlocked-titles"],
    queryFn: () => fetchTitles(),
  });

  const update = useMutation({
    mutationFn: (vars: { primary: string; secondary: string | null }) =>
      setDisplay({
        data: { primary_title_slug: vars.primary, secondary_title_slug: vars.secondary },
      }),
    onSuccess: () => {
      toast.success("Display titles updated.");
      void qc.invalidateQueries({ queryKey: ["my-unlocked-titles"] });
      void qc.invalidateQueries({ queryKey: ["dashboard-profile"] });
      void qc.invalidateQueries({ queryKey: ["trust-state"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) {
    return <div className="h-10 animate-pulse rounded-[12px] bg-reps-panel-soft" />;
  }

  const unlocked = data?.unlocked ?? [];
  const locked = data?.locked ?? [];
  const visibleSlugs = data?.visible_title_slugs ?? [];
  const hidden = data?.hidden_by_supersession ?? [];

  // Selectable = unlocked AND visible (not superseded by another grant).
  const selectable = unlocked.filter((t) => visibleSlugs.includes(t.title_slug));

  const primarySlug =
    data?.primary_title_slug && selectable.some((t) => t.title_slug === data.primary_title_slug)
      ? data.primary_title_slug
      : selectable[0]?.title_slug ?? null;
  const secondarySlug =
    data?.secondary_title_slug &&
    selectable.some((t) => t.title_slug === data.secondary_title_slug) &&
    data.secondary_title_slug !== primarySlug
      ? data.secondary_title_slug
      : null;

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

  function pickPrimary(slug: string) {
    if (slug === primarySlug) return;
    const nextSecondary = secondarySlug === slug ? null : secondarySlug;
    update.mutate({ primary: slug, secondary: nextSecondary });
  }

  function toggleSecondary(slug: string) {
    if (!primarySlug) return;
    if (slug === primarySlug) return;
    const next = secondarySlug === slug ? null : slug;
    update.mutate({ primary: primarySlug, secondary: next });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* PRIMARY ---------------------------------------------------------- */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/45">
          <span>Primary title</span>
          <span className="text-white/35">Headline of your profile</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {selectable.map((t) => {
            const isActive = primarySlug === t.title_slug;
            return (
              <button
                key={`p-${t.title_slug}`}
                type="button"
                disabled={update.isPending || isActive}
                onClick={() => pickPrimary(t.title_slug)}
                className={
                  "flex items-center justify-between rounded-[10px] border px-3 py-2 text-left text-[13px] transition-colors " +
                  (isActive
                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                    : "border-reps-border bg-reps-ink text-white/80 hover:text-white")
                }
              >
                <span className="flex items-center gap-2">
                  {isActive ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
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
      </div>

      {/* SECONDARY -------------------------------------------------------- */}
      {selectable.length > 1 ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-wide text-white/45">
            <span>Secondary title (optional)</span>
            <span className="text-white/35">Shown alongside your primary</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {selectable
              .filter((t) => t.title_slug !== primarySlug)
              .map((t) => {
                const isActive = secondarySlug === t.title_slug;
                return (
                  <button
                    key={`s-${t.title_slug}`}
                    type="button"
                    disabled={update.isPending}
                    onClick={() => toggleSecondary(t.title_slug)}
                    className={
                      "flex items-center justify-between rounded-[10px] border px-3 py-2 text-left text-[13px] transition-colors " +
                      (isActive
                        ? "border-reps-orange-border bg-reps-orange-soft text-white"
                        : "border-reps-border bg-reps-ink text-white/70 hover:text-white")
                    }
                  >
                    <span className="flex items-center gap-2">
                      {isActive ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-reps-orange" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-[4px] border border-reps-border" />
                      )}
                      {t.label}
                    </span>
                    <span className="text-[11px] text-white/45">
                      {isActive ? "Selected — click to remove" : "Click to add"}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      ) : null}

      {/* HIDDEN BY SUPERSESSION ------------------------------------------- */}
      {hidden.length > 0 ? (
        <div className="rounded-[10px] border border-reps-border bg-reps-panel-soft p-2.5 text-[12px] text-white/65">
          <div className="flex items-center gap-2 text-white/85">
            <EyeOff className="h-3.5 w-3.5 text-white/55" />
            <span className="font-semibold">Covered by a higher qualification</span>
          </div>
          <ul className="mt-1.5 space-y-1">
            {hidden.map((h) => (
              <li key={h.slug} className="text-white/60">
                <span className="font-medium text-white/80">{h.label}</span>{" "}
                <span className="text-white/45">— included within {h.coveredByLabel}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11.5px] text-white/45">
            These remain on file but aren&apos;t shown separately, since your higher title already covers them.
          </p>
        </div>
      ) : null}

      {/* LOCKED ROADMAP -------------------------------------------------- */}
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
