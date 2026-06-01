import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

const navItems: { label: string; to: string; hasDropdown: boolean }[] = [
  { label: "Find a Professional", to: "/find-a-professional", hasDropdown: true },
  { label: "How REPs Works", to: "/how-it-works", hasDropdown: false },
  { label: "For Professionals", to: "/for-professionals", hasDropdown: false },
  { label: "Resources", to: "/resources", hasDropdown: true },
  { label: "About REPs", to: "/about", hasDropdown: true },
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
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center gap-1 text-[14px] font-medium text-white/85 transition-colors hover:text-white"
              activeProps={{ className: "text-white" }}
            >
              {item.label}
              {item.hasDropdown && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
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
        </div>
      </div>
    </header>
  );
}
