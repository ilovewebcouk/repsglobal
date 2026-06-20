export type { TrainerActive, AdminActive } from "./nav-data";
import type { TrainerActive, AdminActive } from "./nav-data";

export type DashboardActive = TrainerActive | AdminActive;

export type Tier = "verified" | "pro" | "studio";
export type Role = "admin" | "trainer";

export type DashboardShellMember = {
  name: string;
  avatarUrl?: string | null;
  headline?: string | null;
  tierLabel?: string;
};
