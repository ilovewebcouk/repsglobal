import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import {
  ChevronDown,
  Menu,
  Search,
  X,
  MapPin,
  ShieldCheck,
  Heart,
  
  Crosshair,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RESOURCE_ARTICLES } from "@/lib/resources";
import { cn } from "@/lib/utils";
import {
  RESOURCE_TOPICS,
  RESOURCE_QUICK_LINKS,
  TOP_LOCATIONS,
  TOP_PROFESSIONS,
  TRAIN_GOALS,
} from "./nav-config";
import { HeaderCommandPalette } from "./HeaderCommandPalette";

type Variant = "transparent" | "solid";

const SCROLL_THRESHOLD = 96;
const LOCATION_KEY = "reps.location";
const MOCK_USER_KEY = "reps.mockUser";

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
    train: pathname.startsWith("/find-a-professional") && pathname.includes("goal"),
    find:
      pathname.startsWith("/find-a-professional") ||
      pathname.startsWith("/professions") ||
      pathname.startsWith("/in/") ||
      pathname.startsWith("/pro/"),
    resources:
      pathname.startsWith("/resources") ||
      pathname.startsWith("/standards") ||
      pathname.startsWith("/verify") ||
      pathname.startsWith("/help"),
    pros: pathname.startsWith("/for-professionals") || pathname.startsWith("/pricing"),
  };
}

function useLocationPin() {
  const [city, setCity] = useState<string>("London");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCATION_KEY);
      if (saved) setCity(saved);
    } catch {
      /* noop */
    }
  }, []);
  const update = (next: string) => {
    setCity(next);
    try {
      window.localStorage.setItem(LOCATION_KEY, next);
    } catch {
      /* noop */
    }
  };
  return { city, setCity: update };
}

function useMockUser() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MOCK_USER_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);
  const signOut = () => {
    try {
      window.localStorage.removeItem(MOCK_USER_KEY);
    } catch {
      /* noop */
    }
    setUser(null);
  };
  return { user, signOut };
}

