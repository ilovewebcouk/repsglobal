import * as React from "react";

/**
 * Observe an element's height and publish it as a CSS variable (in px)
 * on `document.documentElement`, so other components can offset against
 * the real, live chrome height (e.g. sticky sub-nav under a header whose
 * height may change with banners, wrap, etc.).
 */
export function useMeasuredHeight(
  ref: React.RefObject<HTMLElement | null>,
  cssVar: string,
) {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;

    const write = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) root.style.setProperty(cssVar, `${h}px`);
    };

    write();
    const ro = new ResizeObserver(write);
    ro.observe(el);
    window.addEventListener("resize", write);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", write);
    };
  }, [ref, cssVar]);
}
