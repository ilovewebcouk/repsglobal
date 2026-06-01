import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const navItems = [
  { label: "Find a Professional", hasDropdown: true },
  { label: "How REPs Works", hasDropdown: false },
  { label: "For Professionals", hasDropdown: false, to: "/for-professionals" as const },
  { label: "Resources", hasDropdown: true, to: "/resources" as const },
  { label: "About REPs", hasDropdown: true },
];

type Variant = "transparent" | "solid";

export function PublicHeader({ variant = "transparent" }: { variant?: Variant }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const wrapperClass =
    variant === "transparent"
      ? "absolute inset-x-0 top-0 z-30 bg-transparent"
      : "sticky top-0 z-30 bg-reps-ink border-b border-reps-border";

  return (
    <header className={wrapperClass}>
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-display text-[34px] font-bold leading-none tracking-tight text-white">
            REPs
          </span>
          <span className="hidden border-l border-white/15 pl-3 text-[11px] leading-tight text-white/70 sm:block">
            The Register of
            <br />
            Exercise Professionals
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => {
            const linkClass =
              "flex items-center gap-1 text-[14px] font-medium text-white/85 transition-colors hover:text-white";
            if (item.to) {
              return (
                <Link key={item.label} to={item.to} className={linkClass}>
                  {item.label}
                  {item.hasDropdown && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
                </Link>
              );
            }
            return (
              <button key={item.label} type="button" className={linkClass}>
                {item.label}
                {item.hasDropdown && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/signup"
            className="hidden h-10 items-center rounded-[10px] border border-white/25 px-5 text-[14px] font-medium text-white transition-colors hover:bg-white/10 sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="inline-flex h-10 items-center rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
          >
            Join REPs
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/25 text-white transition-colors hover:bg-white/10 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-full border-l-0 bg-reps-ink p-0 text-white sm:max-w-sm"
            >
              <VisuallyHidden>
                <SheetTitle>REPs navigation</SheetTitle>
              </VisuallyHidden>
              <div className="flex h-[76px] items-center px-6">
                <span className="font-display text-[28px] font-bold leading-none tracking-tight text-white">
                  REPs
                </span>
              </div>
              <nav className="flex flex-col gap-1 px-4 pb-6">
                {navItems.map((item) => {
                  const itemClass =
                    "flex items-center justify-between rounded-[10px] px-3 py-3 text-[16px] font-medium text-white/90 transition-colors hover:bg-white/5 hover:text-white";
                  if (item.to) {
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={itemClass}
                      >
                        {item.label}
                      </Link>
                    );
                  }
                  return (
                    <span key={item.label} className={itemClass}>
                      {item.label}
                    </span>
                  );
                })}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-white/10 px-6 py-5">
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-[10px] border border-white/25 px-5 text-[14px] font-medium text-white transition-colors hover:bg-white/10"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
                >
                  Join REPs
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
