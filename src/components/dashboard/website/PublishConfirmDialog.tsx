import * as React from "react";
import { Loader2 } from "lucide-react";

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
import type { DiffSection } from "@/lib/website/publish.functions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: Partial<Record<DiffSection, string>>;
  everPublished: boolean;
  publishing: boolean;
  onConfirm: () => void;
};

const SECTION_LABEL: Record<DiffSection, string> = {
  basics: "Website basics",
  method: "How I coach",
  plans: "Coaching plans",
  results: "Client results",
  faqs: "FAQs",
  specialisms: "Specialisms",
  location: "Where I train",
  profile: "Profile photo",
  contact: "Languages & socials",
};

/**
 * Confirm dialog shown before publishing. Lists the sections that changed
 * since the last snapshot so trainers can see exactly what will go live.
 * On the very first publish there's no snapshot to diff against, so we
 * show a first-run explanation instead of a diff list.
 */
export function PublishConfirmDialog({
  open,
  onOpenChange,
  summary,
  everPublished,
  publishing,
  onConfirm,
}: Props) {
  const dirty = (Object.keys(summary) as DiffSection[]).filter((k) => !!summary[k]);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-reps-border bg-reps-panel text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {everPublished ? "Publish these changes?" : "Publish your website?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/60">
            {everPublished
              ? "Your public page will republish immediately. Any changes to your profile photo, specialisms, location, languages or social links will also go live at this point."
              : "This will make your public page live at your REPS URL."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {everPublished ? (
          dirty.length > 0 ? (
            <ul className="my-1 space-y-1.5 rounded-[12px] border border-reps-border bg-reps-panel-soft/60 p-3 text-[13px] text-white/80">
              {dirty.map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                  <span>
                    <span className="font-semibold text-white">{SECTION_LABEL[k]}</span>{" "}
                    <span className="text-white/60">— {summary[k]}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="my-1 rounded-[12px] border border-reps-border bg-reps-panel-soft/60 p-3 text-[13px] text-white/70">
              Nothing has changed since your last publish — this will just refresh the snapshot.
            </p>
          )
        ) : (
          <p className="my-1 rounded-[12px] border border-reps-border bg-reps-panel-soft/60 p-3 text-[13px] text-white/70">
            This is your first publish. From now on your public page only updates when you click Publish.
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={publishing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={publishing}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-reps-orange text-white hover:bg-reps-orange-hover"
          >
            {publishing ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Publishing…
              </>
            ) : (
              "Publish now"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
