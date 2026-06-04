/**
 * Thin radial fade divider used between major sections of the v2 page
 * to give a premium rhythm without adding meaningful vertical length.
 */
export function SectionDivider() {
  return (
    <div aria-hidden className="relative h-px w-full overflow-visible">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-reps-border to-transparent" />
      <div className="absolute left-1/2 top-0 h-8 w-[60%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,122,0,0.10),transparent_70%)]" />
    </div>
  );
}
