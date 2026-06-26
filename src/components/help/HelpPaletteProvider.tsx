import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { CommandPalette } from "./CommandPalette";

type Ctx = {
  open: () => void;
};

const HelpPaletteCtx = createContext<Ctx | null>(null);

export function useHelpPalette() {
  const ctx = useContext(HelpPaletteCtx);
  if (!ctx) throw new Error("useHelpPalette must be used inside <HelpPaletteProvider>");
  return ctx;
}

export function HelpPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // Global ⌘K / Ctrl-K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <HelpPaletteCtx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
    </HelpPaletteCtx.Provider>
  );
}
