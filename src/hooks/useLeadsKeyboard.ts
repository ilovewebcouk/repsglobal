import * as React from "react";

type Opts = {
  enabled: boolean;
  count: number;
  selectedId: string | null;
  onMove: (delta: 1 | -1) => void;
  onOpen: () => void;
  onClose: () => void;
};

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

/** J/K (or arrows) to move, Enter to open, Esc to close. Ignored when typing. */
export function useLeadsKeyboard({ enabled, count, selectedId, onMove, onOpen, onClose }: Opts) {
  React.useEffect(() => {
    if (!enabled || count === 0) return;
    function handler(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          onMove(1);
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          onMove(-1);
          break;
        case "Enter":
          if (selectedId) {
            e.preventDefault();
            onOpen();
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, count, selectedId, onMove, onOpen, onClose]);
}