function useCmdK(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
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
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { city, setCity } = useLocationPin();
  const { user, signOut } = useMockUser();

  useCmdK(() => setCmdOpen(true));

  // Two-row expanded layout only on home, at rest, on desktop.
  const expanded = active.isHome && !isSolid;

  const wrapperClass = cn(
    "z-30 transition-colors duration-200",
    variant === "transparent" ? "fixed inset-x-0 top-0" : "sticky top-0",
    isSolid
      ? "bg-reps-ink/95 backdrop-blur supports-[backdrop-filter]:bg-reps-ink/80 border-b border-reps-border"
      : "bg-transparent border-b border-transparent",
  );

  return (
    <>
      <header className={wrapperClass}>
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          {/* Row 1 — logo · location · nav · trust · right cluster */}
          <div className="flex h-[72px] items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-3" aria-label="REPs home">
                <span className="font-display text-[30px] font-bold leading-none tracking-tight text-white">
                  REPs
                </span>
              </Link>

              <span aria-hidden className="hidden h-6 w-px bg-white/15 lg:block" />

              <LocationPin
                city={city}
                onChange={setCity}
                className={cn("hidden lg:inline-flex", expanded && "lg:hidden")}
              />
            </div>

            <NavigationMenu.Root
              delayDuration={120}
              skipDelayDuration={200}
              className="relative hidden lg:block"
            >
              <NavigationMenu.List className="flex items-center gap-7">
                <NavigationMenu.Item>
                  <NavigationMenu.Trigger className={triggerClass(false)}>
                    Train
                    <ChevronDown
                      aria-hidden="true"
                      className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                    />
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="absolute left-0 top-full pt-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
                    <TrainMenu />
                  </NavigationMenu.Content>
                </NavigationMenu.Item>

                <NavigationMenu.Item>
                  <NavigationMenu.Trigger className={triggerClass(active.find)}>
                    Find a Pro
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
              </NavigationMenu.List>
            </NavigationMenu.Root>

            <div className="flex items-center gap-2">
              <Link
                to="/verify"
                className="hidden h-9 items-center gap-1.5 whitespace-nowrap rounded-[999px] border border-reps-orange-border bg-reps-orange-soft px-3 text-[12px] font-semibold text-white transition-colors hover:border-reps-orange hover:bg-[rgba(255,122,0,0.18)] lg:inline-flex"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-reps-orange" aria-hidden />
                All pros verified
              </Link>

              <CompactSearchPill
                expanded={expanded}
                city={city}
                onClick={() => setCmdOpen(true)}
              />

              {user && (
                <Link
                  to="/find-a-professional"
                  aria-label="Saved professionals"
                  className="hidden h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 text-white/85 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink xl:inline-flex"
                >
                  <Heart className="h-4 w-4" aria-hidden />
                </Link>
              )}



              <Link
                to="/for-professionals"
                className={cn(
                  "hidden h-10 items-center whitespace-nowrap rounded-[10px] px-3 text-[13px] font-medium transition-colors xl:inline-flex",
                  active.pros
                    ? "text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                Become a Pro
              </Link>

              {user ? (
                <UserMenu user={user} onSignOut={signOut} />
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden h-10 items-center whitespace-nowrap rounded-[10px] border border-white/25 px-4 text-[14px] font-medium text-white transition-colors hover:bg-white/10 sm:inline-flex"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="hidden h-10 items-center whitespace-nowrap rounded-[10px] bg-reps-orange px-4 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark sm:inline-flex"
                  >
                    Join REPs
                  </Link>
                </>
              )}

              {/* Mobile: search pill + hamburger */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Search professionals"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink lg:hidden"
              >
                <Search className="h-4 w-4" aria-hidden />
              </button>

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
                  <SheetTitle className="sr-only">REPs navigation</SheetTitle>
                  <SheetDescription className="sr-only">
                    Main site navigation and account links.
                  </SheetDescription>
                  <MobileDrawer
                    active={active}
                    city={city}
                    user={user}
                    onSignOut={signOut}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>



      <HeaderCommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      <MobileSearchSheet
        open={mobileSearchOpen}
        onOpenChange={setMobileSearchOpen}
        city={city}
        onChangeCity={setCity}
      />
    </>
  );
}

/* ---------------- compact pill (scrolled state) ---------------- */

function CompactSearchPill({
  expanded,
  city,
  onClick,
}: {
  expanded: boolean;
  city: string;
  onClick: () => void;
}) {
  if (expanded) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden h-10 items-center gap-2 whitespace-nowrap rounded-[999px] border border-white/20 bg-white/[0.04] pl-3 pr-4 text-[13px] text-white/85 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink xl:inline-flex"
    >
      <Search className="h-4 w-4 text-reps-orange" aria-hidden />
      <span>Search professionals</span>
      <span aria-hidden className="h-3 w-px bg-white/20" />
      <MapPin className="h-3.5 w-3.5" aria-hidden />
      <span className="font-medium text-white">{city}</span>
    </button>
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

function TrainMenu() {
  return (
    <PanelShell width="w-[680px]">
      <div className="grid grid-cols-2 gap-3">
        {TRAIN_GOALS.map((g) => {
          const Icon = g.icon;
          return (
            <NavigationMenu.Link asChild key={g.slug}>
              <Link
                to="/find-a-professional"
                className="group/tile flex items-start gap-3 rounded-[16px] border border-reps-stone bg-reps-warm-white p-3 transition-colors hover:border-reps-orange-border hover:bg-[rgba(255,122,0,0.04)] focus:outline-none focus:border-reps-orange-border focus:bg-[rgba(255,122,0,0.04)]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-reps-orange-soft text-reps-orange">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="flex flex-col">
                  <span className="text-[14px] font-semibold text-reps-charcoal group-hover/tile:text-reps-orange">
                    {g.label}
                  </span>
                  <span className="mt-0.5 text-[12px] text-reps-charcoal/65">
                    {g.outcome}
                  </span>
                </span>
              </Link>
            </NavigationMenu.Link>
          );
        })}
      </div>
      <div className="mt-5 border-t border-reps-stone pt-4">
        <NavigationMenu.Link asChild>
          <Link
            to="/find-a-professional"
            className="text-[13px] font-semibold text-reps-orange hover:underline focus:underline focus:outline-none"
          >
            Browse all goals →
          </Link>
        </NavigationMenu.Link>
      </div>
    </PanelShell>
  );
}

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
              className="mt-3 block overflow-hidden rounded-[18px] border border-reps-stone bg-reps-warm-white transition-colors hover:border-reps-orange-border focus:outline-none focus:border-reps-orange-border"
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
  const featured = RESOURCE_ARTICLES.slice(0, 3);
  return (
    <PanelShell width="w-[720px]">
      <div className="grid grid-cols-[1fr_1.4fr] gap-8">
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            Browse by topic
          </h4>
          <ul className="mt-3 flex flex-col gap-1">
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

          <h4 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-muted-light">
            REPs explained
          </h4>
          <ul className="mt-3 flex flex-col gap-1">
            {RESOURCE_QUICK_LINKS.map((l) => (
              <li key={l.to}>
                <NavigationMenu.Link asChild>
                  <Link to={l.to} className={menuItemClass}>
                    {l.label}
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

/* ---------------- user menu (mock auth shell) ---------------- */

function UserMenu({
  user,
  onSignOut,
}: {
  user: { name: string; email: string };
  onSignOut: () => void;
}) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="hidden h-10 items-center gap-2 rounded-[999px] border border-white/20 bg-white/[0.04] pl-1 pr-3 text-[13px] font-medium text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-reps-ink sm:inline-flex"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[999px] bg-reps-orange text-[12px] font-semibold text-white">
            {initials}
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

/* ---------------- mobile search sheet ---------------- */

function MobileSearchSheet({
  open,
  onOpenChange,
  city,
  onChangeCity,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  city: string;
  onChangeCity: (next: string) => void;
}) {
  const navigate = useNavigate();
  const [what, setWhat] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
    navigate({ to: "/find-a-professional" });
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="border-b border-reps-border bg-reps-ink p-0 text-white [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Search professionals</SheetTitle>
        <SheetDescription className="sr-only">
          Search by goal, profession or city.
        </SheetDescription>
        <div className="flex items-center gap-3 border-b border-reps-border px-5 py-4">
          <form onSubmit={submit} className="flex flex-1 items-center gap-2 rounded-[999px] border border-white/15 bg-white/[0.06] px-4 py-2">
            <Search className="h-4 w-4 text-reps-orange" aria-hidden />
            <input
              autoFocus
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              placeholder={`Search in ${city}…`}
              className="w-full bg-transparent text-[14px] font-medium text-white placeholder:text-white/55 focus:outline-none"
            />
          </form>
          <SheetClose asChild>
            <button
              type="button"
              aria-label="Close search"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/20 text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </SheetClose>
        </div>

        <div className="px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
            Popular goals
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRAIN_GOALS.map((g) => (
              <Link
                key={g.slug}
                to="/find-a-professional"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-9 items-center rounded-[999px] border border-white/15 bg-white/[0.04] px-3 text-[12px] font-medium text-white/85 transition-colors hover:bg-white/10"
              >
                {g.label}
              </Link>
            ))}
          </div>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
            Popular cities
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TOP_LOCATIONS.map((l) => (
              <button
                key={l.slug}
                type="button"
                onClick={() => {
                  onChangeCity(l.label);
                }}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-[999px] border px-3 text-[12px] font-medium transition-colors",
                  city === l.label
                    ? "border-reps-orange-border bg-reps-orange-soft text-white"
                    : "border-white/15 bg-white/[0.04] text-white/85 hover:bg-white/10",
                )}
              >
                <MapPin className="h-3 w-3" aria-hidden />
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
  "block rounded-[8px] px-3 py-2 text-[14px] text-white/80 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-reps-orange/70";

function MobileDrawer({
  active,
  city,
  user,
  onSignOut,
  onNavigate,
}: {
  active: ActiveState;
  city: string;
  user: { name: string; email: string } | null;
  onSignOut: () => void;
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
            <X className="h-4 w-4" aria-hidden />
          </button>
        </SheetClose>
      </div>

      {user ? (
        <div className="border-b border-reps-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[999px] bg-reps-orange text-[13px] font-semibold text-white">
              {user.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <div className="text-[14px] font-semibold text-white">{user.name}</div>
              <div className="text-[12px] text-white/60">{user.email}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-b border-reps-border px-5 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={onNavigate}
              className="inline-flex h-11 items-center justify-center rounded-[10px] border border-white/25 px-3 text-[14px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              onClick={onNavigate}
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-reps-orange px-3 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
            >
              Join REPs
            </Link>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <Link
          to="/find-a-professional"
          onClick={onNavigate}
          className={cn(mobileLinkBase, "mb-2 bg-white/[0.04] text-white hover:bg-white/[0.08]")}
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4 text-reps-orange" aria-hidden />
            Search in {city}
          </span>
        </Link>

        <Link
          to="/verify"
          onClick={onNavigate}
          className={cn(
            mobileLinkBase,
            "mb-3 border border-reps-orange-border bg-reps-orange-soft text-white",
          )}
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-reps-orange" aria-hidden />
            All professionals verified
          </span>
        </Link>

        <Accordion type="multiple" className="space-y-1">
          <AccordionItem value="train" className="border-0">
            <AccordionTrigger className="rounded-[10px] px-3 py-3 text-[15px] font-medium text-white/85 hover:text-white hover:no-underline">
              Train by goal
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <ul className="flex flex-col px-1">
                {TRAIN_GOALS.map((g) => (
                  <li key={g.slug}>
                    <Link
                      to="/find-a-professional"
                      onClick={onNavigate}
                      className={mobileSubLinkClass}
                    >
                      {g.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="find" className="border-0">
            <AccordionTrigger
              className={cn(
                "rounded-[10px] px-3 py-3 text-[15px] font-medium hover:no-underline",
                active.find ? "text-white" : "text-white/85 hover:text-white",
              )}
            >
              Find a Pro
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
                {RESOURCE_QUICK_LINKS.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} onClick={onNavigate} className={mobileSubLinkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <Link
            to="/for-professionals"
            onClick={onNavigate}
            className={cn(mobileLinkClass(active.pros), "mt-2")}
          >
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" aria-hidden />
              Become a Pro
            </span>
          </Link>
        </Accordion>

        <div className="mt-6 border-t border-reps-border pt-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
            Company
          </p>
          <ul className="flex flex-col">
            <li><Link to="/about" onClick={onNavigate} className={mobileSubLinkClass}>About REPs</Link></li>
            <li><Link to="/standards" onClick={onNavigate} className={mobileSubLinkClass}>Standards</Link></li>
            <li><Link to="/complaints" onClick={onNavigate} className={mobileSubLinkClass}>Complaints</Link></li>
            <li><Link to="/help" onClick={onNavigate} className={mobileSubLinkClass}>Help Centre</Link></li>
          </ul>
        </div>
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
