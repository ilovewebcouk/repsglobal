import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import {
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  Heart,
  User,
  LogOut,
  CalendarCheck,
  MessageSquare,
  Settings,
} from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RESOURCE_ARTICLES, getFeaturedArticles, getLatestArticles, type ResourceCategory } from "@/lib/resources";
import { cn } from "@/lib/utils";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { useSessionUser, type SessionUser } from "@/hooks/use-session-user";
import { UserAccountMenu } from "@/components/account/UserAccountMenu";
import {
  RESOURCE_TOPICS,
  PRO_RESOURCES,
  ABOUT_GROUPS,
  TOP_LOCATIONS,
  TOP_PROFESSIONS,
} from "./nav-config";
import { FEATURE_GROUPS } from "@/components/features/feature-config";
import { initialsFromName } from "@/lib/initials";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";


type Variant = "transparent" | "solid";

const SCROLL_THRESHOLD = 96;

/* ---------------- hooks ---------------- */

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
    isHome: pathname === "/",
    find:
      pathname.startsWith("/find-a-professional") ||
      pathname.startsWith("/professions") ||
      pathname.startsWith("/in/") ||
      pathname.startsWith("/pro/") ||
      pathname.startsWith("/how-it-works"),
    resources:
      pathname === "/resources" || pathname.startsWith("/resources/"),
    pros:
      pathname.startsWith("/for-professionals") ||
      pathname.startsWith("/features") ||
      pathname.startsWith("/pricing") ||
      pathname.startsWith("/compare") ||
      pathname.startsWith("/cpd") ||
      pathname.startsWith("/specialisms") ||
      pathname.startsWith("/signup"),
    about:
      pathname.startsWith("/about") ||
      pathname.startsWith("/verify") ||
      pathname.startsWith("/contact") ||
      pathname.startsWith("/reviews"),
  };
}






/* ---------------- style helpers ---------------- */

const triggerBase =
  "group inline-flex items-center gap-1 whitespace-nowrap rounded-[6px] text-[14px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink";


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

/* ---------------- root ---------------- */

export function PublicHeader({ variant = "transparent" }: { variant?: Variant }) {
  const isSolid = useIsSolid(variant);
  const active = useActive();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  
  const { user, isAdmin, signOut } = useSessionUser();

  

  // Two-row expanded layout only on home, at rest, on desktop.
  const expanded = active.isHome && !isSolid;

  const wrapperClass = cn(
    "z-50 transition-colors duration-200",
    variant === "transparent" ? "fixed inset-x-0 top-0" : "sticky top-0",
    isSolid
      ? "bg-reps-ink/95 backdrop-blur supports-[backdrop-filter]:bg-reps-ink/80 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.55)]"
      : "bg-transparent",
  );

  return (
    <>
      <header className={wrapperClass}>
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          {/* Row 1 — logo · location · nav · trust · right cluster */}
          <div className="flex h-[72px] items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3" aria-label="REPS home">
                <RepsWordmark className="h-[22px] text-white" />
              </Link>

            </div>


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
                  <NavigationMenu.Trigger className={triggerClass(active.pros)}>
                    For Professionals
                    <ChevronDown
                      aria-hidden="true"
                      className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                    />
                    <ActiveDot show={active.pros} />
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="absolute left-0 top-full pt-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
                    <ForProsMenu />
                  </NavigationMenu.Content>
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
                    About REPS
                    <ChevronDown
                      aria-hidden="true"
                      className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                    />
                    <ActiveDot show={active.about} />
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="absolute right-0 top-full pt-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
                    <AboutMenu />
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              </NavigationMenu.List>
            </NavigationMenu.Root>

            <div className="flex items-center gap-2">


              {user && (
                isAdmin ? (
                  <NotificationsBell />
                ) : (
                  <Link
                    to="/find-a-professional"
                    aria-label="Saved professionals"
                    className="hidden h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 text-white/85 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink xl:inline-flex"
                  >
                    <Heart className="h-4 w-4" aria-hidden />
                  </Link>
                )
              )}




              {user ? (
                <UserAccountMenu surface="public" />
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="hidden h-10 items-center whitespace-nowrap rounded-[10px] border border-white/25 px-4 text-[14px] font-medium text-white transition-colors hover:bg-white/10 sm:inline-flex"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/pricing"
                    className="hidden h-10 items-center whitespace-nowrap rounded-[10px] bg-reps-orange px-4 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark sm:inline-flex"
                  >
                    Join REPS
                  </Link>
                </>
              )}


              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open menu"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink lg:hidden"
                  >
                    <Menu className="h-5 w-5" aria-hidden />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full border-l border-reps-border bg-reps-ink p-0 text-white sm:max-w-sm [&>button]:hidden"
                >
                  <SheetTitle className="sr-only">REPS navigation</SheetTitle>
                  <SheetDescription className="sr-only">
                    Main site navigation and account links.
                  </SheetDescription>
                  <MobileDrawer
                    active={active}
                    city={city}
                    user={user}
                    isAdmin={isAdmin}
                    onSignOut={signOut}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>



    </>
  );
}



