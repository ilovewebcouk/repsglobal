import {
  Apple,
  AreaChart,
  Briefcase,
  Building2,
  Calendar as CalendarIcon,
  ClipboardList,
  CreditCard,
  Dumbbell,
  FileCheck,
  FileText,
  GraduationCap,
  Images,
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
      { icon: Inbox, label: "Enquiries", to: "/dashboard/enquiries" },
      { icon: Star, label: "Reviews", to: "/dashboard/reviews" },
      { icon: UserCircle, label: "Public Profile", to: "/dashboard/profile" },
      { icon: ShieldCheck, label: "Verification", to: "/dashboard/verification" },
      { icon: GraduationCap, label: "Education & CPD", to: "/dashboard/cpd" },
      { icon: Settings, label: "Settings", to: "/dashboard/settings" },
    ],
  },
] as const satisfies readonly NavGroup[];

export const PRO_NAV = [
  {
    title: "Work",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
      { icon: Target, label: "Leads", to: "/dashboard/leads" },
      { icon: Users, label: "Clients", to: "/dashboard/clients" },
      { icon: CalendarIcon, label: "Calendar", to: "/dashboard/calendar" },
      { icon: CreditCard, label: "Bookings", to: "/dashboard/bookings" },
      { icon: MessagesSquare, label: "Messages", to: "/dashboard/messages" },
    ],
  },
  {
    title: "Deliver",
    items: [
      { icon: Store, label: "Shop-front", to: "/dashboard/shop-front" },
      { icon: Tag, label: "Services", to: "/dashboard/services" },
      { icon: Dumbbell, label: "Programs", to: "/dashboard/programs" },
      { icon: Apple, label: "Nutrition", to: "/dashboard/nutrition" },
      { icon: ClipboardList, label: "Check-Ins", to: "/dashboard/check-ins" },
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
      { icon: Settings, label: "Settings", to: "/dashboard/settings" },
    ],
  },
] as const satisfies readonly NavGroup[];

export const ADMIN_NAV = [
  {
    title: "Manage",
    items: [
      { icon: LayoutDashboard, label: "Overview", to: "/admin" },
      { icon: Users, label: "Professionals", to: "/admin/professionals" },
      { icon: ShieldCheck, label: "Verification", to: "/admin/verification" },
      { icon: UserCheck, label: "Memberships", to: "/admin/memberships" },
      { icon: Target, label: "Directory", to: "/admin/directory" },
      { icon: Building2, label: "Gyms", to: "/admin/gyms" },
      { icon: Star, label: "Reviews", to: "/admin/reviews" },
      { icon: CreditCard, label: "Stripe", to: "/admin/payments" },
      { icon: GraduationCap, label: "CPD", to: "/admin/cpd" },
    ],
  },
  {
    title: "Platform",
    items: [
      { icon: FileCheck, label: "Migration", to: "/admin/migration", badge: "BD" },
      { icon: LifeBuoy, label: "Support", to: "/admin/support" },
      { icon: Megaphone, label: "Campaigns", to: "/admin/campaigns" },
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
