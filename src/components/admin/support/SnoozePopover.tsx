import { useState } from "react";
import { Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function nextMondayMorning() {
  const d = new Date();
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (8 - day) % 7 || 7; // days until next Monday
  d.setDate(d.getDate() + diff);
  d.setHours(9, 0, 0, 0);
  return d;
}

function tomorrowMorning() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

function inHours(n: number) {
  return new Date(Date.now() + n * 60 * 60 * 1000);
}

const OPTIONS: { label: string; build: () => Date }[] = [
  { label: "1 hour", build: () => inHours(1) },
  { label: "4 hours", build: () => inHours(4) },
  { label: "Tomorrow 9am", build: tomorrowMorning },
  { label: "Monday 9am", build: nextMondayMorning },
];

export function SnoozePopover({
  onSnooze,
  onUnsnooze,
  snoozedUntil,
  trigger,
}: {
  onSnooze: (untilIso: string) => void;
  onUnsnooze: () => void;
  snoozedUntil?: string | null;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const isSnoozed =
    !!snoozedUntil && new Date(snoozedUntil).getTime() > Date.now();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 bg-white/5 border-reps-border text-white/80 hover:bg-white/10 hover:text-white text-[12px]"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            {isSnoozed ? "Snoozed" : "Snooze"}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[240px] bg-reps-panel border-reps-border text-white p-2"
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45 px-2 pt-1 pb-2">
          Snooze until
        </div>
        <div className="flex flex-col gap-0.5">
          {OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                onSnooze(opt.build().toISOString());
                setOpen(false);
              }}
              className="text-left text-[13px] text-white/85 hover:bg-white/5 rounded-[8px] px-2 py-1.5"
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="mt-2 border-t border-reps-border pt-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/45 px-2 pb-1">
            Custom
          </div>
          <div className="flex gap-1.5 px-2 pb-1">
            <Input
              type="datetime-local"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="h-8 bg-white/[0.04] border-reps-border text-white text-[12px]"
            />
            <Button
              size="sm"
              disabled={!custom}
              onClick={() => {
                const d = new Date(custom);
                if (!isNaN(d.getTime()) && d.getTime() > Date.now()) {
                  onSnooze(d.toISOString());
                  setOpen(false);
                  setCustom("");
                }
              }}
              className="h-8 bg-reps-orange hover:bg-reps-orange/90 text-white text-[12px]"
            >
              Set
            </Button>
          </div>
        </div>
        {isSnoozed ? (
          <div className="mt-2 border-t border-reps-border pt-2 px-2 pb-1">
            <button
              onClick={() => {
                onUnsnooze();
                setOpen(false);
              }}
              className="text-[12px] text-reps-orange hover:underline"
            >
              Wake now
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
