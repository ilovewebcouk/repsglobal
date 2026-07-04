import * as React from "react";
import { Save, Trash2, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldCounter } from "@/components/dashboard/website/FieldCounter";
import type { FaqDTO } from "@/lib/website/website-content.functions";

const QUESTION_MAX = 200;
const ANSWER_MAX = 1200;

export type FaqDraft = {
  id?: string;
  question: string;
  answer: string;
  sort_order: number;
  source: "manual" | "ai";
};

export function draftFromFaq(f: FaqDTO | null, fallbackOrder = 0): FaqDraft {
  return {
    id: f?.id,
    question: f?.question ?? "",
    answer: f?.answer ?? "",
    sort_order: f?.sort_order ?? fallbackOrder,
    source: (f?.source as "manual" | "ai") ?? "manual",
  };
}

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: boolean;
  initial: FaqDraft;
  onSave: (draft: FaqDraft) => void;
  onDelete?: () => void;
};

export function FaqEditDialog({
  open,
  onOpenChange,
  editing,
  initial,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = React.useState<FaqDraft>(initial);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const originalRef = React.useRef<string>("");

  React.useEffect(() => {
    if (open) {
      setDraft(initial);
      originalRef.current = JSON.stringify(initial);
      setConfirmDiscard(false);
      setConfirmDelete(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = JSON.stringify(draft) !== originalRef.current;
  const canSave =
    draft.question.trim().length >= 3 && draft.answer.trim().length >= 3;

  function attemptClose() {
    if (dirty) setConfirmDiscard(true);
    else onOpenChange(false);
  }

  function handleSave() {
    if (!canSave) return;
    onSave({
      ...draft,
      question: draft.question.trim(),
      answer: draft.answer.trim(),
    });
    onOpenChange(false);
  }

  const inputCls =
    "h-10 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange";
  const areaCls =
    "min-h-[140px] w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) attemptClose();
          else onOpenChange(o);
        }}
      >
        <DialogContent
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            attemptClose();
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-reps-border bg-reps-panel p-0 text-white sm:max-w-[600px] [&>button.absolute]:hidden"
        >
          <DialogHeader className="border-b border-reps-border px-6 pb-4 pt-5">
            <DialogTitle className="text-white">
              {editing ? "Edit FAQ" : "Add FAQ"}
            </DialogTitle>
            <DialogDescription className="text-white/55">
              A short question a real client would ask, with a straight answer in 2–4 sentences.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {editing && draft.source === "ai" ? (
              <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[12px] text-white/70">
                <Sparkles className="h-3.5 w-3.5 text-reps-orange" />
                AI draft — edit anything you like before saving.
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                  Question
                </label>
                <input
                  value={draft.question}
                  onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                  maxLength={QUESTION_MAX}
                  placeholder="[Question a client actually asks — e.g. Do you offer online-only coaching?]"
                  className={inputCls}
                />
                <FieldCounter current={draft.question.length} max={QUESTION_MAX} />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                  Answer
                </label>
                <textarea
                  value={draft.answer}
                  onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
                  maxLength={ANSWER_MAX}
                  placeholder="[Straight answer — 2–4 short sentences]"
                  className={areaCls}
                />
                <FieldCounter current={draft.answer.length} max={ANSWER_MAX} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-reps-border bg-reps-panel/95 px-6 py-3">
            <div className="flex items-center gap-3">
              {editing && onDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex h-9 items-center gap-1.5 rounded-[10px] border border-reps-border bg-reps-panel-soft px-3 text-[12.5px] font-semibold text-red-300 hover:bg-reps-panel"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              ) : null}
              <div className="text-[12px] text-white/45">
                {dirty ? (
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Unsaved changes
                  </span>
                ) : (
                  editing ? "No changes" : "Ready"
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={attemptClose}
                className="flex h-10 items-center rounded-[10px] border border-reps-border bg-reps-panel-soft px-4 text-[13px] font-semibold text-white hover:bg-reps-panel"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSave || (editing && !dirty)}
                onClick={handleSave}
                className="flex h-10 items-center gap-2 rounded-[10px] bg-reps-orange px-4 text-[13px] font-semibold text-white hover:bg-reps-orange-hover disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                Save & close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent className="border-reps-border bg-reps-panel text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              You have edits that haven't been saved. If you close now, those changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-reps-border bg-reps-panel-soft text-white hover:bg-reps-panel hover:text-white">
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDiscard(false);
                onOpenChange(false);
              }}
              className="bg-red-500 text-white hover:bg-red-500/90"
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-reps-border bg-reps-panel text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this FAQ?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              This removes the question from your public website. You can add another in its place.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-reps-border bg-reps-panel-soft text-white hover:bg-reps-panel hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDelete(false);
                onDelete?.();
                onOpenChange(false);
              }}
              className="bg-red-500 text-white hover:bg-red-500/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
