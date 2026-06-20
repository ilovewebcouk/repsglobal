import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type LightboxImage = { id: string; url: string; alt?: string };

type Props = {
  images: LightboxImage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
};

export function PhotoLightbox({ images, open, onOpenChange, initialIndex = 0 }: Props) {
  const [index, setIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  if (!images.length) return null;
  const current = images[Math.max(0, Math.min(index, images.length - 1))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] gap-0 border-0 bg-black/95 p-0 sm:max-w-[1200px] [&>button]:hidden"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Photo gallery</DialogTitle>

        <div className="relative flex h-[80vh] items-center justify-center">
          <img
            src={current.url}
            alt={current.alt ?? `Photo ${index + 1} of ${images.length}`}
            className="max-h-full max-w-full object-contain"
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setIndex((i) => (i - 1 + images.length) % images.length)
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[12px] font-medium text-white">
            {index + 1} / {images.length}
          </span>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto bg-black/80 p-3">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "h-16 w-16 flex-none overflow-hidden rounded-[8px] border-2 transition",
                  i === index
                    ? "border-white"
                    : "border-transparent opacity-60 hover:opacity-100",
                )}
                aria-label={`View photo ${i + 1}`}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