/* ---------------- location pin ---------------- */

function LocationPin({
  city,
  onChange,
  className,
}: {
  city: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-9 items-center gap-1.5 rounded-[999px] border border-white/15 bg-white/[0.04] px-3 text-[13px] font-medium text-white/85 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink",
            className,
          )}
        >
          <MapPin className="h-3.5 w-3.5 text-reps-orange" aria-hidden />
          {city}
          <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[260px] rounded-[16px] border border-reps-stone bg-white p-2 text-reps-charcoal"
      >
        <button
          type="button"
          onClick={() => {
            onChange("Near me");
            setOpen(false);
          }}
          className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-medium text-reps-charcoal transition-colors hover:bg-reps-warm-white hover:text-reps-orange"
        >
          <Crosshair className="h-4 w-4 text-reps-orange" aria-hidden />
          Detect location
        </button>
        <div className="my-2 h-px bg-reps-stone" />
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
          Popular cities
        </p>
        <ul className="flex flex-col">
          {TOP_LOCATIONS.map((l) => (
            <li key={l.slug}>
              <button
                type="button"
                onClick={() => {
                  onChange(l.label);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-[8px] px-3 py-1.5 text-[13px] transition-colors hover:bg-reps-warm-white hover:text-reps-orange",
                  city === l.label
                    ? "font-semibold text-reps-orange"
                    : "text-reps-charcoal",
                )}
              >
                {l.label}
                {city === l.label && (
                  <span className="h-1.5 w-1.5 rounded-full bg-reps-orange" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------- mega menus ---------------- */

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
        "rounded-[22px] border border-reps-stone bg-white p-6 text-reps-charcoal shadow-[0_28px_90px_rgba(0,0,0,0.38)]",
      )}
    >
      {children}
    </div>
  );
}

const menuItemClass =
  "block rounded-[8px] px-2 py-1.5 text-[14px] font-medium text-reps-charcoal transition-colors hover:bg-reps-warm-white hover:text-reps-orange focus:bg-reps-warm-white focus:text-reps-orange focus:outline-none";


function FindMenu() {
  const featured = RESOURCE_ARTICLES[0];
  return (
    <PanelShell width="w-[760px]">
      <div className="grid grid-cols-[1fr_1fr_1.1fr] gap-8">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Top professions
          </h4>
          <ul className="mt-3 flex flex-col gap-1">
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
            Top cities
          </h4>
          <ul className="mt-3 flex flex-col gap-1">
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
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Featured this week
          </h4>
          <NavigationMenu.Link asChild>
            <Link
              to="/find-a-professional"
              className="mt-3 block overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white transition-colors hover:border-reps-orange-border focus:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange/60"
            >
              <div
                className="h-24 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${featured.cover})` }}
                aria-hidden
              />
              <div className="p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-reps-orange">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  Verified pros
                </div>
                <p className="mt-1 text-[13px] font-semibold leading-snug text-reps-charcoal">
                  Browse the most-booked trainers in your city
                </p>
              </div>
            </Link>
          </NavigationMenu.Link>
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

function ResourcesMenu() {
  const featured = getFeaturedArticles(3);
  const latest = getLatestArticles(3);
  return (
    <PanelShell width="w-[960px]">
      <div className="grid grid-cols-[1fr_1.3fr_1.3fr] gap-8">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Browse by topic
          </h4>
          <ul className="mt-3 flex flex-col gap-1">
            {RESOURCE_TOPICS.map((t) => (
              <li key={t.category}>
                <NavigationMenu.Link asChild>
                  <Link
                    to="/resources"
                    search={{ category: t.category as ResourceCategory }}
                    className={menuItemClass}
                  >
                    {t.label}
                  </Link>
                </NavigationMenu.Link>
              </li>
            ))}
          </ul>
        </div>
        <ArticleColumn heading="Featured" articles={featured} />
        <ArticleColumn heading="Latest" articles={latest} />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-reps-stone pt-4">
        <span className="text-[11px] text-reps-charcoal/55">
          {RESOURCE_ARTICLES.length} guides · updated weekly
        </span>
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

function ArticleColumn({
  heading,
  articles,
}: {
  heading: string;
  articles: ReturnType<typeof getFeaturedArticles>;
}) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
        {heading}
      </h4>
      <ul className="mt-3 flex flex-col gap-3">
        {articles.map((a) => (
          <li key={a.slug}>
            <NavigationMenu.Link asChild>
              <Link
                to="/resources/$slug"
                params={{ slug: a.slug }}
                className="flex items-start gap-3 rounded-[16px] p-2 transition-colors hover:bg-reps-warm-white focus:bg-reps-warm-white focus:outline-none"
              >
                <span
                  className="h-12 w-16 shrink-0 rounded-[10px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${a.cover})` }}
                  aria-hidden
                />
                <span className="flex flex-col">
                  <span className="text-[13px] font-semibold leading-snug text-reps-charcoal">
                    {a.title}
                  </span>
                  <span className="mt-0.5 text-[11px] text-reps-charcoal/60">
                    {a.category} · {a.readTime}
                  </span>
                </span>
              </Link>
            </NavigationMenu.Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ForProsMenu() {
  return (
    <PanelShell width="w-[640px]">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Overview
          </h4>
          <ul className="mt-3 flex flex-col gap-1">
            <li>
              <NavigationMenu.Link asChild>
                <Link to="/for-professionals" className={menuItemClass}>
                  For Professionals overview
                </Link>
              </NavigationMenu.Link>
            </li>
            <li>
              <NavigationMenu.Link asChild>
                <Link to="/pricing" className={menuItemClass}>
                  Pricing
                </Link>
              </NavigationMenu.Link>
            </li>
            <li>
              <NavigationMenu.Link asChild>
                <Link to="/compare" className={menuItemClass}>
                  Compare platforms
                </Link>
              </NavigationMenu.Link>
            </li>
            {PRO_RESOURCES.map((l) => (
              <li key={l.to}>
                <NavigationMenu.Link asChild>
                  <Link to={l.to} className={menuItemClass}>
                    {l.label}
                  </Link>
                </NavigationMenu.Link>
              </li>
            ))}
            <li>
              <NavigationMenu.Link asChild>
                <Link
                  to="/pricing"
                  className={cn(menuItemClass, "font-semibold text-reps-orange")}
                >
                  Join REPS →
                </Link>
              </NavigationMenu.Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Platform pillars
          </h4>
          <ul className="mt-3 flex flex-col gap-1">
            {FEATURE_GROUPS.map((g) => (
              <li key={g.key}>
                <NavigationMenu.Link asChild>
                  <Link
                    to={
                      g.key === "visibility"
                        ? "/features/visibility"
                        : g.key === "shopfront"
                          ? "/features/shop-front"
                          : g.key === "operations"
                            ? "/features/operations"
                            : g.key === "coaching"
                              ? "/features/coaching"
                              : g.key === "ai"
                                ? "/features/ai"
                                : "/features/growth"
                    }
                    className="group/feat flex items-start gap-2.5 rounded-[12px] p-2 transition-colors hover:bg-reps-warm-white focus:bg-reps-warm-white focus:outline-none"
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]",
                        g.highlight
                          ? "bg-reps-orange text-white"
                          : "bg-reps-orange-soft text-reps-orange",
                      )}
                    >
                      <g.icon className="h-4 w-4" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[13px] font-semibold leading-tight text-reps-charcoal group-hover/feat:text-reps-orange">
                        {g.label}
                      </span>
                      <span className="mt-0.5 text-[11px] leading-snug text-reps-charcoal/60">
                        {g.desc}
                      </span>
                    </span>
                  </Link>
                </NavigationMenu.Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PanelShell>
  );
}

function AboutMenu() {
  return (
    <PanelShell width="w-[760px]">
      <div className="grid grid-cols-3 gap-8">
        {ABOUT_GROUPS.map((group) => (
          <div key={group.heading}>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
              {group.heading}
            </h4>
            <ul className="mt-3 flex flex-col gap-1">
              {group.links.map((l) => (
                <li key={l.label}>
                  {"soon" in l && l.soon ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-default select-none items-center gap-2 rounded-[8px] px-2 py-1.5 text-[14px] font-medium text-reps-charcoal/45">
                          {l.label}
                          <span className="rounded-[6px] border border-reps-stone/40 bg-reps-warm-white/60 px-1.5 py-[1px] text-[10px] font-medium uppercase tracking-[0.14em] text-reps-charcoal/50">
                            Soon
                          </span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">Launching soon</TooltipContent>
                    </Tooltip>
                  ) : (
                    <NavigationMenu.Link asChild>
                      <Link to={l.to} className={menuItemClass}>
                        {l.label}
                      </Link>
                    </NavigationMenu.Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}




/* ---------------- user menu (mock auth shell) ---------------- */

function UserMenu({
  user,
  isAdmin,
  onSignOut,
}: {
  user: SessionUser;
  isAdmin: boolean;
  onSignOut: () => void;
}) {
  const initials = initialsFromName(user.name);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="hidden h-10 items-center gap-2 rounded-[999px] border border-white/20 bg-white/[0.04] pl-1 pr-3 text-[13px] font-medium text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink sm:inline-flex"
        >
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[999px] bg-reps-orange text-[12px] font-semibold text-white">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[240px] rounded-[16px] border border-reps-stone bg-white p-1.5 text-reps-charcoal"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <div className="text-[13px] font-semibold leading-tight text-reps-charcoal">
            {user.name}
          </div>
          <div className="text-[11px] font-normal leading-tight text-reps-charcoal/60">
            {user.email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-reps-stone" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="rounded-[10px] focus:bg-reps-warm-white">
            <Link to="/portal/today">
              <CalendarCheck className="mr-2 h-4 w-4 text-reps-orange" aria-hidden />
              Bookings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-[10px] focus:bg-reps-warm-white">
            <Link to="/find-a-professional">
              <Heart className="mr-2 h-4 w-4 text-reps-orange" aria-hidden />
              Saved
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-[10px] focus:bg-reps-warm-white">
            <Link to="/portal/messages">
              <MessageSquare className="mr-2 h-4 w-4 text-reps-orange" aria-hidden />
              Messages
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-[10px] focus:bg-reps-warm-white">
            <Link to="/portal/profile">
              <Settings className="mr-2 h-4 w-4 text-reps-orange" aria-hidden />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {isAdmin && (
          <>
            <DropdownMenuSeparator className="my-1 bg-reps-stone" />
            <DropdownMenuItem asChild className="rounded-[10px] focus:bg-reps-warm-white">
              <Link to="/admin">
                <ShieldCheck className="mr-2 h-4 w-4 text-reps-orange" aria-hidden />
                Admin console
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator className="my-1 bg-reps-stone" />
        <DropdownMenuItem
          onSelect={onSignOut}
          className="rounded-[10px] focus:bg-reps-warm-white"
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


/* ---------------- mobile drawer ---------------- */

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
  "flex min-h-11 items-center rounded-[8px] px-3 py-2.5 text-[14px] text-white/80 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange/70";

function MobileDrawer({
  active,
  city,
  user,
  isAdmin,
  onSignOut,
  onNavigate,
}: {
  active: ActiveState;
  city: string;
  user: SessionUser | null;
  isAdmin: boolean;
  onSignOut: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-4 shadow-[0_6px_16px_-12px_rgba(0,0,0,0.6)]">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2" aria-label="REPS home">
          <RepsWordmark className="h-[19px] text-white" />
        </Link>
        <SheetClose asChild>
          <button
            type="button"
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/20 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </SheetClose>
      </div>

      {user ? (
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[999px] bg-reps-orange text-[13px] font-semibold text-white">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                user.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              )}
            </span>
            <div>
              <div className="text-[14px] font-semibold text-white">{user.name}</div>
              <div className="text-[12px] text-white/60">{user.email}</div>
            </div>
          </div>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={onNavigate}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-white/25 px-3 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
            >
              <ShieldCheck className="h-4 w-4 text-reps-orange" aria-hidden />
              Admin console
            </Link>
          )}
        </div>
      ) : (
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/auth"
              onClick={onNavigate}
              className="inline-flex h-11 items-center justify-center rounded-[10px] border border-white/25 px-3 text-[14px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              to="/pricing"
              onClick={onNavigate}
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-reps-orange px-3 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
            >
              Join REPS
            </Link>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4">


        <Accordion type="multiple" className="space-y-1">
          <AccordionItem value="find" className="border-0">
            <AccordionTrigger
              className={cn(
                "rounded-[10px] px-3 py-3 text-[15px] font-medium hover:no-underline [&>svg]:text-white/60",
                active.find ? "text-white" : "text-white/85 hover:text-white",
              )}
            >
              Find a Professional
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-col gap-3 px-1">
                <Link
                  to="/find-a-professional"
                  onClick={onNavigate}
                  className={cn(mobileSubLinkClass, "font-semibold text-white")}
                >
                  Browse all professionals
                </Link>
                <div className="border-t border-reps-border" />

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
                    Top cities
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

          <AccordionItem value="pros" className="border-0">
            <AccordionTrigger
              className={cn(
                "rounded-[10px] px-3 py-3 text-[15px] font-medium hover:no-underline [&>svg]:text-white/60",
                active.pros ? "text-white" : "text-white/85 hover:text-white",
              )}
            >
              For Professionals
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <ul className="flex flex-col px-1">
                <li>
                  <Link
                    to="/for-professionals"
                    onClick={onNavigate}
                    className={cn(mobileSubLinkClass, "font-semibold text-white")}
                  >
                    Overview
                  </Link>
                </li>
                <li>
                  <Link to="/features/visibility" onClick={onNavigate} className={mobileSubLinkClass}>
                    Visibility
                  </Link>
                </li>
                <li>
                  <Link to="/features/shop-front" onClick={onNavigate} className={mobileSubLinkClass}>
                    Shop-front
                  </Link>
                </li>
                <li>
                  <Link to="/features/operations" onClick={onNavigate} className={mobileSubLinkClass}>
                    Operations
                  </Link>
                </li>
                <li>
                  <Link to="/features/coaching" onClick={onNavigate} className={mobileSubLinkClass}>
                    Coaching
                  </Link>
                </li>
                <li>
                  <Link
                    to="/features/ai"
                    onClick={onNavigate}
                    className={cn(mobileSubLinkClass, "text-reps-orange")}
                  >
                    REPS AI
                  </Link>
                </li>
                <li>
                  <Link to="/features/growth" onClick={onNavigate} className={mobileSubLinkClass}>
                    Growth
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" onClick={onNavigate} className={mobileSubLinkClass}>
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/compare" onClick={onNavigate} className={mobileSubLinkClass}>
                    Compare platforms
                  </Link>
                </li>
                {PRO_RESOURCES.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} onClick={onNavigate} className={mobileSubLinkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/pricing"
                    onClick={onNavigate}
                    className={cn(mobileSubLinkClass, "font-semibold text-reps-orange")}
                  >
                    Join REPS →
                  </Link>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="resources" className="border-0">
            <AccordionTrigger
              className={cn(
                "rounded-[10px] px-3 py-3 text-[15px] font-medium hover:no-underline [&>svg]:text-white/60",
                active.resources ? "text-white" : "text-white/85 hover:text-white",
              )}
            >
              Resources
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <ul className="flex flex-col px-1">
                <li>
                  <Link
                    to="/resources"
                    onClick={onNavigate}
                    className={cn(mobileSubLinkClass, "font-semibold text-white")}
                  >
                    All articles
                  </Link>
                </li>
                {RESOURCE_TOPICS.map((t) => (
                  <li key={t.category}>
                    <Link
                      to="/resources"
                      search={{ category: t.category as ResourceCategory }}
                      onClick={onNavigate}
                      className={mobileSubLinkClass}
                    >
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="about" className="border-0">
            <AccordionTrigger
              className={cn(
                "rounded-[10px] px-3 py-3 text-[15px] font-medium hover:no-underline [&>svg]:text-white/60",
                active.about ? "text-white" : "text-white/85 hover:text-white",
              )}
            >
              About REPS
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-col gap-3 px-1">
                {ABOUT_GROUPS.map((group) => (
                  <div key={group.heading}>
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                      {group.heading}
                    </p>
                    <ul className="flex flex-col">
                      {group.links.map((l) => (
                        <li key={l.label}>
                          {"soon" in l && l.soon ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex cursor-default select-none items-center gap-2 rounded-[8px] px-3 py-2.5 text-[14px] text-white/45">
                                  {l.label}
                                  <span className="rounded-[6px] border border-white/12 bg-white/[0.04] px-1.5 py-[1px] text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
                                    Soon
                                  </span>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">Launching soon</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Link to={l.to} onClick={onNavigate} className={mobileSubLinkClass}>
                              {l.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </nav>

      {user && (
        <div className="border-t border-reps-border px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onSignOut();
              onNavigate();
            }}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-white/25 px-5 text-[14px] font-medium text-white transition-colors hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
