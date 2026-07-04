import * as React from "react";
import { Save, Trash2 } from "lucide-react";

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
import { TransformationImageEditor } from "@/components/dashboard/TransformationImageEditor";
import type { TransformationDTO } from "@/lib/website/website-content.functions";

const METRIC_MAX = 80;
const QUOTE_MAX = 600;
const NAME_MAX = 60;
const ROLE_MAX = 60;
const DURATION_MAX = 40;

export type ResultDraft = {
  id?: string;
  client_first_name: string;
  client_role: string;
  duration_label: string;
  metric: string;
  quote: string;
  image_url: string;
  sort_order: number;
  is_published: boolean;
};

export function draftFromResult(t: TransformationDTO | null, fallbackOrder = 0): ResultDraft {
  return {
    id: t?.id,
    client_first_name: t?.client_first_name ?? "",
    client_role: t?.client_role ?? "",
    duration_label: t?.duration_label ?? "",
    metric: t?.metric ?? "",
    quote: t?.quote ?? "",
    image_url: t?.image_url ?? "",
    sort_order: t?.sort_order ?? fallbackOrder,
    is_published: t?.is_published ?? true,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: boolean;
  initial: ResultDraft;
  onSave: (draft: ResultDraft) => void;
  onDelete?: () => void;
};

export function ResultEditDialog({
  open,
  onOpenChange,
  editing,
  initial,
  onSave,
  onDelete,
}: Props) {
  const [draft, setDraft] = React.useState<ResultDraft>(initial);
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
    draft.metric.trim().length > 0 || draft.client_first_name.trim().length > 0;

  function attemptClose() {
    if (dirty) setConfirmDiscard(true);
    else onOpenChange(false);
  }

  function handleSave() {
    if (!canSave) return;
    onSave({
      ...draft,
      client_first_name: draft.client_first_name.trim(),
      client_role: draft.client_role.trim(),
      duration_label: draft.duration_label.trim(),
      metric: draft.metric.trim(),
      quote: draft.quote.trim(),
      image_url: draft.image_url.trim(),
    });
    onOpenChange(false);
  }

  const inputCls =
    "h-10 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange";
  const areaCls =
    "min-h-[110px] w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange";

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
          className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-reps-border bg-reps-panel p-0 text-white sm:max-w-[640px] [&>button.absolute]:hidden"
        >
          <DialogHeader className="border-b border-reps-border px-6 pb-4 pt-5">
            <DialogTitle className="text-white">
              {editing ? "Edit client result" : "Add client result"}
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Photo + headline + short quote. Preview updates on the right after you publish.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
                  Photo
                </label>
                <p className="mb-2 text-[11px] text-white/45">
                  Landscape 4:3 — face and result visible. Min 800 × 600.
                </p>
                <TransformationImageEditor
                  value={draft.image_url}
                  onChange={(v) => setDraft({ ...draft, image_url: v })}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                  Result headline
                </label>
                <input
                  value={draft.metric}
                  onChange={(e) => setDraft({ ...draft, metric: e.target.value })}
                  maxLength={METRIC_MAX}
                  placeholder="[Result headline — e.g. −8kg · first unassisted pull-up]"
                  className={inputCls}
                />
                <FieldCounter current={draft.metric.length} max={METRIC_MAX} />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                  Client quote <span className="font-normal text-white/45">(optional)</span>
                </label>
                <textarea
                  value={draft.quote}
                  onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
                  maxLength={QUOTE_MAX}
                  placeholder="[Short quote from the client about their result]"
                  className={areaCls}
                />
                <FieldCounter current={draft.quote.length} max={QUOTE_MAX} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                    Client name
                  </label>
                  <input
                    value={draft.client_first_name}
                    onChange={(e) => setDraft({ ...draft, client_first_name: e.target.value })}
                    maxLength={NAME_MAX}
                    placeholder="[First name]"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                    Role <span className="font-normal text-white/45">(optional)</span>
                  </label>
                  <input
                    value={draft.client_role}
                    onChange={(e) => setDraft({ ...draft, client_role: e.target.value })}
                    maxLength={ROLE_MAX}
                    placeholder="[e.g. Marketing Director]"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                    Duration <span className="font-normal text-white/45">(optional)</span>
                  </label>
                  <input
                    value={draft.duration_label}
                    onChange={(e) => setDraft({ ...draft, duration_label: e.target.value })}
                    maxLength={DURATION_MAX}
                    placeholder="[e.g. 12 weeks]"
                    className={inputCls}
                  />
                </div>
              </div>

              {editing ? (
                <label className="flex items-start gap-2.5 rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2.5 text-[12.5px] text-white/85">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-3.5 w-3.5 accent-reps-orange"
                    checked={draft.is_published}
                    onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })}
                  />
                  <span>
                    <span className="font-semibold text-white">Show on my public page</span>
                    <span className="ml-1 text-white/55">
                      — untick to hide without deleting.
                    </span>
                  </span>
                </label>
              ) : null}
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
            <AlertDialogTitle className="text-white">Delete this client result?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              This removes the card from your public website. You can add another in its place.
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
