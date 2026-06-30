import {
  AlertCircle,
  Apple,
  AreaChart,
  Briefcase,
  Building2,
  Calendar as CalendarIcon,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileText,
  GraduationCap,

  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Star,
  Store,
  Tag,
  Target,
  UserCheck,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem<L extends string = string> = {
  icon: LucideIcon;
  label: L;
  to: string;
  badge?: string;
};
export type NavGroup<L extends string = string> = {
  title: string;
  items: NavItem<L>[];
};

export const VERIFIED_NAV = [
  {
    title: "Account",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
      { icon: UserCircle, label: "Public Profile", to: "/dashboard/profile" },
      { icon: ShieldCheck, label: "Verification", to: "/dashboard/verification" },
      { icon: GraduationCap, label: "Education & CPD", to: "/dashboard/cpd" },
    ],
  },
  {
    title: "Deliver",
    items: [
      { icon: Store, label: "Website", to: "/dashboard/website" },
      { icon: Inbox, label: "Enquiries", to: "/dashboard/enquiries" },
      { icon: Star, label: "Reviews", to: "/dashboard/reviews" },
    ],
  },
  {
    title: "Help",
    items: [
      { icon: LifeBuoy, label: "Support", to: "/dashboard/support" },
    ],
  },
  {
    title: "System",
    items: [
      { icon: Settings, label: "Settings", to: "/dashboard/settings" },
    ],
  },
] as const satisfies readonly NavGroup[];

export const PRO_NAV = [
  {
    title: "Work",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
      { icon: Users, label: "Clients", to: "/dashboard/clients" },
      { icon: CalendarIcon, label: "Calendar", to: "/dashboard/calendar" },
      { icon: CreditCard, label: "Bookings", to: "/dashboard/bookings" },
      { icon: MessagesSquare, label: "Messages", to: "/dashboard/messages" },
    ],
  },
  {
    title: "Deliver",
    items: [
      { icon: Store, label: "Website", to: "/dashboard/website" },
      { icon: Dumbbell, label: "Programs", to: "/dashboard/programs" },
      { icon: Apple, label: "Nutrition", to: "/dashboard/nutrition" },
      { icon: ClipboardList, label: "Check-Ins", to: "/dashboard/check-ins" },
      { icon: Target, label: "Leads", to: "/dashboard/leads" },
      { icon: Star, label: "Reviews", to: "/dashboard/reviews" },
    ],
  },
  {
    title: "Grow",
    items: [
      { icon: AreaChart, label: "Reports", to: "/dashboard/reports" },
      { icon: FileText, label: "Content Studio", to: "/dashboard/content" },
      { icon: Users, label: "Community", to: "/dashboard/community" },
      { icon: UserCircle, label: "Public Profile", to: "/dashboard/profile" },
      { icon: ShieldCheck, label: "Verification", to: "/dashboard/verification" },
      { icon: GraduationCap, label: "Education & CPD", to: "/dashboard/cpd" },
    ],
  },
  {
    title: "Money & Admin",
    items: [
      { icon: CreditCard, label: "Stripe", to: "/dashboard/payments" },
      { icon: Briefcase, label: "Business Tools", to: "/dashboard/business" },
    ],
  },
  {
    title: "Help",
    items: [
      { icon: LifeBuoy, label: "Support", to: "/dashboard/support" },
    ],
  },
  {
    title: "System",
    items: [
      { icon: Settings, label: "Settings", to: "/dashboard/settings" },
    ],
  },
] as const satisfies readonly NavGroup[];

export const ADMIN_NAV = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Overview", to: "/admin" },
    ],
  },
  {
    title: "Members & Pros",
    items: [
      { icon: Users, label: "Professionals", to: "/admin/professionals" },
      { icon: ShieldCheck, label: "Verification", to: "/admin/verification" },
      { icon: Star, label: "Reviews", to: "/admin/reviews" },
    ],
  },
  {
    title: "Revenue",
    items: [
      { icon: CreditCard, label: "Billing", to: "/admin/billing" },
    ],
  },

  {
    title: "Content & Discovery",
    items: [
      { icon: Target, label: "Directory", to: "/admin/directory" },
      { icon: Building2, label: "Gyms", to: "/admin/gyms" },
      { icon: GraduationCap, label: "CPD", to: "/admin/cpd" },
    ],
  },
  {
    title: "Support & Comms",
    items: [
      { icon: LifeBuoy, label: "Support", to: "/admin/support" },
      { icon: Megaphone, label: "Campaigns", to: "/admin/campaigns" },
    ],
  },
  {
    title: "System",
    items: [
      { icon: ShieldCheck, label: "Team", to: "/admin/team" },
      { icon: Settings, label: "Settings", to: "/admin/settings" },
    ],
  },
] as const satisfies readonly NavGroup[];

// Derived label unions — adding a route that passes an `active` label not
// present in these arrays is now a typecheck error.
export type TrainerActive =
  | (typeof VERIFIED_NAV)[number]["items"][number]["label"]
  | (typeof PRO_NAV)[number]["items"][number]["label"];

export type AdminActive = (typeof ADMIN_NAV)[number]["items"][number]["label"];
