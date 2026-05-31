import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

const navItems = [
  { label: "Find a Professional", hasDropdown: true },
  { label: "How REPs Works", hasDropdown: false },
  { label: "For Professionals", hasDropdown: false },
  { label: "Resources", hasDropdown: true },
  { label: "About REPs", hasDropdown: true },
];

type Variant = "transparent" | "solid";

export function PublicHeader({ variant = "transparent" }: { variant?: Variant }) {
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
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex items-center gap-1 text-[14px] font-medium text-white/85 transition-colors hover:text-white"
            >
              {item.label}
              {item.hasDropdown && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/signup"
            className="hidden h-10 items-center rounded-[12px] border border-white/25 px-5 text-[14px] font-medium text-white transition-colors hover:bg-white/10 sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="inline-flex h-10 items-center rounded-[12px] bg-reps-orange px-5 text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(242,140,56,0.6)] transition-colors hover:bg-reps-orange-dark"
          >
            Join REPs
          </Link>
        </div>
      </div>
    </header>
  );
}
