import * as React from "react";
import { Sparkles, Loader2, RefreshCw, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { draftCopy, rewriteCopy } from "@/lib/profile/bio-ai.functions";

/* -------------------------------------------------------------------------- */
/* AiCopyAssist                                                                */
/*                                                                            */
/* Inline AI helper used on the dashboard profile editor for two fields:      */
/*   - field="tagline"  (160 chars, single line)                              */
/*   - field="bio"      (1200 chars, multi-paragraph)                         */
/*                                                                            */
/* Behaviour:                                                                 */
/*   - When `value` is empty → "Draft with AI" mode (3 variants from facts)   */
/*   - When `value` has content → "Improve" mode (tone rewrite)               */
/*                                                                            */
/* The component never writes to the DB. It calls `onApply(newText)` and the  */
/* parent owns the form state.                                                */
/* -------------------------------------------------------------------------- */

export type AiCopyFacts = {
  full_name?: string;
  primary_profession?: string;
  specialisms?: string[];
  city?: string;
  in_person_available?: boolean;
  online_available?: boolean;
  years_experience?: number;
  qualifications?: string[];
  service_titles?: string[];
};

type Tone = "tighten" | "confident" | "warmer" | "specific";

const TONE_OPTIONS: Array<{ id: Tone; label: string; hint: string }> = [
  { id: "tighten", label: "Tighten", hint: "Same meaning, fewer words" },
  { id: "confident", label: "More confident", hint: "Direct, no hedging" },
  { id: "warmer", label: "Warmer", hint: "Friendlier, more human" },
  { id: "specific", label: "More specific", hint: "Cut the vague phrasing" },
];

type Props = {
  field: "tagline" | "bio";
  value: string;
  facts: AiCopyFacts;
  onApply: (next: string) => void;
  className?: string;
};

export function AiCopyAssist({ field, value, facts, onApply, className }: Props) {
  const [open, setOpen] = React.useState(false);
  const hasContent = value.trim().length >= 20;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[8px] border border-reps-orange/40 bg-reps-orange/10 px-2.5 py-1 text-[11.5px] font-medium text-reps-orange transition-colors hover:bg-reps-orange/15 hover:text-orange-200",
          className,
        )}
      >
        <Sparkles className="h-3 w-3" data-icon />
        {hasContent ? "Improve with AI" : "Draft with AI"}
      </button>

      <AiCopyDialog
        open={open}
        onOpenChange={setOpen}
        field={field}
        currentValue={value}
        hasContent={hasContent}
        facts={facts}
        onApply={(text) => {
          onApply(text);
          setOpen(false);
          toast.success(
            field === "tagline" ? "Tagline updated — save to publish." : "Bio updated — save to publish.",
          );
        }}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog                                                                      */
/* -------------------------------------------------------------------------- */

type DialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  field: "tagline" | "bio";
  currentValue: string;
  hasContent: boolean;
  facts: AiCopyFacts;
  onApply: (text: string) => void;
};

