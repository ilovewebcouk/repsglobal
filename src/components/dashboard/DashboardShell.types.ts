export type TrainerActive =
  | "Dashboard"
  | "Leads"
  | "Clients"
  | "Calendar"
  | "Bookings"
  | "Messages"
  | "Programs"
  | "Nutrition"
  | "Check-Ins"
  | "Reviews"
  | "Reports"
  | "Content Studio"
  | "Community"
  | "Education & CPD"
  | "Public Profile"
  | "Services"
  | "Shop-front"
  | "Enquiries"
  | "Edit Profile"
  | "Verification"
  | "Stripe"
  | "Business Tools"
  | "Settings";

export type AdminActive =
  | "Overview"
  | "Professionals"
  | "Verification"
  | "Memberships"
  | "Directory"
  | "Gyms"
  | "Reviews"
  | "Stripe"
  | "CPD"
  | "Migration"
  | "Support"
  | "Campaigns"
  | "Settings";

export type DashboardActive = TrainerActive | AdminActive;

export type Tier = "verified" | "pro" | "studio";
export type Role = "admin" | "trainer";

export type DashboardShellMember = {
  name: string;
  avatarUrl?: string | null;
  headline?: string | null;
  tierLabel?: string;
};
