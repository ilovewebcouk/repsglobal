import { cn } from "@/lib/utils";

/**
 * macOS-style browser chrome around platform mockups.
 * Use to wrap a `*Mockup` component in a hero / showcase tile.
 */
export function BrowserFrame({
  url = "app.repsglobal.com",
  children,
  className,
  shadow = true,
}: {
  url?: string;
  children: React.ReactNode;
  className?: string;
  shadow?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel",
        shadow && "shadow-[0_28px_90px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-reps-border bg-reps-panel-soft/70 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <div className="ml-4 flex h-6 max-w-[280px] flex-1 items-center justify-center rounded-[999px] bg-reps-ink/70 px-3 text-[11px] text-white/55">
          {url}
        </div>
        <span className="w-[42px]" />
      </div>
      <div className="bg-reps-ink">{children}</div>
    </div>
  );
}
