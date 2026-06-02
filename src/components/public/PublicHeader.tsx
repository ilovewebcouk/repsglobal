import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { RESOURCE_ARTICLES } from "@/lib/resources";
import { cn } from "@/lib/utils";
import {
  ABOUT_LINKS,
  RESOURCE_TOPICS,
  TOP_LOCATIONS,
  TOP_PROFESSIONS,
} from "./nav-config";

type Variant = "transparent" | "solid";

const SCROLL_THRESHOLD = 64;

const triggerBase =
  "group inline-flex items-center gap-1 rounded-[6px] text-[14px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink";

function triggerClass(active: boolean) {
  return cn(
    triggerBase,
    active
      ? "text-white data-[state=open]:text-white"
      : "text-white/85 hover:text-white focus:text-white data-[state=open]:text-white",
  );
}

function ActiveDot({ show }: { show: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-1 h-1 w-1 rounded-full bg-reps-orange transition-opacity",
        show ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

function useIsSolid(variant: Variant) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (variant === "solid") return;
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);
  return variant === "solid" || scrolled;
}

function useActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return {
    pathname,
    find: pathname.startsWith("/find-a-professional") ||
      pathname.startsWith("/professions") ||
      pathname.startsWith("/in/"),
    how: pathname.startsWith("/how-it-works"),
    pros: pathname.startsWith("/for-professionals"),
    resources: pathname.startsWith("/resources"),
    about:
      pathname === "/about" ||
      pathname.startsWith("/standards") ||
      pathname.startsWith("/verify") ||
      pathname.startsWith("/reviews") ||
      pathname.startsWith("/complaints"),
  };
}

