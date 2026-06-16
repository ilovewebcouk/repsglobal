import * as React from "react";
import { Crosshair, MapPin, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResolveViewerLocation } from "@/lib/profile/useResolveViewerLocation";

/**
 * Inline control for the directory: "Set your location" → resolves and
 * persists the viewer origin in localStorage so distance + nearest sort
 * become available.
 */
export function ViewerOriginControl() {
  const [open, setOpen] = React.useState(false);
  const [postcode, setPostcode] = React.useState("");
  const { origin, setOrigin, runPostcode, runGeolocate, busy } =
    useResolveViewerLocation({
      onResolved: () => {
        setOpen(false);
        setPostcode("");
      },
    });



  if (origin) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-orange/40 bg-reps-orange/10 px-3 py-1 text-[12px] font-medium text-reps-orange">
        <MapPin className="h-3 w-3" />
        Searching from {origin.postcode_outward}
        <button
          type="button"
          onClick={() => setOrigin(null)}
          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-reps-orange/20"
          aria-label="Clear location"
        >
          <X className="h-3 w-3" />
        </button>
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-reps-stone bg-reps-warm-white px-3 py-1 text-[12px] font-medium text-reps-charcoal transition-colors hover:border-reps-orange/40 hover:text-reps-orange"
        >
          <MapPin className="h-3 w-3" />
          Set your location for distances
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] rounded-[16px] p-4">
        <div className="space-y-3">
          <div>
            <p className="font-display text-[14px] font-semibold text-reps-charcoal">
              Where are you searching from?
            </p>
            <p className="mt-0.5 text-[12px] text-reps-muted-light">
              We use this only to sort by distance. Nothing is stored on our servers.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 rounded-[10px] shadow-none"
            onClick={() => geoMutation.mutate()}
            disabled={busy}
          >
            <Crosshair className="h-3.5 w-3.5" />
            Use my current location
          </Button>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-reps-muted-light">
            <span className="h-px flex-1 bg-reps-stone" />
            or
            <span className="h-px flex-1 bg-reps-stone" />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (postcode.trim()) postcodeMutation.mutate(postcode);
            }}
            className="flex gap-2"
          >
            <Input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              placeholder="e.g. SW1A 1AA"
              className="rounded-[12px]"
              disabled={busy}
            />
            <Button
              type="submit"
              className="rounded-[10px] shadow-none"
              disabled={busy || !postcode.trim()}
            >
              Set
            </Button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