function AiCopyDialog({
  open,
  onOpenChange,
  field,
  currentValue,
  hasContent,
  facts,
  onApply,
}: DialogProps) {
  const [mode, setMode] = React.useState<"draft" | "improve">(
    hasContent ? "improve" : "draft",
  );

  // Reset mode whenever the dialog re-opens
  React.useEffect(() => {
    if (open) setMode(hasContent ? "improve" : "draft");
  }, [open, hasContent]);

  const fieldLabel = field === "tagline" ? "tagline" : "public bio";
  const factsReady =
    !!facts.primary_profession ||
    (facts.specialisms?.length ?? 0) > 0 ||
    !!facts.city;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 border-reps-border bg-reps-panel p-0 text-white sm:max-w-[640px]">
        <DialogHeader className="shrink-0 border-b border-reps-border/60 px-6 pt-6 pb-4">
          <DialogTitle className="font-display text-[18px] text-white">
            {mode === "draft" ? `Draft your ${fieldLabel}` : `Improve your ${fieldLabel}`}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-white/60">
            {mode === "draft"
              ? "We'll use what you've already added to your profile. AI suggests — you decide. Edit anything before saving."
              : "Pick a tone. We'll keep every fact you wrote and rewrite the rest."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {hasContent ? (
            <div className="flex gap-1 rounded-[10px] bg-reps-ink p-1 text-[12.5px]">
              <ModeTab active={mode === "improve"} onClick={() => setMode("improve")}>
                Improve
              </ModeTab>
              <ModeTab active={mode === "draft"} onClick={() => setMode("draft")}>
                Start over
              </ModeTab>
            </div>
          ) : null}

          {mode === "draft" ? (
            <DraftPane
              field={field}
              facts={facts}
              factsReady={factsReady}
              onApply={onApply}
            />
          ) : (
            <ImprovePane
              field={field}
              facts={facts}
              currentValue={currentValue}
              onApply={onApply}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-[8px] px-3 py-1.5 font-medium transition-colors",
        active
          ? "bg-reps-panel-soft text-white"
          : "text-white/55 hover:text-white/80",
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Draft pane                                                                  */
/* -------------------------------------------------------------------------- */

function DraftPane({
  field,
  facts,
  factsReady,
  onApply,
}: {
  field: "tagline" | "bio";
  facts: AiCopyFacts;
  factsReady: boolean;
  onApply: (text: string) => void;
}) {
  const draftFn = useServerFn(draftCopy);
  const [variants, setVariants] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [extra, setExtra] = React.useState("");

  const run = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await draftFn({
        data: {
          field,
          facts: {
            full_name: facts.full_name,
            primary_profession: facts.primary_profession,
            specialisms: facts.specialisms ?? [],
            city: facts.city,
            in_person_available: facts.in_person_available ?? false,
            online_available: facts.online_available ?? false,
            years_experience: facts.years_experience,
            qualifications: facts.qualifications ?? [],
            service_titles: facts.service_titles ?? [],
            extra: extra.trim(),
          },
        },
      });
      setVariants(res.variants);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [draftFn, field, facts, extra]);

  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border border-reps-border bg-reps-ink/60 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
          Facts we'll use
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {facts.primary_profession ? <Chip>{facts.primary_profession}</Chip> : null}
          {(facts.specialisms ?? []).map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
          {facts.city ? <Chip>{facts.city}</Chip> : null}
          {facts.in_person_available ? <Chip>in-person</Chip> : null}
          {facts.online_available ? <Chip>online</Chip> : null}
          {!factsReady ? (
            <span className="text-[12px] text-white/55">
              Add your profession, city or specialisms above first for sharper drafts.
            </span>
          ) : null}
        </div>
        <label className="mt-3 block">
          <span className="text-[11.5px] text-white/60">
            Anything else worth mentioning? (optional)
          </span>
          <input
            type="text"
            value={extra}
            onChange={(e) => setExtra(e.target.value.slice(0, 200))}
            placeholder="e.g. ex-rugby player, Hyrox-focused, 8 years coaching"
            className="mt-1 w-full rounded-[10px] border border-reps-border bg-reps-panel px-3 py-2 text-[13px] text-white placeholder:text-white/35 focus:border-white/25 focus:outline-none"
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-200">
          {error}
        </p>
      ) : null}

      {variants.length === 0 ? (
        <Button
          type="button"
          onClick={run}
          disabled={loading}
          className="w-full bg-reps-orange text-black hover:bg-reps-orange/90"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" data-icon />
              Drafting…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" data-icon />
              Draft 3 options
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-2">
          {variants.map((v, i) => (
            <VariantCard
              key={i}
              index={i}
              text={v}
              onApply={() => onApply(v)}
              field={field}
            />
          ))}
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-white/60 hover:text-white/85"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" data-icon />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" data-icon />
            )}
            {loading ? "Drafting…" : "Try 3 more"}
          </button>
        </div>
      )}
    </div>
  );
}

