import { Link } from "@tanstack/react-router";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { ChevronDown } from "lucide-react";
import { RESOURCE_ARTICLES } from "@/lib/resources";
import { cn } from "@/lib/utils";
import {
  ABOUT_LINKS,
  RESOURCE_TOPICS,
  TOP_LOCATIONS,
  TOP_PROFESSIONS,
} from "./nav-config";

type Variant = "transparent" | "solid";

const triggerClass =
  "group inline-flex items-center gap-1 text-[14px] font-medium text-white/85 transition-colors hover:text-white focus:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink rounded-[6px] data-[state=open]:text-white";

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

        <NavigationMenu.Root
          delayDuration={120}
          skipDelayDuration={200}
          className="relative hidden lg:block"
        >
          <NavigationMenu.List className="flex items-center gap-7">
            <NavigationMenu.Item>
              <NavigationMenu.Trigger className={triggerClass}>
                Find a Professional
                <ChevronDown
                  aria-hidden="true"
                  className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180"
                />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="absolute left-0 top-full pt-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
                <FindMenu />
              </NavigationMenu.Content>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link to="/how-it-works" className={triggerClass}>
                  How REPs Works
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link to="/for-professionals" className={triggerClass}>
                  For Professionals
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Trigger className={triggerClass}>
                Resources
                <ChevronDown
                  aria-hidden="true"
                  className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180"
                />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="absolute left-0 top-full pt-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
                <ResourcesMenu />
              </NavigationMenu.Content>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Trigger className={triggerClass}>
                About REPs
                <ChevronDown
                  aria-hidden="true"
                  className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180"
                />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="absolute left-0 top-full pt-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
                <AboutMenu />
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>

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

function PanelShell({
  width,
  children,
}: {
  width: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        width,
        "rounded-[18px] border border-reps-stone bg-white p-6 text-reps-charcoal shadow-lg",
      )}
    >
      {children}
    </div>
  );
}

const menuItemClass =
  "block rounded-[8px] px-2 py-1.5 text-[14px] font-medium text-reps-charcoal transition-colors hover:bg-reps-warm-white hover:text-reps-orange focus:bg-reps-warm-white focus:text-reps-orange focus:outline-none";

function FindMenu() {
  return (
    <PanelShell width="w-[640px]">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Top professions
          </h4>
          <ul className="mt-3 flex flex-col gap-2">
            {TOP_PROFESSIONS.map((p) => (
              <li key={p.slug}>
                <NavigationMenu.Link asChild>
                  <Link
                    to="/professions/$profession"
                    params={{ profession: p.slug }}
                    className={menuItemClass}
                  >
                    {p.label}
                  </Link>
                </NavigationMenu.Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Top locations
          </h4>
          <ul className="mt-3 flex flex-col gap-2">
            {TOP_LOCATIONS.map((l) => (
              <li key={l.slug}>
                <NavigationMenu.Link asChild>
                  <Link
                    to="/in/$location"
                    params={{ location: l.slug }}
                    className={menuItemClass}
                  >
                    {l.label}
                  </Link>
                </NavigationMenu.Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-5 border-t border-reps-stone pt-4">
        <NavigationMenu.Link asChild>
          <Link
            to="/find-a-professional"
            className="text-[13px] font-semibold text-reps-orange hover:underline focus:underline focus:outline-none"
          >
            Browse all professionals →
          </Link>
        </NavigationMenu.Link>
      </div>
    </PanelShell>
  );
}

function AboutMenu() {
  return (
    <PanelShell width="w-[320px]">
      <ul className="flex flex-col gap-1">
        {ABOUT_LINKS.map((item) => (
          <li key={item.to}>
            <NavigationMenu.Link asChild>
              <Link
                to={item.to}
                className="block rounded-[10px] px-3 py-2 transition-colors hover:bg-reps-warm-white focus:bg-reps-warm-white focus:outline-none"
              >
                <span className="block text-[14px] font-semibold text-reps-charcoal">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-[12px] text-reps-charcoal/65">
                  {item.sub}
                </span>
              </Link>
            </NavigationMenu.Link>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

function ResourcesMenu() {
  const featured = RESOURCE_ARTICLES.slice(0, 3);
  return (
    <PanelShell width="w-[640px]">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Browse by topic
          </h4>
          <ul className="mt-3 flex flex-col gap-2">
            {RESOURCE_TOPICS.map((t) => (
              <li key={t.category}>
                <NavigationMenu.Link asChild>
                  <Link to="/resources" className={menuItemClass}>
                    {t.label}
                  </Link>
                </NavigationMenu.Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Featured articles
          </h4>
          <ul className="mt-3 flex flex-col gap-3">
            {featured.map((a) => (
              <li key={a.slug}>
                <NavigationMenu.Link asChild>
                  <Link
                    to="/resources/$slug"
                    params={{ slug: a.slug }}
                    className="block rounded-[8px] px-2 py-1 transition-colors hover:bg-reps-warm-white focus:bg-reps-warm-white focus:outline-none"
                  >
                    <span className="block text-[13px] font-semibold leading-snug text-reps-charcoal hover:text-reps-orange">
                      {a.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-reps-charcoal/60">
                      {a.category} · {a.readTime}
                    </span>
                  </Link>
                </NavigationMenu.Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-5 border-t border-reps-stone pt-4">
        <NavigationMenu.Link asChild>
          <Link
            to="/resources"
            className="text-[13px] font-semibold text-reps-orange hover:underline focus:underline focus:outline-none"
          >
            All articles →
          </Link>
        </NavigationMenu.Link>
      </div>
    </PanelShell>
  );
}
