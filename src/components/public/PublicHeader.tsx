import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

type Variant = "transparent" | "solid";

type DropdownChild = { label: string; to: string; params?: Record<string, string> };

const findChildren: DropdownChild[] = [
  { label: "Browse the directory", to: "/find-a-professional" },
  { label: "Specialisms", to: "/specialisms" },
  { label: "CPD-trained professionals", to: "/cpd" },
];

const resourceChildren: DropdownChild[] = [
  { label: "All resources", to: "/resources" },
  {
    label: "How REPs verifies a professional",
    to: "/resources/$slug",
    params: { slug: "how-reps-verifies-a-fitness-professional" },
  },
  {
    label: "Choosing the right personal trainer",
    to: "/resources/$slug",
    params: { slug: "choosing-the-right-personal-trainer" },
  },
  {
    label: "Grow your PT business in 2026",
    to: "/resources/$slug",
    params: { slug: "grow-your-pt-business-in-2026" },
  },
  { label: "FAQ", to: "/faq" },
  { label: "Help centre", to: "/help" },
  { label: "Business tools", to: "/business-tools" },
];

const aboutChildren: DropdownChild[] = [
  { label: "About REPs", to: "/about" },
  { label: "Standards", to: "/standards" },
  { label: "Verify a professional", to: "/verify" },
  { label: "Reviews", to: "/reviews" },
  { label: "Press", to: "/press" },
  { label: "Careers", to: "/careers" },
  { label: "Contact", to: "/contact" },
];

const desktopLinkClass =
  "flex items-center gap-1 text-[14px] font-medium text-white/85 transition-colors hover:text-white";
const activeLinkProps = { className: "text-reps-orange" };

const dropdownContentClass =
  "min-w-[240px] rounded-[22px] border-white/10 bg-reps-ink p-2 text-white shadow-lg shadow-black/20";
const dropdownItemClass =
  "rounded-[10px] px-3 py-2 text-[14px] text-white/85 focus:bg-white/5 focus:text-reps-orange data-[highlighted]:bg-white/5 data-[highlighted]:text-reps-orange";

function DesktopDropdown({
  label,
  rootTo,
  children,
}: {
  label: string;
  rootTo: string;
  children: DropdownChild[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={desktopLinkClass}>
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={12} className={dropdownContentClass}>
        {children.map((child) => (
          <DropdownMenuItem key={`${child.to}-${child.params?.slug ?? ""}`} asChild className={dropdownItemClass}>
            <Link
              to={child.to as any}
              params={child.params as any}
              activeProps={activeLinkProps}
              activeOptions={{ exact: child.to === rootTo }}
            >
              {child.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PublicHeader({ variant = "transparent" }: { variant?: Variant }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
          <DesktopDropdown
            label="Find a Professional"
            rootTo="/find-a-professional"
            children={findChildren}
          />
          <Link to="/how-it-works" className={desktopLinkClass} activeProps={activeLinkProps}>
            How REPs Works
          </Link>
          <Link to="/for-professionals" className={desktopLinkClass} activeProps={activeLinkProps}>
            For Professionals
          </Link>
          <DesktopDropdown label="Resources" rootTo="/resources" children={resourceChildren} />
          <DesktopDropdown label="About REPs" rootTo="/about" children={aboutChildren} />
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden h-10 items-center rounded-[10px] border border-white/25 px-5 text-[14px] font-medium text-white transition-colors hover:bg-white/10 lg:inline-flex"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="hidden h-10 items-center rounded-[10px] bg-reps-orange px-5 text-[14px] font-semibold text-white transition-colors hover:bg-reps-orange-dark sm:inline-flex"
          >
            Join REPs
          </Link>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="h-11 w-11 rounded-[10px] text-white hover:bg-white/10 hover:text-white lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full flex-col gap-0 border-l border-white/10 bg-reps-ink p-0 text-white sm:max-w-sm [&>button]:hidden"
            >
              <SheetTitle className="sr-only">REPs navigation</SheetTitle>

              {/* Top bar */}
              <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-6">
                <Link to="/" onClick={close} className="flex items-center gap-3">
                  <span className="font-display text-[28px] font-bold leading-none tracking-tight text-white">
                    REPs
                  </span>
                </Link>
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Close menu"
                    className="h-11 w-11 rounded-[10px] text-white hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </SheetClose>
              </div>

              {/* Nav list */}
              <div className="flex-1 overflow-y-auto px-2 py-2">
                <MobileAccordionItem
                  label="Find a Professional"
                  rootTo="/find-a-professional"
                  children={findChildren}
                  onNavigate={close}
                />
                <MobileLink to="/how-it-works" onNavigate={close}>
                  How REPs Works
                </MobileLink>
                <MobileLink to="/for-professionals" onNavigate={close}>
                  For Professionals
                </MobileLink>
                <MobileAccordionItem
                  label="Resources"
                  rootTo="/resources"
                  children={resourceChildren}
                  onNavigate={close}
                />
                <MobileAccordionItem
                  label="About REPs"
                  rootTo="/about"
                  children={aboutChildren}
                  onNavigate={close}
                />
              </div>

              {/* Footer CTAs */}
              <div className="space-y-3 border-t border-white/10 p-4">
                <Link
                  to="/login"
                  onClick={close}
                  className="flex h-11 w-full items-center justify-center rounded-[10px] border border-white/25 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={close}
                  className="flex h-11 w-full items-center justify-center rounded-[10px] bg-reps-orange text-[15px] font-semibold text-white transition-colors hover:bg-reps-orange-dark"
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

function MobileLink({
  to,
  onNavigate,
  children,
}: {
  to: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to as any}
      onClick={onNavigate}
      activeProps={{ className: "text-reps-orange" }}
      className="flex items-center justify-between rounded-[10px] px-4 py-4 text-[18px] font-medium text-white hover:bg-white/5"
    >
      {children}
    </Link>
  );
}

function MobileAccordionItem({
  label,
  rootTo,
  children,
  onNavigate,
}: {
  label: string;
  rootTo: string;
  children: DropdownChild[];
  onNavigate: () => void;
}) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={label} className="border-b-0">
        <AccordionTrigger className="rounded-[10px] px-4 py-4 text-[18px] font-medium text-white hover:bg-white/5 hover:no-underline">
          {label}
        </AccordionTrigger>
        <AccordionContent className="pb-2 pl-2">
          <div className="flex flex-col">
            {children.map((child) => (
              <Link
                key={`${child.to}-${child.params?.slug ?? ""}`}
                to={child.to as any}
                params={child.params as any}
                onClick={onNavigate}
                activeProps={{ className: "text-reps-orange" }}
                activeOptions={{ exact: child.to === rootTo }}
                className="rounded-[10px] px-4 py-3 text-[15px] text-white/80 hover:bg-white/5 hover:text-white"
              >
                {child.label}
              </Link>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