function VariantCard({
  index,
  text,
  onApply,
  field,
}: {
  index: number;
  text: string;
  onApply: () => void;
  field: "tagline" | "bio";
}) {
  const labels = ["Outcome-led", "Credentials-led", "Personality-led"];
  return (
    <div className="rounded-[14px] border border-reps-border bg-reps-ink/40 p-3 transition-colors hover:border-white/20">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-reps-orange">
          {labels[index] ?? `Option ${index + 1}`}
        </span>
        <span className="text-[10.5px] tabular-nums text-white/40">
          {text.length} / {field === "tagline" ? 160 : 1200}
        </span>
      </div>
      <p
        className={cn(
          "mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-white/90",
          field === "tagline" && "text-[14.5px]",
        )}
      >
        {text}
      </p>
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          size="sm"
          onClick={onApply}
          className="bg-white text-black hover:bg-white/90"
        >
          <Check className="h-3.5 w-3.5" data-icon />
          Use this
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Improve pane                                                                */
/* -------------------------------------------------------------------------- */

function ImprovePane({
  field,
  facts,
  currentValue,
  onApply,
}: {
  field: "tagline" | "bio";
  facts: AiCopyFacts;
  currentValue: string;
  onApply: (text: string) => void;
}) {
  const rewriteFn = useServerFn(rewriteCopy);
  const [tone, setTone] = React.useState<Tone | null>(null);
  const [rewrite, setRewrite] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(
    async (t: Tone) => {
      setTone(t);
      setLoading(true);
      setError(null);
      setRewrite(null);
      try {
        const res = await rewriteFn({
          data: {
            field,
            tone: t,
            current: currentValue,
            facts: {
              full_name: facts.full_name,
              primary_profession: facts.primary_profession,
              specialisms: facts.specialisms ?? [],
              city: facts.city,
              in_person_available: facts.in_person_available ?? false,
              online_available: facts.online_available ?? false,
              years_experience: facts.years_experience,
              qualifications: facts.qualifications ?? [],
              service_titles: facts.service_titles ?? [],
            },
          },
        });
        setRewrite(res.rewrite);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [rewriteFn, field, currentValue, facts],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TONE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => run(opt.id)}
            disabled={loading}
            className={cn(
              "rounded-[10px] border px-3 py-2 text-left text-[12.5px] transition-colors",
              tone === opt.id
                ? "border-reps-orange/60 bg-reps-orange/10 text-white"
                : "border-reps-border bg-reps-ink/40 text-white/85 hover:border-white/25 hover:text-white",
              loading && "cursor-wait opacity-70",
            )}
          >
            <div className="font-medium">{opt.label}</div>
            <div className="mt-0.5 text-[11px] text-white/55">{opt.hint}</div>
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 rounded-[12px] border border-reps-border bg-reps-ink/40 px-3 py-4 text-[13px] text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" data-icon />
          Rewriting…
        </div>
      ) : rewrite ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <CompareCard label="Current" text={currentValue} muted />
          <CompareCard label="Rewrite" text={rewrite} />
        </div>
      ) : (
        <p className="rounded-[12px] border border-dashed border-reps-border bg-reps-ink/30 px-3 py-4 text-[12.5px] text-white/55">
          Pick a tone above to see a rewrite. We'll show your current copy and the rewrite side-by-side before anything changes.
        </p>
      )}

      {rewrite ? (
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRewrite(null);
              setTone(null);
            }}
            className="border-reps-border bg-transparent text-white/80 hover:bg-white/5"
          >
            Discard
          </Button>
          <Button
            type="button"
            onClick={() => rewrite && onApply(rewrite)}
            className="bg-white text-black hover:bg-white/90"
          >
            <Check className="h-3.5 w-3.5" data-icon />
            Use rewrite
          </Button>
        </DialogFooter>
      ) : null}
    </div>
  );
}

function CompareCard({
  label,
  text,
  muted,
}: {
  label: string;
  text: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border bg-reps-ink/40 p-3",
        muted ? "border-reps-border" : "border-reps-orange/40",
      )}
    >
      <span
        className={cn(
          "text-[11px] font-semibold uppercase tracking-wide",
          muted ? "text-white/45" : "text-reps-orange",
        )}
      >
        {label}
      </span>
      <p
        className={cn(
          "mt-2 max-h-[260px] overflow-auto whitespace-pre-line text-[13px] leading-relaxed",
          muted ? "text-white/65" : "text-white/95",
        )}
      >
        {text}
      </p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
      {children}
    </span>
  );
}
