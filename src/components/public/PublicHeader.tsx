import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RESOURCE_ARTICLES } from "@/lib/resources";
import {
  ABOUT_LINKS,
  RESOURCE_TOPICS,
  TOP_LOCATIONS,
  TOP_PROFESSIONS,
} from "./nav-config";

type Variant = "transparent" | "solid";

type DropdownKey = "find" | "resources" | "about";

const triggerClass =
  "flex items-center gap-1 text-[14px] font-medium text-white/85 transition-colors hover:text-white focus:outline-none";

export function PublicHeader({ variant = "transparent" }: { variant?: Variant }) {
  const wrapperClass =
    variant === "transparent"
      ? "absolute inset-x-0 top-0 z-30 bg-transparent"
      : "sticky top-0 z-30 bg-reps-ink border-b border-reps-border";

  const [open, setOpen] = useState<DropdownKey | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const openMenu = (key: DropdownKey) => {
    cancelClose();
    setOpen(key);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
          <NavTrigger
            label="Find a Professional"
            isOpen={open === "find"}
            onEnter={() => openMenu("find")}
            onLeave={scheduleClose}
          >
            <FindMenu onItemClick={() => setOpen(null)} />
          </NavTrigger>

          <Link to="/how-it-works" className={triggerClass}>
            How REPs Works
          </Link>

          <Link to="/for-professionals" className={triggerClass}>
            For Professionals
          </Link>

          <NavTrigger
            label="Resources"
            href="/resources"
            isOpen={open === "resources"}
            onEnter={() => openMenu("resources")}
            onLeave={scheduleClose}
          >
            <ResourcesMenu onItemClick={() => setOpen(null)} />
          </NavTrigger>

          <NavTrigger
            label="About REPs"
            href="/about"
            isOpen={open === "about"}
            onEnter={() => openMenu("about")}
            onLeave={scheduleClose}
          >
            <AboutMenu onItemClick={() => setOpen(null)} />
          </NavTrigger>
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

function NavTrigger({
  label,
  href,
  isOpen,
  onEnter,
  onLeave,
  children,
}: {
  label: string;
  href?: string;
  isOpen: boolean;
  onEnter: () => void;
  onLeave: () => void;
  children: React.ReactNode;
}) {
  const Trigger = href ? (
    <Link to={href} className={triggerClass} onFocus={onEnter}>
      {label}
      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
    </Link>
  ) : (
    <button type="button" className={triggerClass} onFocus={onEnter}>
      {label}
      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
    </button>
  );

  return (
    <div
      className="relative"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {Trigger}
      {isOpen && (
        <div
          className="absolute left-1/2 top-full z-40 -translate-x-1/2 pt-3"
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function PanelShell({ width, children }: { width: string; children: React.ReactNode }) {
  return (
    <div
      className={`${width} rounded-[18px] border border-reps-stone bg-white p-6 text-reps-charcoal`}
    >
      {children}
    </div>
  );
}

function FindMenu({ onItemClick }: { onItemClick: () => void }) {
  return (
    <PanelShell width="w-[640px]">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Top professions
          </h4>
          <ul className="mt-3 space-y-2">
            {TOP_PROFESSIONS.map((p) => (
              <li key={p.slug}>
                <Link
                  to="/professions/$profession"
                  params={{ profession: p.slug }}
                  onClick={onItemClick}
                  className="block rounded-[8px] px-2 py-1.5 text-[14px] font-medium text-reps-charcoal hover:bg-reps-warm-white hover:text-reps-orange"
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Top locations
          </h4>
          <ul className="mt-3 space-y-2">
            {TOP_LOCATIONS.map((l) => (
              <li key={l.slug}>
                <Link
                  to="/in/$location"
                  params={{ location: l.slug }}
                  onClick={onItemClick}
                  className="block rounded-[8px] px-2 py-1.5 text-[14px] font-medium text-reps-charcoal hover:bg-reps-warm-white hover:text-reps-orange"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-5 border-t border-reps-stone pt-4">
        <Link
          to="/find-a-professional"
          onClick={onItemClick}
          className="text-[13px] font-semibold text-reps-orange hover:underline"
        >
          Browse all professionals →
        </Link>
      </div>
    </PanelShell>
  );
}

function AboutMenu({ onItemClick }: { onItemClick: () => void }) {
  return (
    <PanelShell width="w-[320px]">
      <ul className="space-y-1">
        {ABOUT_LINKS.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onItemClick}
              className="block rounded-[10px] px-3 py-2 hover:bg-reps-warm-white"
            >
              <span className="block text-[14px] font-semibold text-reps-charcoal">
                {item.label}
              </span>
              <span className="mt-0.5 block text-[12px] text-reps-charcoal/65">
                {item.sub}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

function ResourcesMenu({ onItemClick }: { onItemClick: () => void }) {
  const featured = RESOURCE_ARTICLES.slice(0, 3);
  return (
    <PanelShell width="w-[640px]">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Browse by topic
          </h4>
          <ul className="mt-3 space-y-2">
            {RESOURCE_TOPICS.map((t) => (
              <li key={t.category}>
                <Link
                  to="/resources"
                  search={{ category: t.category }}
                  onClick={onItemClick}
                  className="block rounded-[8px] px-2 py-1.5 text-[14px] font-medium text-reps-charcoal hover:bg-reps-warm-white hover:text-reps-orange"
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Featured articles
          </h4>
          <ul className="mt-3 space-y-3">
            {featured.map((a) => (
              <li key={a.slug}>
                <Link
                  to="/resources/$slug"
                  params={{ slug: a.slug }}
                  onClick={onItemClick}
                  className="block rounded-[8px] px-2 py-1 hover:bg-reps-warm-white"
                >
                  <span className="block text-[13px] font-semibold leading-snug text-reps-charcoal hover:text-reps-orange">
                    {a.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-reps-charcoal/60">
                    {a.category} · {a.readTime}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-5 border-t border-reps-stone pt-4">
        <Link
          to="/resources"
          onClick={onItemClick}
          className="text-[13px] font-semibold text-reps-orange hover:underline"
        >
          All articles →
        </Link>
      </div>
    </PanelShell>
  );
}
