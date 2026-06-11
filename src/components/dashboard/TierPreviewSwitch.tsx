import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  isTierOverrideAllowed,
  readTierOverride,
  setTierOverride,
  useRealTrainerTier,
} from "@/lib/dashboard/useTrainerTier";
import type { Tier } from "@/components/dashboard/DashboardShell";

/**
 * Dev-only floating tier-preview switch. Mounted in the dashboard topbar's
 * `actions` slot. On production hosts it renders nothing.
 *
 * The override only changes client-side rendering (sidebar nav + the
 * Pro-route `UpgradePanel` decision). The server route gate at
 * `_professional/route.tsx` still reads the real tier from the DB, so the
 * switch cannot grant real access.
 */
export function TierPreviewSwitch() {
  if (!isTierOverrideAllowed()) return null;
  return <TierPreviewSwitchInner />;
}

function TierPreviewSwitchInner() {
  const realTier = useRealTrainerTier();
  const [override, setOverride] = React.useState<Tier | null>(() =>
    readTierOverride(),
  );

  React.useEffect(() => {
    const sync = () => setOverride(readTierOverride());
    window.addEventListener("reps:tier-override-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("reps:tier-override-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const effective: Tier = override ?? realTier;

  const handleChange = (value: string) => {
    if (!value) return;
    const next = value as Tier;
    // Selecting the real tier clears the override entirely.
    const persisted: Tier | null = next === realTier ? null : next;
    setTierOverride(persisted);
    setOverride(persisted);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="hidden items-center gap-2 rounded-[10px] border border-dashed border-reps-orange-border bg-reps-orange-soft/40 px-2 py-1 md:flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="border-reps-orange-border bg-reps-orange text-white">
              Preview
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            Dev-only tier preview. Real tier:{" "}
            <span className="font-semibold capitalize">{realTier}</span>.
            {override ? " Client view only — server access unchanged." : ""}
          </TooltipContent>
        </Tooltip>

        <ToggleGroup
          type="single"
          size="sm"
          value={effective}
          onValueChange={handleChange}
          aria-label="Preview dashboard as tier"
          className="gap-1"
        >
          <ToggleGroupItem value="verified" aria-label="Preview as Verified">
            Verified
          </ToggleGroupItem>
          <ToggleGroupItem value="pro" aria-label="Preview as Pro">
            Pro
          </ToggleGroupItem>
          <ToggleGroupItem value="studio" aria-label="Preview as Studio">
            Studio
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}