export function PublicHeader({ variant = "transparent" }: { variant?: Variant }) {
  const isSolid = useIsSolid(variant);
  const active = useActive();
  const [mobileOpen, setMobileOpen] = useState(false);

  const wrapperClass = cn(
    "z-30 transition-colors duration-200",
    variant === "transparent" ? "fixed inset-x-0 top-0" : "sticky top-0",
    isSolid
      ? "bg-reps-ink/95 backdrop-blur supports-[backdrop-filter]:bg-reps-ink/80 border-b border-reps-border"
      : "bg-transparent border-b border-transparent",
  );

  return (
    <header className={wrapperClass}>
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between gap-4 px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3" aria-label="REPs home">
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
              <NavigationMenu.Trigger className={triggerClass(active.find)}>
                Find a Professional
                <ChevronDown
                  aria-hidden="true"
                  className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                />
                <ActiveDot show={active.find} />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="absolute left-0 top-full pt-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
                <FindMenu />
              </NavigationMenu.Content>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link asChild active={active.how}>
                <Link to="/how-it-works" className={triggerClass(active.how)}>
                  How REPs Works
                  <ActiveDot show={active.how} />
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link asChild active={active.pros}>
                <Link to="/for-professionals" className={triggerClass(active.pros)}>
                  For Professionals
                  <ActiveDot show={active.pros} />
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Trigger className={triggerClass(active.resources)}>
                Resources
                <ChevronDown
                  aria-hidden="true"
                  className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                />
                <ActiveDot show={active.resources} />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="absolute left-0 top-full pt-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
                <ResourcesMenu />
              </NavigationMenu.Content>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Trigger className={triggerClass(active.about)}>
                About REPs
                <ChevronDown
                  aria-hidden="true"
                  className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                />
                <ActiveDot show={active.about} />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="absolute left-0 top-full pt-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
                <AboutMenu />
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu.Root>

        <div className="flex items-center gap-2">
          <Link
            to="/find-a-professional"
            aria-label="Search professionals"
            className="hidden h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 text-white/85 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink lg:inline-flex"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/login"
            className="hidden h-10 items-center rounded-[10px] border border-white/25 px-5 text-[14px] font-medium text-white transition-colors hover:bg-white/10 sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="hidden h-10 items-center rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark sm:inline-flex"
          >
            Join REPs
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full border-l border-reps-border bg-reps-ink p-0 text-white sm:max-w-sm [&>button]:hidden"
            >
              <SheetTitle className="sr-only">REPs navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Main site navigation and account links.
              </SheetDescription>
              <MobileDrawer active={active} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
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

/* ---------------- Mobile drawer ---------------- */

type ActiveState = ReturnType<typeof useActive>;

const mobileLinkBase =
  "flex items-center justify-between rounded-[10px] px-3 py-3 text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange/70";

function mobileLinkClass(active: boolean) {
  return cn(
    mobileLinkBase,
    active
      ? "bg-white/5 text-white"
      : "text-white/85 hover:bg-white/5 hover:text-white",
  );
}

const mobileSubLinkClass =
  "block rounded-[8px] px-3 py-2 text-[14px] text-white/80 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange/70";

function MobileDrawer({
  active,
  onNavigate,
}: {
  active: ActiveState;
  onNavigate: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-reps-border px-5 py-4">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2" aria-label="REPs home">
          <span className="font-display text-[26px] font-bold leading-none tracking-tight text-white">
            REPs
          </span>
        </Link>
        <SheetClose asChild>
          <button
            type="button"
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/20 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </SheetClose>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <Link
          to="/find-a-professional"
          onClick={onNavigate}
          className={cn(mobileLinkBase, "mb-3 bg-white/[0.04] text-white hover:bg-white/[0.08]")}
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" aria-hidden="true" />
            Search professionals
          </span>
        </Link>

        <Accordion type="multiple" className="space-y-1">
          <AccordionItem value="find" className="border-0">
            <AccordionTrigger
              className={cn(
                "rounded-[10px] px-3 py-3 text-[15px] font-medium hover:no-underline",
                active.find ? "text-white" : "text-white/85 hover:text-white",
              )}
            >
              Find a Professional
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-col gap-3 px-1">
                <div>
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                    Top professions
                  </p>
                  <ul className="flex flex-col">
                    {TOP_PROFESSIONS.map((p) => (
                      <li key={p.slug}>
                        <Link
                          to="/professions/$profession"
                          params={{ profession: p.slug }}
                          onClick={onNavigate}
                          className={mobileSubLinkClass}
                        >
                          {p.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                    Top locations
                  </p>
                  <ul className="flex flex-col">
                    {TOP_LOCATIONS.map((l) => (
                      <li key={l.slug}>
                        <Link
                          to="/in/$location"
                          params={{ location: l.slug }}
                          onClick={onNavigate}
                          className={mobileSubLinkClass}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <Link to="/how-it-works" onClick={onNavigate} className={mobileLinkClass(active.how)}>
            How REPs Works
          </Link>

          <Link
            to="/for-professionals"
            onClick={onNavigate}
            className={mobileLinkClass(active.pros)}
          >
            For Professionals
          </Link>

          <AccordionItem value="resources" className="border-0">
            <AccordionTrigger
              className={cn(
                "rounded-[10px] px-3 py-3 text-[15px] font-medium hover:no-underline",
                active.resources ? "text-white" : "text-white/85 hover:text-white",
              )}
            >
              Resources
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <ul className="flex flex-col px-1">
                {RESOURCE_TOPICS.map((t) => (
                  <li key={t.category}>
                    <Link to="/resources" onClick={onNavigate} className={mobileSubLinkClass}>
                      {t.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/resources"
                    onClick={onNavigate}
                    className={cn(mobileSubLinkClass, "text-reps-orange")}
                  >
                    All articles →
                  </Link>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="about" className="border-0">
            <AccordionTrigger
              className={cn(
                "rounded-[10px] px-3 py-3 text-[15px] font-medium hover:no-underline",
                active.about ? "text-white" : "text-white/85 hover:text-white",
              )}
            >
              About REPs
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <ul className="flex flex-col px-1">
                {ABOUT_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} onClick={onNavigate} className={mobileSubLinkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </nav>

      <div className="border-t border-reps-border px-5 py-4">
        <div className="flex flex-col gap-2">
          <Link
            to="/login"
            onClick={onNavigate}
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-white/25 px-5 text-[14px] font-medium text-white transition-colors hover:bg-white/10"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            onClick={onNavigate}
            className="inline-flex h-11 items-center justify-center rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
          >
            Join REPs
          </Link>
        </div>
      </div>
    </div>
  );
}
