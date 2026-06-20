import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { draftReviewRemovalReason } from "@/lib/reviews/reviews.functions";

export type RemovalCategory =
  | "off_topic"
  | "abusive"
  | "fake"
  | "pii"
  | "defamatory"
  | "spam"
  | "other";

const CATEGORIES: Array<{ value: RemovalCategory; label: string; hint: string }> = [
  { value: "off_topic", label: "Off-topic", hint: "Not about the trainer's service." },
  { value: "abusive", label: "Abusive / hateful", hint: "Personal attacks, slurs, harassment." },
  { value: "fake", label: "Fake or incentivised", hint: "Looks fake, bought, or coerced." },
  { value: "pii", label: "Personal data / privacy", hint: "Email, phone, address, etc." },
  { value: "defamatory", label: "Defamatory", hint: "Unverifiable serious claims." },
  { value: "spam", label: "Spam / promotion", hint: "Promotes another business or link." },
  { value: "other", label: "Other", hint: "Anything else against guidelines." },
];

export type RemoveSubmit = {
  category: RemovalCategory;
  note: string;
  internalNote?: string;
  notify: boolean;
};

export function RemoveReviewDialog({
  reviewId,
  trigger,
  onConfirm,
  isPending,
}: {
  reviewId: string;
  trigger: React.ReactNode;
  onConfirm: (vars: RemoveSubmit) => void;
  isPending?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<RemovalCategory>("off_topic");
  const [note, setNote] = React.useState("");
  const [internalNote, setInternalNote] = React.useState("");
  const [notify, setNotify] = React.useState(true);

  const draft = useMutation({
    mutationFn: () =>
      draftReviewRemovalReason({ data: { reviewId, category } }),
    onSuccess: (res) => {
      setNote(res.draft);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Couldn't draft a reason"),
  });

  React.useEffect(() => {
    if (!open) {
      // Reset on close.
      setCategory("off_topic");
      setNote("");
      setInternalNote("");
      setNotify(true);
    }
  }, [open]);

  const noteLen = note.trim().length;
  const noteValid = noteLen >= 20 && noteLen <= 600;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Remove this review</DialogTitle>
          <DialogDescription>
            The trainer will be notified by email and in their dashboard with the
            reason you set below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-[12px] font-semibold text-white/80">
              Category
            </Label>
            <RadioGroup
              value={category}
              onValueChange={(v) => setCategory(v as RemovalCategory)}
              className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
            >
              {CATEGORIES.map((c) => (
                <label
                  key={c.value}
                  htmlFor={`cat-${c.value}`}
                  className={`flex cursor-pointer items-start gap-2 rounded-[10px] border px-3 py-2 transition ${
                    category === c.value
                      ? "border-reps-orange-border bg-reps-orange-soft/40"
                      : "border-reps-border bg-reps-panel-soft hover:border-white/20"
                  }`}
                >
                  <RadioGroupItem id={`cat-${c.value}`} value={c.value} className="mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-white">{c.label}</p>
                    <p className="text-[11px] leading-snug text-white/55">{c.hint}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="removal-note"
                className="text-[12px] font-semibold text-white/80"
              >
                Reason shown to trainer
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => draft.mutate()}
                disabled={draft.isPending}
                className="h-7 gap-1.5 rounded-[10px] border-reps-orange-border bg-reps-orange-soft px-2.5 text-[11px] font-semibold text-reps-orange hover:bg-reps-orange-soft/70"
              >
                {draft.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Draft with AI
              </Button>
            </div>
            <Textarea
              id="removal-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A short, professional note. Trainer will see this verbatim."
              rows={5}
              maxLength={600}
              className="resize-none"
            />
            <p className="flex items-center justify-between text-[10.5px] text-white/45">
              <span>{noteValid ? "Looks good." : "20–600 characters."}</span>
              <span>{noteLen}/600</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="internal-note"
              className="text-[12px] font-semibold text-white/80"
            >
              Internal note <span className="text-white/45">(admin-only, optional)</span>
            </Label>
            <Textarea
              id="internal-note"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Anything you want other admins to know. Never shown to the trainer."
              rows={2}
              maxLength={1000}
              className="resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-[12px] text-white/70">
            <Checkbox
              checked={notify}
              onCheckedChange={(v) => setNotify(v === true)}
            />
            Email the trainer with the reason
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!noteValid || isPending}
            onClick={() => {
              onConfirm({
                category,
                note: note.trim(),
                internalNote: internalNote.trim() || undefined,
                notify,
              });
              setOpen(false);
            }}
            className="bg-reps-orange text-white hover:bg-reps-orange-hover"
          >
            Remove review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
