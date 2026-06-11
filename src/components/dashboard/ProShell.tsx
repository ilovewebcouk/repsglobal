/**
 * Backward-compat shim. New code should import `DashboardShell` and primitives
 * directly:
 *   import { DashboardShell } from "@/components/dashboard/DashboardShell";
 *   import { PCard, PPanel } from "@/components/dashboard/primitives";
 *
 * This shim keeps the existing 17+ ProShell consumers working until they are
 * migrated in a follow-up turn.
 */
import * as React from "react";
import {
  DashboardShell,
  type DashboardShellMember,
  type Tier,
  type TrainerActive,
} from "@/components/dashboard/DashboardShell";

export { PCard } from "@/components/dashboard/primitives/PCard";
export { PPanel } from "@/components/dashboard/primitives/PPanel";

export type ProActive = TrainerActive;
export type ProShellMember = DashboardShellMember;

export function ProShell({
  active,
  title,
  subtitle,
  actions,
  // hasProAccess is preserved for the old API surface but no longer drives nav
  // — tier does. Verified-tier routes should pass tier="verified" so the
  // sidebar collapses to the Verified set; Pro/Studio routes can omit it.
  hasProAccess: _hasProAccess = true,
  tier = "pro",
  member,
  children,
}: {
  active: ProActive;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  hasProAccess?: boolean;
  tier?: Tier;
  member?: ProShellMember;
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      role="trainer"
      tier={tier}
      active={active}
      title={title}
      subtitle={subtitle}
      actions={actions}
      member={member}
    >
      {children}
    </DashboardShell>
  );
}
