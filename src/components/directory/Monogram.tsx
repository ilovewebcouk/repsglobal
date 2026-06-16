import * as React from "react";

/**
 * Circular initials avatar used as the fallback when a professional has no photo.
 * Background hue is deterministic from the name so the same person always renders
 * with the same tile colour. Stays inside the warm-ivory palette — never decorative.
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic 0-359 hue per name, biased to warm/neutral range
function hueFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  // Keep within warm 15-50° and cool 195-230° bands so we never collide with brand orange (~22°)
  const band = h % 2;
  return band === 0 ? 30 + ((h >>> 8) % 25) : 200 + ((h >>> 8) % 30);
}

export function Monogram({
  name,
  size,
  className,
}: {
  name: string;
  size: number;
  className?: string;
}) {
  const text = initials(name);
  const hue = hueFor(name);
  // Soft, low-chroma tile so the initials sit on warm-white
  const bg = `hsl(${hue} 22% 92%)`;
  const fg = `hsl(${hue} 35% 32%)`;
  const fontPx = Math.round(size * 0.36);
  return (
    <div
      aria-hidden
      className={`inline-flex select-none items-center justify-center rounded-[12px] font-display font-bold tracking-tight ring-1 ring-reps-stone ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color: fg,
        fontSize: fontPx,
      }}
    >
      {text}
    </div>
  );
}
