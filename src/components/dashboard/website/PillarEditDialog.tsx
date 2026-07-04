import * as React from "react";
import { Save } from "lucide-react";

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
import type { MethodPillar } from "@/lib/website/website-content.functions";

const TITLE_MAX = 60;
const BODY_MAX = 200;

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  index: number; // 0-based slot
  pillar: MethodPillar;
  onSave: (next: MethodPillar) => void;
};

export function PillarEditDialog({
  open,
  onOpenChange,
  index,
  pillar,
  onSave,
}: Props) {
  const [title, setTitle] = React.useState(pillar.title);
  const [body, setBody] = React.useState(pillar.body);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const originalRef = React.useRef({ title: "", body: "" });

  React.useEffect(() => {
    if (open) {
      setTitle(pillar.title);
      setBody(pillar.body);
      originalRef.current = { title: pillar.title, body: pillar.body };
      setConfirmDiscard(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty =
    title !== originalRef.current.title || body !== originalRef.current.body;

  function attemptClose() {
    if (dirty) setConfirmDiscard(true);
    else onOpenChange(false);
  }

  function handleSave() {
    onSave({ title: title.trim(), body: body.trim() });
    onOpenChange(false);
  }

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
          className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-reps-border bg-reps-panel p-0 text-white sm:max-w-[560px] [&>button.absolute]:hidden"
        >
          <DialogHeader className="border-b border-reps-border px-6 pb-4 pt-5">
            <DialogTitle className="text-white">
              Edit pillar {String(index + 1).padStart(2, "0")}
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Numbered card ({String(index + 1).padStart(2, "0")}) shown in the "How I coach" section. Nothing saves until you click Save.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                  Pillar title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={TITLE_MAX}
                  placeholder="[Pillar title — e.g. Build the base]"
                  className="h-10 w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange"
                />
                <FieldCounter current={title.length} max={TITLE_MAX} />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-white/80">
                  Description
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={BODY_MAX}
                  placeholder="[One clear sentence about what happens in this phase]"
                  className="min-h-[110px] w-full rounded-[12px] border border-reps-border bg-reps-panel-soft px-3 py-2 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-reps-orange"
                />
                <FieldCounter current={body.length} max={BODY_MAX} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-reps-border bg-reps-panel/95 px-6 py-3">
            <div className="text-[12px] text-white/45">
              {dirty ? (
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Unsaved changes
                </span>
              ) : (
                "No changes"
              )}
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
                disabled={!title.trim() || !dirty}
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
    </>
  );
}
